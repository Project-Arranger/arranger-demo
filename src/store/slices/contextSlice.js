export default function createContextSlice(set) {
  return {
    activeTrackId: 'drums',
    melodyScaleId: 'major',
    selectedBar: 0,
    selectedClipId: null,

    setActiveTrackId: (activeTrackId) => set({ activeTrackId }),
    setMelodyScaleId: (melodyScaleId) => set({ melodyScaleId }),
    setSelectedBar: (selectedBar) => set({ selectedBar }),
    setSelectedClipId: (selectedClipId) => set({ selectedClipId }),
  };
}
