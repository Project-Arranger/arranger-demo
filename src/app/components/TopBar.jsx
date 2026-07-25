import { createElement } from 'react';
import {
  ClipboardPaste,
  Copy,
  Redo2,
  Settings,
  SkipBack,
  Square,
  Undo2,
} from 'lucide-react';
import {
  ROOT_KEY,
  SCALE,
} from '../../domain/musicConstants.js';
import { getTutorialControlRole } from '../../tutorial/drumsTutorialRuntime.js';
import { formatDisplayPosition } from '../transportPosition.js';
import { HardwareInputStatus } from './HardwareInputStatus.jsx';
import { renderIcon } from './icons.js';

function TopBar({
  activeTutorialTarget,
  bpm,
  canCopyClip = false,
  canPasteClip = false,
  canRedo = false,
  canUndo = false,
  currentBar,
  currentStep,
  hardwareInput = null,
  isPlaying,
  onBackToStart,
  onNewSong = () => {},
  onPlayToggle,
  onCopyClip = () => {},
  onPasteClip = () => {},
  onStop,
  onTutorialToggle,
  onRedo = () => {},
  onUndo = () => {},
  rootKey,
  scale,
  showTutorialToggle = false,
  tutorialCollapsed = false,
  tutorialTargets,
}) {
  const active = activeTutorialTarget === 'top-bar';
  const tutorialToggleLabel = tutorialCollapsed ? '展开教程' : '收起教程';
  const playTutorialRole = getTutorialControlRole(tutorialTargets, 'transport-play');
  const transportClassName = [
    'transport',
    playTutorialRole === 'target' ? 'tutorial-control-target tutorial-transport-target' : '',
  ].filter(Boolean).join(' ');
  const playClassName = [
    't-btn',
    'play',
    isPlaying ? 'active' : '',
  ].filter(Boolean).join(' ');
  const [
    displayBar = '—',
    displayBeat = '—',
    displayStep = '—',
  ] = formatDisplayPosition(currentBar, currentStep).split('.');

  return (
    <header
      className={`topbar${active ? ' tutorial-target-active' : ''}`}
      data-tutorial-target="top-bar"
    >
      <div className="brand">
        <div className="name">Project Arranger</div>
        <div className="project">v0.22</div>
      </div>

      <button className="btn-new" aria-label="New song" title="New song" type="button" onClick={onNewSong}>
        <span className="power-gem" aria-hidden="true" />
        <span className="btn-new-label">New</span>
      </button>

      <div className="topbar-left-controls">
        <div className="history-controls" role="toolbar" aria-label="History">
          <button
            className="t-btn undo"
            aria-label="向前一步"
            title="向前一步 (Ctrl+Z)"
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
          >
            {renderIcon(Undo2)}
          </button>
          <button
            className="t-btn redo"
            aria-label="向后一步"
            title="向后一步"
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
          >
            {renderIcon(Redo2)}
          </button>
        </div>

        <div className="clip-controls" role="toolbar" aria-label="Clip actions">
          <button
            className="t-btn copy-clip"
            aria-label="复制 clip"
            title="复制 clip (Cmd/Ctrl+C)"
            type="button"
            disabled={!canCopyClip}
            onClick={onCopyClip}
          >
            {renderIcon(Copy)}
          </button>
          <button
            className="t-btn paste-clip"
            aria-label="粘贴 clip"
            title="粘贴 clip (Cmd/Ctrl+V)"
            type="button"
            disabled={!canPasteClip}
            onClick={onPasteClip}
          >
            {renderIcon(ClipboardPaste)}
          </button>
        </div>

        <div className={transportClassName} role="toolbar" aria-label="Transport">
          <button
            className="t-btn"
            aria-label="Back to start"
            title="Back to start"
            type="button"
            onClick={onBackToStart}
          >
            {renderIcon(SkipBack)}
          </button>
          <button className="t-btn" aria-label="Stop" title="Stop" type="button" onClick={onStop}>
            {renderIcon(Square)}
          </button>
          <button
            className={playClassName}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            type="button"
            onClick={onPlayToggle}
          >
            <span className="play-glyph" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="topbar-center">
        <div className="hardware-status-display">
          <div className="stats" role="group" aria-label="Project info">
            <div className="stat">
              <div className="lbl">Position</div>
              <div className="val mono">
                {displayBar}
                <span className="sep">.</span>
                {displayBeat}
                <span className="sep">.</span>
                {displayStep}
              </div>
            </div>
            <div className="stat">
              <div className="lbl">BPM</div>
              <div className="val mono">{bpm}</div>
            </div>
            <div className="stat">
              <div className="lbl">Key</div>
              <div className="val mono">{rootKey} maj</div>
            </div>
            <div className="stat">
              <div className="lbl">Scale</div>
              <div className="val mono">{scale === SCALE ? ROOT_KEY : scale}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="right-tools">
        {hardwareInput ? createElement(HardwareInputStatus, hardwareInput) : null}
        {showTutorialToggle ? (
          <button
            className="key-switch tutorial-switch"
            type="button"
            aria-label={tutorialToggleLabel}
            title={tutorialToggleLabel}
            onClick={onTutorialToggle}
          >
            教程
          </button>
        ) : null}
        <div className="key-switch save-switch" title="All changes saved">
          <span className="dot" />
          Saved
        </div>
        <button className="hardware-export">Export</button>
        <button className="icon-btn" aria-label="Settings" title="Settings">
          {renderIcon(Settings)}
        </button>
      </div>
    </header>
  );
}

export { TopBar };
