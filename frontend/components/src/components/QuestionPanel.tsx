import { useEffect, type ReactNode } from 'react';
import GameButton from './GameButton';
import styles from './QuestionPanel.module.css';

export type QuestionFeedback = 'correct' | 'incorrect' | 'close';

export type QuestionPanelQuestion = {
  prompt: ReactNode;
  hint?: ReactNode;
};

export type QuestionPanelProps = {
  question?: QuestionPanelQuestion;
  selectedAnswer?: string;
  onSubmit: (answer: string) => void;
  feedback?: QuestionFeedback;
  onNext?: () => void;
  questionLabel?: ReactNode;
  submitLabel?: ReactNode;
  nextLabel?: ReactNode;
};

type QuestionContentProps = Pick<QuestionPanelProps, 'question' | 'questionLabel'> & {
  footer?: ReactNode;
};

const QuestionContent = ({ question, questionLabel, footer }: QuestionContentProps) => (
  <div className={styles.content}>
    {questionLabel && <span className={styles.eyebrow}>{questionLabel}</span>}
    <h2 className={styles.question}>{question?.prompt}</h2>
    {question?.hint && <p className={styles.hint}>{question.hint}</p>}
    {footer}
  </div>
);

const QuestionPanel = ({
  question,
  selectedAnswer,
  onSubmit,
  feedback,
  onNext,
  questionLabel,
  submitLabel,
  nextLabel,
}: QuestionPanelProps) => {
  const isAnswerSubmitted = feedback !== undefined;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat) return;

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest('input, textarea, select, button, a, [role="button"]'))
      ) {
        return;
      }

      event.preventDefault();

      if (isAnswerSubmitted) {
        onNext?.();
      } else if (question && selectedAnswer) {
        onSubmit(selectedAnswer);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswerSubmitted, onNext, onSubmit, question, selectedAnswer]);

  return (
    <section className={`${styles.panel} ${feedback ? styles[feedback] : ''}`}>
      <QuestionContent question={question} questionLabel={questionLabel} />
      {isAnswerSubmitted ? (
        onNext && <GameButton type="next" onClick={onNext} label={nextLabel} />
      ) : (
        <GameButton
          type="submit"
          disabled={!selectedAnswer || !question}
          onClick={() => question && selectedAnswer && onSubmit(selectedAnswer)}
          label={submitLabel}
        />
      )}
    </section>
  );
};

export default QuestionPanel;
