import * as Tone from 'tone';
import AudioEngine from './AudioEngine.js';

export default function createAudioEngine(options = {}) {
  return new AudioEngine({
    tone: Tone,
    ...options,
  });
}
