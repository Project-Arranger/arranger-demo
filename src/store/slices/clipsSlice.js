import { TOTAL_BARS, TRACK_IDS } from '../../domain/musicConstants.js';

const DEFAULT_CLIP_NAMES = Object.freeze({
  drums: 'Drum 01',
  chord: 'Chord 01',
});

const TRACK_LABELS = Object.freeze({
  drums: 'Drum',
  bass: 'Bass',
  chord: 'Chord',
  lead: 'Lead',
  pad: 'Pad',
  vocal: 'Vocal',
  sample: 'Sample',
});

function createClipId(trackId, bar) {
  return `${trackId}-bar-${bar}`;
}

function createClipRecord(trackId, bar) {
  return {
    id: createClipId(trackId, bar),
    trackId,
    bar,
    name: DEFAULT_CLIP_NAMES[trackId] ?? `${TRACK_LABELS[trackId] ?? trackId} 01`,
  };
}

function isValidClipLocation(trackId, bar) {
  return TRACK_IDS.includes(trackId) && Number.isInteger(bar) && bar >= 0 && bar < TOTAL_BARS;
}

function createInitialClips() {
  const initialClips = [
    createClipRecord('drums', 0),
    createClipRecord('chord', 0),
  ];

  return {
    ids: initialClips.map((clip) => clip.id),
    byId: Object.fromEntries(initialClips.map((clip) => [clip.id, clip])),
  };
}

function findClipForTrackBar(clips, trackId, bar) {
  const ids = clips?.ids ?? [];
  const byId = clips?.byId ?? {};

  return ids
    .map((id) => byId[id])
    .find((clip) => clip?.trackId === trackId && clip.bar === bar) ?? null;
}

export default function createClipsSlice(set, get) {
  return {
    clips: createInitialClips(),

    getClipForTrackBar: (trackId, bar) => findClipForTrackBar(get().clips, trackId, bar),

    selectClip: (clipId) => {
      const clip = get().clips.byId[clipId];
      if (!clip) return null;

      set({
        activeTrackId: clip.trackId,
        selectedBar: clip.bar,
        selectedClipId: clip.id,
      });

      return clip;
    },

    createClip: (trackId, bar) => {
      if (!isValidClipLocation(trackId, bar)) return null;

      const existingClip = get().getClipForTrackBar(trackId, bar);
      if (existingClip) {
        get().selectClip(existingClip.id);
        return existingClip;
      }

      const clip = createClipRecord(trackId, bar);
      set((state) => ({
        activeTrackId: clip.trackId,
        selectedBar: clip.bar,
        selectedClipId: clip.id,
        clips: {
          ids: [...state.clips.ids, clip.id],
          byId: {
            ...state.clips.byId,
            [clip.id]: clip,
          },
        },
      }));

      return clip;
    },
  };
}

export {
  createClipId,
  createClipRecord,
  createInitialClips,
  findClipForTrackBar,
  isValidClipLocation,
};
