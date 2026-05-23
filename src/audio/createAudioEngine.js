import AudioEngine from './AudioEngine.js';

function loadToneDependency() {
  return import('tone');
}

export default function createAudioEngine(options = {}) {
  return new AudioEngine({
    loadTone: loadToneDependency,
    ...options,
  });
}
