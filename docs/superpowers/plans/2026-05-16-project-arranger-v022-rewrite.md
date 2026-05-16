# Project Arranger v0.22 Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Project Arranger v0.22 as a teaching-first Web music creation tool while preserving reusable audio assets and music data from the old project.

**Architecture:** Start from the empty repo at `/Users/nora/Documents/arranger demo`. Use the old project at `/Users/nora/Documents/Nora/app/arranger` only as a migration source for samples, music data, and proven Tone.js patterns. Rebuild the app shell, Zustand boundaries, unified command layer, tutorial overlay, button-first chord workflow, and Kiosk-oriented UI as the v0.22 main path.

**Tech Stack:** Vite, React, Zustand, Tone.js, lucide-react, plain CSS, Node-based tests.

---

## Source References

- Requirements: `/Users/nora/Documents/Nora/app/arranger/docs/ARRANGER_REWRITE_REQUIREMENTS.md`
- Old project source: `/Users/nora/Documents/Nora/app/arranger`
- New project target: `/Users/nora/Documents/arranger demo`

## Execution Rules

- Complete one phase at a time.
- After each phase, run the focused tests plus `npm run lint` and `npm run build` once those scripts exist.
- Prefer test-first for pure logic: matrix, command guards, tutorial completion, chord workflow, project storage.
- Keep old drag-based chord UI out of the v0.22 main path.
- Commit after each coherent phase if the user asks for commits.

## Phase 1: Foundation Project Setup

**Goal:** Turn the empty repo into a runnable React app with migrated music assets.

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/app/App.jsx`
- Create: `src/index.css`
- Create directories: `src/app`, `src/domain`, `src/store`, `src/input`, `src/audio`, `src/tutorial`, `src/components`, `src/data`, `src/storage`, `src/styles`, `tests`, `public/samples`
- Copy from old project: `public/samples`, `src/data/chords.js`, `src/data/bassNotes.js`, `src/data/leadNotes.js`, `src/data/percNotes.js`

- [ ] Initialize Vite React project files in the current repo.
- [ ] Install runtime dependencies: `react`, `react-dom`, `zustand`, `tone`, `lucide-react`.
- [ ] Install dev dependencies for Vite and ESLint.
- [ ] Copy old sample files into `public/samples`.
- [ ] Copy old music data files into `src/data`.
- [ ] Add scripts: `dev`, `build`, `lint`, `test`.
- [ ] Verify the default app renders.
- [ ] Run: `npm run build`.
- [ ] Run: `npm run lint`.

**Command to give Codex:**

```text
开始执行 Phase 1 基础工程：在当前空仓初始化 Vite React 项目，安装依赖，建立目录结构，并从旧项目迁移 samples 和 data 音乐数据。完成后运行 lint/build。
```

## Phase 2: Data Model and Store Foundation

**Goal:** Implement the 8-bar, 16-step, 4-track matrix and basic Zustand slices.

**Files:**
- Create: `src/domain/musicConstants.js`
- Create: `src/store/createInitialMatrix.js`
- Create: `src/store/useMusicStore.js`
- Create: `src/store/slices/transportSlice.js`
- Create: `src/store/slices/matrixSlice.js`
- Create: `src/store/slices/contextSlice.js`
- Test: `tests/matrix.test.js`

- [ ] Define constants: `TOTAL_BARS = 8`, `STEPS_PER_BAR = 16`, `BEATS_PER_BAR = 4`, `TRACK_IDS = ['chord', 'bass', 'perc', 'lead']`, `DEFAULT_BPM = 120`, `ROOT_KEY = 'C'`, `SCALE = 'Ionian'`.
- [ ] Implement `createInitialMatrix()` returning all four tracks, eight bars per track, and sixteen null steps per bar.
- [ ] Implement `transportSlice` with BPM, key, scale, play state, current position, seek position, and volumes.
- [ ] Implement `matrixSlice` with `setCell`, `clearStep`, `clearTrack`, and `clearMatrix`.
- [ ] Implement `contextSlice` with selected track and selected bar.
- [ ] Compose slices in `useMusicStore`.
- [ ] Add tests for matrix shape and primitive writes/clears.
- [ ] Run: `npm test -- tests/matrix.test.js`.
- [ ] Run: `npm run build`.
- [ ] Run: `npm run lint`.

**Command to give Codex:**

```text
继续 Phase 2 数据模型：实现 musicConstants、createInitialMatrix、Zustand 基础 slices，并添加 matrix 初始化和基础写入/清除测试。
```

## Phase 3: Unified AppCommand Layer

**Goal:** Route mouse, touch, keyboard, and future hardware events through one command contract.

**Files:**
- Create: `src/input/appCommands.js`
- Create: `src/input/commandGuards.js`
- Create: `src/input/commandDispatcher.js`
- Create: `src/input/keyboardMap.js`
- Create: `src/input/useKeyboardCommands.js`
- Test: `tests/command_guards.test.js`
- Test: `tests/command_dispatcher.test.js`

- [ ] Define `APP_COMMAND_TYPES` for transport, tutorial, percussion, chord, and lead commands.
- [ ] Add JSDoc typedefs for `AppCommand` payloads.
- [ ] Implement `isValidAppCommand(command)` with exact payload validation.
- [ ] Implement `dispatchCommand(command, deps)` so handlers can call store actions and audio methods without components knowing input sources.
- [ ] Implement keyboard mapping: Space play/pause, Escape stop, arrows seek, Enter tutorial next, number keys chord/lead options.
- [ ] Add guard tests for valid and invalid commands.
- [ ] Add dispatcher tests using mocked store/audio dependencies.
- [ ] Run: `npm test -- tests/command_guards.test.js tests/command_dispatcher.test.js`.
- [ ] Run: `npm run build`.
- [ ] Run: `npm run lint`.

**Command to give Codex:**

```text
继续 Phase 3 命令层：实现 AppCommand 类型、command guard、command dispatcher 和键盘映射。所有后续 UI 操作都必须通过 dispatchCommand。
```

## Phase 4: Audio Engine

**Goal:** Rebuild Tone.js playback behind a clear API and keep old samples.

**Files:**
- Create: `src/audio/audioStatus.js`
- Create: `src/audio/AudioEngine.js`
- Modify: `src/input/commandDispatcher.js`

- [ ] Implement audio statuses: `idle`, `starting`, `ready`, `sample-fallback`, `error`.
- [ ] Load migrated chord, bass, lead, and 808 samples using `import.meta.env.BASE_URL`.
- [ ] Add synth fallbacks for chord, bass, lead, and percussion sample failure.
- [ ] Implement `startAudio`, `play`, `pause`, `stop`, `seekToStep`.
- [ ] Implement preview APIs: `playChordPreview`, `playChordArpeggioPreview`, `playBassPreview`, `playPercPreview`, `playLeadPreview`.
- [ ] Implement `leadNoteOn(note)` and `leadNoteOff(note)`.
- [ ] Wire transport and lead commands to audio methods through the dispatcher.
- [ ] Manually smoke test audio unlock, play, pause, stop, seek, and four track previews.
- [ ] Run: `npm run build`.
- [ ] Run: `npm run lint`.

**Command to give Codex:**

```text
继续 Phase 4 音频：迁移旧项目 Tone.js 音频能力，整理成 AudioEngine API，支持四轨预览、transport 播放和 Lead noteOn/noteOff。
```

## Phase 5: UI Shell

**Goal:** Build the first-screen Kiosk arrangement workspace.

**Files:**
- Create: `src/app/AppShell.jsx`
- Create: `src/components/TransportBar.jsx`
- Create: `src/components/Arrangement.jsx`
- Create: `src/components/ContextEditor.jsx`
- Create: `src/components/TutorialOverlay.jsx`
- Create: `src/styles/tokens.css`
- Modify: `src/app/App.jsx`
- Modify: `src/index.css`

- [ ] Create app layout with top transport, center arrangement, bottom context editor, and right tutorial panel.
- [ ] Render eight bars and four tracks using stable grid dimensions.
- [ ] Add selected bar and selected track state interactions through commands or store actions.
- [ ] Add transport controls that dispatch transport commands.
- [ ] Add placeholder context editor that switches by active track.
- [ ] Add tutorial panel placeholder with correct width constraints: min 280px, max 360px, no more than 25vw where practical.
- [ ] Check layout at 1280x720 and 1920x1080.
- [ ] Run: `npm run build`.
- [ ] Run: `npm run lint`.

**Command to give Codex:**

```text
继续 Phase 5 UI Shell：实现首屏编曲工作台布局，包括 Transport、Arrangement、Context Editor、右侧 Tutorial Panel 占位，并适配 1280x720 和 1920x1080。
```

## Phase 6: Percussion Workflow

**Goal:** Make the first editable music workflow complete and testable.

**Files:**
- Create: `src/store/slices/percussionSlice.js`
- Create: `src/components/PercMatrix.jsx`
- Modify: `src/components/ContextEditor.jsx`
- Modify: `src/input/commandDispatcher.js`
- Test: `tests/percussion.test.js`

- [ ] Implement `togglePercStep(bar, step, instrument)` for kick, snare, and hihat.
- [ ] Allow multiple percussion instruments in the same step.
- [ ] Implement `autoFillPercGroove(bar)` with kick/hihat at step 0, hihat at step 4, snare/hihat at step 8, hihat at step 12.
- [ ] Render a 16-step percussion grid in the context editor.
- [ ] Dispatch `perc.toggle` from cell clicks.
- [ ] Play percussion preview after a step is turned on.
- [ ] Add an auto-groove button for the selected bar.
- [ ] Add tests for toggle on, toggle off, stacked instruments, and auto groove.
- [ ] Run: `npm test -- tests/percussion.test.js`.
- [ ] Run: `npm run build`.
- [ ] Run: `npm run lint`.

**Command to give Codex:**

```text
继续 Phase 6 Perc：实现 kick/snare/hihat 的 16-step 编辑器、预览声音、自动基础律动和相关测试。所有操作通过 AppCommand。
```

## Phase 7: Button-First Chord Composer

**Goal:** Replace the old drag-first chord path with an eight-option command-driven chord workflow.

**Files:**
- Create: `src/store/slices/chordSlice.js`
- Create: `src/components/ChordComposer.jsx`
- Modify: `src/components/Arrangement.jsx`
- Modify: `src/components/ContextEditor.jsx`
- Modify: `src/input/commandDispatcher.js`
- Reuse: `src/data/chords.js`
- Test: `tests/chord_workflow.test.js`

- [ ] Keep migrated `CHORD_LIBRARY`, `CHORD_VARIATIONS`, and `ORGANIZE_TRANSITIONS`.
- [ ] Implement Doo-wop template writing C-Am-F-G across eight bars.
- [ ] Implement chord workflow stages: `template`, `color`, `passing`, `tension`, `complete`.
- [ ] Map `chord.selectOption` to the current stage option.
- [ ] Implement `chord.confirm` to commit the current stage and advance where needed.
- [ ] Preserve `baseChordId`, `variationId`, `notes`, `isHead`, and transition/tension markers in chord cells.
- [ ] Preview each selected chord option immediately.
- [ ] Render chord blocks in arrangement with base, variation, passing, and tension states.
- [ ] Add tests for template write, variation replacement, passing chord insertion, and tension insertion.
- [ ] Run: `npm test -- tests/chord_workflow.test.js`.
- [ ] Run: `npm run build`.
- [ ] Run: `npm run lint`.

**Command to give Codex:**

```text
继续 Phase 7 Chord Composer：实现按钮驱动和弦流程，支持模板、色彩变体、经过和弦、张力释放、即时试听和确认写入。
```

## Phase 8: Lead Performance

**Goal:** Build the MVP endpoint: real-time lead performance and activity tracking.

**Files:**
- Create: `src/store/slices/leadSlice.js`
- Create: `src/components/LeadPerformance.jsx`
- Modify: `src/components/ContextEditor.jsx`
- Modify: `src/input/keyboardMap.js`
- Modify: `src/input/commandDispatcher.js`
- Test: `tests/lead.test.js`

- [ ] Define lead notes C3, D3, E3, F3, G3, A3, B3.
- [ ] Render touch-friendly note buttons.
- [ ] Dispatch `lead.noteOn` on pointer/key down.
- [ ] Dispatch `lead.noteOff` on pointer/key up.
- [ ] Track lead activity count for tutorial completion.
- [ ] Optionally write lead notes into the selected bar at the current or nearest available step.
- [ ] Add tests for activity count and command routing.
- [ ] Run: `npm test -- tests/lead.test.js`.
- [ ] Run: `npm run build`.
- [ ] Run: `npm run lint`.

**Command to give Codex:**

```text
继续 Phase 8 Lead：实现 Lead 实时演奏，支持触控按钮和数字键 noteOn/noteOff，并记录至少 4 次 Lead 活动用于教程完成。
```

## Phase 9: Tutorial Engine and Overlay

**Goal:** Connect the real UI into the full teaching flow.

**Files:**
- Create: `src/tutorial/tutorialStepIds.js`
- Create: `src/tutorial/tutorialSteps.js`
- Create: `src/tutorial/completionEvaluators.js`
- Create: `src/tutorial/tutorialSelectors.js`
- Create: `src/store/slices/tutorialSlice.js`
- Modify: `src/components/TutorialOverlay.jsx`
- Modify: `src/app/AppShell.jsx`
- Test: `tests/tutorial_completion.test.js`

- [ ] Define steps: Intro, UI Overview, Perc Kick, Perc Snare, Perc Hihat, Perc Groove, Chord Template, Chord Color, Chord Passing, Chord Tension, Lead Performance, Complete.
- [ ] Put all tutorial copy and targets in `tutorialSteps.js`.
- [ ] Implement tutorial state: current step, active/skipped/completed state, last wrong-target hint, completed task state.
- [ ] Implement completion evaluators for manual steps, percussion counts, chord workflow stage completion, and lead activity count.
- [ ] Highlight real DOM targets through stable `data-tutorial-target` attributes.
- [ ] Keep target areas clickable.
- [ ] Allow non-target clicks and show a reminder in the right panel.
- [ ] Require the user to click Next after completing action steps.
- [ ] Implement restart tutorial without clearing matrix.
- [ ] Add evaluator tests.
- [ ] Run: `npm test -- tests/tutorial_completion.test.js`.
- [ ] Run: `npm run build`.
- [ ] Run: `npm run lint`.

**Command to give Codex:**

```text
继续 Phase 9 Tutorial：实现教程步骤配置、tutorial slice、completion evaluators 和真实 UI overlay，跑通 Intro 到完成页。
```

## Phase 10: Project Persistence

**Goal:** Restore project state after refresh.

**Files:**
- Create: `src/storage/projectStorage.js`
- Create: `src/store/slices/projectSlice.js`
- Modify: `src/store/useMusicStore.js`
- Test: `tests/project_storage.test.js`

- [ ] Implement saved project version `1`.
- [ ] Save matrix, tutorial step id, BPM, root key, scale, volumes, and updated timestamp.
- [ ] Load saved data on app startup.
- [ ] Ignore malformed JSON and fall back to a fresh project.
- [ ] Ignore incompatible versions and fall back to a fresh project.
- [ ] Add debounced or subscription-based autosave after relevant store changes.
- [ ] Add storage roundtrip tests.
- [ ] Run: `npm test -- tests/project_storage.test.js`.
- [ ] Run: `npm run build`.
- [ ] Run: `npm run lint`.

**Command to give Codex:**

```text
继续 Phase 10 本地保存：实现 projectStorage、本地自动保存、启动恢复和异常数据 fallback，并添加 storage 测试。
```

## Phase 11: Final Verification and Polish

**Goal:** Prove the v0.22 acceptance path works.

**Files:**
- Modify as needed based on failing checks.
- Optional create: `docs/VERIFICATION.md`

- [ ] Run: `npm test`.
- [ ] Run: `npm run lint`.
- [ ] Run: `npm run build`.
- [ ] Start the app with `npm run dev`.
- [ ] Manually verify audio unlock, play, pause, stop, seek, and chord/bass/perc/lead previews.
- [ ] Manually run the tutorial path: Intro, UI Overview, Perc, Chord, Lead, Complete.
- [ ] Refresh the browser and verify matrix, tutorial progress, BPM, key, scale, and volume recover.
- [ ] Verify no hardware connection is required for mouse, touch, or keyboard use.
- [ ] Check 1280x720 and 1920x1080 landscape layout for overflow, text overlap, and layout jumps.
- [ ] Record final verification results in the handoff response or `docs/VERIFICATION.md`.

**Command to give Codex:**

```text
执行 Phase 11 完整验收：运行 lint/build/test，补齐核心测试，并手动检查教程主路径、音频、刷新恢复和 Kiosk 横屏布局。
```

## Out of Scope for v0.22

- Full DAW editing.
- Undo and redo.
- Multi-key, multi-scale, or multi-time-signature lessons.
- Advanced bass tutorial.
- Production export/share workflow.
- Hardware WebSocket as a required runtime dependency.
- Old drag-and-drop chord workflow as the primary path.
