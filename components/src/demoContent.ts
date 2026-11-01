import type { ReactNode } from 'react';
import { createElement, Fragment } from 'react';
import type { EuropeMapDisplay } from './components/EuropeMap';
import type { LeaderboardContent } from './components/Leaderboards';
import type { QuestionPanelQuestion } from './components/QuestionPanel';

type DemoGameMode = {
  id: number;
  name: string;
  description: ReactNode;
  icon: ReactNode;
  display: EuropeMapDisplay;
};

export const GAME_MODES = [
  {
    id: 1,
    name: 'Capital Cities',
    description: 'Explore the capitals of Europe.',
    icon: '🏙️',
    display: { city: true },
  },
  {
    id: 2,
    name: 'Countries & Regions',
    description: 'Discover countries and their regions.',
    icon: '🗺️',
    display: { country: true },
  },
  {
    id: 3,
    name: 'History & Fun Facts',
    description: 'Learn surprising stories from across Europe.',
    icon: '✨',
    display: { country: true, city: true },
  },
] as const satisfies readonly DemoGameMode[];

export type GameModeName = (typeof GAME_MODES)[number]['name'];

type DemoQuestion = QuestionPanelQuestion & {
  country: string;
  fact: string;
};

export const QUESTIONS: Record<GameModeName, DemoQuestion[]> = {
  'Capital Cities': [
    {
      prompt: 'Which country is home to Paris?',
      hint: 'Look for the country in western Europe.',
      country: 'France',
      fact: 'The Eiffel Tower was built for the 1889 World’s Fair in Paris.',
    },
    {
      prompt: 'Which country is home to Rome?',
      hint: 'Look for the country on the Mediterranean Sea.',
      country: 'Italy',
      fact: 'Rome was the center of the ancient Roman Empire.',
    },
    {
      prompt: 'Which country is home to Lisbon?',
      hint: 'Look to the western edge of the Iberian Peninsula.',
      country: 'Portugal',
      fact: 'Lisbon is one of the oldest cities in western Europe.',
    },
    {
      prompt: 'Which country is home to Prague?',
      hint: 'Look in central Europe.',
      country: 'Czechia',
      fact: 'Prague’s historic Charles Bridge crosses the Vltava River.',
    },
    {
      prompt: 'Which country is home to Athens?',
      hint: 'Look in southeastern Europe.',
      country: 'Greece',
      fact: 'Ancient Athens is often called the birthplace of democracy.',
    },
  ],
  'Countries & Regions': [
    {
      prompt: 'Find Norway on the map.',
      hint: 'Look along the western side of the Scandinavian Peninsula.',
      country: 'Norway',
      fact: 'Norway’s coastline is famous for its deep fjords.',
    },
    {
      prompt: 'Find Croatia on the map.',
      hint: 'Look along the Adriatic Sea.',
      country: 'Croatia',
      fact: 'Croatia has more than a thousand islands in the Adriatic Sea.',
    },
    {
      prompt: 'Find Ireland on the map.',
      hint: 'Look on the island west of Great Britain.',
      country: 'Ireland',
      fact: 'Ireland is often called the Emerald Isle because of its green landscape.',
    },
    {
      prompt: 'Find Poland on the map.',
      hint: 'Look in central Europe, east of Germany.',
      country: 'Poland',
      fact: 'The historic center of Kraków is a UNESCO World Heritage Site.',
    },
    {
      prompt: 'Find Hungary on the map.',
      hint: 'Look in central Europe, in the Carpathian Basin.',
      country: 'Hungary',
      fact: 'The Danube divides Hungary’s capital, Budapest, into Buda and Pest.',
    },
  ],
  'History & Fun Facts': [
    {
      prompt: 'Which country is home to the Colosseum?',
      hint: 'Look for the country that contains Rome.',
      country: 'Italy',
      fact: 'The Colosseum opened nearly 2,000 years ago and hosted public spectacles.',
    },
    {
      prompt: 'In which country can you visit the Acropolis of Athens?',
      hint: 'Look in southeastern Europe.',
      country: 'Greece',
      fact: 'The Parthenon on the Acropolis was dedicated to the goddess Athena.',
    },
    {
      prompt: 'Which country is home to Bran Castle?',
      hint: 'Look in southeastern Europe, north of Bulgaria.',
      country: 'Romania',
      fact: 'Bran Castle is often linked with Dracula in popular culture.',
    },
    {
      prompt: 'Which country is home to the Alhambra?',
      hint: 'Look on the Iberian Peninsula.',
      country: 'Spain',
      fact: 'The Alhambra in Granada is a celebrated palace and fortress complex.',
    },
    {
      prompt: 'In which country did the Berlin Wall stand?',
      hint: 'Look in central Europe.',
      country: 'Germany',
      fact: 'The Berlin Wall fell in 1989, helping pave the way for German reunification.',
    },
  ],
};

export const LEADERBOARD_CONTENT: LeaderboardContent = {
  eyebrow: 'THE CLASSROOM CHALLENGE',
  title: 'Top explorers',
  subtitle: 'Every quiz gets you closer to the top.',
  periodLabel: 'WEEKLY',
  scoreNote: 'Earn points by exploring the map',
  youLabel: 'YOU',
  pointsLabel: 'pts',
  emptyState: 'No scores yet. Be the first to play!',
  currentPlayerSummary: (rank) =>
    createElement(Fragment, null, 'You are currently ', createElement('strong', null, `#${rank}`), '.'),
};
