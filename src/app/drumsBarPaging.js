import {
  getAdjacentTrackClipBar,
  getSortedTrackClipBars,
} from './trackBarPaging.js';

function getSortedDrumsClipBars(clips) {
  return getSortedTrackClipBars(clips, 'drums');
}

function canPageDrumsClipBars(clips) {
  return getSortedDrumsClipBars(clips).length > 1;
}

function getAdjacentDrumsClipBar(clips, selectedBar, direction) {
  return getAdjacentTrackClipBar(clips, 'drums', selectedBar, direction);
}

export {
  canPageDrumsClipBars,
  getAdjacentDrumsClipBar,
};
