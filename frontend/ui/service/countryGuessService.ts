import {
  checkCountryGuess as checkApiCountryGuess,
  createCountryGuessGame as createApiCountryGuessGame,
  finishCountryGuessGame as finishApiCountryGuessGame,
  pauseCountryGuessGame as pauseApiCountryGuessGame,
  resumeCountryGuessGame as resumeApiCountryGuessGame,
  skipCountry as skipApiCountry,
} from "../api/apiCountryGuessService";
import {
  checkMockCountryGuess,
  createMockCountryGuessGame,
  finishMockCountryGuessGame,
  pauseMockCountryGuessGame,
  resumeMockCountryGuessGame,
  skipMockCountry,
} from "../api/mockCountryGuess";

const service = process.env.NEXT_PUBLIC_USE_MOCK_QUESTIONS === "true"
  ? {
      checkCountryGuess: checkMockCountryGuess,
      createCountryGuessGame: createMockCountryGuessGame,
      finishCountryGuessGame: finishMockCountryGuessGame,
      pauseCountryGuessGame: pauseMockCountryGuessGame,
      resumeCountryGuessGame: resumeMockCountryGuessGame,
      skipCountry: skipMockCountry,
    }
  : {
      checkCountryGuess: checkApiCountryGuess,
      createCountryGuessGame: createApiCountryGuessGame,
      finishCountryGuessGame: finishApiCountryGuessGame,
      pauseCountryGuessGame: pauseApiCountryGuessGame,
      resumeCountryGuessGame: resumeApiCountryGuessGame,
      skipCountry: skipApiCountry,
    };

export const {
  checkCountryGuess,
  createCountryGuessGame,
  finishCountryGuessGame,
  pauseCountryGuessGame,
  resumeCountryGuessGame,
  skipCountry,
} = service;
