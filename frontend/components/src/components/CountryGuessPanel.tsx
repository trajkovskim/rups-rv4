import { useRef, useState, type ReactNode } from 'react';
import GameButton from './GameButton';
import questionStyles from './QuestionPanel.module.css';
import styles from './CountryGuessPanel.module.css';

export type CountryGuessPanelProps = {
  prompt: ReactNode;
  questionLabel?: ReactNode;
  inputLabel: string;
  placeholder?: string;
  submitLabel?: ReactNode;
  skipLabel?: ReactNode;
  // Zadnji napačen odgovor; panel je rdeč, dokler je ta odgovor še vpisan
  wrongAnswer?: string | null;
  wrongAnswerMessage?: ReactNode;
  previousResult?: { message: ReactNode; isCorrect: boolean } | null;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
};

const CountryGuessPanel = ({
  prompt,
  questionLabel,
  inputLabel,
  placeholder,
  submitLabel,
  skipLabel,
  wrongAnswer,
  wrongAnswerMessage,
  previousResult,
  onSubmit,
  onSkip,
}: CountryGuessPanelProps) => {
  const [answer, setAnswer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmedAnswer = answer.trim();
  const isWrong = Boolean(wrongAnswer) && wrongAnswer === trimmedAnswer;

  const submit = () => {
    if (!trimmedAnswer) return;
    onSubmit(trimmedAnswer);
    // Po napačnem odgovoru lahko igralec takoj tipka naprej čez staro besedilo
    inputRef.current?.focus();
    inputRef.current?.select();
  };

  return (
    <section className={`${questionStyles.panel} ${styles.panel} ${isWrong ? questionStyles.incorrect : ''}`}>
      <div className={questionStyles.content}>
        {questionLabel && <span className={questionStyles.eyebrow}>{questionLabel}</span>}
        <h2 className={questionStyles.question}>{prompt}</h2>
        {isWrong ? (
          <p className={`${styles.message} ${styles.wrong}`} role="status">{wrongAnswerMessage}</p>
        ) : (
          previousResult && (
            <p className={`${styles.message} ${previousResult.isCorrect ? styles.right : styles.wrong}`} role="status">
              {previousResult.message}
            </p>
          )
        )}
      </div>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          aria-label={inputLabel}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submit();
            }
          }}
        />
        <GameButton type="submit" disabled={!trimmedAnswer} onClick={submit} label={submitLabel} />
        <GameButton type="next" onClick={onSkip} label={skipLabel} />
      </form>
    </section>
  );
};

export default CountryGuessPanel;
