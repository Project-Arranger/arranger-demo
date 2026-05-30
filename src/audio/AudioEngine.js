import {
  DEFAULT_BPM,
  DRUMS_INSTRUMENT_IDS,
  STEPS_PER_BAR,
  TOTAL_BARS,
} from '../domain/musicConstants.js';
import {
  CHORD_GRID_PITCHES,
} from '../domain/chordCells.js';
import { clampTrackVolume } from '../domain/trackVolume.js';
import { AUDIO_STATUSES } from './audioStatus.js';
import { createMatrixPlaybackAdapter } from './matrixPlaybackAdapter.js';

const DRUMS_SAMPLE_FILES = Object.freeze({
  kick: 'samples/808/kick.wav',
  snare: 'samples/808/snare.wav',
  hihat: 'samples/808/hihat.wav',
});

const LEAD_SAMPLE_FILES = Object.freeze({
  C3: 'samples/lead/Lead C3.wav',
  D3: 'samples/lead/Lead D3.wav',
  E3: 'samples/lead/Lead E3.wav',
  F3: 'samples/lead/Lead F3.wav',
  G3: 'samples/lead/Lead G3.wav',
  A3: 'samples/lead/Lead A3.wav',
  B3: 'samples/lead/Lead B3.wav',
});

function getGeneratedBassSampleFileName(note) {
  return `Bass_${note.replace('#', 'Sharp')}.wav`;
}

const GENERATED_BASS_SAMPLE_FILES = Object.freeze(
  Object.fromEntries(
    CHORD_GRID_PITCHES.map((pitch) => [
      pitch.label,
      `samples/bass/generated/${getGeneratedBassSampleFileName(pitch.label)}`,
    ]),
  ),
);

const BASS_SAMPLE_FILES = Object.freeze({
  A0: 'samples/bass/Bass_A0.wav',
  B0: 'samples/bass/Bass_B0.wav',
  C1: 'samples/bass/Bass_C1.wav',
  D1: 'samples/bass/Bass_D1.wav',
  E1: 'samples/bass/Bass_E1.wav',
  F1: 'samples/bass/Bass_F1.wav',
  G1: 'samples/bass/Bass_G1.wav',
  ...GENERATED_BASS_SAMPLE_FILES,
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

function createLeadSampleUrls(baseUrl = '/') {
  const normalizedBaseUrl = baseUrl === '/' ? '' : trimTrailingSlash(baseUrl);

  return Object.fromEntries(
    Object.entries(LEAD_SAMPLE_FILES).map(([note, file]) => [
      note,
      `${normalizedBaseUrl}/${file}`,
    ]),
  );
}

function createBassSampleUrls(baseUrl = '/') {
  const normalizedBaseUrl = baseUrl === '/' ? '' : trimTrailingSlash(baseUrl);

  return Object.fromEntries(
    Object.entries(BASS_SAMPLE_FILES).map(([note, file]) => [
      note,
      `${normalizedBaseUrl}/${file}`,
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

function readVolumeSource(volumeSource) {
  if (!volumeSource) return {};
  return typeof volumeSource === 'function' ? volumeSource() : volumeSource;
}

function getVolumeForTrack(volumeSource, trackId) {
  const volumes = readVolumeSource(volumeSource);
  return clampTrackVolume(volumes?.[trackId]);
}

function applyVolume(node, volume) {
  if (!node) return;

  if (node.volume && typeof node.volume === 'object' && 'value' in node.volume) {
    node.volume.value = volume;
    return;
  }

  node.set?.({ volume });
}

export default class AudioEngine {
  constructor(options = {}) {
    this.tone = options.tone ?? null;
    this.loadTone = options.loadTone ?? null;
    this.toneLoadPromise = null;
    this.baseUrl = options.baseUrl ?? getDefaultBaseUrl();
    this.matrixSource = options.matrixSource ?? null;
    this.volumeSource = options.volumeSource ?? null;
    this.onPositionChange = options.onPositionChange ?? null;
    this.playerFactory = options.playerFactory ?? null;
    this.samplerFactory = options.samplerFactory ?? null;
    this.fallbackSynthFactory = options.fallbackSynthFactory ?? null;
    this.chordSynthFactory = options.chordSynthFactory ?? null;
    this.now = options.now ?? (() => this.tone?.now?.() ?? 0);
    this.status = AUDIO_STATUSES.IDLE;
    this.drumPlayers = new Map();
    this.fallbackSynth = null;
    this.chordSynth = null;
    this.leadSampler = null;
    this.bassSampler = null;
    this.matrixAdapter = null;
    this.transportEventId = null;
    this.transportFlatStep = 0;
    this.currentBar = 0;
    this.currentStep = 0;
  }

  get transport() {
    return this.tone?.Transport;
  }

  async ensureTone() {
    if (this.tone) return this.tone;
    if (!this.loadTone) return null;

    if (!this.toneLoadPromise) {
      this.toneLoadPromise = this.loadTone()
        .then((tone) => {
          this.tone = tone?.default ?? tone;
          return this.tone;
        })
        .catch((error) => {
          this.toneLoadPromise = null;
          throw error;
        });
    }

    return this.toneLoadPromise;
  }

  getSampleUrls() {
    return createDrumsSampleUrls(this.baseUrl);
  }

  getLeadSampleUrls() {
    return createLeadSampleUrls(this.baseUrl);
  }

  getBassSampleUrls() {
    return createBassSampleUrls(this.baseUrl);
  }

  getTrackVolume(trackId) {
    return getVolumeForTrack(this.volumeSource, trackId);
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

  createLeadSampler() {
    const urls = this.getLeadSampleUrls();
    if (this.samplerFactory) return callToDestination(this.samplerFactory(urls));
    if (!this.tone?.Sampler) return null;

    return callToDestination(new this.tone.Sampler({ urls }));
  }

  createBassSampler() {
    const urls = this.getBassSampleUrls();
    if (this.samplerFactory) return callToDestination(this.samplerFactory(urls));
    if (!this.tone?.Sampler) return null;

    return callToDestination(new this.tone.Sampler({ urls }));
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
      await this.ensureTone();
      await this.tone?.start?.();
      this.fallbackSynth = this.fallbackSynth ?? this.createFallbackSynth();
      this.chordSynth = this.chordSynth ?? this.createChordSynth();
      this.leadSampler = this.leadSampler ?? this.createLeadSampler();
      this.loadDrumsPlayers();
      this.status = AUDIO_STATUSES.READY;
    } catch {
      this.drumPlayers.clear();
      this.fallbackSynth = this.createFallbackSynth();
      this.chordSynth = this.chordSynth ?? this.createChordSynth();
      this.leadSampler = this.leadSampler ?? this.createLeadSampler();
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

  triggerDrumsInstrument(instrument, time = this.now(), volume = this.getTrackVolume('drums')) {
    if (!DRUMS_INSTRUMENT_IDS.includes(instrument)) return false;

    const player = this.drumPlayers.get(instrument);
    if (player?.start) {
      try {
        applyVolume(player, volume);
        player.start(time);
        return true;
      } catch {
        // Tone.Player can exist before its buffer is ready; keep first-click preview audible.
      }
    }

    if (this.fallbackSynth?.triggerAttackRelease) {
      try {
        applyVolume(this.fallbackSynth, volume);
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
    const volume = this.getTrackVolume('drums');
    return instrumentList
      .filter((instrument) => this.triggerDrumsInstrument(instrument, time, volume));
  }

  triggerChordNotes(notes, duration = '4n', time = this.now(), volume = this.getTrackVolume('chord')) {
    if (!Array.isArray(notes) || !notes.length) return false;
    if (!this.chordSynth?.triggerAttackRelease) return false;

    try {
      applyVolume(this.chordSynth, volume);
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

  triggerLeadSampler(note, duration = '16n', time = this.now(), volume = this.getTrackVolume('lead')) {
    if (!this.leadSampler?.triggerAttackRelease) return false;

    try {
      applyVolume(this.leadSampler, volume);
      this.leadSampler.triggerAttackRelease(note, duration, time);
      return true;
    } catch {
      return false;
    }
  }

  async triggerLeadNote(note, duration = '16n', time) {
    await this.startAudio();
    return this.triggerLeadSampler(note, duration, time ?? this.now());
  }

  triggerBassSampler(note, duration = '16n', time = this.now(), volume = this.getTrackVolume('bass')) {
    this.bassSampler = this.bassSampler ?? this.createBassSampler();
    if (!this.bassSampler?.triggerAttackRelease) return false;

    try {
      applyVolume(this.bassSampler, volume);
      this.bassSampler.triggerAttackRelease(note, duration, time);
      return true;
    } catch {
      return false;
    }
  }

  async triggerBassNote(note, duration = '16n', time) {
    await this.startAudio();
    return this.triggerBassSampler(note, duration, time ?? this.now());
  }

  async previewLeadSequence(notes, options = {}) {
    const {
      duration = '16n',
      intervalSeconds = 0.16,
    } = options;

    await this.startAudio();

    const startTime = this.now();
    const volume = this.getTrackVolume('lead');
    return notes.map((note, index) => this.triggerLeadSampler(
      note,
      duration,
      startTime + index * intervalSeconds,
      volume,
    ));
  }

  async previewChordSequence(noteGroups, options = {}) {
    const {
      duration = '8n',
      intervalSeconds = 0.55,
    } = options;

    await this.startAudio();

    const startTime = this.now();
    const volume = this.getTrackVolume('chord');
    return noteGroups.map((notes, index) => this.triggerChordNotes(
      notes,
      duration,
      startTime + index * intervalSeconds,
      volume,
    ));
  }

  async previewChordPattern(events, options = {}) {
    const {
      bpm = DEFAULT_BPM,
    } = options;

    await this.startAudio();

    const secondsPerSixteenth = 60 / bpm / 4;
    const startTime = this.now();
    const volume = this.getTrackVolume('chord');
    return events.map((event) => this.triggerChordNotes(
      event.notes,
      event.duration ?? '16n',
      startTime + event.step * secondsPerSixteenth,
      volume,
    ));
  }

  async previewBassPattern(events, options = {}) {
    const {
      bpm = DEFAULT_BPM,
    } = options;

    await this.startAudio();

    const secondsPerSixteenth = 60 / bpm / 4;
    const startTime = this.now();
    const volume = this.getTrackVolume('bass');
    return events.map((event) => this.triggerBassSampler(
      event.note,
      event.duration ?? '16n',
      startTime + event.step * secondsPerSixteenth,
      volume,
    ));
  }

  triggerChordEvent(event, time = this.now()) {
    return this.triggerChordNotes(
      event.notes,
      event.duration,
      time,
      this.getTrackVolume(event.trackId ?? 'chord'),
    );
  }

  setMatrixSource(matrixSource) {
    this.matrixSource = matrixSource;
    this.matrixAdapter = null;
  }

  setVolumeSource(volumeSource) {
    this.volumeSource = volumeSource;
  }

  hasTransportEvent() {
    return this.transportEventId !== null && this.transportEventId !== undefined;
  }

  hasStartedAudio() {
    return (
      this.status === AUDIO_STATUSES.READY
      || this.status === AUDIO_STATUSES.SAMPLE_FALLBACK
    );
  }

  getStartedTransport() {
    return this.hasStartedAudio() ? this.transport : null;
  }

  clearMatrixPlaybackSchedule() {
    const transport = this.getStartedTransport();
    if (!this.hasTransportEvent() || !transport?.clear) return false;

    transport.clear(this.transportEventId);
    this.transportEventId = null;
    return true;
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
    const transport = this.getStartedTransport();
    if (!adapter || !transport?.scheduleRepeat) return null;

    this.clearMatrixPlaybackSchedule();

    this.transportEventId = transport.scheduleRepeat((time) => {
      const position = adapter.getPositionForFlatStep(this.transportFlatStep);
      this.currentBar = position.bar;
      this.currentStep = position.step;
      this.onPositionChange?.(position.bar, position.step);

      for (const event of adapter.getEventsForStep(position.bar, position.step)) {
        if (event.type === 'drums') {
          this.triggerDrumsInstrument(event.instrument, time);
        }
        if (event.type === 'bass') {
          this.triggerBassSampler(
            event.note,
            event.duration,
            time,
            this.getTrackVolume(event.trackId ?? 'bass'),
          );
        }
        if (event.type === 'chord') {
          this.triggerChordEvent(event, time);
        }
        if (event.type === 'lead') {
          this.triggerLeadSampler(
            event.note,
            event.duration,
            time,
            this.getTrackVolume(event.trackId ?? 'lead'),
          );
        }
      }

      this.transportFlatStep = (this.transportFlatStep + 1) % adapter.totalSteps;
    }, '16n');

    return this.transportEventId;
  }

  syncTransport({ bpm = DEFAULT_BPM, bar = this.currentBar, step = this.currentStep } = {}) {
    const transport = this.getStartedTransport();
    if (transport?.bpm) {
      transport.bpm.value = bpm;
    }

    return this.seekToStep(bar, step);
  }

  seekToStep(bar, step) {
    this.currentBar = bar;
    this.currentStep = step;
    this.transportFlatStep = (bar * STEPS_PER_BAR + step) % (TOTAL_BARS * STEPS_PER_BAR);

    const transport = this.getStartedTransport();
    if (transport) {
      transport.position = formatToneTransportPosition(bar, step);
    }
  }

  async play(options = {}) {
    await this.startAudio();
    if (Object.hasOwn(options, 'volumeSource')) {
      this.setVolumeSource(options.volumeSource);
    }
    this.syncTransport(options);

    if (options.matrixSource || this.matrixSource) {
      this.scheduleMatrixPlayback(options.matrixSource ?? this.matrixSource);
    }

    this.getStartedTransport()?.start?.();
  }

  async pause() {
    this.getStartedTransport()?.pause?.();
  }

  async stop() {
    const transport = this.getStartedTransport();
    transport?.stop?.();
    if (transport) {
      transport.position = formatToneTransportPosition(this.currentBar, this.currentStep);
    }
    this.clearMatrixPlaybackSchedule();
  }
}

export {
  createBassSampleUrls,
  createDrumsSampleUrls,
  createLeadSampleUrls,
  formatToneTransportPosition,
};
