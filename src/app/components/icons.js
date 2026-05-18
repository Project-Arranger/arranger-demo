import { createElement } from 'react';
import {
  AudioLines,
  Boxes,
  Drum,
  Layers,
  Mic,
  Music,
  Piano,
} from 'lucide-react';

const TRACK_ICONS = {
  drums: Drum,
  bass: Music,
  chord: Piano,
  lead: AudioLines,
  pad: Layers,
  vocal: Mic,
  sample: Boxes,
};

function renderIcon(Icon, props = {}) {
  return createElement(Icon, { 'aria-hidden': 'true', ...props });
}

export { TRACK_ICONS, renderIcon };
