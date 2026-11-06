import { useId } from 'react';
import FloatingPanel from './FloatingPanel';
import LeaderboardEntries from './LeaderboardEntries';
import LeaderboardHeader from './LeaderboardHeader';
import LeaderboardTabs from './LeaderboardTabs';
import type { LeaderboardsProps } from './leaderboardTypes';
import styles from './Leaderboards.module.css';

export type {
  LeaderboardContent,
  LeaderboardEntry,
  LeaderboardTab,
  LeaderboardsProps,
} from './leaderboardTypes';

const Leaderboards = ({
  entries,
  currentPlayerName,
  content,
  tabs,
  activeTabId,
  onTabChange,
  isLoading = false,
  loadingLabel = 'Loading leaderboard…',
}: LeaderboardsProps) => {
  const panelId = useId();
  const hasTabs = tabs !== undefined && tabs.length > 0;
  const activeTabIndex = hasTabs
    ? tabs.findIndex((tab) => tab.id === activeTabId)
    : -1;

  return (
    <FloatingPanel position="top-right" mobilePosition="bottom-right" size="wide">
      <section className={styles.leaderboard}>
        <LeaderboardHeader
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          periodLabel={content.periodLabel}
        />
        {hasTabs && onTabChange && activeTabId !== undefined && (
          <LeaderboardTabs
            tabs={tabs}
            activeTabId={activeTabId}
            panelId={panelId}
            label={content.tabsLabel ?? 'Leaderboard categories'}
            onTabChange={onTabChange}
          />
        )}
        <div
          aria-labelledby={
            activeTabIndex >= 0
              ? `${panelId}-tab-${activeTabIndex}`
              : undefined
          }
          aria-busy={isLoading}
          className={styles.panel}
          id={panelId}
          role={hasTabs ? 'tabpanel' : undefined}
        >
          <LeaderboardEntries
            entries={entries}
            currentPlayerName={currentPlayerName}
            content={content}
            isLoading={isLoading}
            loadingLabel={loadingLabel}
          />
        </div>
      </section>
    </FloatingPanel>
  );
};

export default Leaderboards;
