import { type ReactNode } from 'react';
import FloatingPanel from './FloatingPanel';
import styles from './Leaderboards.module.css';

export type LeaderboardEntry = {
  name: string;
  displayName?: ReactNode;
  score: number;
  rank: number;
};

export type LeaderboardContent = {
  eyebrow: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
  periodLabel: ReactNode;
  scoreNote: ReactNode;
  youLabel: ReactNode;
  pointsLabel: ReactNode;
  emptyState: ReactNode;
  currentPlayerSummary: (rank: number) => ReactNode;
};

export type LeaderboardsProps = {
  entries: LeaderboardEntry[];
  currentPlayerName: string;
  content: LeaderboardContent;
};

const MEDALS = ['🥇', '🥈', '🥉'];

const Leaderboards = ({ entries, currentPlayerName, content }: LeaderboardsProps) => {
  const currentPlayer = entries.find((entry) => entry.name === currentPlayerName);

  const leaderboard = (
    <section className={styles.leaderboard}>
        <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{content.eyebrow}</p>
          <h1 className={styles.title}>
            {content.title}
          </h1>
          <p className={styles.subtitle}>{content.subtitle}</p>
        </div>
        <span className={styles.weekBadge}>{content.periodLabel}</span>
      </header>

      <div className={styles.scoreNote}>
        <span className={styles.scoreIcon}>
          ✦
        </span>
        {content.scoreNote}
      </div>

      <ol className={styles.entries}>
        {entries.map((entry) => {
          const isCurrentPlayer = entry.name === currentPlayerName;

          return (
            <li
              className={[
                styles.entry,
                entry.rank <= 3 ? styles[`entry--top-${entry.rank}`] : '',
                isCurrentPlayer ? styles['entry--current'] : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={`${entry.rank}-${entry.name}`}
            >
              <span className={styles.rank}>
                {entry.rank <= 3 ? (
                  <span>
                    {MEDALS[entry.rank - 1]}
                  </span>
                ) : (
                  entry.rank
                )}
              </span>
              <span className={styles.avatar}>
                {entry.name.slice(0, 1).toUpperCase()}
              </span>
              <span className={styles.playerName}>
                {entry.displayName ?? entry.name}
                {isCurrentPlayer && <span className={styles.youBadge}>{content.youLabel}</span>}
              </span>
              <span className={styles.points}>
                {entry.score.toLocaleString()} <span>{content.pointsLabel}</span>
              </span>
            </li>
          );
        })}
        {entries.length === 0 && (
          <li className={styles.emptyState}>{content.emptyState}</li>
        )}
      </ol>

      {currentPlayer && (
        <footer className={styles.footer}>
          <span className={styles.footerStar}>
            ★
          </span>
          <span>{content.currentPlayerSummary(currentPlayer.rank)}</span>
        </footer>
      )}
    </section>
  );

  return (
    <FloatingPanel position="top-right" mobilePosition="bottom-right" size="wide">
      {leaderboard}
    </FloatingPanel>
  );
};

export default Leaderboards;
