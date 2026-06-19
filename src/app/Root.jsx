import { createElement, useState } from 'react';
import App from './App.jsx';
import {
  CURRENT_GENRE_ID,
  GENRE_OPTIONS,
} from './genreOptions.js';
import { GenreSelectScreen } from './components/GenreSelectScreen.jsx';

function Root() {
  const [selectedGenreId, setSelectedGenreId] = useState(null);

  const handleGenreEnter = (genreId) => {
    if (genreId !== CURRENT_GENRE_ID) return;
    setSelectedGenreId(genreId);
  };

  if (selectedGenreId !== CURRENT_GENRE_ID) {
    return createElement(GenreSelectScreen, {
      currentGenreId: CURRENT_GENRE_ID,
      onGenreEnter: handleGenreEnter,
      options: GENRE_OPTIONS,
    });
  }

  return createElement(App);
}

export default Root;
