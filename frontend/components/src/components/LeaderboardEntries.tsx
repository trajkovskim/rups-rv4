import type { ReactNode } from 'react';
import type { LeaderboardContent, LeaderboardEntry } from './leaderboardTypes';
import styles from './Leaderboards.module.css';

const MEDALS = ['🥇', '🥈', '🥉'];

type LeaderboardEntriesProps = {
  entries: LeaderboardEntry[];
  currentPlayerName: string;
  content: LeaderboardContent;
  isLoading: boolean;
  loadingLabel: ReactNode;
};

const LeaderboardEntries = ({
  entries,
  currentPlayerName,
  content,
  isLoading,
  loadingLabel,
}: LeaderboardEntriesProps) => {
  const currentPlayer = entries.find((entry) => entry.name === currentPlayerName);

  return (
    <>
      <div className={styles.scoreNote}>
        <span className={styles.scoreIcon}>✦</span>
        {content.scoreNote}
      </div>

      <ol className={styles.entries}>
        {isLoading ? (
          <li className={styles.emptyState}>{loadingLabel}</li>
        ) : entries.length > 0 ? (
          entries.map((entry) => (
            <LeaderboardEntryRow
              content={content}
              currentPlayerName={currentPlayerName}
              entry={entry}
              key={`${entry.rank}-${entry.name}`}
            />
          ))
        ) : (
          <li className={styles.emptyState}>{content.emptyState}</li>
        )}
      </ol>

      {currentPlayer && !isLoading && (
        <footer className={styles.footer}>
          <span className={styles.footerStar}>★</span>
          <span>{content.currentPlayerSummary(currentPlayer.rank)}</span>
        </footer>
      )}
    </>
  );
};

type LeaderboardEntryRowProps = {
  entry: LeaderboardEntry;
  currentPlayerName: string;
  content: LeaderboardContent;
};

const LeaderboardEntryRow = ({
  entry,
  currentPlayerName,
  content,
}: LeaderboardEntryRowProps) => {
  const isCurrentPlayer = entry.name === currentPlayerName;
  const rankClass =
    entry.rank <= 3 ? styles[`entry--top-${entry.rank}`] : '';

  return (
    <li
      className={[styles.entry, rankClass, isCurrentPlayer ? styles['entry--current'] : '']
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.rank}>
        {entry.rank <= 3 ? MEDALS[entry.rank - 1] : entry.rank}
      </span>
      <span className={styles.avatar}>{entry.name.slice(0, 1).toUpperCase()}</span>
      <span className={styles.playerName}>
        {entry.displayName ?? entry.name}
        {isCurrentPlayer && <span className={styles.youBadge}>{content.youLabel}</span>}
      </span>
      <span className={styles.points}>
        {entry.score.toLocaleString()} <span>{content.pointsLabel}</span>
      </span>
    </li>
  );
};

export default LeaderboardEntries;
