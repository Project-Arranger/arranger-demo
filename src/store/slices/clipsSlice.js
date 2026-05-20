import { TOTAL_BARS, TRACK_IDS } from '../../domain/musicConstants.js';

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

function formatClipName(trackId, bar) {
  const label = TRACK_LABELS[trackId] ?? trackId;
  const barNumber = String(bar + 1).padStart(2, '0');

  return `${label} ${barNumber}`;
}

function createClipRecord(trackId, bar) {
  return {
    id: createClipId(trackId, bar),
    trackId,
    bar,
    name: formatClipName(trackId, bar),
  };
}

function createEmptyBarLike(bar) {
  return Array.from({ length: bar.length }, () => null);
}

function cloneBar(bar) {
  return [...bar];
}

function moveClipRecordToBar(clip, bar) {
  return {
    ...clip,
    id: createClipId(clip.trackId, bar),
    bar,
    name: formatClipName(clip.trackId, bar),
  };
}

function isValidClipLocation(trackId, bar) {
  return TRACK_IDS.includes(trackId) && Number.isInteger(bar) && bar >= 0 && bar < TOTAL_BARS;
}

function createInitialClips() {
  const initialClips = [
    createClipRecord('drums', 0),
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

    moveClipToBar: (clipId, targetBar) => {
      const state = get();
      const sourceClip = state.clips.byId[clipId];
      if (!sourceClip || !isValidClipLocation(sourceClip.trackId, targetBar)) return null;

      if (sourceClip.bar === targetBar) {
        get().selectClip(sourceClip.id);
        return sourceClip;
      }

      const trackMatrix = state.matrix[sourceClip.trackId];
      if (!trackMatrix?.[sourceClip.bar] || !trackMatrix?.[targetBar]) return null;

      const targetClip = findClipForTrackBar(state.clips, sourceClip.trackId, targetBar);
      const sourceBarData = cloneBar(trackMatrix[sourceClip.bar]);
      const targetBarData = cloneBar(trackMatrix[targetBar]);
      const nextTrackMatrix = [...trackMatrix];
      const nextById = { ...state.clips.byId };
      let nextIds = state.clips.ids;
      let selectedClip;

      if (targetClip) {
        const nextSourceClip = moveClipRecordToBar(targetClip, sourceClip.bar);
        const nextTargetClip = moveClipRecordToBar(sourceClip, targetBar);
        nextById[nextSourceClip.id] = nextSourceClip;
        nextById[nextTargetClip.id] = nextTargetClip;
        nextTrackMatrix[sourceClip.bar] = targetBarData;
        nextTrackMatrix[targetBar] = sourceBarData;
        selectedClip = nextTargetClip;
      } else {
        const nextTargetClip = moveClipRecordToBar(sourceClip, targetBar);
        delete nextById[sourceClip.id];
        nextById[nextTargetClip.id] = nextTargetClip;
        nextIds = state.clips.ids.map((id) => (id === sourceClip.id ? nextTargetClip.id : id));
        nextTrackMatrix[sourceClip.bar] = createEmptyBarLike(sourceBarData);
        nextTrackMatrix[targetBar] = sourceBarData;
        selectedClip = nextTargetClip;
      }

      set({
        activeTrackId: selectedClip.trackId,
        selectedBar: selectedClip.bar,
        selectedClipId: selectedClip.id,
        clips: {
          ids: nextIds,
          byId: nextById,
        },
        matrix: {
          ...state.matrix,
          [selectedClip.trackId]: nextTrackMatrix,
        },
      });

      return selectedClip;
    },
  };
}

export {
  createClipId,
  createClipRecord,
  createInitialClips,
  findClipForTrackBar,
  formatClipName,
  isValidClipLocation,
};
