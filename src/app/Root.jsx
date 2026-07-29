import {
  createElement,
  useEffect,
  useState,
} from 'react';
import App from './App.jsx';
import {
  CURRENT_GENRE_ID,
  GENRE_OPTIONS,
  MULTIMODAL_GENRE_ID,
} from './genreOptions.js';
import { GenreSelectScreen } from './components/GenreSelectScreen.jsx';
import { MultimodalFlowScreen } from './components/MultimodalFlowScreen.jsx';
import {
  createInitialRecommendationSelections,
  createMultimodalRecommendationAppState,
  validateMultimodalMediaFile,
} from './multimodalRecommendation.js';
import { RECOMMENDED_BPM } from '../domain/bpm.js';
import useMusicStore from '../store/useMusicStore.js';

const ROOT_VIEWS = Object.freeze({
  ANALYZING: 'analyzing',
  ARRANGER: 'arranger',
  GENRE: 'genre',
  RESULTS: 'results',
  UPLOAD: 'upload',
});

function Root() {
  const [view, setView] = useState(ROOT_VIEWS.GENRE);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaKind, setMediaKind] = useState(null);
  const [mediaError, setMediaError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysisStageIndex, setAnalysisStageIndex] = useState(0);
  const [bpm, setBpm] = useState(RECOMMENDED_BPM);
  const [selections, setSelections] = useState(createInitialRecommendationSelections);

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (view !== ROOT_VIEWS.ANALYZING) return undefined;

    const timers = [
      window.setTimeout(() => setAnalysisStageIndex(1), 900),
      window.setTimeout(() => setAnalysisStageIndex(2), 1800),
      window.setTimeout(() => setView(ROOT_VIEWS.RESULTS), 2700),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [view]);

  const handleGenreEnter = (genreId) => {
    if (genreId === CURRENT_GENRE_ID) {
      setView(ROOT_VIEWS.ARRANGER);
      return;
    }
    if (genreId === MULTIMODAL_GENRE_ID) {
      setView(ROOT_VIEWS.UPLOAD);
    }
  };

  const handleFileSelect = (file) => {
    const validation = validateMultimodalMediaFile(file);
    setMediaError(validation.error);
    if (!validation.valid) return;

    const nextPreviewUrl = URL.createObjectURL(file);
    setMediaFile(file);
    setMediaKind(validation.kind);
    setPreviewUrl(nextPreviewUrl);
  };

  const handleStartAnalysis = () => {
    if (!mediaFile) return;
    setAnalysisStageIndex(0);
    setView(ROOT_VIEWS.ANALYZING);
  };

  const handleApplyRecommendation = () => {
    useMusicStore.setState(createMultimodalRecommendationAppState({ bpm }));
    setView(ROOT_VIEWS.ARRANGER);
  };

  const handleSelectionChange = (group, value) => {
    setSelections((current) => ({
      ...current,
      [group]: value,
    }));
  };

  const handleBackToGenre = () => {
    setMediaFile(null);
    setMediaKind(null);
    setMediaError(null);
    setPreviewUrl(null);
    setView(ROOT_VIEWS.GENRE);
  };

  if (view === ROOT_VIEWS.GENRE) {
    return createElement(GenreSelectScreen, {
      currentGenreId: CURRENT_GENRE_ID,
      onGenreEnter: handleGenreEnter,
      options: GENRE_OPTIONS,
    });
  }

  if (
    view === ROOT_VIEWS.UPLOAD
    || view === ROOT_VIEWS.ANALYZING
    || view === ROOT_VIEWS.RESULTS
  ) {
    return createElement(MultimodalFlowScreen, {
      bpm,
      error: mediaError,
      file: mediaFile,
      kind: mediaKind,
      onApply: handleApplyRecommendation,
      onBack: view === ROOT_VIEWS.UPLOAD
        ? handleBackToGenre
        : () => setView(ROOT_VIEWS.UPLOAD),
      onBpmChange: setBpm,
      onCancelAnalysis: () => setView(ROOT_VIEWS.UPLOAD),
      onFileSelect: handleFileSelect,
      onGenerate: handleStartAnalysis,
      onSelectionChange: handleSelectionChange,
      previewUrl,
      selections,
      stageIndex: analysisStageIndex,
      view,
    });
  }

  return createElement(App);
}

export default Root;
