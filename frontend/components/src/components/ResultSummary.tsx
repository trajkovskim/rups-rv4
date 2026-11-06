import type { ReactNode } from 'react';
import GameButton from './GameButton';
import styles from './ResultSummary.module.css';

export type QuestionResult = {
  prompt: ReactNode;
  submittedAnswer: ReactNode;
  correctAnswer: ReactNode;
  isCorrect: boolean;
  pointsEarned?: number;
  quality: 'good' | 'medium' | 'bad';
  distanceKm?: number;
};

export type ResultSummaryContent = {
  heading: ReactNode;
  pointsLabel: (maximumPoints: number) => ReactNode;
  resultMessage: (correctAnswers: number, totalQuestions: number, percentage: number) => ReactNode;
  correctLabel: ReactNode;
  partiallyCorrectLabel: ReactNode;
  incorrectLabel: ReactNode;
  reviewLabel: ReactNode;
  answersHeading: ReactNode;
  questionLabel: (questionNumber: number) => ReactNode;
  correctAnswerLabel: (answer: ReactNode) => ReactNode;
  pointsUnit: ReactNode;
  replayLabel: ReactNode;
};

export type ResultSummaryProps = {
  points: number;
  correctAnswers: number;
  totalQuestions: number;
  maxPointsPerQuestion: number;
  questionResults: QuestionResult[];
  onReplay: () => void;
  content: ResultSummaryContent;
  stat?: { label: ReactNode; value: ReactNode };
};

const ResultSummary = ({
  points,
  correctAnswers,
  totalQuestions,
  maxPointsPerQuestion,
  questionResults,
  onReplay,
  content,
  stat,
}: ResultSummaryProps) => {
  const percentage = totalQuestions === 0 ? 0 : Math.round((correctAnswers / totalQuestions) * 100);
  const maximumPoints = totalQuestions * maxPointsPerQuestion;

  return (
    <section className={styles.summary}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{content.heading}</p>
        <h1 className={styles.points}>{points}</h1>
        <p className={styles.pointsLabel}>{content.pointsLabel(maximumPoints)}</p>

        {stat && (
          <p className={styles.stat}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </p>
        )}

        <p className={styles.resultMessage}>
          {content.resultMessage(correctAnswers, totalQuestions, percentage)}
        </p>
      </header>

      <div className={styles.progressSection}>
        <div className={styles.progress}>
          {questionResults.map((result, index) => (
            <span
              key={index}
              className={
                result.quality === 'good'
                  ? styles.goodSegment
                  : result.quality === 'medium'
                    ? styles.mediumSegment
                    : styles.badSegment
              }
            />
          ))}
          {questionResults.length === 0 && <span className={styles.emptySegment} />}
        </div>

        <div className={styles.legend}>
          <span><i className={styles.goodDot} /> {content.correctLabel}</span>
          {questionResults.some((result) => result.quality === 'medium') && (
            <span><i className={styles.mediumDot} /> {content.partiallyCorrectLabel}</span>
          )}
          <span><i className={styles.badDot} /> {content.incorrectLabel}</span>
        </div>
      </div>

      <div className={styles.review}>
        <h2 className={styles.reviewTitle}>{content.answersHeading}</h2>

        <div className={styles.answers}>
          {questionResults.map((result, index) => {
            const qualityClass =
              result.quality === 'good'
                ? styles.questionGood
                : result.quality === 'medium'
                  ? styles.questionMedium
                  : styles.questionBad;

            const statusClass =
              result.quality === 'good'
                ? styles.goodLabel
                : result.quality === 'medium'
                  ? styles.mediumLabel
                  : styles.badLabel;

            const statusLabel =
              result.quality === 'good'
                ? content.correctLabel
                : result.quality === 'medium'
                  ? content.partiallyCorrectLabel
                  : content.incorrectLabel;

            const earnedPoints =
              result.pointsEarned ?? (result.isCorrect ? maxPointsPerQuestion : 0);

            const progressPercentage =
              maxPointsPerQuestion > 0
                ? Math.min(100, Math.max(0, (earnedPoints / maxPointsPerQuestion) * 100))
                : 0;

            const distanceClass =
              result.quality === 'good'
                ? styles.distanceGood
                : result.quality === 'medium'
                  ? styles.distanceMedium
                  : styles.distanceBad;

            const progressClass =
              result.quality === 'good'
                ? styles.cardProgressGood
                : result.quality === 'medium'
                  ? styles.cardProgressMedium
                  : styles.cardProgressBad;

            return (
              <article className={`${styles.questionResult} ${qualityClass}`} key={index}>
                <div className={styles.cardHeader}>
                  <span className={styles.questionNumber}>
                    {content.questionLabel(index + 1)}
                  </span>
                  <span className={statusClass}>{statusLabel}</span>
                </div>

                <p className={styles.prompt}>{result.prompt}</p>

                {typeof result.distanceKm === 'number' ? (
                  <p className={`${styles.distance} ${distanceClass}`}>
                    {result.quality === 'good' ? 'Razdalja:' : 'Zgrešil si za:'}{' '}
                    <strong>
                      {result.distanceKm.toLocaleString('sl-SI', {
                        maximumFractionDigits: 1,
                      })}{' '}
                      km
                    </strong>
                  </p>
                ) : (
                  <>
                    <p className={styles.submittedAnswer}>{result.submittedAnswer}</p>
                    {!result.isCorrect && (
                      <p className={styles.correctAnswer}>
                        {content.correctAnswerLabel(result.correctAnswer)}
                      </p>
                    )}
                  </>
                )}

                <div className={styles.cardScore}>
                  <strong>{earnedPoints}</strong>
                  <span>{content.pointsUnit}</span>
                </div>

                <div className={styles.cardProgress}>
                  <span
                    className={progressClass}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className={styles.actions}>
        <GameButton type="new-game" label={content.replayLabel} onClick={onReplay} />
      </div>
    </section>
  );
};

export default ResultSummary;