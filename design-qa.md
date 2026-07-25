# Skeuomorphic UI Design QA

## Source Of Truth

- Reference image: `/Users/nora/Downloads/Gemini_Generated_Image_nrumfinrumfinrum.png`
- Target state: main arranger, tutorial skipped, Pop selected, Drums track selected, `Drum 01` clip open.
- Viewports checked: `1440x900`, `390x844`

## Evidence

- Desktop screenshot: `output/playwright/skeuo-drums-desktop-v2.png`
- Mobile screenshot: `output/playwright/skeuo-drums-mobile-v2.png`
- Full-view comparison: `output/playwright/skeuo-comparison-desktop.png`
- Bottom-editor comparison: `output/playwright/skeuo-comparison-editor.png`

## Checks

- P0: Main workflow remains interactive: transport, tutorial skip, track selection, clip opening, editor resize, and bottom editor controls are reachable.
- P0: No browser console errors found in the smoke run.
- P0: Existing data flow, matrix/clip structure, command dispatch, and audio-facing APIs were not changed.
- P1: Reference materials are represented with project-local assets: wall, brushed metal, dark grid panel, wood, brass, carbon/leather, green gem, amber gem.
- P1: Hardware shell is present across topbar, tracks, timeline, and bottom editor.
- P1: Timeline rows stay aligned with track rows, clips stay one measure wide, and the playhead spans ruler/grid.
- P1: Drum sequencer keeps a stable 16-step layout with glowing square pads and section dividers.
- P1: Mobile layout keeps editor controls visible by wrapping the editor header/tools.
- P2: Add-clip hover affordance was softened so it does not visually compete with clips.
- P2: Inactive drum pads now carry instrument-tinted material instead of appearing uniformly empty.

## Accepted Differences

- The implementation uses a straight-on interactive workstation view, not the reference image's perspective tilt, matching the approved plan.
- Existing product copy and editor controls are preserved, so the bottom action labels differ from the generated mockup where current functionality requires it.
- Drum pad active/inactive states preserve real sequencer state instead of lighting every pad exactly like the reference.

## Result

Final result: passed.

---

# Chord Editor Rhythm HTML Prototype QA

## Source And State

- Source visual truth: `/Users/nora/Documents/arranger demo/mockups/chord-editor-rhythm-reference.png`
- Implementation: `/Users/nora/Documents/arranger demo/mockups/chord-editor-rhythm-prototype.html`
- Implementation screenshot: `/Users/nora/Documents/arranger demo/mockups/chord-editor-rhythm-implementation.png`
- Viewport: `1280x720`
- State: desktop, Doo-Wop progression selected, C current chord, Am next chord, eight-note groove active.

## Comparison Evidence

- Full-view comparison: `/Users/nora/Documents/arranger demo/mockups/chord-editor-rhythm-comparison.png`
- Focused-region comparison was not needed: the implementation screenshot keeps the header, progression summary, chord context, labels, and all 16 steps readable at the tested viewport.

## Findings

- No actionable P0/P1/P2 differences remain.
- Fonts and typography: the compact sans-serif controls, serif instrument/readout labels, monospace metadata, weights, wrapping, and hierarchy match the existing Project Arranger visual language. All primary labels remain readable at `1280x720`.
- Spacing and layout rhythm: the progression is now a compact, unboxed information block. The current-chord readout sits directly below it on the same left edge, while the next-chord readout anchors the opposite edge. Four beat groups remain visually scannable without horizontal overflow.
- Colors and visual tokens: the prototype intentionally replaces the reference's neutral gray/blue palette with the product's wood, gunmetal, brass, dark-grid, cream, and chord-amber materials.
- Image quality and asset fidelity: all visible material assets are reused from `public/assets/skeuo`; no placeholder imagery remains. Assets render sharply at the tested viewport.
- Copy and content: `Chord 01`, Doo-Wop, `C · Am · F · G`, current `C`, next `Am`, step numbers 01–16, and the clear/template actions are present. Progression preview copy and behavior were removed as requested.
- Interaction and accessibility: progression selection, groove cycling, step toggles, clear-bar behavior, Escape-to-close, button labels, pressed states, and keyboard focus affordances were checked. Browser console reported no errors or warnings.

## Comparison History

1. Initial pass found a P2 broken track asset caused by a base-path mismatch and a P2 blank close control.
2. Asset paths were changed to resolve relative to the prototype route, and the close control was replaced with a readable hardware-styled text action.
3. Post-fix evidence is `/Users/nora/Documents/arranger demo/mockups/chord-editor-rhythm-implementation.png`; both issues are resolved.
4. The first refinement pass found excessive visual weight in the progression and chord-readout region. The progression card and preview action were removed, both chord badges were reduced, and the current readout was placed below the progression on the same left edge; the next readout remains right-aligned.

## Accepted Differences

- The source screenshot is a structural wireframe rather than the product's visual source of truth. The prototype preserves its information architecture while intentionally using the current Project Arranger skeuomorphic styling.
- Active eighth-note steps are shown in the initial state so the groove control is legible; the reference leaves all slots empty.
- The prototype uses four beat labels below the 16 steps to improve musical grouping without changing the requested structure.

final result: passed

---

# Drums Four-Beat Hardware Frames QA

## Source And State

- Source visual truth: `/var/folders/22/2k2swhcn1zl1rf0pqjp4yt7w0000gn/T/codex-clipboard-7f742c84-c80a-432f-b3b0-ac9ac0f6efcd.png`
- Implementation screenshot: `/Users/nora/Documents/arranger demo/output/playwright/drums-beat-groups-v3.png`
- Viewport: `1280x720`, device pixel ratio `2`; the browser screenshot is normalized to `1280x720` CSS pixels.
- Source pixels: `2280x826`; implementation pixels: `1280x720`.
- State: tutorial skipped, Drums bar 5 selected, four beat frames visible, all pads inactive for visual comparison.

## Comparison Evidence

- Full-view comparison: the source and implementation screenshots were opened together in one comparison pass.
- A separate focused crop was not required: `BEAT 1–4`, the four repeated `1–4` step labels, the three instrument rows, frame edges, and pad states are readable in the `1280x720` implementation capture.

## Findings

- No actionable P0/P1/P2 differences remain.
- Fonts and typography: beat labels use the existing uppercase hardware-label treatment; each beat shows a compact monospace `1–4` step sequence at `8.5px` with no clipping.
- Spacing and layout rhythm: four equal frames measure approximately `188.67x196.55px`; each contains one header, four position labels, three instrument rows, and twelve pads. The complete grid reports equal client and scroll widths with no horizontal overflow.
- Colors and visual tokens: the reference's flat blue grouping is intentionally translated into the product's dark-grid texture, copper borders, brass beat labels, cream position labels, and wood editor base, following `design.md`.
- Image quality and asset fidelity: frames reuse `dark-grid-panel.png`; pads and instrument lamps retain the existing `drum-step-*.png` assets. No placeholder imagery or new CSS-drawn assets were introduced.
- Copy and content: every beat frame visibly repeats `1–4`, while complete positions `5.1.1–5.4.4` remain available in the pad accessible names and the current transport position remains in the TopBar.
- Interaction and accessibility: clicking `Toggle Kick at 5.1.1` changed its pressed state without affecting grouping. Every frame has a Beat group label, every pad keeps its complete position name, and the browser console reported zero errors.
- Verification: all `455` tests passed; `npm run lint`, `npm run build`, and `git diff --check` completed successfully.

## Comparison History

1. The first grouped implementation established the four hardware frames but inherited a dark position-label color, creating a P2 readability issue.
2. Position labels were changed to the design system's cream text with a compact shadow.
3. Full `x.x.x` labels were simplified to a repeated `1–4` sequence after product review, without removing the complete accessible positions.
4. Post-fix evidence is `/Users/nora/Documents/arranger demo/output/playwright/drums-beat-groups-v3.png`; all sixteen labels are readable, report no overflow, and the P2 is resolved.

## Accepted Differences

- The reference uses large flat-blue beat cards and oversized numerals as a structural diagram. The implementation preserves the four-card grouping while using the required skeuomorphic hardware materials from `design.md`.
- Visible labels intentionally show only the within-beat step `1–4`; full `x.x.x` positions are reserved for the TopBar and pad accessible names.

final result: passed

---

## Chord Step Harmony Label Readability Follow-up

- Final wide-screen evidence: `/Users/nora/Documents/arranger demo/.playwright-cli/page-2026-07-15T08-30-09-032Z.png`
- Final compact-screen evidence: `/Users/nora/Documents/arranger demo/.playwright-cli/page-2026-07-15T08-30-43-905Z.png`
- The 16 Chord Steps now reserve a two-layer label zone (step number plus chord-name button) and reduce the physical switch to `54px` (`48px` at compact height). This gives editable names such as `Cmaj7` a full, independently tappable label instead of squeezing them beside the number.
- Beat groups use a `152px` minimum column so the larger labels remain readable without reducing the clear four-by-four rhythm grouping.
- The harmony popover now uses larger title, section, card, chord-name, and tone-token scales. At both `1280×720` and `1024×720`, `Cmaj7` was fully visible in its Step label and the menu remained contained; at the compact viewport it flipped above the Step without page overflow.
- Browser checks reported no layout overflow or console errors/warnings. `npm test` passed all `331` tests; `npm run lint` and `npm run build` completed successfully.

final result: passed

# Chord Preview Button Containment QA

## Source And State

- Source visual truth: `/var/folders/22/2k2swhcn1zl1rf0pqjp4yt7w0000gn/T/codex-clipboard-4efea8d4-3f64-4ac9-9b5f-fdfcc6af7c8c.png`
- Implementation: `/Users/nora/Documents/arranger demo/mockups/chord-editor-rhythm-prototype.html`
- Implementation screenshot: `/Users/nora/Documents/arranger demo/mockups/chord-template-workspace-implementation.png`
- Viewport: `1280x720`
- State: combined chord-template workspace open, Doo-Wop selected, preview and close controls visible.

## Comparison Evidence

- Full-view evidence: `/Users/nora/Documents/arranger demo/mockups/chord-template-workspace-implementation.png`
- Focused implementation crop: `/Users/nora/Documents/arranger demo/mockups/chord-preview-button-focused.png`
- Focused side-by-side comparison: `/Users/nora/Documents/arranger demo/mockups/chord-preview-button-comparison.png`

## Findings

- No actionable P0/P1/P2 differences remain.
- Fonts and typography: this icon-only correction does not change the workspace title, template labels, descriptions, or control copy.
- Spacing and layout rhythm: the play control now measures `36x36px` inside the `46px` header, leaving `4.5px` above and `5.5px` below. Its full border and shadow are visibly contained and it shares the close control's baseline.
- Colors and visual tokens: the brass face, dark outline, and reduced hardware shadow remain consistent with the existing Project Arranger control treatment.
- Image quality and asset fidelity: the existing project-local play icon stays sharp at `17x17px`; no replacement placeholder or newly approximated artwork was introduced.
- Copy and content: the control retains the explicit tooltip and accessible label `试听所选和弦`.
- Interaction and accessibility: the play action was clicked successfully after resizing, its accessible pressed state remains wired, and the browser console reported no errors or warnings.

## Comparison History

1. The supplied focused screenshot identified a P2 containment issue: the `42px` circular control and its shadow visually crossed the `46px` title bar.
2. The control was reduced to `36px`, the icon to `17px`, and the outer shadow was tightened.
3. Post-fix browser measurements confirm the button is fully contained; focused comparison evidence shows the border and shadow no longer cross the title-bar edge.

## Accepted Differences

- The corrected play control is intentionally the same outer size as the close control, while its circular shape and play icon keep it visually distinct.

final result: passed

# Chord Template Workspace QA

## Source And State

- Structure reference: `/Users/nora/Documents/arranger demo/mockups/chord-template-workspace-reference.png`
- Groove-fill reference: `/Users/nora/Documents/arranger demo/mockups/chord-groove-fill-reference.png`
- Chord-content reference: `/Users/nora/Documents/arranger demo/mockups/chord-template-content-reference.png`
- Implementation: `/Users/nora/Documents/arranger demo/mockups/chord-editor-rhythm-prototype.html`
- Implementation screenshot: `/Users/nora/Documents/arranger demo/mockups/chord-template-workspace-implementation.png`
- Viewport: `1280x720`
- State: combined template workspace open, Doo-Wop selected, column-chord basic groove selected.

## Comparison Evidence

- Full-view and focused-reference comparison: `/Users/nora/Documents/arranger demo/mockups/chord-template-workspace-comparison.png`
- Current product-style comparison: `/Users/nora/Documents/arranger demo/mockups/chord-workspace-style-comparison.png`
- The combined comparisons include the complete implementation, the current Project Arranger editor, and separate focused truth for page structure, groove step positions, and chord-card content; no additional crop is required.

## Findings

- No actionable P0/P1/P2 differences remain.
- Fonts and typography: template names, Roman-numeral tags, chord chips, descriptions, section labels, and action labels retain the current Project Arranger serif/sans/monospace hierarchy without clipped text at the tested desktop size.
- Spacing and layout rhythm: the single entry opens a full editor workspace with a three-card progression row, a two-card groove row, and a bottom apply-range row. Preview is a single prominent action in the workspace header, not repeated inside cards or mixed into the bottom apply actions.
- Colors and visual tokens: wood, gunmetal, dark-grid, cream, chord amber, selected borders, and hardware controls reuse the existing product treatment.
- Image quality and asset fidelity: material images come from `public/assets/skeuo`; there are no placeholder images or broken asset paths.
- Copy and content: Axis, Doo-Wop, and Andalusian names, Roman-numeral labels, chord sequences, descriptions, one selected-progression preview action, and both apply-range actions are present.
- Groove fidelity: the basic groove activates step `1`; the syncopated groove activates steps `1`, `7`, and `13`. All 16 miniature steps in both cards measure exactly `14.94px` wide in the verified viewport.
- Interaction and accessibility: the combined entry, progression selection, groove selection, single preview state, apply-to-current-bar, apply-globally, return, Escape close, selected states, and resulting main-editor values were tested. Browser console reported no errors or warnings.

## Comparison History

1. The original two template entry buttons were merged into one combined entry and a unified second-level workspace.
2. Groove fill positions were corrected to `[1]` and `[1, 7, 13]` to match the supplied reference.
3. A P2 width inconsistency caused by group-start margins was removed from both main and miniature step grids; all step widths now match.
4. Chord cards were expanded to retain names, Roman-numeral tags, chord chips, and descriptions from the supplied reference.
5. Repeated card preview controls were removed and replaced by one prominent `试听所选和弦` action in the workspace header.
6. The header preview action was refined into a single circular play control backed by the project icon library; its selected-template preview state and accessible name were verified.
7. The secondary-menu return control was replaced by the same compact X treatment used by the other track editors. It closes the dialog and remains keyboard-labelled as `关闭二级菜单`.
8. The play control was reduced from `42px` to `36px` and its shadow tightened so it sits fully inside the `46px` workspace header.

## Accepted Differences

- The supplied references are structural composites. The implementation preserves their content and layout relationships while using the existing Project Arranger skeuomorphic visual system.
- The single preview action uses a play icon for fast recognition while preserving an explicit tooltip and accessible label.

final result: passed

---

# Chord Card Border And Size Consistency QA

## Source And State

- Source visual truth: `/var/folders/22/2k2swhcn1zl1rf0pqjp4yt7w0000gn/T/codex-clipboard-52c4bbaa-07c5-40e9-a4e6-1d25052c4945.png`
- Implementation: `/Users/nora/Documents/arranger demo/mockups/chord-editor-rhythm-prototype.html`
- Implementation screenshot: `/Users/nora/Documents/arranger demo/mockups/chord-card-borders-implementation.png`
- Viewport: `1280x720`
- State: combined template workspace open, Axis progression selected, basic column-chord groove selected.

## Comparison Evidence

- Full-view implementation: `/Users/nora/Documents/arranger demo/mockups/chord-card-borders-implementation.png`
- Focused implementation crop: `/Users/nora/Documents/arranger demo/mockups/chord-card-borders-focused.png`
- Focused source/implementation comparison: `/Users/nora/Documents/arranger demo/mockups/chord-card-borders-comparison.png`

## Findings

- No actionable P0/P1/P2 differences remain.
- Fonts and typography: all template names, chord labels, degree tags, descriptions, groove metadata, sizes, and wrapping are unchanged.
- Spacing and layout rhythm: both rows now use the same three-column grid and `12px` gap. Every visible chord and groove card measures approximately `300.33px` wide and exactly `152px` high at the verified viewport; the groove row intentionally leaves its third grid track empty because it contains only two templates.
- Colors and visual tokens: upper and lower unselected cards now share `rgba(255, 219, 157, 0.24)` borders; selected cards share `rgba(255, 220, 153, 0.82)` borders.
- Image quality and asset fidelity: no imagery or icon assets were changed.
- Copy and content: the three chord templates and two groove templates retain all supplied content without additions or deletions.
- Interaction and accessibility: progression and groove selection remain functional. Computed styles confirm matching `10px` radii, matching normal/selected shadows, and matching card dimensions across both rows; the browser console reported no errors or warnings.

## Comparison History

1. The supplied screenshot identified a P2 hierarchy inconsistency: the upper cards had an additional visible group frame and different individual selected/normal border treatments.
2. The first pass made only the wrapper border transparent. Its dark background and `8px` padding still rendered as a visible full-row frame, so the P2 remained.
3. The corrected pass removed the wrapper background, border, radius, and padding while keeping all card content unchanged.
4. The upper cards retain the lower cards' border radius, normal border, selected border, and shadow values.
5. Post-fix focused comparison and computed-style measurements confirm the wrapper is fully transparent with a `0px` border and `0px` padding, and the upper/lower individual card borders match exactly.
6. A subsequent size check found that upper cards measured about `300.33px × 132px`, while lower cards measured `330px × 152.05px`, leaving a visible hierarchy mismatch.
7. The groove row was changed to the same three-column track sizing and `12px` gap as the progression row, and both card types were fixed at `152px` height. Post-fix measurements confirm all visible cards now share the same width and height; the 16 miniature steps also use the same width sequence in both groove cards.

## Accepted Differences

- Card backgrounds remain content-specific because the request was intentionally limited to border display and component sizing.

final result: passed

---

# Chord Choice Button Consistency QA

## Source And State

- Source visual truth: `/Users/nora/Documents/arranger demo/mockups/chord-card-borders-implementation.png`
- Implementation: `/Users/nora/Documents/arranger demo/mockups/chord-editor-rhythm-prototype.html`
- Implementation screenshot: `/Users/nora/Documents/arranger demo/mockups/chord-button-consistency-implementation.jpg`
- Viewport: `1275x720`
- State: combined template workspace open, Doo-Wop progression selected, basic column-chord groove selected.

## Comparison Evidence

- Full-view implementation: `/Users/nora/Documents/arranger demo/mockups/chord-button-consistency-implementation.jpg`
- Focused before/after comparison: `/Users/nora/Documents/arranger demo/mockups/chord-button-consistency-comparison.jpg`
- The focused comparison keeps all twelve chord choices readable and shows the width correction directly; no additional crop is needed.

## Findings

- No actionable P0/P1/P2 differences remain.
- Fonts and typography: chord names retain the existing Georgia weight and size; `C`, `G`, `F`, `E`, `Am`, and `Dm` stay vertically and horizontally centered without truncation.
- Spacing and layout rhythm: all twelve chord-choice chips now measure exactly `42px × 30px`. Every chord row measures `272px` internally with no horizontal overflow, so separators and gaps remain evenly spaced.
- Colors and visual tokens: brass text, dark wood fill, border opacity, radii, and selected-card styling are unchanged.
- Image quality and asset fidelity: no image or icon assets were changed.
- Copy and content: all three progression names, degree tags, chord sequences, and descriptions are unchanged.
- Interaction and accessibility: Axis and Doo-Wop card selection were exercised and the selected state restored to Doo-Wop. The browser console contains only Vite connection debug entries and no errors or warnings.

## Comparison History

1. The pre-fix state had a P2 consistency mismatch: single-character chords measured `34px` wide, `Am` about `41.06px`, and `Dm` about `42.05px`.
2. The chord-choice style was changed to a fixed `42px` width with border-box sizing and zero horizontal padding.
3. Post-fix browser measurements confirm that all twelve chips are exactly `42px × 30px`; the focused comparison shows equal button widths across all three progression cards.

## Accepted Differences

- Chord labels retain their natural character widths inside the equal outer button bounds.

final result: passed

---

# Chord Editor Rhythm Production Refactor QA

## Source And State

- Source visual truth: `/Users/nora/Documents/arranger demo/mockups/chord-editor-rhythm-prototype.html`
- Main-editor reference: `/Users/nora/Documents/arranger demo/mockups/chord-editor-rhythm-implementation.png`
- Template-workspace reference: `/Users/nora/Documents/arranger demo/mockups/chord-template-workspace-implementation.png`
- Production main editor: `/Users/nora/Documents/arranger demo/mockups/chord-editor-rhythm-production-1280x720.png`
- Production template workspace: `/Users/nora/Documents/arranger demo/mockups/chord-template-workspace-production-1280x720.png`
- Compact production main editor: `/Users/nora/Documents/arranger demo/mockups/chord-editor-rhythm-production-1024x720.png`
- Compact production template workspace: `/Users/nora/Documents/arranger demo/mockups/chord-template-workspace-production-1024x720.png`
- Viewports: `1280x720` and `1024x720`
- State: four existing Chord clips, Doo-Wop progression applied globally, column-chord basic groove selected, bar 4 open.

## Comparison Evidence

- Full main-editor comparison: `/Users/nora/Documents/arranger demo/mockups/chord-editor-rhythm-comparison-pass2.png`
- Focused main-editor comparison: `/Users/nora/Documents/arranger demo/mockups/chord-editor-rhythm-focused-comparison-pass2.png`
- Full workspace comparison: `/Users/nora/Documents/arranger demo/mockups/chord-template-workspace-comparison-pass2.png`
- Focused workspace comparison: `/Users/nora/Documents/arranger demo/mockups/chord-template-workspace-focused-comparison-pass2.png`
- Each comparison places the supplied reference and the production implementation in the same image input. The focused evidence keeps the 16-step controls, template cards, groove cards, and apply actions legible.

## Findings

- No actionable P0/P1/P2 differences remain.
- Typography: the production editor preserves the reference's serif hierarchy for progression and chord names, compact monospace metadata, and readable Chinese control copy at both tested breakpoints.
- Spacing and layout: the main editor retains the summary, current/next chord, 16 equal rhythm switches, four beat labels, and status light. The workspace retains a three-card progression row, two-card groove row, and two explicit apply actions without document or workspace overflow.
- Colors and tokens: wood, gunmetal, grid-panel, brass controls, selected amber outlines, and track-specific Chord colors reuse the existing Project Arranger skeuomorphic materials.
- Image and asset fidelity: the production UI uses the project-local `icon-play.svg`, `icon-x.svg`, wood, brass, and grid assets; no placeholder imagery or approximate icons were introduced.
- Copy and content: all six progression templates remain available across two pages in the required order, both groove templates remain available, and the main editor exposes only the requested template, clear-bar, close, paging, and rhythm controls.
- Interaction and accessibility: browser QA covered pending-only card selection, Escape/close discard, page 1/page 2, preview, current-bar apply, global apply, manual rhythm toggling, clear-bar source retention, pressed states, and accessible labels. The final browser console contained no errors or warnings.
- Responsive behavior: at `1280x720`, opening the workspace no longer changes the editor height or adds timeline scrollbars. At `1024x720`, the document and workspace remain width/height contained; the existing timeline's compact internal scrolling is unchanged between the main and workspace states.
- Automated verification: `npm test` passed all 316 tests; `npm run lint` and `npm run build` completed successfully.

## Comparison History

1. The first production comparison exposed a P2 native scrollbar and slight clipping in the compact 16-step grid.
2. The step grid was tightened and its vertical overflow removed; post-fix measurement confirmed equal client and scroll heights with all 16 switches and beat labels visible.
3. A later full-workspace comparison exposed a P2 height regression: opening the workspace enlarged the editor and compressed the track timeline enough to add scrollbars at `1280x720`.
4. The `720px`-height workspace was changed to reuse the main editor height. Header, card, groove, description, and apply-action spacing were compacted within that fixed surface.
5. Post-fix browser measurements confirmed the editor remains `360px` high, the timeline keeps equal client and scroll heights at `1280x720`, and the dialog/body keep equal client and scroll dimensions at both tested viewports.
6. New full-view and focused pass-2 comparisons were generated from the final production screenshots and reviewed together with the supplied references.

## Accepted Differences

- The reference is an isolated editor prototype, while production shares a `720px` viewport with the arranger timeline. Production therefore uses a shallower step/control surface and compact card descriptions while preserving the reference hierarchy, content, and interaction model.
- The `1024x720` arranger timeline already scrolls internally in both main-editor and workspace states; the refactor does not add page or workspace overflow at that breakpoint.

final result: passed

---

# Chord Rhythm Grouping And Four-Clip Preview QA

## Source And State

- Visual baseline: `/Users/nora/Documents/arranger demo/mockups/chord-editor-rhythm-prototype.html`
- Previous production main editor: `/Users/nora/Documents/arranger demo/mockups/chord-editor-rhythm-production-1280x720.png`
- Previous production template workspace: `/Users/nora/Documents/arranger demo/mockups/chord-template-workspace-production-1280x720.png`
- Updated main editor: `/Users/nora/Documents/arranger demo/output/playwright/chord-rhythm-main-1280x720.png`
- Updated template workspace: `/Users/nora/Documents/arranger demo/output/playwright/chord-template-workspace-1280x720-stable.png`
- Updated compact main editor: `/Users/nora/Documents/arranger demo/output/playwright/chord-rhythm-main-1024x720.png`
- Updated compact template workspace: `/Users/nora/Documents/arranger demo/output/playwright/chord-template-workspace-1024x720.png`
- Viewports: `1280x720` and `1024x720`
- State: eight existing Chord clips, Doo-Wop pending, basic and syncopated groove cards exercised, combined preview and transport-stop behavior verified.

## Findings

- No actionable P0/P1/P2 differences remain.
- Rhythm hierarchy: both main-editor controls and miniature groove previews now use four separately bordered and recessed Beat groups with four steps each. The inter-group gap is visibly larger than the within-group gap at both tested breakpoints.
- Layout and responsiveness: all four Beat groups remain equal-width and fully visible. Document and body `scrollWidth` match the viewport at `1280x720` and `1024x720`; no page-level horizontal overflow was introduced.
- Preview fidelity: the pending progression and pending groove are combined into a 64-step, four-clip preview. Basic groove events occur at steps `0, 16, 32, 48`; syncopated events occur at `0, 6, 12` plus the same offsets for each following clip.
- Interaction: the preview control changes from `试听所选和弦与律动` to a pressed `停止试听` state. Immediate stop returns `aria-pressed` from `true` to `false`; selecting another progression or groove, closing, Escape, apply, unmount, or starting the arranger transport cancels the active preview.
- Transport behavior: browser QA confirmed an active arranger transport becomes stopped before the chord preview enters its playing state, and it is not automatically resumed afterward.
- Accessibility: the main sequence exposes four named `Beat 1` through `Beat 4` groups, all sixteen switches retain their step-specific labels, and the icon-only preview button has distinct play and stop accessible names.
- Console and verification: browser console reported `0` errors and `0` warnings. `npm test` passed all `320` tests; `npm run lint`, `npm run build`, and `git diff --check` completed successfully.

## Comparison History

1. The prior production view presented both rhythm rows as continuous sixteen-step strips, so the four-beat meter was visually weak.
2. Main-editor steps were wrapped into four recessed hardware wells and the miniature groove rows received the same four-well structure.
3. The fixed `900ms` preview indicator and chord-only sequence were replaced by a cancelable four-clip session driven by the current pending progression, groove, and project BPM.
4. Browser checks covered natural completion, play/stop toggling, selection cancellation, transport conflict, Escape close, responsive containment, and console state.

## Accepted Differences

- The miniature groove wells are intentionally shallower and more compact than the main editor wells so both groove cards remain readable inside the fixed-height secondary workspace.
- Preview playback is audio-only and does not move the arranger playhead or mutate clip selection, matrix data, or undo history.

final result: passed

---

# Shared Track Clip Pager Clarity QA

## Evidence

- Drums at `1280x720`: `/Users/nora/Documents/arranger demo/output/playwright/track-clip-pager-drums-1280x720.png`
- Chord at `1280x720`: `/Users/nora/Documents/arranger demo/output/playwright/track-clip-pager-chord-1280x720.png`
- Melody at `1024x720`: `/Users/nora/Documents/arranger demo/output/playwright/track-clip-pager-melody-1024x720.png`
- Bass was inspected in the same `1280x720` browser session through the shared pager component and reported the same visible copy, accessible names, and `48px` control width.

## Findings

- No actionable P0/P1/P2 issues remain.
- All four editors now show a directional chevron plus visible `上一个 / 下一个` and `CLIP` copy instead of relying on an icon alone.
- Accessible names and hover titles explicitly say `切换到上一个 Clip` and `切换到下一个 Clip`.
- The compact `1280x720` controls were widened from the initial `32px` pass to `48px`; the Chinese label uses `10px` bold, non-wrapping text, while the secondary `CLIP` label preserves the hardware-style hierarchy.
- Clicking `下一个 Clip` in Melody changed the active editor from `Melody 01` to `Melody 02`, confirming that the clearer label still invokes the existing clip-order paging behavior.
- Browser measurements reported zero page-level horizontal overflow at `1280x720` and `1024x720`. The browser console reported `0` errors and `0` warnings.
- Automated verification: `npm test` passed all `320` tests; `npm run lint`, `npm run build`, and `git diff --check` completed successfully.

## 2x Size Follow-up

- Updated Drums at `1280x720`: `/Users/nora/Documents/arranger demo/output/playwright/track-clip-pager-2x-drums-1280x720.png`
- Updated Chord at `1280x720`: `/Users/nora/Documents/arranger demo/output/playwright/track-clip-pager-2x-chord-1280x720.png`
- Updated Melody at `1024x720`: `/Users/nora/Documents/arranger demo/output/playwright/track-clip-pager-2x-melody-1024x720.png`
- Standard controls now measure `96x128px`, exactly twice the previous `48x64px`. The compact `1280x720` controls measure `96x112px`, exactly twice the previous `48x56px` compact dimensions.
- Chevron icons doubled from `15px` to `30px`; the Chinese direction label doubled from `10px` to `20px`; the `CLIP` label doubled from `7px` to `14px`.
- Drums, Chord, Bass, and Melody all retained their shared accessible labels and paging behavior. The enlarged Melody next button still changed `Melody 01` to `Melody 02`.
- Both tested viewports reported zero page-level overflow and the console reported `0` errors and `0` warnings. `npm test` passed all `320` tests; `npm run lint` and `npm run build` completed successfully.

## 75% Width Follow-up

- Updated Chord at `1280x720`: `/Users/nora/Documents/arranger demo/output/playwright/track-clip-pager-75-chord-1280x720.png`
- Button width was reduced by exactly `25%`, from `96px` to `72px`; height, icon size, Chinese label size, and `CLIP` label size remain unchanged.
- The compact-width rule was reduced proportionally from `80px` to `60px`, preserving a touch target wider than the `44px` accessibility minimum.
- Browser measurement confirmed the `20px` Chinese label occupies about `57px` inside the `72px` control without wrapping or clipping. The page reported zero horizontal overflow and the console reported `0` errors and `0` warnings.
- `npm test` passed all `320` tests; `npm run lint`, `npm run build`, and `git diff --check` completed successfully.

## Cross-track Position Alignment Follow-up

- Final Drums evidence at `1280x720`: `/Users/nora/Documents/arranger demo/.playwright-cli/page-2026-07-14T17-05-31-496Z.png`
- The Drums-only pager grid and horizontal body inset were removed. Drums, Chord, Bass, and Melody now inherit the same shared pager-shell columns and outer alignment; only the central Drums sequencer panel keeps its own centered width.
- At `1280x720`, all four editors measured the same `72x112px` controls: previous Clip `54.453125–126.453125px`, next Clip `1153.546875–1225.546875px`. The centered Drums panel remained `860px` wide at `210–1070px`.
- At `1024x720`, Drums and Melody measured the same `72x128px` controls: previous Clip `43.96875–115.96875px`, next Clip `908.03125–980.03125px`. The shared component and rule set cover Chord and Bass identically.
- Both viewports reported zero page-level horizontal overflow. The clean browser session reported `0` errors and `0` warnings.
- The two layout tests covering the Drums sequencer and compact desktop viewport passed. `npm run lint`, `npm run build`, and `git diff --check` completed successfully.
- The full suite currently has nine unrelated UI-source assertion failures while a concurrent Piano Roll refactor updates Bass/Melody markup and legacy `.chord-grid` expectations; the pager alignment tests pass and this change does not modify those Piano Roll files.

## Drums Editor Height And Step Scale Follow-up

- Final `1280x720` evidence: `/Users/nora/Documents/arranger demo/output/playwright/drum-editor-enlarged-1280x720.png`
- Final `1024x720` evidence: `/Users/nora/Documents/arranger demo/output/playwright/drum-editor-enlarged-1024x720.png`
- Drums now uses the same `clamp(360px, 46vh, 430px)` editor-height tier as Bass and Melody outside template workspaces. At `1024x720`, all three editors measured exactly `291.15625px` high with the same `405.3125px` top edge.
- At `1280x720`, the compact Drums step controls increased from `32x32px` to `42x42px`; the instrument lamps increased from `32px` to `40px`. The panel, body, and document all reported equal client/scroll dimensions.
- At `1024x720`, steps increased from `42x42px` to `44x44px`. Kick, Snare, and Hi-Hat labels move above their rows at the `981–1179px` breakpoint so all sixteen enlarged steps remain visible without label overlap or horizontal/vertical content scrolling.
- The shared previous/next Clip buttons keep their cross-track positions and sizes. Both tested viewports reported zero page-level overflow, and the clean browser session reported `0` errors and `0` warnings.
- The three focused layout checks passed. The full automated suite passed, and `npm run lint`, `npm run build`, and `git diff --check` completed successfully.

## Drums Step Grid Even-fill Follow-up

- User evidence: `/var/folders/22/2k2swhcn1zl1rf0pqjp4yt7w0000gn/T/codex-clipboard-428bb8a9-0efe-44bf-8043-5aef0b0c36cf.png`
- Final tall wide-screen evidence: `/Users/nora/Documents/arranger demo/output/playwright/drum-editor-even-fill-2048x1080-tall.png`
- Final `1280x720` evidence: `/Users/nora/Documents/arranger demo/output/playwright/drum-editor-even-fill-1280x720.png`
- Final `1024x720` evidence: `/Users/nora/Documents/arranger demo/output/playwright/drum-editor-even-fill-1024x720.png`
- The fixed `980px`/`860px` Drums panel caps were removed. The panel now fills the shared Pager center column while the previous/next Clip controls retain their cross-track outer positions.
- Each Beat and each of its four steps now uses equal fractional tracks. Step controls remain capped at a usable `64px` on wide screens instead of stretching into oversized pads, while their centers distribute across the full working width.
- Step-number, Kick, Snare, Hi-Hat, and bar-indicator layers use the full panel height with `space-evenly`. A simulated `505px`-high editor placed the three `64px` rows at approximately `695px`, `790px`, and `885px`, with no content scroll.
- Beat separators are attached to Beat-group boundaries rather than the fourth button, so they remain centered when fractional tracks expand.
- At `2048x1080`, the first and last steps span `290.9375–1877.0625px` inside the Pager center region. At `1280x720`, all sixteen `42px` controls remain visible; at `1024x720`, all sixteen `44px` controls and stacked row labels remain contained.
- All tested states reported equal client/scroll dimensions, zero page overflow, and `0` browser errors or warnings. Focused layout checks, the full automated suite, `npm run lint`, `npm run build`, and `git diff --check` completed successfully.

final result: passed

---

## Drums Step Grid Half-gap Follow-up

- Final `2048x1080` evidence: `/Users/nora/Documents/arranger demo/output/playwright/drum-editor-half-gap-2048x1080.png`
- Final `1280x720` evidence: `/Users/nora/Documents/arranger demo/output/playwright/drum-editor-half-gap-1280x720.png`
- Final `1024x720` evidence: `/Users/nora/Documents/arranger demo/output/playwright/drum-editor-half-gap-1024x720.png`
- On the wide layout, the centered sixteen-step grid now uses `82%` of the available sequence region. The `64px` controls remain unchanged while the within-beat edge gap drops from approximately `34.9px` to `16.7px`, almost exactly half.
- On the compact `1280x720` layout, the grid uses `88%` of the available region. The `42px` controls remain unchanged while the within-beat edge gap drops from approximately `13.7px` to `6.9px`.
- The `1024x720` breakpoint intentionally retains the full-width layout so all sixteen fixed `44px` controls remain visible. The page and body both reported `1024px` client/scroll width with no horizontal overflow.
- Grid bounds were centered with equal left/right space inside the step region at both wide and compact desktop sizes. Beat-group spacing and separators remain more prominent than the reduced within-beat gaps.
- The clean browser session reported `0` errors and `0` warnings. All `325` tests passed; `npm run lint`, `npm run build`, and `git diff --check` completed successfully.

final result: passed

---

## Drums Instrument Label Balance Follow-up

- Final `2048x1080` evidence: `/Users/nora/Documents/arranger demo/output/playwright/drum-label-balance-2048x1080.png`
- Final `1280x720` evidence: `/Users/nora/Documents/arranger demo/output/playwright/drum-label-balance-1280x720.png`
- Final `1024x720` evidence: `/Users/nora/Documents/arranger demo/output/playwright/drum-label-balance-1024x720.png`
- Kick, Snare, Hi-Hat, and the sixteen-step grid now form one centered responsive content block. This moves the instrument labels inward without changing the shared previous/next Clip button positions or step control sizes.
- At `2048x1080`, the Kick lamp starts `168.2px` after the previous Clip button and the final step ends `173.4px` before the next Clip button, a `5.2px` optical difference across an approximately `1760px` span.
- At `1280x720`, the matching distances are `72.2px` and `73.3px`, differing by approximately `1.1px`. The `42px` controls and approximately `6.2px` within-beat gaps remain unchanged in character.
- The `1024x720` stacked-label breakpoint intentionally retains full-width rows. All sixteen `44px` controls remain visible with no page or body horizontal overflow.
- The clean browser session reported `0` errors and `0` warnings. All `325` tests passed; `npm run lint`, `npm run build`, and `git diff --check` completed successfully.

final result: passed

---

## Chord Harmony Menu Large-format Follow-up

- Final `1280x720` evidence: `/Users/nora/Documents/arranger demo/.playwright-cli/page-2026-07-15T08-47-16-343Z.png`
- Final `1024x720` evidence: `/Users/nora/Documents/arranger demo/.playwright-cli/page-2026-07-15T08-48-06-681Z.png`
- The harmony popover maximum width increased from `720px` to `940px`, giving the five enrichment cards materially wider reading columns while keeping the full menu inside both target viewports.
- Enrichment and passing cards now measure at least `112px` high at the compact breakpoint and `124px` otherwise. Chord names use `18–20px`, descriptions use `11–12px`, and tone tokens use `11px`; the close control is `40px` square.
- A dark modal scrim now separates the floating hardware panel from the Arranger underneath. The same Escape, outside-click, apply, and close behavior remains unchanged.
- Both tested viewports displayed every enrichment and passing option without horizontal or vertical overflow. The browser console stayed free of application errors, all `332` tests passed, and `npm run lint`, `npm run build`, plus `git diff --check` completed successfully.

final result: passed

---

## Chord Harmony Option Preview Follow-up

- Final `1280x720` evidence: `/Users/nora/Documents/arranger demo/.playwright-cli/page-2026-07-15T09-15-21-608Z.png`
- Final `1024x720` evidence: `/Users/nora/Documents/arranger demo/.playwright-cli/page-2026-07-15T09-18-38-236Z.png`
- Every enrichment and passing-chord card now has a dedicated `40x40px` brass preview control. The apply region remains separate, so previewing never applies the candidate chord or writes to the matrix.
- Harmony previews reuse the template workspace's cancelable sequence-preview path: they stop Arranger transport first, use the current project BPM, switch to the existing stop icon while active, and release the chord at the preview boundary.
- Switching candidates, applying an option, changing a rhythm step, changing Clip, opening the template workspace, closing the popover, pressing Escape, clicking outside, closing the editor, or unmounting cancels the active preview. Stale completion callbacks cannot clear a newer preview state.
- Passing-chord apply and preview controls remain visibly and semantically disabled outside Step 15. All controls expose candidate-specific labels and pressed state to assistive technology.
- Both target viewports displayed all controls without panel or page overflow. A browser interaction confirmed that previewing `Cmaj7` left the current Step 15 value unchanged, and the clean browser session reported `0` errors and `0` warnings.
- All `333` tests passed; `npm run lint`, `npm run build`, and the focused chord/UI suites completed successfully.

final result: passed
