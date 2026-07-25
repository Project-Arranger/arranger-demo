import assert from 'node:assert/strict';
import test from 'node:test';

import useMusicStore from '../src/store/useMusicStore.js';
import {
  CHILL_RECIPE_DEFINITIONS,
  CHILL_TUTORIAL_BPM,
  applyChillTutorialRecipe,
  createChillTutorialAppState,
  createChillTutorialMatrix,
  isChillTutorialScoreComplete,
} from '../src/tutorial/chillTutorialScore.js';
import {
  CHILL_TUTORIAL_STAGES,
  CHILL_TUTORIAL_STEPS,
  createChillTutorialSession,
} from '../src/tutorial/chillTutorialSteps.js';
import {
  TUTORIAL_CATALOG,
  TUTORIAL_IDS,
} from '../src/tutorial/tutorialCatalog.js';
import {
  getContextualTutorialPosition,
} from '../src/tutorial/contextualTutorialPosition.js';

function getOneBasedActiveSteps(bar) {
  return bar
    .map((cell, stepIndex) => (cell ? stepIndex + 1 : null))
    .filter(Boolean);
}

test('tutorial catalog keeps Chill first and legacy basics second', () => {
  assert.deepEqual(
    TUTORIAL_CATALOG.map((tutorial) => tutorial.id),
    [
      TUTORIAL_IDS.CHILL_RAINY_STREET,
      TUTORIAL_IDS.LEGACY_BASICS,
    ],
  );
  assert.equal(TUTORIAL_CATALOG[0].runtime, 'contextual');
  assert.equal(TUTORIAL_CATALOG[1].runtime, 'sidebar');
});

test('Chill tutorial exposes five stages and deterministic recipe steps', () => {
  assert.deepEqual(CHILL_TUTORIAL_STAGES, [
    '第一句话',
    '第二句话',
    '回家',
    '前奏',
    '完整播放',
  ]);
  assert.equal(CHILL_TUTORIAL_STEPS.length, 16);
  assert.equal(CHILL_TUTORIAL_STEPS.at(-1).explicit, true);
  assert.equal(CHILL_TUTORIAL_STEPS.at(-1).anchorSelector, '[data-tutorial-anchor="transport"]');
  assert.deepEqual(createChillTutorialSession(), {
    appliedRecipeIds: [],
    completed: false,
    expanded: false,
    hasStarted: false,
    paused: false,
    stepIndex: 0,
  });
});

test('Chill master score matches the approved eight-bar notes', () => {
  const matrix = createChillTutorialMatrix();

  assert.deepEqual(getOneBasedActiveSteps(matrix.drums[7]), [1, 3, 5, 9, 11, 13]);
  assert.deepEqual(
    matrix.drums[7].map((cell) => cell?.instruments ?? null).filter(Boolean),
    [
      ['hihat'],
      ['kick', 'hihat'],
      ['hihat'],
      ['snare', 'hihat'],
      ['kick'],
      ['kick'],
    ],
  );
  assert.deepEqual(
    matrix.chord[7].map((cell) => cell?.label ?? null),
    ['Cmaj7', null, null, null, null, null, null, null, 'C', null, null, null, null, null, null, null],
  );
  assert.deepEqual(
    matrix.bass[7].map((cell) => cell?.note ?? null),
    ['C1', null, null, null, 'C1', null, null, null, null, null, 'C1', null, null, null, 'C1', null],
  );
  assert.equal(matrix.melody[7].every((cell) => cell === null), true);
  assert.deepEqual(
    matrix.melody[4].map((cell) => cell?.note ?? null),
    ['E4', null, 'A4', null, null, null, null, null, 'D4', null, null, null, null, null, 'C4', null],
  );
});

test('every staged recipe composes to the exact approved master at 88 BPM', () => {
  const initialState = useMusicStore.getInitialState();
  let tutorialState = {
    ...initialState,
    ...createChillTutorialAppState(initialState),
  };

  assert.equal(tutorialState.bpm, CHILL_TUTORIAL_BPM);
  assert.equal(isChillTutorialScoreComplete(tutorialState.matrix), false);
  assert.equal(tutorialState.clips.ids.length, 32);

  for (const recipeId of Object.keys(CHILL_RECIPE_DEFINITIONS)) {
    const patch = applyChillTutorialRecipe(tutorialState, recipeId);
    assert.ok(patch, recipeId);
    tutorialState = {
      ...tutorialState,
      ...patch,
    };
  }

  assert.equal(isChillTutorialScoreComplete(tutorialState.matrix), true);
  assert.deepEqual(tutorialState.matrix.drums, createChillTutorialMatrix().drums);
  assert.deepEqual(tutorialState.matrix.chord, createChillTutorialMatrix().chord);
  assert.deepEqual(tutorialState.matrix.bass, createChillTutorialMatrix().bass);
  assert.deepEqual(tutorialState.matrix.melody, createChillTutorialMatrix().melody);
});

test('contextual placement tries top bottom right left and clamps at viewport edges', () => {
  const cardRect = { width: 200, height: 120 };
  const viewport = { width: 1000, height: 700 };

  assert.deepEqual(
    getContextualTutorialPosition({
      cardRect,
      targetRect: {
        bottom: 400,
        height: 50,
        left: 400,
        right: 500,
        top: 350,
        width: 100,
      },
      viewport,
    }),
    { left: 350, placement: 'top', top: 216 },
  );

  assert.equal(
    getContextualTutorialPosition({
      cardRect,
      targetRect: {
        bottom: 80,
        height: 50,
        left: 400,
        right: 500,
        top: 30,
        width: 100,
      },
      viewport,
    }).placement,
    'bottom',
  );

  assert.equal(
    getContextualTutorialPosition({
      cardRect,
      placements: ['right', 'left'],
      targetRect: {
        bottom: 330,
        height: 60,
        left: 80,
        right: 140,
        top: 270,
        width: 60,
      },
      viewport,
    }).placement,
    'right',
  );

  const clamped = getContextualTutorialPosition({
    cardRect: { width: 360, height: 300 },
    targetRect: {
      bottom: 696,
      height: 20,
      left: 970,
      right: 990,
      top: 676,
      width: 20,
    },
    viewport: { width: 400, height: 340 },
  });
  assert.equal(clamped.left, 28);
  assert.equal(clamped.top, 28);
});
