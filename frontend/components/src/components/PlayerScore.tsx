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
        <div className={styles.scoreHeader}>
          <span className={styles.playerName}>{name}</span>
        </div>

        <div className={styles.points}>
          <span className={styles.scoreLabel}>{pointsLabel}</span>
          <strong className={styles.scoreValue}>
            {points.toLocaleString('sl-SI')}
          </strong>
        </div>
      </aside>
    </FloatingPanel>
  );
};

export default PlayerScore;