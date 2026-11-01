import { FloatingPanel } from '@meridiani/components';
import styles from './PointsAward.module.css';

type PointsAwardProps = {
  points: number;
};

const PointsAward = ({ points }: PointsAwardProps) => {
  if (points <= 0) return null;

  return (
    <FloatingPanel
      position="top-right"
      style={{
        top: 'calc(var(--panel-gutter, 1.25rem) + 5.2rem)',
        pointerEvents: 'none',
        zIndex: 3,
      }}
    >
      <span className={styles.points} aria-live="polite">
        +{points}
      </span>
    </FloatingPanel>
  );
};

export default PointsAward;
