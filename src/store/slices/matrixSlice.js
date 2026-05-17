import createInitialMatrix from '../createInitialMatrix.js';

function hasTrack(matrix, trackId) {
  return Object.hasOwn(matrix, trackId);
}

export default function createMatrixSlice(set, get) {
  return {
    matrix: createInitialMatrix(),

    setCell: (trackId, barIndex, stepIndex, cellData) => set((state) => {
      if (!hasTrack(state.matrix, trackId)) return {};

      const nextBar = [...state.matrix[trackId][barIndex]];
      nextBar[stepIndex] = cellData;

      const nextTrack = [...state.matrix[trackId]];
      nextTrack[barIndex] = nextBar;

      return {
        matrix: {
          ...state.matrix,
          [trackId]: nextTrack,
        },
      };
    }),

    clearStep: (trackId, barIndex, stepIndex) => {
      const { matrix, setCell } = get();
      if (!hasTrack(matrix, trackId)) return;

      setCell(trackId, barIndex, stepIndex, null);
    },

    clearTrack: (trackId) => set((state) => {
      if (!hasTrack(state.matrix, trackId)) return {};

      return {
        matrix: {
          ...state.matrix,
          [trackId]: createInitialMatrix()[trackId],
        },
      };
    }),

    clearMatrix: () => set({ matrix: createInitialMatrix() }),
  };
}
