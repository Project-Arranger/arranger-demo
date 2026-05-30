import {
  CORE_TRACK_IDS,
  TRACK_IDS,
} from '../../domain/musicConstants.js';

export default function createContextSlice(set) {
  return {
    activeTrackId: 'drums',
    melodyScaleId: 'major',
    selectedBar: 0,
    selectedClipId: null,
    visibleTrackIds: [...CORE_TRACK_IDS],

    addVisibleTrack: (trackId) => {
      if (!TRACK_IDS.includes(trackId)) return null;

      let addedTrackId = null;
      set((state) => {
        if (state.visibleTrackIds.includes(trackId)) return {};

        addedTrackId = trackId;
        return {
          activeTrackId: trackId,
          selectedClipId: null,
          visibleTrackIds: [...state.visibleTrackIds, trackId],
        };
      });

      return addedTrackId;
    },
    setActiveTrackId: (activeTrackId) => set({ activeTrackId }),
    setMelodyScaleId: (melodyScaleId) => set({ melodyScaleId }),
    setSelectedBar: (selectedBar) => set({ selectedBar }),
    setSelectedClipId: (selectedClipId) => set({ selectedClipId }),
  };
}
