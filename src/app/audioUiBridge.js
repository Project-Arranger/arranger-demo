import {
  areSameDrumsInstruments,
  getDrumsCellInstruments,
  mergeDrumsCellInstrument,
} from '../domain/drumsCells.js';
import { dispatchCommand } from '../input/commandDispatcher.js';
import { createDefaultDrumsPattern } from './drumsPatternActions.js';

function seedDefaultDrumsPattern(store, pattern = createDefaultDrumsPattern()) {
  const state = store.getState?.();
  if (!state?.matrix?.drums || typeof state.setCell !== 'function') return;

  for (const event of pattern) {
    const currentCell = store.getState().matrix.drums[event.bar]?.[event.step];
    const nextCell = mergeDrumsCellInstrument(currentCell, event.instrument);
    if (
      areSameDrumsInstruments(
        getDrumsCellInstruments(currentCell),
        getDrumsCellInstruments(nextCell),
      )
    ) {
      continue;
    }

    store.getState().setCell('drums', event.bar, event.step, nextCell);
  }
}

function createUiAudioDispatcher({ store, audio, dispatch = dispatchCommand }) {
  return (command) => dispatch(command, { store, audio });
}

export {
  createDefaultDrumsPattern,
  createUiAudioDispatcher,
  seedDefaultDrumsPattern,
};
