import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { AUDIO_STATUSES } from '../src/audio/audioStatus.js';
import AudioEngine, {
  createBassSampleUrls,
  createChordSampleUrls,
  createDrumsSampleUrls,
  createMelodySampleUrls,
  formatToneTransportPosition,
} from '../src/audio/AudioEngine.js';
import createAudioEngine from '../src/audio/createAudioEngine.js';
import { STEPS_PER_BAR } from '../src/domain/musicConstants.js';
import createInitialMatrix from '../src/store/createInitialMatrix.js';

const SAMPLE_ASSET_VERSION = 'sample-refresh-20260608';
const SAMPLE_VERSION_QUERY = `?v=${SAMPLE_ASSET_VERSION}`;

function versioned(url) {
  return `${url}${SAMPLE_VERSION_QUERY}`;
}

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
    stop(time) {
      calls.push(['transport.stop', time]);
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

function createChordSamplerFactory(calls) {
  return (urls) => ({
    triggerAttackRelease: (notes, duration, time) => calls.push([
      'chordSampler.triggerAttackRelease',
      notes,
      duration,
      time,
      urls,
    ]),
    toDestination: () => calls.push(['chordSampler.toDestination']),
  });
}

function createSamplerFactory(calls) {
  return (urls) => ({
    releaseAll: (time) => calls.push(['sampler.releaseAll', time, urls]),
    triggerAttack: (note, time) => calls.push([
      'sampler.triggerAttack',
      note,
      time,
      urls,
    ]),
    triggerAttackRelease: (note, duration, time) => calls.push([
      'sampler.triggerAttackRelease',
      note,
      duration,
      time,
      urls,
    ]),
    toDestination: () => calls.push(['sampler.toDestination']),
  });
}

function createVolumeAwareSamplerFactory(calls) {
  return (urls) => {
    const sampler = {
      volume: { value: 0 },
      triggerAttack(note, time) {
        calls.push([
          'sampler.triggerAttack',
          note,
          time,
          sampler.volume.value,
          urls,
        ]);
      },
      triggerAttackRelease(note, duration, time) {
        calls.push([
          'sampler.triggerAttackRelease',
          note,
          duration,
          time,
          sampler.volume.value,
          urls,
        ]);
      },
      toDestination() {
        calls.push(['sampler.toDestination']);
        return sampler;
      },
    };

    return sampler;
  };
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
      releaseAll(time) {
        calls.push(['chord.releaseAll', time]);
      },
      toDestination() {
        calls.push(['chord.toDestination']);
        return synth;
      },
    };

    return synth;
  };
}

function createVolumeAwareChordSamplerFactory(calls) {
  return (urls) => {
    const sampler = {
      volume: { value: 0 },
      triggerAttackRelease(notes, duration, time) {
        calls.push([
          'chordSampler.triggerAttackRelease',
          notes,
          duration,
          time,
          sampler.volume.value,
          urls,
        ]);
      },
      releaseAll(time) {
        calls.push(['chordSampler.releaseAll', time]);
      },
      toDestination() {
        calls.push(['chordSampler.toDestination']);
        return sampler;
      },
    };

    return sampler;
  };
}

function createManualTimers() {
  let nextTimerId = 1;
  const timers = new Map();
  const cancelled = [];

  return {
    cancelTimeout(timerId) {
      cancelled.push(timerId);
      timers.delete(timerId);
    },
    cancelled,
    getDelays() {
      return [...timers.values()].map((timer) => timer.delay).sort((a, b) => a - b);
    },
    runThrough(maxDelay) {
      const dueTimers = [...timers.entries()]
        .filter(([, timer]) => timer.delay <= maxDelay)
        .sort(([, left], [, right]) => left.delay - right.delay);
      dueTimers.forEach(([timerId, timer]) => {
        if (!timers.has(timerId)) return;
        timers.delete(timerId);
        timer.callback();
      });
    },
    scheduleTimeout(callback, delay) {
      const timerId = nextTimerId;
      nextTimerId += 1;
      timers.set(timerId, { callback, delay });
      return timerId;
    },
    size() {
      return timers.size;
    },
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

test('createDrumsSampleUrls maps drums instruments to v0.22 samples', () => {
  assert.deepEqual(createDrumsSampleUrls('/arranger/'), {
    kick: versioned('/arranger/samples/Drums/Kick_v0.22.wav'),
    snare: versioned('/arranger/samples/Drums/Snare_v0.22.wav'),
    hihat: versioned('/arranger/samples/Drums/Hihat_v0.22.wav'),
  });
});

test('createMelodySampleUrls maps melody anchor samples for sampler playback', () => {
  const urls = createMelodySampleUrls('/arranger/');

  assert.equal(urls.C2, versioned('/arranger/samples/Melody/Melody_C2_v0.22.wav'));
  assert.equal(urls.C3, versioned('/arranger/samples/Melody/Melody_C3_v0.22.wav'));
  assert.equal(urls.C4, versioned('/arranger/samples/Melody/Melody_C4_v0.22.wav'));
  assert.equal(urls.A2, versioned('/arranger/samples/Melody/Melody_A2_v0.22.wav'));
  assert.equal(urls.A3, versioned('/arranger/samples/Melody/Melody_A3_v0.22.wav'));
  assert.equal(urls.A4, versioned('/arranger/samples/Melody/Melody_A4_v0.22.wav'));
  assert.equal(urls.G4, versioned('/arranger/samples/Melody/Melody_G4_v0.22.wav'));
  assert.equal(urls.C5, undefined);
  assert.equal(urls['C#4'], undefined);
  assert.ok(Object.values(urls).every((url) => url.includes('/samples/Melody/')));
  assert.ok(Object.values(urls).every((url) => !url.includes('/lead-old/')));
});

test('createBassSampleUrls maps v0.22 bass anchor samples for sampler playback', () => {
  const urls = createBassSampleUrls('/arranger/');

  assert.equal(urls.F0, versioned('/arranger/samples/Bass/Bass_F0_v0.22.wav'));
  assert.equal(urls.G0, versioned('/arranger/samples/Bass/Bass_G0_v0.22.wav'));
  assert.equal(urls.C1, versioned('/arranger/samples/Bass/Bass_C1_v0.22.wav'));
  assert.equal(urls.C4, undefined);
  assert.equal(urls['F#3'], undefined);
});

test('createChordSampleUrls maps v0.3 chord note anchor samples', () => {
  const urls = createChordSampleUrls('/arranger/');

  assert.equal(urls.C4, versioned('/arranger/samples/Chords/Chord_C4_v0.3.wav'));
  assert.equal(urls.E4, versioned('/arranger/samples/Chords/Chord_E4_v0.3.wav'));
  assert.equal(urls.G4, versioned('/arranger/samples/Chords/Chord_G4_v0.3.wav'));
  assert.equal(urls['F#4'], undefined);
});

test('sample URLs are cache-busted and never point at old backup folders', () => {
  const urls = [
    ...Object.values(createDrumsSampleUrls('/arranger/')),
    ...Object.values(createMelodySampleUrls('/arranger/')),
    ...Object.values(createBassSampleUrls('/arranger/')),
    ...Object.values(createChordSampleUrls('/arranger/')),
  ];

  assert.ok(urls.every((url) => url.endsWith(SAMPLE_VERSION_QUERY)));
  assert.ok(urls.every((url) => !/\/(808|bass|chords|lead)-old\//.test(url)));
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
    ['player.start', 'kick', versioned('/samples/Drums/Kick_v0.22.wav'), 12.5],
    ['player.start', 'snare', versioned('/samples/Drums/Snare_v0.22.wav'), 12.5],
  ]);
});

test('AudioEngine starts audio and triggers chord sampler notes', async () => {
  const tone = createFakeTone();
  const engine = new AudioEngine({
    tone,
    playerFactory: createPlayerFactory(tone.calls),
    chordSamplerFactory: createChordSamplerFactory(tone.calls),
    chordSynthFactory: createChordSynthFactory(tone.calls),
  });

  assert.equal(await engine.startAudio(), AUDIO_STATUSES.READY);
  assert.equal(await engine.triggerChord(['C4', 'E4', 'G4'], '4n'), true);

  assert.deepEqual(tone.calls.filter(([name]) => name.startsWith('chordSampler.')), [
    ['chordSampler.toDestination'],
    ['chordSampler.triggerAttackRelease', ['C4', 'E4', 'G4'], '2s', 12.5, createChordSampleUrls()],
  ]);
  assert.deepEqual(tone.calls.filter(([name]) => name.startsWith('chord.')), [
    ['chord.toDestination'],
  ]);
});

test('AudioEngine falls back to chord synth when chord sampler is unavailable', async () => {
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

test('AudioEngine starts audio and triggers complete Melody one-shots using UI note pitch', async () => {
  const tone = createFakeTone();
  const engine = new AudioEngine({
    tone,
    playerFactory: createPlayerFactory(tone.calls),
    samplerFactory: createSamplerFactory(tone.calls),
  });

  assert.equal(await engine.startAudio(), AUDIO_STATUSES.READY);
  assert.equal(await engine.triggerMelodyNote('G5', '16n'), true);

  assert.deepEqual(tone.calls.filter(([name]) => name === 'sampler.triggerAttack'), [
    [
      'sampler.triggerAttack',
      'G5',
      12.5,
      createMelodySampleUrls(),
    ],
  ]);
});

test('AudioEngine plays every Matrix Melody duration as overlapping one-shots', async () => {
  const tone = createFakeTone();
  const matrix = createInitialMatrix();
  matrix.melody[0][0] = { type: 'melody', note: 'C4' };
  matrix.melody[0][1] = { type: 'melody', note: 'C4', durationSteps: 1 };
  matrix.melody[0][2] = { type: 'melody', note: 'C4', durationSteps: 2 };
  const gatedSampler = {
    releaseAll: (time) => tone.calls.push(['gated.releaseAll', time]),
    toDestination: () => gatedSampler,
    triggerAttackRelease: (note, duration, time) => (
      tone.calls.push(['gated.triggerAttackRelease', note, duration, time])
    ),
  };
  const oneShotSampler = {
    releaseAll: (time) => tone.calls.push(['oneShot.releaseAll', time]),
    toDestination: () => oneShotSampler,
    triggerAttack: (note, time) => tone.calls.push(['oneShot.triggerAttack', note, time]),
  };
  const engine = new AudioEngine({
    tone,
    matrixSource: matrix,
    melodyOneShotSamplerFactory: () => oneShotSampler,
    playerFactory: createPlayerFactory(tone.calls),
    samplerFactory: () => gatedSampler,
  });

  await engine.play({ bpm: 120 });
  tone.Transport.scheduledCallback(24);
  tone.Transport.scheduledCallback(24.125);
  tone.Transport.scheduledCallback(24.25);

  assert.deepEqual(tone.calls.filter(([name]) => name.includes('.trigger')), [
    ['oneShot.triggerAttack', 'C4', 24],
    ['oneShot.triggerAttack', 'C4', 24.125],
    ['oneShot.triggerAttack', 'C4', 24.25],
  ]);

  await engine.pause();
  assert.equal(tone.calls.some(([name]) => name.endsWith('.releaseAll')), false);

  await engine.stop();
  assert.deepEqual(tone.calls.filter(([name]) => name.endsWith('.releaseAll')), [
    ['gated.releaseAll', 12.5],
    ['oneShot.releaseAll', 12.5],
  ]);
});

test('AudioEngine leaves Melody input one-shots alone on Note Off and releases them on Stop', async () => {
  const tone = createFakeTone();
  const matrixSampler = {
    releaseAll: (time) => tone.calls.push(['matrix.releaseAll', time]),
    toDestination: () => matrixSampler,
    triggerAttackRelease: (note) => tone.calls.push(['matrix.triggerAttackRelease', note]),
  };
  const inputSampler = {
    releaseAll: (time) => tone.calls.push(['input.releaseAll', time]),
    toDestination: () => inputSampler,
    triggerAttack: (note, time) => tone.calls.push(['input.triggerAttack', note, time]),
  };
  const oneShotSampler = {
    releaseAll: (time) => tone.calls.push(['oneShot.releaseAll', time]),
    toDestination: () => oneShotSampler,
    triggerAttack: (note, time) => tone.calls.push(['oneShot.triggerAttack', note, time]),
  };
  const engine = new AudioEngine({
    tone,
    melodyOneShotSamplerFactory: () => oneShotSampler,
    playerFactory: createPlayerFactory(tone.calls),
    melodyInputSamplerFactory: () => inputSampler,
    samplerFactory: () => matrixSampler,
  });

  await engine.startAudio();
  await engine.triggerMelodyInputNote('C4');
  engine.releaseMelodyInputNote('C4');
  engine.triggerMelodySampler('G4');

  assert.deepEqual(tone.calls.filter(([name]) => name.startsWith('input.')), [
    ['input.triggerAttack', 'C4', 12.5],
  ]);
  assert.deepEqual(tone.calls.filter(([name]) => name.startsWith('oneShot.')), [
    ['oneShot.triggerAttack', 'G4', 12.5],
  ]);

  await engine.stop();
  assert.deepEqual(tone.calls.filter(([name]) => name.endsWith('.releaseAll')), [
    ['matrix.releaseAll', 12.5],
    ['input.releaseAll', 12.5],
    ['oneShot.releaseAll', 12.5],
  ]);
});

test('AudioEngine lets free-playing input samples play as one-shots', async () => {
  const tone = createFakeTone();
  const inputSampler = {
    releaseAll: (time) => tone.calls.push(['input.releaseAll', time]),
    toDestination: () => inputSampler,
    triggerAttack: (note, time) => tone.calls.push(['input.triggerAttack', note, time]),
    triggerAttackRelease: () => {},
  };
  const engine = new AudioEngine({
    tone,
    melodyInputSamplerFactory: () => inputSampler,
    playerFactory: createPlayerFactory(tone.calls),
    samplerFactory: createSamplerFactory(tone.calls),
  });

  assert.equal(await engine.triggerMelodyInputOneShot('E4'), true);
  assert.deepEqual(tone.calls.filter(([name]) => name.startsWith('input.')), [
    ['input.triggerAttack', 'E4', 12.5],
  ]);

  engine.releaseAllMelodyInputNotes();
  assert.deepEqual(tone.calls.filter(([name]) => name.startsWith('input.')), [
    ['input.triggerAttack', 'E4', 12.5],
    ['input.releaseAll', 12.5],
  ]);
});

test('AudioEngine cancels pending free-playing attacks when input voices are cleared', async () => {
  const tone = createFakeTone();
  const inputSampler = {
    toDestination: () => inputSampler,
    triggerAttack: (note, time) => tone.calls.push(['input.triggerAttack', note, time]),
  };
  const engine = new AudioEngine({
    tone,
    melodyInputSamplerFactory: () => inputSampler,
    playerFactory: createPlayerFactory(tone.calls),
    samplerFactory: createSamplerFactory(tone.calls),
  });
  let finishAudioStart;
  engine.startAudio = () => new Promise((resolve) => {
    finishAudioStart = resolve;
  });

  const pendingAttack = engine.triggerMelodyInputOneShot('G4');
  engine.releaseAllMelodyInputNotes();
  finishAudioStart(AUDIO_STATUSES.READY);

  assert.equal(await pendingAttack, false);
  assert.deepEqual(tone.calls.filter(([name]) => name.startsWith('input.')), []);
});

test('AudioEngine previews Melody sequences as timed input one-shots', async () => {
  const tone = createFakeTone();
  const inputSampler = {
    toDestination: () => inputSampler,
    triggerAttack: (note, time) => tone.calls.push(['input.triggerAttack', note, time]),
  };
  const engine = new AudioEngine({
    tone,
    melodyInputSamplerFactory: () => inputSampler,
    playerFactory: createPlayerFactory(tone.calls),
    samplerFactory: createSamplerFactory(tone.calls),
  });

  assert.deepEqual(await engine.previewMelodySequence(
    ['C4', 'E4', 'G4'],
    { duration: '32n', intervalSeconds: 0.2 },
  ), [true, true, true]);
  assert.deepEqual(tone.calls.filter(([name]) => name.startsWith('input.')), [
    ['input.triggerAttack', 'C4', 12.5],
    ['input.triggerAttack', 'E4', 12.7],
    ['input.triggerAttack', 'G4', 12.9],
  ]);
});

test('AudioEngine applies Melody volume and stops every Melody voice when muted', async () => {
  const tone = createFakeTone();
  const mix = {
    mutedTracks: { melody: false },
    volumes: { melody: -7 },
  };
  const matrixSampler = {
    volume: { value: 0 },
    releaseAll: (time) => tone.calls.push(['matrix.releaseAll', time]),
    toDestination: () => matrixSampler,
    triggerAttackRelease: () => {},
  };
  const inputSampler = {
    volume: { value: 0 },
    releaseAll: (time) => tone.calls.push(['input.releaseAll', time]),
    toDestination: () => inputSampler,
    triggerAttack: () => {},
  };
  const oneShotSampler = {
    volume: { value: 0 },
    releaseAll: (time) => tone.calls.push(['oneShot.releaseAll', time]),
    toDestination: () => oneShotSampler,
    triggerAttack: () => {},
  };
  const engine = new AudioEngine({
    tone,
    melodyInputSamplerFactory: () => inputSampler,
    melodyOneShotSamplerFactory: () => oneShotSampler,
    playerFactory: createPlayerFactory(tone.calls),
    samplerFactory: () => matrixSampler,
    volumeSource: () => mix,
  });

  await engine.triggerMelodyInputNote('C4');
  engine.triggerMelodyOneShot('E4');
  assert.equal(engine.refreshTrackVolume('melody'), -7);
  assert.equal(matrixSampler.volume.value, -7);
  assert.equal(inputSampler.volume.value, -7);
  assert.equal(oneShotSampler.volume.value, -7);

  mix.mutedTracks.melody = true;
  assert.equal(engine.refreshTrackVolume('melody'), -Infinity);
  assert.equal(matrixSampler.volume.value, -Infinity);
  assert.equal(inputSampler.volume.value, -Infinity);
  assert.equal(oneShotSampler.volume.value, -Infinity);
  assert.deepEqual(tone.calls.filter(([name]) => name.endsWith('.releaseAll')), [
    ['matrix.releaseAll', 12.5],
    ['input.releaseAll', 12.5],
    ['oneShot.releaseAll', 12.5],
  ]);
});

test('AudioEngine starts audio and triggers bass sampler notes', async () => {
  const tone = createFakeTone();
  const engine = new AudioEngine({
    tone,
    playerFactory: createPlayerFactory(tone.calls),
    samplerFactory: createSamplerFactory(tone.calls),
  });

  assert.equal(await engine.triggerBassNote('A#1', '8n'), true);

  assert.deepEqual(tone.calls.filter(([name]) => name === 'sampler.triggerAttackRelease').at(-1), [
    'sampler.triggerAttackRelease',
    'A#1',
    '8n',
    12.5,
    createBassSampleUrls(),
  ]);
});

test('AudioEngine starts audio and triggers transposed bass sampler notes from anchors', async () => {
  const tone = createFakeTone();
  const engine = new AudioEngine({
    tone,
    playerFactory: createPlayerFactory(tone.calls),
    samplerFactory: createVolumeAwareSamplerFactory(tone.calls),
    volumeSource: () => ({ bass: -8 }),
  });

  assert.equal(await engine.triggerBassNote('F#3', '16n'), true);

  assert.deepEqual(tone.calls.filter(([name]) => name === 'sampler.triggerAttackRelease').at(-1), [
    'sampler.triggerAttackRelease',
    'F#3',
    '16n',
    12.5,
    -8,
    createBassSampleUrls(),
  ]);
});

test('AudioEngine schedules Melody one-shot preview after audio startup completes', async () => {
  let now = 7;
  const tone = createFakeTone();
  tone.now = () => now;
  tone.start = async () => {
    tone.calls.push(['tone.start']);
    now = 8;
  };
  const engine = new AudioEngine({
    tone,
    playerFactory: createPlayerFactory(tone.calls),
    samplerFactory: createSamplerFactory(tone.calls),
  });

  assert.equal(await engine.triggerMelodyNote('C4', '16n'), true);

  assert.deepEqual(tone.calls.filter(([name]) => name === 'sampler.triggerAttack'), [
    [
      'sampler.triggerAttack',
      'C4',
      8,
      createMelodySampleUrls(),
    ],
  ]);
});

test('AudioEngine respects explicit Melody one-shot preview times', async () => {
  let now = 7;
  const tone = createFakeTone();
  tone.now = () => now;
  tone.start = async () => {
    tone.calls.push(['tone.start']);
    now = 8;
  };
  const engine = new AudioEngine({
    tone,
    playerFactory: createPlayerFactory(tone.calls),
    samplerFactory: createSamplerFactory(tone.calls),
  });

  assert.equal(await engine.triggerMelodyNote('C4', '16n', 12), true);

  assert.deepEqual(tone.calls.filter(([name]) => name === 'sampler.triggerAttack'), [
    [
      'sampler.triggerAttack',
      'C4',
      12,
      createMelodySampleUrls(),
    ],
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
    ['transport.stop', 12.5],
    ['transport.clear', 'repeat-id'],
  ]);
});

test('AudioEngine changes live tempo without seeking or restarting transport', async () => {
  const tone = createFakeTone();
  const engine = new AudioEngine({
    tone,
    matrixSource: createInitialMatrix(),
    playerFactory: createPlayerFactory(tone.calls),
  });

  assert.equal(engine.setTempo(104), false);
  await engine.play({ bpm: 88, bar: 2, step: 4 });
  const positionBeforeTempoChange = tone.Transport.position;
  const callsBeforeTempoChange = [...tone.calls];

  assert.equal(engine.setTempo(104), true);
  assert.equal(tone.Transport.bpm.value, 104);
  assert.equal(tone.Transport.position, positionBeforeTempoChange);
  assert.equal(engine.currentBar, 2);
  assert.equal(engine.currentStep, 4);
  assert.deepEqual(tone.calls, callsBeforeTempoChange);
});

test('AudioEngine play position callback follows scheduled transport ticks', async () => {
  const tone = createFakeTone();
  const matrix = createInitialMatrix();
  const positions = [];
  const engine = new AudioEngine({
    tone,
    matrixSource: matrix,
    playerFactory: createPlayerFactory(tone.calls),
  });

  await engine.play({
    bpm: 120,
    onPositionChange: (bar, step) => positions.push([bar, step]),
  });
  tone.Transport.scheduledCallback(24);
  tone.Transport.scheduledCallback(24.125);
  tone.Transport.scheduledCallback(24.25);

  assert.deepEqual(positions, [
    [0, 0],
    [0, 1],
    [0, 2],
  ]);
  assert.equal(engine.currentBar, 0);
  assert.equal(engine.currentStep, 2);
  assert.equal(engine.transportFlatStep, 3);
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

test('AudioEngine matrix playback triggers drums bass chord and melody events', async () => {
  const tone = createFakeTone();
  const matrix = createInitialMatrix();
  matrix.drums[0][0] = { instruments: ['kick'] };
  matrix.bass[0][0] = { type: 'bass', note: 'C1', duration: '8n' };
  matrix.chord[0][0] = { root: 'C', quality: 'maj', label: 'C' };
  matrix.melody[0][0] = { type: 'melody', note: 'G4', durationSteps: 4 };
  const engine = new AudioEngine({
    tone,
    matrixSource: matrix,
    playerFactory: createPlayerFactory(tone.calls),
    chordSamplerFactory: createChordSamplerFactory(tone.calls),
    chordSynthFactory: createChordSynthFactory(tone.calls),
    samplerFactory: createSamplerFactory(tone.calls),
  });

  await engine.play({ bpm: 120 });
  tone.Transport.scheduledCallback(24);

  assert.deepEqual(tone.calls.filter(([name]) => (
    name === 'player.start'
    || name === 'chordSampler.triggerAttackRelease'
    || name === 'sampler.triggerAttack'
    || name === 'sampler.triggerAttackRelease'
  )), [
    ['player.start', 'kick', versioned('/samples/Drums/Kick_v0.22.wav'), 24],
    [
      'sampler.triggerAttackRelease',
      'C1',
      '8n',
      24,
      createBassSampleUrls(),
    ],
    ['chordSampler.triggerAttackRelease', ['C4', 'E4', 'G4'], '2s', 24, createChordSampleUrls()],
    ['sampler.triggerAttack', 'G4', 24, createMelodySampleUrls()],
  ]);
});

test('AudioEngine filters matrix playback tracks and stops after the requested step count', async () => {
  const tone = createFakeTone();
  const matrix = createInitialMatrix();
  const completions = [];
  matrix.drums[0][0] = { instruments: ['kick'] };
  matrix.bass[0][0] = { type: 'bass', note: 'C1' };
  matrix.chord[0][0] = { root: 'C', quality: 'maj', label: 'C' };
  matrix.melody[0][0] = { type: 'melody', note: 'G4' };
  const engine = new AudioEngine({
    tone,
    matrixSource: matrix,
    onPlaybackComplete: (result) => completions.push(result),
    playerFactory: createPlayerFactory(tone.calls),
    chordSamplerFactory: createChordSamplerFactory(tone.calls),
    samplerFactory: createSamplerFactory(tone.calls),
  });

  await engine.play({
    audibleTrackIds: ['melody'],
    bpm: 120,
    maxPlaybackSteps: 2,
  });
  tone.Transport.scheduledCallback(24);
  tone.Transport.scheduledCallback(24.125);

  assert.deepEqual(tone.calls.filter(([name]) => (
    name === 'player.start'
    || name === 'chordSampler.triggerAttackRelease'
    || name === 'sampler.triggerAttack'
    || name === 'sampler.triggerAttackRelease'
  )), [
    ['sampler.triggerAttack', 'G4', 24, createMelodySampleUrls()],
  ]);
  assert.deepEqual(completions, [{ bar: 0, playedSteps: 2, step: 1 }]);
  assert.deepEqual(tone.calls.filter(([name]) => name.startsWith('transport.')), [
    ['transport.scheduleRepeat', '16n'],
    ['transport.start'],
    ['transport.stop', 24.125],
    ['transport.clear', 'repeat-id'],
  ]);
});

test('AudioEngine restores all matrix tracks on the next ordinary play', async () => {
  const tone = createFakeTone();
  const matrix = createInitialMatrix();
  matrix.drums[0][0] = { instruments: ['kick'] };
  matrix.melody[0][0] = { type: 'melody', note: 'G4' };
  const engine = new AudioEngine({
    tone,
    matrixSource: matrix,
    playerFactory: createPlayerFactory(tone.calls),
    samplerFactory: createSamplerFactory(tone.calls),
  });

  await engine.play({ audibleTrackIds: ['melody'], maxPlaybackSteps: 1 });
  tone.Transport.scheduledCallback(24);
  await engine.play({ bpm: 120 });
  tone.Transport.scheduledCallback(25);

  assert.equal(tone.calls.some(([name]) => name === 'player.start'), true);
  assert.equal(tone.calls.filter(([name]) => name === 'sampler.triggerAttack').length, 2);
});

test('AudioEngine bounded playback stops at bar eight without looping to the start', async () => {
  const tone = createFakeTone();
  const matrix = createInitialMatrix();
  const positions = [];
  const completions = [];
  const engine = new AudioEngine({
    tone,
    matrixSource: matrix,
    onPlaybackComplete: (result) => completions.push(result),
    playerFactory: createPlayerFactory(tone.calls),
  });

  await engine.play({
    bar: 6,
    maxPlaybackSteps: 2 * STEPS_PER_BAR,
    onPositionChange: (bar, step) => positions.push([bar, step]),
    step: 0,
  });
  for (let index = 0; index < 2 * STEPS_PER_BAR; index += 1) {
    tone.Transport.scheduledCallback(24 + index * 0.125);
  }

  assert.deepEqual(positions[0], [6, 0]);
  assert.deepEqual(positions.at(-1), [7, 15]);
  assert.equal(positions.some(([bar]) => bar === 0), false);
  assert.deepEqual(completions, [{ bar: 7, playedSteps: 32, step: 15 }]);
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
  const volumes = { drums: -18, bass: -12, chord: -9, melody: -4 };
  matrix.drums[0][0] = { instruments: ['kick'] };
  matrix.bass[0][0] = { type: 'bass', note: 'G0', duration: '8n' };
  matrix.chord[0][0] = { root: 'C', quality: 'maj', label: 'C' };
  matrix.melody[0][0] = { type: 'melody', note: 'A4' };
  const engine = new AudioEngine({
    tone,
    matrixSource: matrix,
    volumeSource: () => volumes,
    playerFactory: createVolumeAwarePlayerFactory(tone.calls),
    chordSamplerFactory: createVolumeAwareChordSamplerFactory(tone.calls),
    chordSynthFactory: createVolumeAwareChordSynthFactory(tone.calls),
    samplerFactory: createVolumeAwareSamplerFactory(tone.calls),
  });

  await engine.play({ bpm: 120 });
  tone.Transport.scheduledCallback(24);

  assert.deepEqual(tone.calls.filter(([name]) => (
    name === 'player.start'
    || name === 'chordSampler.triggerAttackRelease'
    || name === 'sampler.triggerAttack'
    || name === 'sampler.triggerAttackRelease'
  )), [
    ['player.start', 'kick', versioned('/samples/Drums/Kick_v0.22.wav'), 24, -18],
    [
      'sampler.triggerAttackRelease',
      'G0',
      '8n',
      24,
      -12,
      createBassSampleUrls(),
    ],
    ['chordSampler.triggerAttackRelease', ['C4', 'E4', 'G4'], '2s', 24, -9, createChordSampleUrls()],
    [
      'sampler.triggerAttack',
      'A4',
      24,
      -4,
      createMelodySampleUrls(),
    ],
  ]);
});

test('AudioEngine keeps duplicate track instance volume and mute channels independent', async () => {
  const tone = createFakeTone();
  const matrix = createInitialMatrix();
  matrix['drums-2'] = createInitialMatrix().drums;
  matrix.drums[0][0] = { instruments: ['kick'] };
  matrix['drums-2'][0][0] = { instruments: ['kick'] };
  const mix = {
    mutedTracks: { drums: false, 'drums-2': true },
    volumes: { drums: -12, 'drums-2': -4 },
  };
  const matrixSource = {
    matrix,
    trackInstancesById: {
      drums: { id: 'drums', type: 'drums' },
      'drums-2': { id: 'drums-2', type: 'drums' },
    },
    trackOrder: ['drums', 'drums-2'],
  };
  const engine = new AudioEngine({
    tone,
    matrixSource,
    volumeSource: () => mix,
    playerFactory: createVolumeAwarePlayerFactory(tone.calls),
  });

  await engine.play({ bpm: 120 });
  tone.Transport.scheduledCallback(24);

  assert.deepEqual(tone.calls.filter(([name]) => name === 'player.start'), [
    ['player.start', 'kick', versioned('/samples/Drums/Kick_v0.22.wav'), 24, -12],
    ['player.start', 'kick', versioned('/samples/Drums/Kick_v0.22.wav'), 24, -Infinity],
  ]);
  assert.equal(engine.refreshTrackVolume('drums'), -12);
  assert.equal(engine.refreshTrackVolume('drums-2'), -Infinity);
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
    ['player.start', 'snare', versioned('/samples/Drums/Snare_v0.22.wav'), 12.5, -12],
    ['player.start', 'snare', versioned('/samples/Drums/Snare_v0.22.wav'), 12.5, -6],
  ]);
});

test('AudioEngine applies independent mute state without losing the stored track volume', async () => {
  const tone = createFakeTone();
  const mix = {
    mutedTracks: { drums: true },
    volumes: { drums: -12 },
  };
  const engine = new AudioEngine({
    tone,
    volumeSource: () => mix,
    playerFactory: createVolumeAwarePlayerFactory(tone.calls),
  });

  await engine.triggerDrumsStep('snare');
  mix.mutedTracks.drums = false;
  await engine.triggerDrumsStep('snare');

  assert.deepEqual(tone.calls.filter(([name]) => name === 'player.start'), [
    ['player.start', 'snare', versioned('/samples/Drums/Snare_v0.22.wav'), 12.5, -Infinity],
    ['player.start', 'snare', versioned('/samples/Drums/Snare_v0.22.wav'), 12.5, -12],
  ]);
});

test('AudioEngine refreshTrackVolume mutes current nodes immediately and restores dB volume', async () => {
  const tone = createFakeTone();
  const mix = {
    mutedTracks: { drums: false },
    volumes: { drums: -12 },
  };
  const engine = new AudioEngine({
    tone,
    volumeSource: () => mix,
    playerFactory: createVolumeAwarePlayerFactory(tone.calls),
  });

  await engine.triggerDrumsStep('kick');
  mix.mutedTracks.drums = true;
  assert.equal(engine.refreshTrackVolume('drums'), -Infinity);
  assert.equal(engine.drumPlayers.get('kick').volume.value, -Infinity);

  mix.mutedTracks.drums = false;
  assert.equal(engine.refreshTrackVolume('drums'), -12);
  assert.equal(engine.drumPlayers.get('kick').volume.value, -12);
});

test('scheduled Chord previews read mute state when each event fires', async () => {
  const tone = createFakeTone();
  const timers = createManualTimers();
  const mix = {
    mutedTracks: { chord: false },
    volumes: { chord: -7 },
  };
  const engine = new AudioEngine({
    tone,
    volumeSource: () => mix,
    playerFactory: createPlayerFactory(tone.calls),
    chordSamplerFactory: createVolumeAwareChordSamplerFactory(tone.calls),
    chordSynthFactory: createVolumeAwareChordSynthFactory(tone.calls),
    scheduleTimeout: timers.scheduleTimeout,
    cancelTimeout: timers.cancelTimeout,
  });
  await engine.startAudio();

  const previewPromise = engine.previewChordClipSequence([
    { step: 0, notes: ['C4', 'E4', 'G4'], duration: '16n' },
    { step: 4, notes: ['F4', 'A4', 'C5'], duration: '16n' },
  ], { bpm: 120, totalSteps: 8 });
  await Promise.resolve();

  timers.runThrough(0);
  mix.mutedTracks.chord = true;
  timers.runThrough(500);
  timers.runThrough(1000);
  await previewPromise;

  assert.deepEqual(
    tone.calls
      .filter(([name]) => name === 'chordSampler.triggerAttackRelease')
      .map((call) => call[4]),
    [-7, -Infinity],
  );
});

test('AudioEngine previews chord sequences with one audio start and timed chord triggers', async () => {
  const tone = createFakeTone();
  const volumes = { chord: -7 };
  const engine = new AudioEngine({
    tone,
    volumeSource: () => volumes,
    playerFactory: createPlayerFactory(tone.calls),
    chordSamplerFactory: createVolumeAwareChordSamplerFactory(tone.calls),
    chordSynthFactory: createVolumeAwareChordSynthFactory(tone.calls),
  });

  await engine.previewChordSequence([
    ['C4', 'E4', 'G4'],
    ['F4', 'A4', 'C5'],
  ]);

  assert.equal(tone.calls.filter(([name]) => name === 'tone.start').length, 1);
  assert.deepEqual(tone.calls.filter(([name]) => name === 'chordSampler.triggerAttackRelease'), [
    ['chordSampler.triggerAttackRelease', ['C4', 'E4', 'G4'], '2s', 12.5, -7, createChordSampleUrls()],
    ['chordSampler.triggerAttackRelease', ['F4', 'A4', 'C5'], '2s', 13.05, -7, createChordSampleUrls()],
  ]);
});

test('AudioEngine previews chord groove patterns with sixteenth-step timing', async () => {
  const tone = createFakeTone();
  const volumes = { chord: -5 };
  const engine = new AudioEngine({
    tone,
    volumeSource: () => volumes,
    playerFactory: createPlayerFactory(tone.calls),
    chordSamplerFactory: createVolumeAwareChordSamplerFactory(tone.calls),
    chordSynthFactory: createVolumeAwareChordSynthFactory(tone.calls),
  });

  await engine.previewChordPattern([
    { step: 0, notes: ['C4', 'E4', 'G4'], duration: '16n' },
    { step: 6, notes: ['C4', 'E4', 'G4'], duration: '16n' },
    { step: 12, notes: ['C4', 'E4', 'G4'], duration: '16n' },
  ], { bpm: 120 });

  assert.equal(tone.calls.filter(([name]) => name === 'tone.start').length, 1);
  assert.deepEqual(tone.calls.filter(([name]) => name === 'chordSampler.triggerAttackRelease'), [
    ['chordSampler.triggerAttackRelease', ['C4', 'E4', 'G4'], '2s', 12.5, -5, createChordSampleUrls()],
    ['chordSampler.triggerAttackRelease', ['C4', 'E4', 'G4'], '2s', 13.25, -5, createChordSampleUrls()],
    ['chordSampler.triggerAttackRelease', ['C4', 'E4', 'G4'], '2s', 14, -5, createChordSampleUrls()],
  ]);
});

test('AudioEngine previews a cancelable four-clip chord sequence through the 64-step boundary', async () => {
  const tone = createFakeTone();
  const timers = createManualTimers();
  const engine = new AudioEngine({
    tone,
    volumeSource: () => ({ chord: -4 }),
    playerFactory: createPlayerFactory(tone.calls),
    chordSamplerFactory: createVolumeAwareChordSamplerFactory(tone.calls),
    chordSynthFactory: createVolumeAwareChordSynthFactory(tone.calls),
    scheduleTimeout: timers.scheduleTimeout,
    cancelTimeout: timers.cancelTimeout,
  });
  await engine.startAudio();

  const previewPromise = engine.previewChordClipSequence([
    { step: 0, notes: ['C3', 'E3', 'G3'], duration: '16n' },
    { step: 16, notes: ['A3', 'C4', 'E3'], duration: '16n' },
    { step: 32, notes: ['F3', 'A3', 'C3'], duration: '16n' },
    { step: 48, notes: ['G3', 'B3', 'D3'], duration: '16n' },
  ], { bpm: 120, totalSteps: 64 });
  await Promise.resolve();

  assert.deepEqual(timers.getDelays(), [0, 2000, 4000, 6000, 8000]);
  timers.runThrough(6000);
  assert.deepEqual(
    tone.calls
      .filter(([name]) => name === 'chordSampler.triggerAttackRelease')
      .map((call) => [call[1], call[3], call[4]]),
    [
      [['C3', 'E3', 'G3'], 12.5, -4],
      [['A3', 'C4', 'E3'], 12.5, -4],
      [['F3', 'A3', 'C3'], 12.5, -4],
      [['G3', 'B3', 'D3'], 12.5, -4],
    ],
  );

  timers.runThrough(8000);
  assert.equal(await previewPromise, 'completed');
  assert.equal(timers.size(), 0);
  assert.deepEqual(tone.calls.filter(([name]) => name.endsWith('releaseAll')), [
    ['chordSampler.releaseAll', 12.5],
    ['chord.releaseAll', 12.5],
  ]);
});

test('AudioEngine stops and supersedes chord clip previews without leaving scheduled hits', async () => {
  const tone = createFakeTone();
  const timers = createManualTimers();
  const engine = new AudioEngine({
    tone,
    playerFactory: createPlayerFactory(tone.calls),
    chordSamplerFactory: createVolumeAwareChordSamplerFactory(tone.calls),
    chordSynthFactory: createVolumeAwareChordSynthFactory(tone.calls),
    scheduleTimeout: timers.scheduleTimeout,
    cancelTimeout: timers.cancelTimeout,
  });
  await engine.startAudio();

  const firstPreview = engine.previewChordClipSequence([
    { step: 0, notes: ['C3', 'E3', 'G3'] },
    { step: 16, notes: ['F3', 'A3', 'C3'] },
  ], { bpm: 120, totalSteps: 64 });
  await Promise.resolve();
  timers.runThrough(0);

  const secondPreview = engine.previewChordClipSequence([
    { step: 0, notes: ['G3', 'B3', 'D3'] },
  ], { bpm: 120, totalSteps: 64 });
  assert.equal(await firstPreview, 'stopped');
  await Promise.resolve();
  assert.equal(engine.stopChordClipSequencePreview(), true);
  assert.equal(await secondPreview, 'stopped');
  assert.equal(timers.size(), 0);
  assert.ok(timers.cancelled.length >= 3);
  assert.equal(await engine.previewChordClipSequence([], { totalSteps: 64 }), 'empty');
  assert.equal(engine.stopChordClipSequencePreview(), false);
});

test('AudioEngine previews bass groove patterns with sixteenth-step timing', async () => {
  const tone = createFakeTone();
  const volumes = { bass: -10 };
  const engine = new AudioEngine({
    tone,
    volumeSource: () => volumes,
    playerFactory: createPlayerFactory(tone.calls),
    samplerFactory: createVolumeAwareSamplerFactory(tone.calls),
  });

  await engine.previewBassPattern([
    { step: 0, note: 'C1', duration: '8n' },
    { step: 4, note: 'G0', duration: '8n' },
    { step: 10, note: 'A#0', duration: '16n' },
  ], { bpm: 120 });

  assert.equal(tone.calls.filter(([name]) => name === 'tone.start').length, 1);
  const samplerCalls = tone.calls.filter(([name]) => name === 'sampler.triggerAttackRelease');
  assert.deepEqual(samplerCalls.map((call) => call.slice(0, 5)), [
    ['sampler.triggerAttackRelease', 'C1', '8n', 12.5, -10],
    ['sampler.triggerAttackRelease', 'G0', '8n', 13, -10],
    ['sampler.triggerAttackRelease', 'A#0', '16n', 13.75, -10],
  ]);
  assert.equal(samplerCalls[0].at(-1).C1, versioned('/samples/Bass/Bass_C1_v0.22.wav'));
  assert.equal(samplerCalls[1].at(-1).G0, versioned('/samples/Bass/Bass_G0_v0.22.wav'));
  assert.equal(samplerCalls[2].at(-1).A0, versioned('/samples/Bass/Bass_A0_v0.22.wav'));
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
