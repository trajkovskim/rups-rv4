import type { ReactNode } from 'react';

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
  tabsLabel?: string;
};

export type LeaderboardTab = {
  id: string;
  label: ReactNode;
};

type LeaderboardsBaseProps = {
  entries: LeaderboardEntry[];
  currentPlayerName: string;
  content: LeaderboardContent;
  isLoading?: boolean;
  loadingLabel?: ReactNode;
};

export type LeaderboardsProps = LeaderboardsBaseProps &
  (
    | {
        tabs: readonly LeaderboardTab[];
        activeTabId: string;
        onTabChange: (tabId: string) => void;
      }
    | {
        tabs?: never;
        activeTabId?: never;
        onTabChange?: never;
      }
  );
