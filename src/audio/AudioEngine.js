import {
  DEFAULT_BPM,
  DRUMS_INSTRUMENT_IDS,
  STEPS_PER_BAR,
  TOTAL_BARS,
} from '../domain/musicConstants.js';
import { getTrackTypeFromInstanceId } from '../domain/trackInstances.js';
import { clampTrackVolume } from '../domain/trackVolume.js';
import { AUDIO_STATUSES } from './audioStatus.js';
import { createMatrixPlaybackAdapter } from './matrixPlaybackAdapter.js';

const DRUMS_SAMPLE_FILES = Object.freeze({
  kick: 'samples/Drums/Kick_v0.22.wav',
  snare: 'samples/Drums/Snare_v0.22.wav',
  hihat: 'samples/Drums/Hihat_v0.22.wav',
});
const SAMPLE_ASSET_VERSION = 'sample-refresh-20260608';
const CHORD_SAMPLE_DURATION = '2s';

function createRootOctaveSampleFiles({ directory, prefix, roots, octaves, sampleVersion = 'v0.22' }) {
  return Object.freeze(Object.fromEntries(
    octaves.flatMap((octave) => roots.map((root) => {
      const note = `${root}${octave}`;
      return [note, `samples/${directory}/${prefix}_${note}_${sampleVersion}.wav`];
    })),
  ));
}

const NATURAL_SAMPLE_ROOTS = Object.freeze(['A', 'B', 'C', 'D', 'E', 'F', 'G']);

const MELODY_SAMPLE_FILES = createRootOctaveSampleFiles({
  directory: 'Melody',
  prefix: 'Melody',
  roots: NATURAL_SAMPLE_ROOTS,
  octaves: [2, 3, 4],
});

const CHORD_SAMPLE_FILES = createRootOctaveSampleFiles({
  directory: 'Chords',
  prefix: 'Chord',
  roots: NATURAL_SAMPLE_ROOTS,
  octaves: [2, 3, 4],
  sampleVersion: 'v0.3',
});

const BASS_SAMPLE_FILES = Object.freeze({
  A0: 'samples/Bass/Bass_A0_v0.22.wav',
  B0: 'samples/Bass/Bass_B0_v0.22.wav',
  C1: 'samples/Bass/Bass_C1_v0.22.wav',
  D1: 'samples/Bass/Bass_D1_v0.22.wav',
  E1: 'samples/Bass/Bass_E1_v0.22.wav',
  F0: 'samples/Bass/Bass_F0_v0.22.wav',
  G0: 'samples/Bass/Bass_G0_v0.22.wav',
});

const DRUM_FALLBACK_NOTES = Object.freeze({
  kick: 'C1',
  snare: 'D1',
  hihat: 'F#1',
});

function trimTrailingSlash(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function appendSampleAssetVersion(url) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${SAMPLE_ASSET_VERSION}`;
}

function createSampleUrl(normalizedBaseUrl, file) {
  return appendSampleAssetVersion(`${normalizedBaseUrl}/${file}`);
}

function createDrumsSampleUrls(baseUrl = '/') {
  const normalizedBaseUrl = baseUrl === '/' ? '' : trimTrailingSlash(baseUrl);

  return Object.fromEntries(
    DRUMS_INSTRUMENT_IDS.map((instrument) => [
      instrument,
      createSampleUrl(normalizedBaseUrl, DRUMS_SAMPLE_FILES[instrument]),
    ]),
  );
}

function createMelodySampleUrls(baseUrl = '/') {
  const normalizedBaseUrl = baseUrl === '/' ? '' : trimTrailingSlash(baseUrl);

  return Object.fromEntries(
    Object.entries(MELODY_SAMPLE_FILES).map(([note, file]) => [
      note,
      createSampleUrl(normalizedBaseUrl, file),
    ]),
  );
}

function createBassSampleUrls(baseUrl = '/') {
  const normalizedBaseUrl = baseUrl === '/' ? '' : trimTrailingSlash(baseUrl);

  return Object.fromEntries(
    Object.entries(BASS_SAMPLE_FILES).map(([note, file]) => [
      note,
      createSampleUrl(normalizedBaseUrl, file),
    ]),
  );
}

function createChordSampleUrls(baseUrl = '/') {
  const normalizedBaseUrl = baseUrl === '/' ? '' : trimTrailingSlash(baseUrl);

  return Object.fromEntries(
    Object.entries(CHORD_SAMPLE_FILES).map(([note, file]) => [
      note,
      createSampleUrl(normalizedBaseUrl, file),
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
  const mix = readVolumeSource(volumeSource);
  if (mix?.mutedTracks?.[trackId] === true) return -Infinity;

  const volumes = mix?.volumes ?? mix;
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

function normalizeAudibleTrackIds(trackIds) {
  if (!Array.isArray(trackIds)) return null;
  return new Set(trackIds.filter((trackId) => typeof trackId === 'string' && trackId.length > 0));
}

function normalizeMaxPlaybackSteps(maxPlaybackSteps) {
  return Number.isInteger(maxPlaybackSteps) && maxPlaybackSteps > 0
    ? maxPlaybackSteps
    : null;
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
    this.onPlaybackComplete = options.onPlaybackComplete ?? null;
    this.playerFactory = options.playerFactory ?? null;
    this.samplerFactory = options.samplerFactory ?? null;
    this.melodyInputSamplerFactory = options.melodyInputSamplerFactory ?? null;
    this.melodyOneShotSamplerFactory = options.melodyOneShotSamplerFactory ?? null;
    this.chordSamplerFactory = options.chordSamplerFactory ?? null;
    this.fallbackSynthFactory = options.fallbackSynthFactory ?? null;
    this.chordSynthFactory = options.chordSynthFactory ?? null;
    this.now = options.now ?? (() => this.tone?.now?.() ?? 0);
    this.scheduleTimeout = options.scheduleTimeout ?? ((callback, delay) => (
      globalThis.setTimeout(callback, delay)
    ));
    this.cancelTimeout = options.cancelTimeout ?? ((timerId) => globalThis.clearTimeout(timerId));
    this.status = AUDIO_STATUSES.IDLE;
    this.drumPlayers = new Map();
    this.fallbackSynth = null;
    this.chordSampler = null;
    this.chordSynth = null;
    this.melodySampler = null;
    this.melodyInputSampler = null;
    this.melodyOneShotSampler = null;
    this.melodyInputRequestId = 0;
    this.bassSampler = null;
    this.instanceAudioNodes = new Map();
    this.matrixAdapter = null;
    this.transportEventId = null;
    this.transportFlatStep = 0;
    this.audibleTrackIds = null;
    this.maxPlaybackSteps = null;
    this.playedSteps = 0;
    this.currentBar = 0;
    this.currentStep = 0;
    this.chordClipPreviewRequestId = 0;
    this.chordClipPreviewSession = null;
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

  getMelodySampleUrls() {
    return createMelodySampleUrls(this.baseUrl);
  }

  getBassSampleUrls() {
    return createBassSampleUrls(this.baseUrl);
  }

  getChordSampleUrls() {
    return createChordSampleUrls(this.baseUrl);
  }

  getTrackVolume(trackId) {
    return getVolumeForTrack(this.volumeSource, trackId);
  }

  refreshTrackVolume(trackId) {
    const trackType = getTrackTypeFromInstanceId(trackId);
    if (!trackType) return null;
    const volume = this.getTrackVolume(trackId);
    const nodes = this.getInstanceAudioNodes(trackId, trackType, { create: false });
    if (trackType === 'drums') {
      nodes?.drumPlayers?.forEach((player) => applyVolume(player, volume));
      applyVolume(nodes?.fallbackSynth, volume);
    }
    if (trackType === 'chord') {
      applyVolume(nodes?.chordSampler, volume);
      applyVolume(nodes?.chordSynth, volume);
    }
    if (trackType === 'bass') applyVolume(nodes?.bassSampler, volume);
    if (trackType === 'melody') {
      applyVolume(nodes?.melodySampler, volume);
      applyVolume(nodes?.melodyInputSampler, volume);
      applyVolume(nodes?.melodyOneShotSampler, volume);
      if (volume === -Infinity) this.stopMelodyVoices(this.now(), trackId);
    }
    return volume;
  }

  getInstanceAudioNodes(trackId, trackType = getTrackTypeFromInstanceId(trackId), options = {}) {
    const { create = true } = options;
    if (!trackType) return null;
    if (trackId === trackType) {
      return {
        bassSampler: this.bassSampler,
        chordSampler: this.chordSampler,
        chordSynth: this.chordSynth,
        drumPlayers: this.drumPlayers,
        fallbackSynth: this.fallbackSynth,
        melodyInputSampler: this.melodyInputSampler,
        melodyOneShotSampler: this.melodyOneShotSampler,
        melodySampler: this.melodySampler,
      };
    }

    let nodes = this.instanceAudioNodes.get(trackId);
    if (!nodes && create) {
      nodes = {
        bassSampler: null,
        chordSampler: null,
        chordSynth: null,
        drumPlayers: new Map(),
        fallbackSynth: null,
        melodyInputSampler: null,
        melodyOneShotSampler: null,
        melodySampler: null,
      };
      this.instanceAudioNodes.set(trackId, nodes);
    }
    return nodes ?? null;
  }

  ensureInstanceAudioNodes(trackId, trackType = getTrackTypeFromInstanceId(trackId)) {
    const nodes = this.getInstanceAudioNodes(trackId, trackType);
    if (!nodes || trackId === trackType) return nodes;

    if (trackType === 'drums') {
      nodes.fallbackSynth = nodes.fallbackSynth ?? this.createFallbackSynth();
      const sampleUrls = this.getSampleUrls();
      for (const instrument of DRUMS_INSTRUMENT_IDS) {
        if (nodes.drumPlayers.has(instrument)) continue;
        const player = callToDestination(this.createPlayer(sampleUrls[instrument], instrument));
        nodes.drumPlayers.set(instrument, player);
      }
    }
    if (trackType === 'chord') {
      nodes.chordSampler = nodes.chordSampler ?? this.createChordSampler();
      nodes.chordSynth = nodes.chordSynth ?? this.createChordSynth();
    }
    if (trackType === 'bass') {
      nodes.bassSampler = nodes.bassSampler ?? this.createBassSampler();
    }
    if (trackType === 'melody') {
      nodes.melodySampler = nodes.melodySampler ?? this.createMelodySampler();
      nodes.melodyInputSampler = nodes.melodyInputSampler ?? this.createMelodyInputSampler();
      nodes.melodyOneShotSampler = nodes.melodyOneShotSampler
        ?? this.createMelodyOneShotSampler();
    }
    return nodes;
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

  createMelodySampler() {
    const urls = this.getMelodySampleUrls();
    if (this.samplerFactory) return callToDestination(this.samplerFactory(urls));
    if (!this.tone?.Sampler) return null;

    return callToDestination(new this.tone.Sampler({ urls }));
  }

  createMelodyInputSampler() {
    const urls = this.getMelodySampleUrls();
    const factory = this.melodyInputSamplerFactory ?? this.samplerFactory;
    if (factory) return callToDestination(factory(urls));
    if (!this.tone?.Sampler) return null;

    return callToDestination(new this.tone.Sampler({ urls }));
  }

  createMelodyOneShotSampler() {
    const urls = this.getMelodySampleUrls();
    const factory = this.melodyOneShotSamplerFactory ?? this.samplerFactory;
    if (factory) return callToDestination(factory(urls));
    if (!this.tone?.Sampler) return null;

    return callToDestination(new this.tone.Sampler({ urls }));
  }

  createChordSampler() {
    const urls = this.getChordSampleUrls();
    if (this.chordSamplerFactory) return callToDestination(this.chordSamplerFactory(urls));
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
      this.chordSampler = this.chordSampler ?? this.createChordSampler();
      this.chordSynth = this.chordSynth ?? this.createChordSynth();
      this.melodySampler = this.melodySampler ?? this.createMelodySampler();
      this.loadDrumsPlayers();
      this.status = AUDIO_STATUSES.READY;
    } catch {
      this.drumPlayers.clear();
      this.fallbackSynth = this.createFallbackSynth();
      this.chordSampler = this.chordSampler ?? this.createChordSampler();
      this.chordSynth = this.chordSynth ?? this.createChordSynth();
      this.melodySampler = this.melodySampler ?? this.createMelodySampler();
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

  triggerDrumsInstrument(
    instrument,
    time = this.now(),
    volume = this.getTrackVolume('drums'),
    trackId = 'drums',
  ) {
    if (!DRUMS_INSTRUMENT_IDS.includes(instrument)) return false;

    const nodes = trackId === 'drums'
      ? { drumPlayers: this.drumPlayers, fallbackSynth: this.fallbackSynth }
      : this.ensureInstanceAudioNodes(trackId, 'drums');
    const player = nodes?.drumPlayers?.get(instrument);
    if (player?.start) {
      try {
        applyVolume(player, volume);
        player.start(time);
        return true;
      } catch {
        // Tone.Player can exist before its buffer is ready; keep first-click preview audible.
      }
    }

    if (nodes?.fallbackSynth?.triggerAttackRelease) {
      try {
        applyVolume(nodes.fallbackSynth, volume);
        nodes.fallbackSynth.triggerAttackRelease(DRUM_FALLBACK_NOTES[instrument], '16n', time);
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  async triggerDrumsStep(instruments, time = this.now(), options = {}) {
    await this.startAudio();

    const trackId = options.trackId ?? 'drums';
    const instrumentList = Array.isArray(instruments) ? instruments : [instruments];
    const volume = this.getTrackVolume(trackId);
    return instrumentList
      .filter((instrument) => this.triggerDrumsInstrument(instrument, time, volume, trackId));
  }

  triggerChordNotes(
    notes,
    duration = '4n',
    time = this.now(),
    volume = this.getTrackVolume('chord'),
    trackId = 'chord',
  ) {
    if (!Array.isArray(notes) || !notes.length) return false;

    const nodes = trackId === 'chord'
      ? { chordSampler: this.chordSampler, chordSynth: this.chordSynth }
      : this.ensureInstanceAudioNodes(trackId, 'chord');
    if (nodes?.chordSampler?.triggerAttackRelease) {
      try {
        applyVolume(nodes.chordSampler, volume);
        nodes.chordSampler.triggerAttackRelease(notes, CHORD_SAMPLE_DURATION, time);
        return true;
      } catch {
        // Fall through to synth so a missing or not-yet-loaded chord sample stays audible.
      }
    }

    if (!nodes?.chordSynth?.triggerAttackRelease) return false;
    try {
      applyVolume(nodes.chordSynth, volume);
      nodes.chordSynth.triggerAttackRelease(notes, duration, time);
      return true;
    } catch {
      return false;
    }
  }

  async triggerChord(notes, duration = '4n', time = this.now()) {
    await this.startAudio();
    return this.triggerChordNotes(notes, duration, time);
  }

  triggerMelodySampler(note, duration = '16n', time = this.now(), volume = this.getTrackVolume('melody')) {
    void duration;
    return this.triggerMelodyOneShot(note, time, volume);
  }

  triggerMelodyOneShot(
    note,
    time = this.now(),
    volume = this.getTrackVolume('melody'),
    trackId = 'melody',
  ) {
    const nodes = trackId === 'melody'
      ? null
      : this.ensureInstanceAudioNodes(trackId, 'melody');
    if (trackId === 'melody') {
      this.melodyOneShotSampler = this.melodyOneShotSampler
        ?? this.createMelodyOneShotSampler();
    }
    const sampler = trackId === 'melody'
      ? this.melodyOneShotSampler
      : nodes?.melodyOneShotSampler;
    if (!sampler?.triggerAttack) return false;

    try {
      applyVolume(sampler, volume);
      sampler.triggerAttack(note, time);
      return true;
    } catch {
      return false;
    }
  }

  async triggerMelodyNote(note, duration = '16n', time) {
    await this.startAudio();
    void duration;
    return this.triggerMelodyOneShot(note, time ?? this.now());
  }

  triggerMelodyInputSampler(
    note,
    duration = '16n',
    time = this.now(),
    volume = this.getTrackVolume('melody'),
  ) {
    void duration;
    return this.triggerMelodyInputOneShotSampler(note, time, volume);
  }

  triggerMelodyInputOneShotSampler(
    note,
    time = this.now(),
    volume = this.getTrackVolume('melody'),
  ) {
    this.melodyInputSampler = this.melodyInputSampler ?? this.createMelodyInputSampler();
    if (!this.melodyInputSampler?.triggerAttack) return false;

    try {
      applyVolume(this.melodyInputSampler, volume);
      this.melodyInputSampler.triggerAttack(note, time);
      return true;
    } catch {
      return false;
    }
  }

  async triggerMelodyInputNote(note, duration = '16n', time) {
    const requestId = this.melodyInputRequestId;
    await this.startAudio();
    if (requestId !== this.melodyInputRequestId) return false;
    void duration;
    return this.triggerMelodyInputSampler(note, duration, time ?? this.now());
  }

  async triggerMelodyInputOneShot(note, time, options = {}) {
    const requestId = this.melodyInputRequestId;
    await this.startAudio();
    if (requestId !== this.melodyInputRequestId) return false;
    const trackId = options.trackId ?? 'melody';
    if (trackId === 'melody') {
      return this.triggerMelodyInputOneShotSampler(note, time ?? this.now());
    }
    const nodes = this.ensureInstanceAudioNodes(trackId, 'melody');
    const sampler = nodes?.melodyInputSampler;
    if (!sampler?.triggerAttack) return false;
    try {
      applyVolume(sampler, this.getTrackVolume(trackId));
      sampler.triggerAttack(note, time ?? this.now());
      return true;
    } catch {
      return false;
    }
  }

  releaseMelodyInputNote() {
    return false;
  }

  releaseAllMelodyInputNotes(time = this.now()) {
    this.melodyInputRequestId += 1;
    this.melodyInputSampler?.releaseAll?.(time);
  }

  stopMelodyVoices(time = this.now(), trackId = null) {
    if (!trackId || trackId === 'melody') {
      this.melodySampler?.releaseAll?.(time);
      this.releaseAllMelodyInputNotes(time);
      this.melodyOneShotSampler?.releaseAll?.(time);
    }
    if (trackId && trackId !== 'melody') {
      const nodes = this.getInstanceAudioNodes(trackId, 'melody', { create: false });
      nodes?.melodySampler?.releaseAll?.(time);
      nodes?.melodyInputSampler?.releaseAll?.(time);
      nodes?.melodyOneShotSampler?.releaseAll?.(time);
      return;
    }
    this.instanceAudioNodes.forEach((nodes) => {
      nodes.melodySampler?.releaseAll?.(time);
      nodes.melodyInputSampler?.releaseAll?.(time);
      nodes.melodyOneShotSampler?.releaseAll?.(time);
    });
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

  async triggerBassNote(note, duration = '16n', time, options = {}) {
    await this.startAudio();
    const trackId = options.trackId ?? 'bass';
    if (trackId === 'bass') return this.triggerBassSampler(note, duration, time ?? this.now());
    const nodes = this.ensureInstanceAudioNodes(trackId, 'bass');
    if (!nodes?.bassSampler?.triggerAttackRelease) return false;
    try {
      const volume = this.getTrackVolume(trackId);
      applyVolume(nodes.bassSampler, volume);
      nodes.bassSampler.triggerAttackRelease(note, duration, time ?? this.now());
      return true;
    } catch {
      return false;
    }
  }

  async previewMelodySequence(notes, options = {}) {
    const {
      intervalSeconds = 0.16,
      trackId = 'melody',
    } = options;

    await this.startAudio();

    const startTime = this.now();
    const volume = this.getTrackVolume(trackId);
    if (trackId === 'melody') {
      return notes.map((note, index) => this.triggerMelodyInputOneShotSampler(
        note,
        startTime + index * intervalSeconds,
        volume,
      ));
    }
    const nodes = this.ensureInstanceAudioNodes(trackId, 'melody');
    return notes.map((note, index) => {
      applyVolume(nodes?.melodyInputSampler, volume);
      nodes?.melodyInputSampler?.triggerAttack?.(note, startTime + index * intervalSeconds);
      return Boolean(nodes?.melodyInputSampler);
    });
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

  releaseChordPreviewVoices(time = this.now()) {
    this.chordSampler?.releaseAll?.(time);
    this.chordSynth?.releaseAll?.(time);
    this.instanceAudioNodes.forEach((nodes) => {
      nodes.chordSampler?.releaseAll?.(time);
      nodes.chordSynth?.releaseAll?.(time);
    });
  }

  stopChordClipSequencePreview() {
    this.chordClipPreviewRequestId += 1;
    const session = this.chordClipPreviewSession;
    if (!session) return false;

    session.timerIds.forEach((timerId) => this.cancelTimeout(timerId));
    this.chordClipPreviewSession = null;
    this.releaseChordPreviewVoices();
    session.resolve('stopped');
    return true;
  }

  async previewChordClipSequence(events, options = {}) {
    const {
      bpm = DEFAULT_BPM,
      totalSteps = STEPS_PER_BAR * 4,
      trackId = 'chord',
    } = options;
    const normalizedEvents = Array.isArray(events)
      ? events.filter((event) => (
        Number.isFinite(event?.step)
        && event.step >= 0
        && event.step < totalSteps
        && Array.isArray(event.notes)
        && event.notes.length
      ))
      : [];

    this.stopChordClipSequencePreview();
    if (!normalizedEvents.length || !Number.isFinite(totalSteps) || totalSteps <= 0) {
      return 'empty';
    }

    const requestId = ++this.chordClipPreviewRequestId;
    await this.startAudio();
    if (requestId !== this.chordClipPreviewRequestId) return 'stopped';

    const normalizedBpm = Number.isFinite(bpm) && bpm > 0 ? bpm : DEFAULT_BPM;
    const millisecondsPerSixteenth = (60 / normalizedBpm / 4) * 1000;
    return new Promise((resolve) => {
      const session = {
        requestId,
        resolve,
        timerIds: new Set(),
      };
      this.chordClipPreviewSession = session;

      const finish = (result) => {
        if (this.chordClipPreviewSession !== session) return;
        session.timerIds.forEach((timerId) => this.cancelTimeout(timerId));
        this.chordClipPreviewSession = null;
        this.releaseChordPreviewVoices();
        resolve(result);
      };

      normalizedEvents.forEach((event) => {
        const timerId = this.scheduleTimeout(() => {
          session.timerIds.delete(timerId);
          if (this.chordClipPreviewSession !== session) return;
          this.triggerChordNotes(
            event.notes,
            event.duration ?? '16n',
            this.now(),
            this.getTrackVolume(trackId),
            trackId,
          );
        }, event.step * millisecondsPerSixteenth);
        session.timerIds.add(timerId);
      });

      const completionTimerId = this.scheduleTimeout(() => {
        session.timerIds.delete(completionTimerId);
        finish('completed');
      }, totalSteps * millisecondsPerSixteenth);
      session.timerIds.add(completionTimerId);
    });
  }

  async previewBassPattern(events, options = {}) {
    const {
      bpm = DEFAULT_BPM,
      trackId = 'bass',
    } = options;

    await this.startAudio();

    const secondsPerSixteenth = 60 / bpm / 4;
    const startTime = this.now();
    const volume = this.getTrackVolume(trackId);
    if (trackId === 'bass') {
      return events.map((event) => this.triggerBassSampler(
        event.note,
        event.duration ?? '16n',
        startTime + event.step * secondsPerSixteenth,
        volume,
      ));
    }
    const nodes = this.ensureInstanceAudioNodes(trackId, 'bass');
    return events.map((event) => {
      applyVolume(nodes?.bassSampler, volume);
      nodes?.bassSampler?.triggerAttackRelease?.(
        event.note,
        event.duration ?? '16n',
        startTime + event.step * secondsPerSixteenth,
      );
      return Boolean(nodes?.bassSampler);
    });
  }

  triggerChordEvent(event, time = this.now()) {
    const trackId = event.trackId ?? 'chord';
    return this.triggerChordNotes(
      event.notes,
      event.duration,
      time,
      this.getTrackVolume(trackId),
      trackId,
    );
  }

  setMatrixSource(matrixSource) {
    this.matrixSource = matrixSource;
    this.matrixAdapter = null;
  }

  setVolumeSource(volumeSource) {
    this.volumeSource = volumeSource;
  }

  setPlaybackCompleteHandler(handler) {
    this.onPlaybackComplete = typeof handler === 'function' ? handler : null;
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
        if (this.audibleTrackIds && !this.audibleTrackIds.has(event.trackId)) continue;
        if (event.type === 'drums') {
          const trackId = event.trackId ?? 'drums';
          this.triggerDrumsInstrument(
            event.instrument,
            time,
            this.getTrackVolume(trackId),
            trackId,
          );
        }
        if (event.type === 'bass') {
          const trackId = event.trackId ?? 'bass';
          if (trackId === 'bass') {
            this.triggerBassSampler(
              event.note,
              event.duration,
              time,
              this.getTrackVolume(trackId),
            );
          } else {
            const nodes = this.ensureInstanceAudioNodes(trackId, 'bass');
            applyVolume(nodes?.bassSampler, this.getTrackVolume(trackId));
            nodes?.bassSampler?.triggerAttackRelease?.(event.note, event.duration, time);
          }
        }
        if (event.type === 'chord') {
          this.triggerChordEvent(event, time);
        }
        if (event.type === 'melody') {
          const melodyVolume = this.getTrackVolume(event.trackId ?? 'melody');
          this.triggerMelodyOneShot(
            event.note,
            time,
            melodyVolume,
            event.trackId ?? 'melody',
          );
        }
      }

      this.transportFlatStep = (this.transportFlatStep + 1) % adapter.totalSteps;
      this.playedSteps += 1;
      if (this.maxPlaybackSteps !== null && this.playedSteps >= this.maxPlaybackSteps) {
        const onPlaybackComplete = this.onPlaybackComplete;
        const completion = {
          bar: position.bar,
          playedSteps: this.playedSteps,
          step: position.step,
        };
        void this.stop(time);
        onPlaybackComplete?.(completion);
      }
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

  setTempo(bpm = DEFAULT_BPM) {
    const normalizedBpm = Number.isFinite(bpm) && bpm > 0 ? bpm : DEFAULT_BPM;
    const transport = this.getStartedTransport();
    if (!transport?.bpm) return false;

    transport.bpm.value = normalizedBpm;
    return true;
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
    this.stopChordClipSequencePreview();
    await this.startAudio();
    if (Object.hasOwn(options, 'volumeSource')) {
      this.setVolumeSource(options.volumeSource);
    }
    if (Object.hasOwn(options, 'onPositionChange')) {
      this.onPositionChange = typeof options.onPositionChange === 'function'
        ? options.onPositionChange
        : null;
    }
    if (Object.hasOwn(options, 'onPlaybackComplete')) {
      this.onPlaybackComplete = typeof options.onPlaybackComplete === 'function'
        ? options.onPlaybackComplete
        : null;
    }
    this.audibleTrackIds = normalizeAudibleTrackIds(options.audibleTrackIds);
    this.maxPlaybackSteps = normalizeMaxPlaybackSteps(options.maxPlaybackSteps);
    this.playedSteps = 0;
    this.syncTransport(options);

    if (options.matrixSource || this.matrixSource) {
      this.scheduleMatrixPlayback(options.matrixSource ?? this.matrixSource);
    }

    this.getStartedTransport()?.start?.();
  }

  async pause() {
    this.getStartedTransport()?.pause?.();
  }

  async stop(time = this.now()) {
    this.stopChordClipSequencePreview();
    const transport = this.getStartedTransport();
    transport?.stop?.(time);
    this.stopMelodyVoices(time);
    if (transport) {
      transport.position = formatToneTransportPosition(this.currentBar, this.currentStep);
    }
    this.clearMatrixPlaybackSchedule();
  }
}

export {
  createBassSampleUrls,
  createChordSampleUrls,
  createDrumsSampleUrls,
  createMelodySampleUrls,
  formatToneTransportPosition,
};
