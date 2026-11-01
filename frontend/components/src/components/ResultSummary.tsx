import type { ReactNode } from 'react';
import GameButton from './GameButton';
import styles from './ResultSummary.module.css';

export type QuestionResult = {
  prompt: ReactNode;
  submittedAnswer: ReactNode;
  correctAnswer: ReactNode;
  isCorrect: boolean;
  pointsEarned?: number;
};

export type ResultSummaryContent = {
  heading: ReactNode;
  pointsLabel: (maximumPoints: number) => ReactNode;
  resultMessage: (correctAnswers: number, totalQuestions: number, percentage: number) => ReactNode;
  correctLabel: ReactNode;
  incorrectLabel: ReactNode;
  reviewLabel: ReactNode;
  answersHeading: ReactNode;
  questionLabel: (questionNumber: number) => ReactNode;
  correctAnswerLabel: (answer: ReactNode) => ReactNode;
  pointsUnit: ReactNode;
  replayLabel: Exclude<ReactNode, boolean | null | undefined>;
};

export type ResultSummaryProps = {
  points: number;
  correctAnswers: number;
  totalQuestions: number;
  pointsPerCorrectAnswer: number;
  questionResults: QuestionResult[];
  onReplay: () => void;
  content: ResultSummaryContent;
};

const ResultSummary = ({
  points,
  correctAnswers,
  totalQuestions,
  pointsPerCorrectAnswer,
  questionResults,
  onReplay,
  content,
}: ResultSummaryProps) => {
  const percentage = totalQuestions === 0 ? 0 : Math.round((correctAnswers / totalQuestions) * 100);
  const maximumPoints = totalQuestions * pointsPerCorrectAnswer;

  return (
    <section className={styles.summary}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{content.heading}</p>
        <h1 className={styles.points}>{points}</h1>
        <p className={styles.pointsLabel}>{content.pointsLabel(maximumPoints)}</p>
        <p className={styles.resultMessage}>{content.resultMessage(correctAnswers, totalQuestions, percentage)}</p>
      </header>

      <div className={styles.progressSection}>
        <div className={styles.progress}>
          {questionResults.map((result, index) => (
            <span
              key={index}
              className={result.isCorrect ? styles.correctSegment : styles.incorrectSegment}
            />
          ))}
          {questionResults.length === 0 && <span className={styles.emptySegment} />}
        </div>
        <div className={styles.legend}>
          <span><i className={styles.correctDot} /> {content.correctLabel}</span>
          <span><i className={styles.incorrectDot} /> {content.incorrectLabel}</span>
        </div>
      </div>

      <div className={styles.review}>
        <h2 className={styles.reviewTitle}>{content.answersHeading}</h2>
        <div className={styles.answers}>
          {questionResults.map((result, index) => (
            <article
              className={`${styles.questionResult} ${result.isCorrect ? styles.questionCorrect : styles.questionIncorrect}`}
              key={index}
            >
              <div className={styles.cardHeader}>
                <span className={styles.questionNumber}>{content.questionLabel(index + 1)}</span>
                <span className={result.isCorrect ? styles.correctLabel : styles.incorrectLabel}>
                  {result.isCorrect ? content.correctLabel : content.reviewLabel}
                </span>
              </div>
              <p className={styles.prompt}><>{result.prompt}</></p>
              <p className={styles.submittedAnswer}><>{result.submittedAnswer}</></p>
              {!result.isCorrect && (
                <p className={styles.correctAnswer}>
                  <>{content.correctAnswerLabel(result.correctAnswer)}</>
                </p>
              )}
              <div className={styles.cardScore}>
                <strong>{result.pointsEarned ?? (result.isCorrect ? pointsPerCorrectAnswer : 0)}</strong>
                <span>{content.pointsUnit}</span>
              </div>
              <div className={styles.cardProgress}>
                <span className={result.isCorrect ? styles.cardProgressCorrect : styles.cardProgressIncorrect} />
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <GameButton type="new-game" label={content.replayLabel} onClick={onReplay} />
      </div>
    </section>
  );
};

export default ResultSummary;
