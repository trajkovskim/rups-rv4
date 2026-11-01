import type { ReactNode } from 'react';
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
