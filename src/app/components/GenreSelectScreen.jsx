import {
  LockKeyhole,
  Music2,
  Play,
} from 'lucide-react';
import {
  CURRENT_GENRE_ID,
  GENRE_OPTIONS,
} from '../genreOptions.js';
import { renderIcon } from './icons.js';

function GenreSelectScreen({
  currentGenreId = CURRENT_GENRE_ID,
  onGenreEnter = () => {},
  options = GENRE_OPTIONS,
}) {
  return (
    <section className="genre-gate" aria-label="选择曲风">
      <div className="genre-gate-inner">
        <header className="genre-gate-head">
          <div className="genre-brand-lockup">
            <span className="genre-brand-icon" aria-hidden="true">{renderIcon(Music2)}</span>
            <span className="genre-brand-text">Project Arranger</span>
          </div>
          <div className="genre-title-group">
            <p className="genre-kicker">ARRANGER STYLE</p>
            <h1>选择曲风</h1>
          </div>
        </header>

        <div className="genre-grid" role="list" aria-label="曲风列表">
          {options.map((genre) => {
            const current = genre.id === currentGenreId;
            const locked = !current || !genre.enabled;
            const cardClassName = [
              'genre-card',
              current ? 'current' : '',
              locked ? 'locked' : '',
            ].filter(Boolean).join(' ');

            return (
              <article
                className={cardClassName}
                style={{
                  '--genre-tone': genre.tone,
                  '--genre-ink': genre.ink,
                }}
                aria-disabled={locked}
                data-current={current ? 'true' : undefined}
                data-locked={locked ? 'true' : undefined}
                data-genre-id={genre.id}
                key={genre.id}
                role="listitem"
              >
                <div className="genre-card-top">
                  <span className="genre-led" aria-hidden="true" />
                  <span className="genre-state mono">
                    {current ? 'CURRENT' : 'LOCKED'}
                  </span>
                  {locked ? (
                    <span className="genre-lock" aria-hidden="true">
                      {renderIcon(LockKeyhole)}
                    </span>
                  ) : null}
                </div>

                <button
                  className="genre-card-select"
                  type="button"
                  disabled={locked}
                  onClick={() => onGenreEnter(genre.id)}
                  aria-label={`选择${genre.label}`}
                >
                  <span className="genre-label">{genre.label}</span>
                  <span className="genre-note mono">{genre.note}</span>
                </button>

                <button
                  className="genre-audition"
                  type="button"
                  disabled={locked}
                  onClick={() => onGenreEnter(genre.id)}
                  aria-label={`试听${genre.label}`}
                >
                  {renderIcon(Play)}
                  <span>试听</span>
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export { GenreSelectScreen };
