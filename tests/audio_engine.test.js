import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { AUDIO_STATUSES } from '../src/audio/audioStatus.js';
import AudioEngine, {
  createDrumsSampleUrls,
  formatToneTransportPosition,
} from '../src/audio/AudioEngine.js';
import createAudioEngine from '../src/audio/createAudioEngine.js';
import { STEPS_PER_BAR } from '../src/domain/musicConstants.js';
import createInitialMatrix from '../src/store/createInitialMatrix.js';

function createFakeTone() {
  const calls = [];
  const transport = {
    bpm: { value: null },
    position: '0:0:0',
    scheduledCallback: null,
    scheduleRepeat(callback, interval) {
      calls.push(['transport.scheduleRepeat', interval]);
      this.scheduledCallback = callback;
      return 'repeat-id';
    },
    clear(id) {
      calls.push(['transport.clear', id]);
    },
    start() {
      calls.push(['transport.start']);
    },
    pause() {
      calls.push(['transport.pause']);
    },
    stop() {
      calls.push(['transport.stop']);
    },
  };

  return {
    calls,
    now: () => 12.5,
    start: async () => calls.push(['tone.start']),
    Transport: transport,
  };
}

function createFakeToneWithEventIds(eventIds) {
  const tone = createFakeTone();
  let eventIndex = 0;
  tone.Transport.scheduleRepeat = (callback, interval) => {
    tone.calls.push(['transport.scheduleRepeat', interval]);
    tone.Transport.scheduledCallback = callback;
    const eventId = eventIds[eventIndex] ?? eventIds.at(-1);
    eventIndex += 1;
    return eventId;
  };
  return tone;
}

function createToneWithBlockedTransport() {
  return {
    get Transport() {
      throw new Error('Transport should not be touched before audio starts');
    },
  };
}

function createPlayerFactory(calls) {
  return (url, instrument) => ({
    start: (time) => calls.push(['player.start', instrument, url, time]),
    toDestination: () => calls.push(['player.toDestination', instrument]),
  });
}

function createChordSynthFactory(calls) {
  return () => ({
    triggerAttackRelease: (notes, duration, time) => calls.push([
      'chord.triggerAttackRelease',
      notes,
      duration,
      time,
    ]),
    toDestination: () => calls.push(['chord.toDestination']),
  });
}

function createVolumeAwarePlayerFactory(calls) {
  return (url, instrument) => {
    const player = {
      volume: { value: 0 },
      start(time) {
        calls.push(['player.start', instrument, url, time, player.volume.value]);
      },
      toDestination() {
        calls.push(['player.toDestination', instrument]);
        return player;
      },
    };

    return player;
  };
}

function createVolumeAwareChordSynthFactory(calls) {
  return () => {
    const synth = {
      volume: { value: 0 },
      triggerAttackRelease(notes, duration, time) {
        calls.push(['chord.triggerAttackRelease', notes, duration, time, synth.volume.value]);
      },
      toDestination() {
        calls.push(['chord.toDestination']);
        return synth;
      },
    };

    return synth;
  };
}

test('audio statuses expose the phase 4 lifecycle states', () => {
  assert.deepEqual(AUDIO_STATUSES, {
    IDLE: 'idle',
    STARTING: 'starting',
    READY: 'ready',
    SAMPLE_FALLBACK: 'sample-fallback',
    ERROR: 'error',
  });
});

test('createDrumsSampleUrls maps drums instruments to migrated 808 samples', () => {
  assert.deepEqual(createDrumsSampleUrls('/arranger/'), {
    kick: '/arranger/samples/808/kick.wav',
    snare: '/arranger/samples/808/snare.wav',
    hihat: '/arranger/samples/808/hihat.wav',
  });
});

test('formatToneTransportPosition converts matrix bar and step to Tone position', () => {
  assert.equal(formatToneTransportPosition(0, 0), '0:0:0');
  assert.equal(formatToneTransportPosition(2, 9), '2:2:1');
  assert.equal(formatToneTransportPosition(7, STEPS_PER_BAR - 1), '7:3:3');
});

test('AudioEngine starts audio and triggers drums samples', async () => {
  const tone = createFakeTone();
  const engine = new AudioEngine({
    tone,
    baseUrl: '/',
    playerFactory: createPlayerFactory(tone.calls),
  });

  assert.equal(engine.status, AUDIO_STATUSES.IDLE);
  assert.equal(await engine.startAudio(), AUDIO_STATUSES.READY);
  await engine.triggerDrumsStep(['kick', 'snare']);

  assert.equal(engine.status, AUDIO_STATUSES.READY);
  assert.deepEqual(tone.calls, [
    ['tone.start'],
    ['player.toDestination', 'kick'],
    ['player.toDestination', 'snare'],
    ['player.toDestination', 'hihat'],
    ['player.start', 'kick', '/samples/808/kick.wav', 12.5],
    ['player.start', 'snare', '/samples/808/snare.wav', 12.5],
  ]);
});

test('AudioEngine starts audio and triggers chord synth notes', async () => {
  const tone = createFakeTone();
  const engine = new AudioEngine({
    tone,
    playerFactory: createPlayerFactory(tone.calls),
    chordSynthFactory: createChordSynthFactory(tone.calls),
  });

  assert.equal(await engine.startAudio(), AUDIO_STATUSES.READY);
  assert.equal(await engine.triggerChord(['C4', 'E4', 'G4'], '4n'), true);

  assert.deepEqual(tone.calls.filter(([name]) => name.startsWith('chord.')), [
    ['chord.toDestination'],
    ['chord.triggerAttackRelease', ['C4', 'E4', 'G4'], '4n', 12.5],
  ]);
});

test('AudioEngine uses synth fallback when drum samples cannot load', async () => {
  const tone = createFakeTone();
  const fallbackCalls = [];
  const engine = new AudioEngine({
    tone,
    playerFactory: () => {
      throw new Error('sample failed');
    },
    fallbackSynthFactory: () => ({
      triggerAttackRelease: (note, duration, time) => fallbackCalls.push([note, duration, time]),
    }),
  });

  assert.equal(await engine.startAudio(), AUDIO_STATUSES.SAMPLE_FALLBACK);
  await engine.triggerDrumsStep('kick');

  assert.deepEqual(fallbackCalls, [['C1', '16n', 12.5]]);
});

test('AudioEngine falls back if a loaded sample player cannot start yet', async () => {
  const tone = createFakeTone();
  const fallbackCalls = [];
  const engine = new AudioEngine({
    tone,
    playerFactory: (url, instrument) => ({
      start: () => {
        throw new Error(`${instrument} sample not ready: ${url}`);
      },
      toDestination: () => tone.calls.push(['player.toDestination', instrument]),
    }),
    fallbackSynthFactory: () => ({
      triggerAttackRelease: (note, duration, time) => fallbackCalls.push([note, duration, time]),
    }),
  });

  assert.equal(await engine.startAudio(), AUDIO_STATUSES.READY);
  await engine.triggerDrumsStep('hihat');

  assert.deepEqual(fallbackCalls, [['F#1', '16n', 12.5]]);
});

test('AudioEngine contains fallback synth trigger errors during stacked drums preview', async () => {
  const tone = createFakeTone();
  const engine = new AudioEngine({
    tone,
    playerFactory: () => {
      throw new Error('sample failed');
    },
    fallbackSynthFactory: () => ({
      triggerAttackRelease: () => {
        throw new Error('same start time');
      },
    }),
  });

  assert.equal(await engine.startAudio(), AUDIO_STATUSES.SAMPLE_FALLBACK);
  assert.deepEqual(await engine.triggerDrumsStep(['kick', 'snare']), []);
});

test('AudioEngine syncs transport play pause stop and seek', async () => {
  const tone = createFakeTone();
  const matrix = createInitialMatrix();
  const engine = new AudioEngine({
    tone,
    matrixSource: matrix,
    playerFactory: createPlayerFactory(tone.calls),
  });

  await engine.play({ bpm: 96 });
  await engine.pause();
  await engine.seekToStep(3, 12);
  await engine.stop();

  assert.equal(tone.Transport.bpm.value, 96);
  assert.equal(tone.Transport.position, '3:3:0');
  assert.equal(engine.currentBar, 3);
  assert.equal(engine.currentStep, 12);
  assert.equal(engine.transportFlatStep, 60);
  assert.deepEqual(tone.calls.filter(([name]) => name.startsWith('transport.')), [
    ['transport.scheduleRepeat', '16n'],
    ['transport.start'],
    ['transport.pause'],
    ['transport.stop'],
    ['transport.clear', 'repeat-id'],
  ]);
});

test('AudioEngine avoids touching Tone transport before audio starts', async () => {
  const engine = new AudioEngine({ tone: createToneWithBlockedTransport() });

  engine.seekToStep(2, 8);
  await engine.pause();
  await engine.stop();

  assert.equal(engine.currentBar, 2);
  assert.equal(engine.currentStep, 8);
  assert.equal(engine.transportFlatStep, 40);
});

test('AudioEngine matrix playback triggers drums and chord events', async () => {
  const tone = createFakeTone();
  const matrix = createInitialMatrix();
  matrix.drums[0][0] = { instruments: ['kick'] };
  matrix.chord[0][0] = { root: 'C', quality: 'maj', label: 'C' };
  const engine = new AudioEngine({
    tone,
    matrixSource: matrix,
    playerFactory: createPlayerFactory(tone.calls),
    chordSynthFactory: createChordSynthFactory(tone.calls),
  });

  await engine.play({ bpm: 120 });
  tone.Transport.scheduledCallback(24);

  assert.deepEqual(tone.calls.filter(([name]) => (
    name === 'player.start' || name === 'chord.triggerAttackRelease'
  )), [
    ['player.start', 'kick', '/samples/808/kick.wav', 24],
    ['chord.triggerAttackRelease', ['C4', 'E4', 'G4'], '4n', 24],
  ]);
});

test('AudioEngine clears existing matrix playback even when Tone returns event id zero', async () => {
  const tone = createFakeToneWithEventIds([0, 1]);
  const matrix = createInitialMatrix();
  const engine = new AudioEngine({
    tone,
    matrixSource: matrix,
    playerFactory: createPlayerFactory(tone.calls),
  });

  await engine.play({ bpm: 120 });
  await engine.play({ bpm: 120 });

  assert.deepEqual(tone.calls.filter(([name]) => name.startsWith('transport.')), [
    ['transport.scheduleRepeat', '16n'],
    ['transport.start'],
    ['transport.clear', 0],
    ['transport.scheduleRepeat', '16n'],
    ['transport.start'],
  ]);
});

test('AudioEngine applies current track volumes to matrix playback events', async () => {
  const tone = createFakeTone();
  const matrix = createInitialMatrix();
  const volumes = { drums: -18, chord: -9 };
  matrix.drums[0][0] = { instruments: ['kick'] };
  matrix.chord[0][0] = { root: 'C', quality: 'maj', label: 'C' };
  const engine = new AudioEngine({
    tone,
    matrixSource: matrix,
    volumeSource: () => volumes,
    playerFactory: createVolumeAwarePlayerFactory(tone.calls),
    chordSynthFactory: createVolumeAwareChordSynthFactory(tone.calls),
  });

  await engine.play({ bpm: 120 });
  tone.Transport.scheduledCallback(24);

  assert.deepEqual(tone.calls.filter(([name]) => (
    name === 'player.start' || name === 'chord.triggerAttackRelease'
  )), [
    ['player.start', 'kick', '/samples/808/kick.wav', 24, -18],
    ['chord.triggerAttackRelease', ['C4', 'E4', 'G4'], '4n', 24, -9],
  ]);
});

test('AudioEngine applies live track volume source to drums previews', async () => {
  const tone = createFakeTone();
  const volumes = { drums: -12 };
  const engine = new AudioEngine({
    tone,
    volumeSource: () => volumes,
    playerFactory: createVolumeAwarePlayerFactory(tone.calls),
  });

  await engine.triggerDrumsStep('snare');
  volumes.drums = -6;
  await engine.triggerDrumsStep('snare');

  assert.deepEqual(tone.calls.filter(([name]) => name === 'player.start'), [
    ['player.start', 'snare', '/samples/808/snare.wav', 12.5, -12],
    ['player.start', 'snare', '/samples/808/snare.wav', 12.5, -6],
  ]);
});

test('AudioEngine previews chord sequences with one audio start and timed chord triggers', async () => {
  const tone = createFakeTone();
  const volumes = { chord: -7 };
  const engine = new AudioEngine({
    tone,
    volumeSource: () => volumes,
    playerFactory: createPlayerFactory(tone.calls),
    chordSynthFactory: createVolumeAwareChordSynthFactory(tone.calls),
  });

  await engine.previewChordSequence([
    ['C4', 'E4', 'G4'],
    ['F4', 'A4', 'C5'],
  ]);

  assert.equal(tone.calls.filter(([name]) => name === 'tone.start').length, 1);
  assert.deepEqual(tone.calls.filter(([name]) => name === 'chord.triggerAttackRelease'), [
    ['chord.triggerAttackRelease', ['C4', 'E4', 'G4'], '8n', 12.5, -7],
    ['chord.triggerAttackRelease', ['F4', 'A4', 'C5'], '8n', 13.05, -7],
  ]);
});

test('AudioEngine previews chord groove patterns with sixteenth-step timing', async () => {
  const tone = createFakeTone();
  const volumes = { chord: -5 };
  const engine = new AudioEngine({
    tone,
    volumeSource: () => volumes,
    playerFactory: createPlayerFactory(tone.calls),
    chordSynthFactory: createVolumeAwareChordSynthFactory(tone.calls),
  });

  await engine.previewChordPattern([
    { step: 0, notes: ['C4', 'E4', 'G4'], duration: '16n' },
    { step: 6, notes: ['C4', 'E4', 'G4'], duration: '16n' },
    { step: 12, notes: ['C4', 'E4', 'G4'], duration: '16n' },
  ], { bpm: 120 });

  assert.equal(tone.calls.filter(([name]) => name === 'tone.start').length, 1);
  assert.deepEqual(tone.calls.filter(([name]) => name === 'chord.triggerAttackRelease'), [
    ['chord.triggerAttackRelease', ['C4', 'E4', 'G4'], '16n', 12.5, -5],
    ['chord.triggerAttackRelease', ['C4', 'E4', 'G4'], '16n', 13.25, -5],
    ['chord.triggerAttackRelease', ['C4', 'E4', 'G4'], '16n', 14, -5],
  ]);
});

test('createAudioEngine defers the default Tone dependency until audio starts', async () => {
  const tone = createFakeTone();
  const loadToneCalls = [];
  const engine = createAudioEngine({
    loadTone: async () => {
      loadToneCalls.push('loadTone');
      return tone;
    },
    playerFactory: createPlayerFactory(tone.calls),
  });

  assert.equal(engine.status, AUDIO_STATUSES.IDLE);
  assert.equal(engine.tone, null);
  assert.deepEqual(loadToneCalls, []);

  assert.equal(await engine.startAudio(), AUDIO_STATUSES.READY);
  assert.equal(engine.tone, tone);
  assert.deepEqual(loadToneCalls, ['loadTone']);
});

test('createAudioEngine does not statically import Tone on module load', async () => {
  const source = await readFile(new URL('../src/audio/createAudioEngine.js', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /import\s+\*\s+as\s+Tone\s+from ['"]tone['"]/);
});
