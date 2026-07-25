import { TOTAL_BARS } from '../domain/musicConstants.js';

const MELODY_RHYTHM_TEMPLATES = Object.freeze([
  Object.freeze({ id: 'syncopation', name: '切分', steps: Object.freeze([0, 6, 12]) }),
  Object.freeze({ id: 'jump-syncopation', name: '跳跃切分', steps: Object.freeze([0, 6, 8, 12]) }),
  Object.freeze({ id: 'two-eight', name: '二八', steps: Object.freeze([1, 7]) }),
  Object.freeze({ id: 'four-sixteen', name: '四十六', steps: Object.freeze([0, 4, 8, 12]) }),
  Object.freeze({ id: 'dotted', name: '附点', steps: Object.freeze([0, 12]) }),
]);

const MELODY_RHYTHM_TEMPLATE_IDS = Object.freeze(
  MELODY_RHYTHM_TEMPLATES.map(({ id }) => id),
);

function getMelodyRhythmTemplate(templateId) {
  return MELODY_RHYTHM_TEMPLATES.find(({ id }) => id === templateId) ?? null;
}

function normalizeMelodyRhythmTemplateId(templateId) {
  return getMelodyRhythmTemplate(templateId)?.id ?? null;
}

function getMelodyClipTemplateId(clips, bar, trackId = 'melody') {
  const ids = clips?.ids ?? [];
  const byId = clips?.byId ?? {};
  const clip = ids
    .map((id) => byId[id])
    .find((candidate) => candidate?.trackId === trackId && candidate.bar === bar);
  return normalizeMelodyRhythmTemplateId(clip?.melodyRhythmTemplateId);
}

function updateMelodyClipTemplates(clips, predicate, templateId, trackId = 'melody') {
  const normalizedTemplateId = normalizeMelodyRhythmTemplateId(templateId);
  let changed = false;
  const nextById = { ...clips.byId };

  for (const clipId of clips.ids) {
    const clip = clips.byId[clipId];
    if (clip?.trackId !== trackId || !predicate(clip)) continue;
    if ((clip.melodyRhythmTemplateId ?? null) === normalizedTemplateId) continue;
    nextById[clipId] = { ...clip, melodyRhythmTemplateId: normalizedTemplateId };
    changed = true;
  }

  return changed ? { ids: clips.ids, byId: nextById } : clips;
}

function applyMelodyRhythmTemplateToBar(clips, bar, templateId, trackId = 'melody') {
  if (!Number.isInteger(bar) || bar < 0 || bar >= TOTAL_BARS) return clips;
  if (!getMelodyRhythmTemplate(templateId)) return clips;
  return updateMelodyClipTemplates(clips, (clip) => clip.bar === bar, templateId, trackId);
}

function applyMelodyRhythmTemplateToExistingClips(clips, templateId, trackId = 'melody') {
  if (!getMelodyRhythmTemplate(templateId)) return clips;
  return updateMelodyClipTemplates(clips, () => true, templateId, trackId);
}

function clearMelodyRhythmTemplateFromBar(clips, bar, trackId = 'melody') {
  return updateMelodyClipTemplates(clips, (clip) => clip.bar === bar, null, trackId);
}

function clearMelodyRhythmTemplates(clips, trackId = 'melody') {
  return updateMelodyClipTemplates(clips, () => true, null, trackId);
}

export {
  applyMelodyRhythmTemplateToBar,
  applyMelodyRhythmTemplateToExistingClips,
  clearMelodyRhythmTemplateFromBar,
  clearMelodyRhythmTemplates,
  getMelodyClipTemplateId,
  getMelodyRhythmTemplate,
  MELODY_RHYTHM_TEMPLATE_IDS,
  MELODY_RHYTHM_TEMPLATES,
  normalizeMelodyRhythmTemplateId,
};
