import { createElement } from 'react';
import {
  AudioLines,
  Disc3,
  Drum,
  KeyboardMusic,
  MicVocal,
  Music,
  Piano,
} from 'lucide-react';

const TRACK_ICONS = {
  drums: Drum,
  bass: Music,
  chord: Piano,
  lead: AudioLines,
  pad: KeyboardMusic,
  sample: Disc3,
  vocal: MicVocal,
};

function renderIcon(Icon, props = {}) {
  return createElement(Icon, { 'aria-hidden': 'true', ...props });
}

export { TRACK_ICONS, renderIcon };
