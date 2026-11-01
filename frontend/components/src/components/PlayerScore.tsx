import type { ReactNode } from 'react';
import styles from './PlayerScore.module.css';
import FloatingPanel from './FloatingPanel';

export type PlayerScoreProps = {
  name: ReactNode;
  points: number;
  pointsLabel: ReactNode;
};

const PlayerScore = ({ name, points, pointsLabel }: PlayerScoreProps) => {
  return (
    <FloatingPanel position="top-right">
      <aside className={styles.score}>
        <span className={styles.playerName}>{name}</span>
        <div className={styles.points}>
          <span className={styles.scoreLabel}>{pointsLabel}</span>
          <strong className={styles.scoreValue}>{points}</strong>
        </div>
      </aside>
    </FloatingPanel>
  );
};

export default PlayerScore;
