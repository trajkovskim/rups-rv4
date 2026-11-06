import styles from './Leaderboards.module.css';
import type { LeaderboardTab } from './leaderboardTypes';

type LeaderboardTabsProps = {
  tabs: readonly LeaderboardTab[];
  activeTabId: string;
  panelId: string;
  label: string;
  onTabChange: (tabId: string) => void;
};

const LeaderboardTabs = ({
  tabs,
  activeTabId,
  panelId,
  label,
  onTabChange,
}: LeaderboardTabsProps) => (
  <div className={styles.tabs} role="tablist" aria-label={label}>
    {tabs.map((tab, index) => (
      <button
        aria-controls={panelId}
        aria-selected={tab.id === activeTabId}
        className={styles.tab}
        id={`${panelId}-tab-${index}`}
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        onKeyDown={(event) => {
          const nextIndex =
            event.key === 'ArrowRight'
              ? (index + 1) % tabs.length
              : event.key === 'ArrowLeft'
                ? (index - 1 + tabs.length) % tabs.length
                : event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? tabs.length - 1
                    : -1;
          if (nextIndex < 0) return;
          event.preventDefault();
          const nextTab = tabs[nextIndex];
          event.currentTarget.parentElement
            ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
            .item(nextIndex)
            ?.focus();
          onTabChange(nextTab.id);
        }}
        role="tab"
        tabIndex={tab.id === activeTabId ? 0 : -1}
        type="button"
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default LeaderboardTabs;
