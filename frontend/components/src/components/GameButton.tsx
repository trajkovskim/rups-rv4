import type { ReactNode } from 'react';
import styles from './GameButton.module.css';

export type GameButtonType = 'start' | 'pause' | 'stop' | 'new-game' | 'resume' | 'submit' | 'back' | 'next' | 'help';

export type GameButtonProps = {
  type: GameButtonType;
  onClick: () => void;
  disabled?: boolean;
  label?: ReactNode;
};

const GameButton = ({ type, onClick, disabled = false, label }: GameButtonProps) => {
  const hasLabel = label !== undefined;

  const icon = (
    <>
      {(type === 'start' || type === 'resume') && (
        <svg viewBox="0 0 24 24">
          <path d="M6.5 5.5v13L17.5 12 6.5 5.5Z" fill="currentColor" />
        </svg>
      )}
      {type === 'pause' && (
        <svg viewBox="0 0 24 24">
          <path d="M7 5h4v14H7zM15 5h4v14h-4z" fill="currentColor" />
        </svg>
      )}
      {type === 'stop' && (
        <svg viewBox="0 0 24 24">
          <path d="M7 7h10v10H7z" fill="currentColor" />
        </svg>
      )}
      {type === 'new-game' && (
        <svg viewBox="0 0 24 24">
          <path
            d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.93 9h-2.02A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35Z"
            fill="currentColor"
          />
        </svg>
      )}
      {type === 'submit' && (
        <svg viewBox="0 0 24 24">
          <path d="m5 12 4 4L19 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
        </svg>
      )}
      {type === 'back' && (
        <svg viewBox="0 0 24 24">
          <path d="m15 18-6-6 6-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
        </svg>
      )}
      {type === 'next' && (
        <svg viewBox="0 0 24 24">
          <path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
        </svg>
      )}
      {type === 'help' && (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M9.8 9a2.25 2.25 0 1 1 3.8 1.6c-.9.8-1.6 1.2-1.6 2.4M12 16.5v.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </svg>
      )}
    </>
  );

  const variantClass = type === 'new-game' ? styles.newGame : styles[type];
  return (
    <button
      className={`${styles.button} ${variantClass} ${hasLabel ? styles.withLabel : ''}`}
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      {hasLabel && <span>{label}</span>}
    </button>
  );
};

export default GameButton;
