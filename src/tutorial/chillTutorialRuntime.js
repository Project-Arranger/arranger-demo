const CHILL_TUTORIAL_RUN_STATES = Object.freeze({
  COMPLETED: 'completed',
  IDLE: 'idle',
  PREVIEWING: 'previewing',
});

function addAppliedRecipeId(appliedRecipeIds, recipeId) {
  if (!recipeId || appliedRecipeIds.includes(recipeId)) return appliedRecipeIds;
  return [...appliedRecipeIds, recipeId];
}

function beginChillTutorialPreview(session, recipeId = null) {
  return {
    ...session,
    appliedRecipeIds: addAppliedRecipeId(session.appliedRecipeIds, recipeId),
    hasStarted: true,
    runState: CHILL_TUTORIAL_RUN_STATES.PREVIEWING,
  };
}

function cancelChillTutorialPreview(session) {
  if (session.runState === CHILL_TUTORIAL_RUN_STATES.IDLE) return session;
  return {
    ...session,
    runState: CHILL_TUTORIAL_RUN_STATES.IDLE,
  };
}

function completeChillTutorialPreview(session) {
  return {
    ...session,
    runState: CHILL_TUTORIAL_RUN_STATES.COMPLETED,
  };
}

function advanceChillTutorialStep(session, stepCount) {
  return {
    ...session,
    runState: CHILL_TUTORIAL_RUN_STATES.IDLE,
    stepIndex: Math.min(session.stepIndex + 1, stepCount - 1),
  };
}

export {
  CHILL_TUTORIAL_RUN_STATES,
  advanceChillTutorialStep,
  beginChillTutorialPreview,
  cancelChillTutorialPreview,
  completeChillTutorialPreview,
};
