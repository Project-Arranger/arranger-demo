import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import {
  CURRENT_GENRE_ID,
  GENRE_OPTIONS,
} from '../genreOptions.js';
import { renderIcon } from './icons.js';

const LEFT_CONTROLS = [
  { label: 'MASTER VOLUME', type: 'knob' },
  { label: 'TUNE', type: 'knob' },
  { label: 'FX', type: 'button', light: 'dot' },
  { label: 'PRESET', type: 'button', light: 'bar' },
];

const RIGHT_CONTROLS = [
  { label: 'TUNE', type: 'knob' },
  { label: 'FX', type: 'button', light: 'bar' },
  { label: 'MENU', type: 'button', light: 'bar' },
  { label: 'PRESET', type: 'button', light: 'bar' },
];

function renderHardwareControl(control, key) {
  return (
    <div className="genre-hardware-control" key={key}>
      {control.type === 'knob' ? (
        <span className="genre-knob" aria-hidden="true" />
      ) : (
        <span className={`genre-control-button ${control.light}`} aria-hidden="true">
          <span className="genre-control-light" />
        </span>
      )}
      <span className="genre-control-label">{control.label}</span>
    </div>
  );
}

function GenreSelectScreen({
  currentGenreId = CURRENT_GENRE_ID,
  onGenreEnter = () => {},
  options = GENRE_OPTIONS,
}) {
  const [selectedPreviewGenreId, setSelectedPreviewGenreId] = useState(currentGenreId);

  const handleGenreSelect = (genre) => {
    setSelectedPreviewGenreId(genre.id);
    if (genre.id === currentGenreId) {
      onGenreEnter(genre.id);
    }
  };

  const handleGenreAudition = (genre) => {
    setSelectedPreviewGenreId(genre.id);
  };

  return (
    <section className="genre-gate" aria-label="选择曲风">
      <div className="genre-hardware">
        <aside className="genre-side-rail left" aria-hidden="true">
          {LEFT_CONTROLS.map((control) => (
            renderHardwareControl(control, `left-${control.label}`)
          ))}
        </aside>

        <main className="genre-console">
          <div className="genre-screen">
            <header className="genre-gate-head">
              <div className="genre-brand-lockup">
                <span className="genre-brand-icon" aria-hidden="true">{renderIcon(Volume2)}</span>
                <span className="genre-brand-text">Aether Synthesizers</span>
              </div>
              <div className="genre-title-group">
                <p className="genre-kicker">GENRE SELECT</p>
                <h1>选择曲风</h1>
              </div>
            </header>

            <div className="genre-grid" role="list" aria-label="曲风列表">
              {options.map((genre) => {
                const selected = genre.id === selectedPreviewGenreId;
                const genreStyle = {
                  '--genre-ink': genre.ink,
                  '--genre-neon': genre.neon,
                  '--genre-tone': genre.tone,
                };

                return (
                  <div
                    className="genre-card-shell"
                    key={genre.id}
                    role="listitem"
                    style={genreStyle}
                  >
                    <button
                      className="genre-card"
                      type="button"
                      style={genreStyle}
                      aria-label={`选择${genre.label}`}
                      aria-pressed={selected}
                      data-enabled={genre.enabled ? 'true' : 'false'}
                      data-genre-id={genre.id}
                      data-selected={selected ? 'true' : undefined}
                      onClick={() => handleGenreSelect(genre)}
                    >
                      <span className="genre-label">{genre.shortLabel}</span>
                      <span className="genre-status mono">
                        {genre.enabled ? 'ENTER' : 'PREVIEW'}
                      </span>
                    </button>
                    <button
                      className="genre-gem-button"
                      type="button"
                      aria-label={`试听 ${genre.label}`}
                      onClick={() => handleGenreAudition(genre)}
                    >
                      <span className="genre-gem" aria-hidden="true" />
                      <span className="genre-gem-label" aria-hidden="true">试听</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="genre-console-title">AETHER SYNTHESIZERS - GENRE SELECT</p>
        </main>

        <aside className="genre-side-rail right" aria-hidden="true">
          {RIGHT_CONTROLS.map((control) => (
            renderHardwareControl(control, `right-${control.label}`)
          ))}
        </aside>
      </div>
    </section>
  );
}

export { GenreSelectScreen };
