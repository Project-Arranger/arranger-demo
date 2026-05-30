import { Buffer } from 'node:buffer';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { argv } from 'node:process';
import { pathToFileURL } from 'node:url';
import {
  CHORD_GRID_PITCHES,
} from '../src/domain/chordCells.js';

const SAMPLE_RATE = 44100;
const DURATION_SECONDS = 1;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const BYTES_PER_SAMPLE = BITS_PER_SAMPLE / 8;
const NOTE_SEMITONES = Object.freeze({
  C: 0,
  'C#': 1,
  D: 2,
  'D#': 3,
  E: 4,
  F: 5,
  'F#': 6,
  G: 7,
  'G#': 8,
  A: 9,
  'A#': 10,
  B: 11,
});

function getGeneratedBassSampleNotes() {
  return CHORD_GRID_PITCHES.map((pitch) => pitch.label);
}

function getGeneratedBassSampleFileName(note) {
  return `Bass_${note.replace('#', 'Sharp')}.wav`;
}

function getNoteFrequency(note) {
  const match = /^([A-G]#?)(\d)$/.exec(note);
  if (!match) {
    throw new Error(`Invalid note label: ${note}`);
  }

  const [, root, octaveText] = match;
  const octave = Number.parseInt(octaveText, 10);
  const midi = (octave + 1) * 12 + NOTE_SEMITONES[root];
  return 440 * 2 ** ((midi - 69) / 12);
}

function getEnvelope(time, duration) {
  const attack = 0.009;
  const decay = 0.12;
  const sustain = 0.58;
  const release = 0.22;
  const releaseStart = duration - release;

  if (time < attack) return time / attack;
  if (time < attack + decay) {
    const progress = (time - attack) / decay;
    return 1 - progress * (1 - sustain);
  }
  if (time > releaseStart) {
    const progress = (time - releaseStart) / release;
    return sustain * Math.max(0, 1 - progress);
  }

  return sustain;
}

function createBassSampleBuffer(note) {
  const sampleCount = Math.floor(SAMPLE_RATE * DURATION_SECONDS);
  const dataSize = sampleCount * CHANNELS * BYTES_PER_SAMPLE;
  const buffer = Buffer.alloc(44 + dataSize);
  const frequency = getNoteFrequency(note);

  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * CHANNELS * BYTES_PER_SAMPLE, 28);
  buffer.writeUInt16LE(CHANNELS * BYTES_PER_SAMPLE, 32);
  buffer.writeUInt16LE(BITS_PER_SAMPLE, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / SAMPLE_RATE;
    const phase = Math.PI * 2 * frequency * time;
    const transient = Math.sin(phase * 6.5) * Math.max(0, 1 - time / 0.035);
    const tone = (
      Math.sin(phase) * 0.72
      + Math.sin(phase * 2) * 0.2
      + Math.sin(phase * 3) * 0.08
      + transient * 0.12
    );
    const shaped = Math.tanh(tone * 1.7);
    const envelope = getEnvelope(time, DURATION_SECONDS);
    const value = Math.max(-1, Math.min(1, shaped * envelope * 0.82));

    buffer.writeInt16LE(Math.round(value * 32767), 44 + index * BYTES_PER_SAMPLE);
  }

  return buffer;
}

function generateAllBassSamples(outputDirectory = 'public/samples/bass/generated') {
  const absoluteOutputDirectory = resolve(outputDirectory);
  mkdirSync(absoluteOutputDirectory, { recursive: true });

  for (const note of getGeneratedBassSampleNotes()) {
    const outputFile = resolve(absoluteOutputDirectory, getGeneratedBassSampleFileName(note));
    writeFileSync(outputFile, createBassSampleBuffer(note));
  }
}

const invokedUrl = argv[1] ? pathToFileURL(argv[1]).href : null;

if (import.meta.url === invokedUrl) {
  generateAllBassSamples();
}

export {
  createBassSampleBuffer,
  generateAllBassSamples,
  getGeneratedBassSampleFileName,
  getGeneratedBassSampleNotes,
};
