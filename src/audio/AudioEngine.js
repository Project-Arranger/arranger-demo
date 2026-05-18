import {
  DEFAULT_BPM,
  DRUMS_INSTRUMENT_IDS,
  STEPS_PER_BAR,
  TOTAL_BARS,
} from '../domain/musicConstants.js';
import { AUDIO_STATUSES } from './audioStatus.js';
import { createMatrixPlaybackAdapter } from './matrixPlaybackAdapter.js';

const DRUMS_SAMPLE_FILES = Object.freeze({
  kick: 'samples/808/kick.wav',
  snare: 'samples/808/snare.wav',
  hihat: 'samples/808/hihat.wav',
});

const DRUM_FALLBACK_NOTES = Object.freeze({
  kick: 'C1',
  snare: 'D1',
  hihat: 'F#1',
});

function trimTrailingSlash(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function createDrumsSampleUrls(baseUrl = '/') {
  const normalizedBaseUrl = baseUrl === '/' ? '' : trimTrailingSlash(baseUrl);

  return Object.fromEntries(
    DRUMS_INSTRUMENT_IDS.map((instrument) => [
      instrument,
      `${normalizedBaseUrl}/${DRUMS_SAMPLE_FILES[instrument]}`,
    ]),
  );
}

function getDefaultBaseUrl() {
  return import.meta.env?.BASE_URL ?? '/';
}

function formatToneTransportPosition(bar, step) {
  const beat = Math.floor(step / 4);
  const sixteenth = step % 4;

  return `${bar}:${beat}:${sixteenth}`;
}

function callToDestination(player) {
  if (typeof player?.toDestination !== 'function') return player;

  const result = player.toDestination();
  return result && typeof result === 'object' ? result : player;
}

export default class AudioEngine {
  constructor(options = {}) {
    this.tone = options.tone;
    this.baseUrl = options.baseUrl ?? getDefaultBaseUrl();
    this.matrixSource = options.matrixSource ?? null;
    this.onPositionChange = options.onPositionChange ?? null;
    this.playerFactory = options.playerFactory ?? null;
    this.fallbackSynthFactory = options.fallbackSynthFactory ?? null;
    this.chordSynthFactory = options.chordSynthFactory ?? null;
    this.now = options.now ?? (() => this.tone?.now?.() ?? 0);
    this.status = AUDIO_STATUSES.IDLE;
    this.drumPlayers = new Map();
    this.fallbackSynth = null;
    this.chordSynth = null;
    this.matrixAdapter = null;
    this.transportEventId = null;
    this.transportFlatStep = 0;
    this.currentBar = 0;
    this.currentStep = 0;
  }

  get transport() {
    return this.tone?.Transport;
  }

  getSampleUrls() {
    return createDrumsSampleUrls(this.baseUrl);
  }

  createPlayer(url, instrument) {
    if (this.playerFactory) return this.playerFactory(url, instrument);
    if (!this.tone?.Player) {
      throw new Error('Tone Player is unavailable');
    }

    return new this.tone.Player(url);
  }

  createFallbackSynth() {
    if (this.fallbackSynthFactory) return this.fallbackSynthFactory();
    if (!this.tone?.MembraneSynth) return null;

    return callToDestination(new this.tone.MembraneSynth());
  }

  createChordSynth() {
    if (this.chordSynthFactory) return callToDestination(this.chordSynthFactory());
    if (!this.tone?.PolySynth) return null;

    const synth = this.tone?.Synth
      ? new this.tone.PolySynth(this.tone.Synth)
      : new this.tone.PolySynth();

    return callToDestination(synth);
  }

  async startAudio() {
    if (
      this.status === AUDIO_STATUSES.READY
      || this.status === AUDIO_STATUSES.SAMPLE_FALLBACK
    ) {
      return this.status;
    }

    this.status = AUDIO_STATUSES.STARTING;

    try {
      await this.tone?.start?.();
      this.fallbackSynth = this.fallbackSynth ?? this.createFallbackSynth();
      this.chordSynth = this.chordSynth ?? this.createChordSynth();
      this.loadDrumsPlayers();
      this.status = AUDIO_STATUSES.READY;
    } catch {
      this.drumPlayers.clear();
      this.fallbackSynth = this.createFallbackSynth();
      this.chordSynth = this.chordSynth ?? this.createChordSynth();
      this.status = this.fallbackSynth
        ? AUDIO_STATUSES.SAMPLE_FALLBACK
        : AUDIO_STATUSES.ERROR;
    }

    return this.status;
  }

  loadDrumsPlayers() {
    const sampleUrls = this.getSampleUrls();

    for (const instrument of DRUMS_INSTRUMENT_IDS) {
      if (this.drumPlayers.has(instrument)) continue;

      const player = callToDestination(this.createPlayer(sampleUrls[instrument], instrument));
      this.drumPlayers.set(instrument, player);
    }
  }

  triggerDrumsInstrument(instrument, time = this.now()) {
    if (!DRUMS_INSTRUMENT_IDS.includes(instrument)) return false;

    const player = this.drumPlayers.get(instrument);
    if (player?.start) {
      try {
        player.start(time);
        return true;
      } catch {
        // Tone.Player can exist before its buffer is ready; keep first-click preview audible.
      }
    }

    if (this.fallbackSynth?.triggerAttackRelease) {
      try {
        this.fallbackSynth.triggerAttackRelease(DRUM_FALLBACK_NOTES[instrument], '16n', time);
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  async triggerDrumsStep(instruments, time = this.now()) {
    await this.startAudio();

    const instrumentList = Array.isArray(instruments) ? instruments : [instruments];
    return instrumentList
      .filter((instrument) => this.triggerDrumsInstrument(instrument, time));
  }

  triggerChordNotes(notes, duration = '4n', time = this.now()) {
    if (!Array.isArray(notes) || !notes.length) return false;
    if (!this.chordSynth?.triggerAttackRelease) return false;

    try {
      this.chordSynth.triggerAttackRelease(notes, duration, time);
      return true;
    } catch {
      return false;
    }
  }

  async triggerChord(notes, duration = '4n', time = this.now()) {
    await this.startAudio();
    return this.triggerChordNotes(notes, duration, time);
  }

  triggerChordEvent(event, time = this.now()) {
    return this.triggerChordNotes(event.notes, event.duration, time);
  }

  setMatrixSource(matrixSource) {
    this.matrixSource = matrixSource;
    this.matrixAdapter = null;
  }

  getMatrixAdapter(matrixSource = this.matrixSource) {
    if (!matrixSource) return null;
    if (!this.matrixAdapter) {
      this.matrixAdapter = createMatrixPlaybackAdapter(matrixSource);
    }

    return this.matrixAdapter;
  }

  scheduleMatrixPlayback(matrixSource = this.matrixSource) {
    const adapter = this.getMatrixAdapter(matrixSource);
    if (!adapter || !this.transport?.scheduleRepeat) return null;

    if (this.transportEventId && this.transport?.clear) {
      this.transport.clear(this.transportEventId);
    }

    this.transportEventId = this.transport.scheduleRepeat((time) => {
      const position = adapter.getPositionForFlatStep(this.transportFlatStep);
      this.currentBar = position.bar;
      this.currentStep = position.step;
      this.onPositionChange?.(position.bar, position.step);

      for (const event of adapter.getEventsForStep(position.bar, position.step)) {
        if (event.type === 'drums') {
          this.triggerDrumsInstrument(event.instrument, time);
        }
        if (event.type === 'chord') {
          this.triggerChordEvent(event, time);
        }
      }

      this.transportFlatStep = (this.transportFlatStep + 1) % adapter.totalSteps;
    }, '16n');

    return this.transportEventId;
  }

  syncTransport({ bpm = DEFAULT_BPM, bar = this.currentBar, step = this.currentStep } = {}) {
    if (this.transport?.bpm) {
      this.transport.bpm.value = bpm;
    }

    return this.seekToStep(bar, step);
  }

  seekToStep(bar, step) {
    this.currentBar = bar;
    this.currentStep = step;
    this.transportFlatStep = (bar * STEPS_PER_BAR + step) % (TOTAL_BARS * STEPS_PER_BAR);

    if (this.transport) {
      this.transport.position = formatToneTransportPosition(bar, step);
    }
  }

  async play(options = {}) {
    await this.startAudio();
    this.syncTransport(options);

    if (options.matrixSource || this.matrixSource) {
      this.scheduleMatrixPlayback(options.matrixSource ?? this.matrixSource);
    }

    this.transport?.start?.();
  }

  async pause() {
    this.transport?.pause?.();
  }

  async stop() {
    this.transport?.stop?.();
    this.seekToStep(0, 0);
  }
}

export { createDrumsSampleUrls, formatToneTransportPosition };
