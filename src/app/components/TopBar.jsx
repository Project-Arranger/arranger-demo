import {
  Plus,
  Settings,
  SkipBack,
  Square,
} from 'lucide-react';
import {
  BEATS_PER_BAR,
  ROOT_KEY,
  SCALE,
} from '../../store/useMusicStore.js';
import { getTutorialControlRole } from '../../tutorial/drumsTutorialRuntime.js';
import { renderIcon } from './icons.js';

function TopBar({
  activeTutorialTarget,
  bpm,
  currentBar,
  currentStep,
  isPlaying,
  onBackToStart,
  onPlayToggle,
  onStop,
  onTutorialToggle,
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

  return (
    <header
      className={`topbar${active ? ' tutorial-target-active' : ''}`}
      data-tutorial-target="top-bar"
    >
      <div className="brand">
        <div className="name">Project Arranger</div>
        <div className="project">v0.22</div>
      </div>

      <button className="btn-new" aria-label="New song">
        {renderIcon(Plus)}
        New Song
      </button>

      <div className="topbar-center">
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

        <div className="stats" role="group" aria-label="Project info">
          <div className="stat">
            <div className="lbl">Position</div>
            <div className="val mono">
              {currentBar + 1}
              <span className="sep">.</span>
              {Math.floor(currentStep / BEATS_PER_BAR) + 1}
              <span className="sep">.</span>
              {(currentStep % BEATS_PER_BAR) + 1}
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

      <div className="right-tools">
        {showTutorialToggle ? (
          <button
            className="tutorial-topbar-button"
            type="button"
            aria-label={tutorialToggleLabel}
            title={tutorialToggleLabel}
            onClick={onTutorialToggle}
          >
            教程
          </button>
        ) : null}
        <div className="save-pill" title="All changes saved">
          <span className="dot" />
          Saved
        </div>
        <button className="btn-export">Export</button>
        <button className="icon-btn" aria-label="Settings" title="Settings">
          {renderIcon(Settings)}
        </button>
      </div>
    </header>
  );
}

export { TopBar };
