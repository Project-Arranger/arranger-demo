import {
  useRef,
  useState,
} from 'react';
import {
  ArrowLeft,
  Check,
  FileImage,
  Film,
  RefreshCw,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  MULTIMODAL_ACCEPT,
  MULTIMODAL_ANALYSIS_STAGES,
  MULTIMODAL_RECOMMENDATION,
} from '../multimodalRecommendation.js';
import { BpmControl } from './BpmControl.jsx';
import { HardwareFlowShell } from './HardwareFlowShell.jsx';
import { renderIcon } from './icons.js';

function ChoiceChips({
  group,
  label,
  onChange,
  value,
}) {
  return (
    <div className="recommendation-choice">
      <span className="recommendation-choice-label">{label}</span>
      <div className="recommendation-chips" role="group" aria-label={label}>
        {group.options.map((option) => (
          <button
            className="recommendation-chip"
            data-active={option.id === value ? 'true' : undefined}
            key={option.id}
            type="button"
            aria-pressed={option.id === value}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MediaPreview({
  file,
  kind,
  previewUrl,
}) {
  const [failedPreviewUrl, setFailedPreviewUrl] = useState(null);
  const videoUnavailable = failedPreviewUrl === previewUrl;

  if (!file || !previewUrl) return null;

  if (kind === 'image') {
    return (
      <img
        className="multimodal-media"
        src={previewUrl}
        alt={`已选择：${file.name}`}
      />
    );
  }

  if (videoUnavailable) {
    return (
      <div className="multimodal-video-fallback" role="status">
        <span aria-hidden="true">{renderIcon(Film)}</span>
        <strong>{file.name}</strong>
        <span>浏览器无法预览这个视频，但仍可以继续生成推荐。</span>
      </div>
    );
  }

  return (
    <video
      className="multimodal-media"
      src={previewUrl}
      aria-label={`已选择：${file.name}`}
      controls
      muted
      playsInline
      preload="metadata"
      onError={() => setFailedPreviewUrl(previewUrl)}
    />
  );
}

function UploadView({
  error,
  file,
  kind,
  onBack,
  onFileSelect,
  onGenerate,
  previewUrl,
}) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const pickFile = (fileList) => {
    const nextFile = fileList?.[0] ?? null;
    if (nextFile) onFileSelect(nextFile);
  };

  return (
    <div className="multimodal-content upload-view">
      <div
        className="multimodal-dropzone"
        data-drag-active={dragActive ? 'true' : undefined}
        data-has-file={file ? 'true' : undefined}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget)) return;
          setDragActive(false);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          pickFile(event.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept={MULTIMODAL_ACCEPT}
          aria-label="上传图片或视频"
          onChange={(event) => {
            pickFile(event.target.files);
            event.target.value = '';
          }}
        />

        {file ? (
          <div className="multimodal-upload-preview">
            <div className="multimodal-preview-frame">
              <MediaPreview file={file} kind={kind} previewUrl={previewUrl} />
            </div>
            <div className="multimodal-file-meta">
              <span aria-hidden="true">{renderIcon(kind === 'image' ? FileImage : Film)}</span>
              <span>
                <strong>{file.name}</strong>
                <small>{kind === 'image' ? 'IMAGE INPUT' : 'VIDEO INPUT'}</small>
              </span>
            </div>
          </div>
        ) : (
          <div className="multimodal-empty-upload">
            <span className="multimodal-upload-icon" aria-hidden="true">{renderIcon(Upload)}</span>
            <strong>放入一张图片或一段视频</strong>
            <span>我们会从色彩、场景和动态中推荐编曲方向</span>
            <small>JPEG / PNG / WebP / GIF · MP4 / WebM / MOV</small>
          </div>
        )}

        <button
          className="hardware-flow-button secondary"
          type="button"
          onClick={() => inputRef.current?.click()}
        >
          {file ? '更换素材' : '选择本地素材'}
        </button>
      </div>

      {error ? <p className="multimodal-error" role="alert">{error}</p> : null}

      <div className="multimodal-actions">
        <button className="hardware-flow-button ghost" type="button" onClick={onBack}>
          <span aria-hidden="true">{renderIcon(ArrowLeft)}</span>
          返回曲风
        </button>
        <button
          className="hardware-flow-button primary"
          type="button"
          disabled={!file}
          onClick={onGenerate}
        >
          <span aria-hidden="true">{renderIcon(Sparkles)}</span>
          生成编曲建议
        </button>
      </div>
    </div>
  );
}

function AnalyzingView({
  file,
  kind,
  onCancel,
  previewUrl,
  stageIndex,
}) {
  return (
    <div className="multimodal-content analyzing-view">
      <div className="analysis-media-panel" aria-hidden="true">
        <MediaPreview file={file} kind={kind} previewUrl={previewUrl} />
        <span className="analysis-scan-line" />
      </div>
      <div className="analysis-status-panel" role="status" aria-live="polite">
        <span className="analysis-orb" aria-hidden="true">{renderIcon(Sparkles)}</span>
        <p className="analysis-kicker mono">MULTIMODAL ANALYSIS</p>
        <h2>{MULTIMODAL_ANALYSIS_STAGES[stageIndex]}</h2>
        <ol className="analysis-stage-list">
          {MULTIMODAL_ANALYSIS_STAGES.map((stage, index) => (
            <li
              data-state={index < stageIndex ? 'complete' : index === stageIndex ? 'active' : 'pending'}
              key={stage}
            >
              <span className="analysis-stage-mark" aria-hidden="true">
                {index < stageIndex ? renderIcon(Check) : index + 1}
              </span>
              <span>{stage}</span>
            </li>
          ))}
        </ol>
        <div className="analysis-progress" aria-hidden="true">
          <span style={{ width: `${((stageIndex + 1) / MULTIMODAL_ANALYSIS_STAGES.length) * 100}%` }} />
        </div>
        <button className="hardware-flow-button ghost" type="button" onClick={onCancel}>
          取消分析
        </button>
      </div>
    </div>
  );
}

function ResultsView({
  bpm,
  file,
  kind,
  onApply,
  onBack,
  onBpmChange,
  onSelectionChange,
  previewUrl,
  selections,
}) {
  const timbreSet = MULTIMODAL_RECOMMENDATION.timbre.options.find(
    (option) => option.id === selections.timbre,
  ) ?? MULTIMODAL_RECOMMENDATION.timbre.options[0];

  return (
    <div className="multimodal-content results-view">
      <section className="results-media-column" aria-label="素材预览">
        <div className="results-media-frame">
          <MediaPreview file={file} kind={kind} previewUrl={previewUrl} />
          <span className="results-analysis-badge mono">
            <span aria-hidden="true">{renderIcon(Check)}</span>
            ANALYZED
          </span>
        </div>
        <div className="results-source-meta">
          <span>{kind === 'image' ? 'IMAGE SOURCE' : 'VIDEO SOURCE'}</span>
          <strong>{file?.name}</strong>
        </div>
        <button className="hardware-flow-button ghost" type="button" onClick={onBack}>
          <span aria-hidden="true">{renderIcon(RefreshCw)}</span>
          更换素材
        </button>
      </section>

      <section className="recommendation-console" aria-label="AI 编曲建议">
        <div className="recommendation-intro">
          <span className="recommendation-confidence mono">MATCH 92%</span>
          <div>
            <p>画面音乐画像</p>
            <h2>松弛、潮湿、有城市微光</h2>
          </div>
        </div>

        <ChoiceChips
          group={MULTIMODAL_RECOMMENDATION.style}
          label="风格"
          value={selections.style}
          onChange={(value) => onSelectionChange('style', value)}
        />

        <div className="recommendation-row">
          <div className="recommendation-bpm-panel">
            <span className="recommendation-choice-label">速度</span>
            <BpmControl
              idPrefix="recommendation-bpm"
              value={bpm}
              onChange={onBpmChange}
            />
          </div>
          <div className="recommendation-static">
            <span>拍号</span>
            <strong className="mono">{MULTIMODAL_RECOMMENDATION.timeSignature}</strong>
          </div>
        </div>

        <ChoiceChips
          group={MULTIMODAL_RECOMMENDATION.mode}
          label="调式"
          value={selections.mode}
          onChange={(value) => onSelectionChange('mode', value)}
        />
        <ChoiceChips
          group={MULTIMODAL_RECOMMENDATION.harmony}
          label="和声"
          value={selections.harmony}
          onChange={(value) => onSelectionChange('harmony', value)}
        />
        <ChoiceChips
          group={MULTIMODAL_RECOMMENDATION.timbre}
          label="音色组"
          value={selections.timbre}
          onChange={(value) => onSelectionChange('timbre', value)}
        />

        <div className="recommended-tracks" aria-label="推荐四轨音色">
          {Object.entries(timbreSet.tracks).map(([trackId, timbre]) => (
            <div className="recommended-track" data-track={trackId} key={trackId}>
              <span>{trackId}</span>
              <strong>{timbre}</strong>
            </div>
          ))}
        </div>

        <div className="recommendation-structure">
          <span>结构</span>
          <strong>{MULTIMODAL_RECOMMENDATION.structure}</strong>
        </div>

        <button className="hardware-flow-button primary apply-recommendation" type="button" onClick={onApply}>
          <span aria-hidden="true">{renderIcon(Sparkles)}</span>
          使用这个方案
        </button>
      </section>
    </div>
  );
}

function MultimodalFlowScreen({
  bpm,
  error,
  file,
  kind,
  onApply,
  onBack,
  onBpmChange,
  onCancelAnalysis,
  onFileSelect,
  onGenerate,
  onSelectionChange,
  previewUrl,
  selections,
  stageIndex,
  view,
}) {
  const viewMeta = {
    upload: {
      kicker: 'AI MULTIMODAL INPUT',
      title: '上传画面',
    },
    analyzing: {
      kicker: 'AI MULTIMODAL ENGINE',
      title: '正在理解画面',
    },
    results: {
      kicker: 'AI ARRANGEMENT PROFILE',
      title: '推荐编曲方案',
    },
  }[view];

  return (
    <HardwareFlowShell
      ariaLabel="AI 多模态编曲"
      consoleTitle="AETHER SYNTHESIZERS - MULTIMODAL ARRANGER"
      kicker={viewMeta.kicker}
      screenClassName={`multimodal-screen ${view}-screen`}
      title={viewMeta.title}
    >
      {view === 'upload' ? (
        <UploadView
          error={error}
          file={file}
          kind={kind}
          onBack={onBack}
          onFileSelect={onFileSelect}
          onGenerate={onGenerate}
          previewUrl={previewUrl}
        />
      ) : null}
      {view === 'analyzing' ? (
        <AnalyzingView
          file={file}
          kind={kind}
          onCancel={onCancelAnalysis}
          previewUrl={previewUrl}
          stageIndex={stageIndex}
        />
      ) : null}
      {view === 'results' ? (
        <ResultsView
          bpm={bpm}
          file={file}
          kind={kind}
          onApply={onApply}
          onBack={onBack}
          onBpmChange={onBpmChange}
          onSelectionChange={onSelectionChange}
          previewUrl={previewUrl}
          selections={selections}
        />
      ) : null}
    </HardwareFlowShell>
  );
}

// JSX component references are not marked as reads by this repository's lint parser.
void BpmControl;
void HardwareFlowShell;
void ChoiceChips;
void MediaPreview;
void UploadView;
void AnalyzingView;
void ResultsView;

export { MultimodalFlowScreen };
