import {
  checkQuestionAnswer as checkApiQuestionAnswer,
  getLeaderboard as getApiLeaderboard,
  getQuestionsForType as getApiQuestionsForType,
} from "../api/apiQuestionsService";
import {
  checkMockQuestionAnswer,
  getMockLeaderboard,
  getMockQuestionsForType,
} from "../api/mockQuestions";
import type {
  CheckQuestionAnswer,
  LeaderboardEntry,
  Question,
  QuestionAnswerFeedback,
  QuestionType,
} from "../api/types";

console.log('mock', process.env.NEXT_PUBLIC_USE_MOCK_QUESTIONS);

const service = process.env.NEXT_PUBLIC_USE_MOCK_QUESTIONS === "true"
  ? {
      checkQuestionAnswer: checkMockQuestionAnswer,
      getLeaderboard: getMockLeaderboard,
      getQuestionsForType: getMockQuestionsForType,
    }
  : {
      checkQuestionAnswer: checkApiQuestionAnswer,
      getLeaderboard: getApiLeaderboard,
      getQuestionsForType: getApiQuestionsForType,
    };

export const checkQuestionAnswer = (
  answer: CheckQuestionAnswer,
): Promise<QuestionAnswerFeedback> => service.checkQuestionAnswer(answer);

export const getLeaderboard = (gameModeId: number): Promise<LeaderboardEntry[]> =>
  service.getLeaderboard(gameModeId);

export const getQuestionsForType = (
  type: QuestionType,
): Promise<Question[]> => service.getQuestionsForType(type);
