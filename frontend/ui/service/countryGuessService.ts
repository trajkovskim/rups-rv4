import {
  checkMockCountryGuess,
  getMockCountryGuessQuestions,
} from "../api/mockCountryGuess";
import type {
  CheckCountryGuess,
  CountryGuessFeedback,
  CountryGuessQuestion,
} from "../api/types";

// Za zdaj samo fiksni podatki; API se priklopi tukaj, ko bo igra v bazi
export const getCountryGuessQuestions = (): Promise<CountryGuessQuestion[]> =>
  getMockCountryGuessQuestions();

export const checkCountryGuess = (guess: CheckCountryGuess): Promise<CountryGuessFeedback> =>
  checkMockCountryGuess(guess);
