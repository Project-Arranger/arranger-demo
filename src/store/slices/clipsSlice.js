import {
  createClipId,
  createClipRecord,
  formatClipName,
} from '../../domain/clipHelpers.js';
import { TOTAL_BARS, TRACK_IDS } from '../../domain/musicConstants.js';

function createEmptyBarLike(bar) {
  return Array.from({ length: bar.length }, () => null);
}

function cloneBar(bar) {
  return [...bar];
}

function cloneCell(cell) {
  if (cell === null || typeof cell !== 'object') return cell;
  if (Array.isArray(cell)) return cell.map((item) => cloneCell(item));

  return Object.fromEntries(
    Object.entries(cell).map(([key, value]) => [key, cloneCell(value)]),
  );
}

function cloneBarData(bar) {
  return bar.map((cell) => cloneCell(cell));
}

function moveClipRecordToBar(clip, bar) {
  return {
    ...clip,
    id: createClipId(clip.trackId, bar),
    bar,
    name: clip.customName ? clip.name : formatClipName(clip.trackId, bar),
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

function createPastedClipRecord(snapshot, targetTrackId, targetBar) {
  const clip = createClipRecord(targetTrackId, targetBar);
  if (targetTrackId === 'melody') {
    clip.melodyRhythmTemplateId = snapshot?.melodyRhythmTemplateId ?? null;
  }
  if (snapshot?.customName === true) {
    return {
      ...clip,
      customName: true,
      name: snapshot.name,
    };
  }

  return clip;
}

export default function createClipsSlice(set, get) {
  return {
    clips: createInitialClips(),

    getClipForTrackBar: (trackId, bar) => findClipForTrackBar(get().clips, trackId, bar),

    createClipClipboardSnapshot: (clipId = get().selectedClipId) => {
      const state = get();
      const clip = state.clips.byId[clipId];
      if (!clip) return null;

      const barData = state.matrix[clip.trackId]?.[clip.bar];
      if (!Array.isArray(barData)) return null;

      return {
        sourceClipId: clip.id,
        trackId: clip.trackId,
        sourceBar: clip.bar,
        name: clip.name,
        customName: clip.customName === true,
        melodyRhythmTemplateId: clip.trackId === 'melody'
          ? clip.melodyRhythmTemplateId ?? null
          : undefined,
        barData: cloneBarData(barData),
      };
    },

    pasteClipClipboardSnapshot: (snapshot, targetTrackId, targetBar) => {
      if (
        !snapshot
        || snapshot.trackId !== targetTrackId
        || !isValidClipLocation(targetTrackId, targetBar)
        || !Array.isArray(snapshot.barData)
      ) {
        return null;
      }

      const state = get();
      const trackMatrix = state.matrix[targetTrackId];
      const targetBarData = trackMatrix?.[targetBar];
      if (!Array.isArray(targetBarData) || snapshot.barData.length !== targetBarData.length) {
        return null;
      }

      const targetClip = findClipForTrackBar(state.clips, targetTrackId, targetBar);
      const pastedClip = createPastedClipRecord(snapshot, targetTrackId, targetBar);
      const nextTrackMatrix = [...trackMatrix];
      nextTrackMatrix[targetBar] = cloneBarData(snapshot.barData);

      set({
        activeTrackId: targetTrackId,
        selectedBar: targetBar,
        selectedClipId: pastedClip.id,
        clips: {
          ids: targetClip ? state.clips.ids : [...state.clips.ids, pastedClip.id],
          byId: {
            ...state.clips.byId,
            [pastedClip.id]: pastedClip,
          },
        },
        matrix: {
          ...state.matrix,
          [targetTrackId]: nextTrackMatrix,
        },
      });

      return pastedClip;
    },

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

    createEmptyClipsForTrack: (trackId) => {
      if (!TRACK_IDS.includes(trackId)) return [];

      const state = get();
      const createdClips = Array.from({ length: TOTAL_BARS }, (_, bar) => bar)
        .filter((bar) => !findClipForTrackBar(state.clips, trackId, bar))
        .map((bar) => createClipRecord(trackId, bar));
      const selectedClip = findClipForTrackBar(state.clips, trackId, 0)
        ?? createdClips.find((clip) => clip.bar === 0)
        ?? null;

      if (!createdClips.length) {
        if (selectedClip) get().selectClip(selectedClip.id);
        return createdClips;
      }

      set({
        activeTrackId: trackId,
        selectedBar: selectedClip?.bar ?? 0,
        selectedClipId: selectedClip?.id ?? null,
        clips: {
          ids: [...state.clips.ids, ...createdClips.map((clip) => clip.id)],
          byId: {
            ...state.clips.byId,
            ...Object.fromEntries(createdClips.map((clip) => [clip.id, clip])),
          },
        },
      });

      return createdClips;
    },

    ensureMelodyClipsInRange: (startBar, endBar = TOTAL_BARS - 1) => {
      if (
        !Number.isInteger(startBar)
        || !Number.isInteger(endBar)
        || startBar < 0
        || endBar >= TOTAL_BARS
        || startBar > endBar
      ) {
        return [];
      }

      const state = get();
      const createdClips = Array.from(
        { length: endBar - startBar + 1 },
        (_, offset) => startBar + offset,
      )
        .filter((bar) => !findClipForTrackBar(state.clips, 'melody', bar))
        .map((bar) => createClipRecord('melody', bar));

      if (!createdClips.length) return createdClips;

      set({
        clips: {
          ids: [...state.clips.ids, ...createdClips.map((clip) => clip.id)],
          byId: {
            ...state.clips.byId,
            ...Object.fromEntries(createdClips.map((clip) => [clip.id, clip])),
          },
        },
      });

      return createdClips;
    },

    renameClip: (clipId, name) => {
      if (typeof name !== 'string') return null;

      const state = get();
      const clip = state.clips.byId[clipId];
      if (!clip) return null;

      const renamedClip = {
        ...clip,
        customName: true,
        name,
      };

      set({
        clips: {
          ids: state.clips.ids,
          byId: {
            ...state.clips.byId,
            [clip.id]: renamedClip,
          },
        },
      });

      return renamedClip;
    },

    deleteClip: (clipId) => {
      const state = get();
      const clip = state.clips.byId[clipId];
      if (!clip) return null;

      const nextById = { ...state.clips.byId };
      delete nextById[clip.id];

      const trackMatrix = state.matrix[clip.trackId];
      const nextMatrix = { ...state.matrix };
      if (trackMatrix?.[clip.bar]) {
        const nextTrackMatrix = [...trackMatrix];
        nextTrackMatrix[clip.bar] = createEmptyBarLike(trackMatrix[clip.bar]);
        nextMatrix[clip.trackId] = nextTrackMatrix;
      }

      set({
        activeTrackId: clip.trackId,
        selectedBar: clip.bar,
        selectedClipId: null,
        clips: {
          ids: state.clips.ids.filter((id) => id !== clip.id),
          byId: nextById,
        },
        matrix: nextMatrix,
      });

      return clip;
    },

    deleteSelectedClip: () => {
      const { selectedClipId } = get();
      if (!selectedClipId) return null;
      return get().deleteClip(selectedClipId);
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
  createInitialClips,
  findClipForTrackBar,
};
