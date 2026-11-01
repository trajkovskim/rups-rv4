import type { LeaderboardContent } from './leaderboardTypes';
import styles from './Leaderboards.module.css';

type LeaderboardHeaderProps = Pick<
  LeaderboardContent,
  'eyebrow' | 'title' | 'subtitle' | 'periodLabel'
>;

const LeaderboardHeader = ({
  eyebrow,
  title,
  subtitle,
  periodLabel,
}: LeaderboardHeaderProps) => (
  <header className={styles.header}>
    <div>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
    <span className={styles.weekBadge}>{periodLabel}</span>
  </header>
);

export default LeaderboardHeader;
