export default function createContextSlice(set) {
  return {
    activeTrackId: 'drums',
    selectedBar: 0,
    selectedClipId: null,

    setActiveTrackId: (activeTrackId) => set({ activeTrackId }),
    setSelectedBar: (selectedBar) => set({ selectedBar }),
    setSelectedClipId: (selectedClipId) => set({ selectedClipId }),
  };
}
