import { ChevronLeft, ChevronRight } from 'lucide-react';
import { renderIcon } from './icons.js';

function TrackBarPager({
  canPageBars = false,
  children,
  className = '',
  contentClassName = '',
  onNextBar = () => {},
  onPreviousBar = () => {},
  trackId = 'drums',
}) {
  const shellClassName = ['track-editor-pager-shell', className]
    .filter(Boolean)
    .join(' ');
  const contentClassNames = ['track-editor-pager-content', contentClassName]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={shellClassName} data-type={trackId}>
      <button
        aria-label="上一小节"
        className="track-page-btn previous"
        disabled={!canPageBars}
        onClick={onPreviousBar}
        title="上一小节"
        type="button"
      >
        {renderIcon(ChevronLeft)}
      </button>
      <div className={contentClassNames}>{children}</div>
      <button
        aria-label="下一小节"
        className="track-page-btn next"
        disabled={!canPageBars}
        onClick={onNextBar}
        title="下一小节"
        type="button"
      >
        {renderIcon(ChevronRight)}
      </button>
    </div>
  );
}

export { TrackBarPager };
