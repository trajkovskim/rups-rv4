import type { ReactNode } from 'react';
import CardsModal from './CardsModal';
import styles from './GameplayInstructions.module.css';

export type GameplayInstructionStep = {
  title: ReactNode;
  description: ReactNode;
};

export type GameplayInstructionsProps = {
  isOpen: boolean;
  onClose: () => void;
  backLabel: Exclude<ReactNode, boolean | null | undefined>;
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  steps: GameplayInstructionStep[];
};

const GameplayInstructions = ({
  isOpen,
  onClose,
  backLabel,
  eyebrow,
  title,
  description,
  steps,
}: GameplayInstructionsProps) => (
  <CardsModal
    isOpen={isOpen}
    eyebrow={eyebrow}
    title={title}
    description={description}
    backButton={{ onClick: onClose, label: backLabel }}
  >
    <ol className={styles.steps}>
      {steps.map((step, index) => (
        <li key={index}>
          <span className={styles.stepNumber}>{index + 1}</span>
          <span>
            <strong>{step.title}</strong>
            <span className={styles.stepDescription}>{step.description}</span>
          </span>
        </li>
      ))}
    </ol>
  </CardsModal>
);

export default GameplayInstructions;
