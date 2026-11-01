# Map component library

A React component library featuring reusable UI components and an interactive Europe map.
Components that display copy accept it through props, so consuming applications control
the wording and can localize it.

## Install

The library expects React 19 and MapLibre GL:

```sh
npm install map-component react react-dom maplibre-gl
```

## Use

Import the components you need and include the library stylesheet once in your app:

```tsx
import europeGeoJson from './europe.geo.json';
import type { FeatureCollection } from 'geojson';
import { EuropeMap, type EuropeMapProps } from 'map-component';
import 'map-component/style.css';

const mapProps: EuropeMapProps = {
  display: { country: true, city: true },
  geojson: europeGeoJson as FeatureCollection,
  style: { width: '100%', height: '500px' },
  onClick: ({ country, city }) => console.log({ country, city }),
};

export function MapView() {
  return <EuropeMap {...mapProps} />;
}
```

Available exports: `Card`, `CardsModal`, `EuropeMap`, `FloatingPanel`, `GameButton`,
`GameplayInstructions`, `Leaderboards`, `LoadingSpinner`, `Modal`, `Overlay`,
`PlayerScore`, `QuestionPanel`, and `ResultSummary`.

Use `FloatingPanel` to position content over a relative container. It handles
responsive placement while the child keeps its own visual styles:

```tsx
import { FloatingPanel } from 'map-component';

<FloatingPanel position="top-right">
  <div>Custom overlay content</div>
</FloatingPanel>
```

Positions are `top-left`, `top-right`, `bottom-center`, and `bottom-right`. Use
`mobilePosition` to change position on small screens and `size="wide"` for wider
content.

`PlayerScore` and `Leaderboards` position themselves and should not be wrapped in an
additional `FloatingPanel`.

Text displayed by `GameplayInstructions`, `QuestionPanel`, and `ResultSummary` is
provided by the consuming application. Supply `GameplayInstructions` with its heading,
description, and `steps`; pass question and button labels to `QuestionPanel`; and pass
a `ResultSummaryContent` object plus `pointsPerCorrectAnswer` to `ResultSummary`.
Display content such as labels, question prompts, and player names accepts
`React.ReactNode`, so it can include formatted elements as well as plain text.
`GameButton` accepts optional visible label content.
`CardsModal` can show an icon-only back button with a `backButton` object containing an
`onClick` callback and accessible `label`.

`Leaderboards` accepts its copy as a `content` prop, keeping text configurable by the
app using the component:

```tsx
import { Leaderboards, type LeaderboardContent, type LeaderboardEntry } from 'map-component';

const entries: LeaderboardEntry[] = [];
const content: LeaderboardContent = {
  eyebrow: 'THE CLASSROOM CHALLENGE',
  title: 'Top explorers',
  subtitle: 'Every quiz gets you closer to the top.',
  periodLabel: 'WEEKLY',
  scoreNote: 'Earn points by exploring the map',
  rankingsLabel: 'Weekly player rankings',
  rankLabel: (rank) => `Rank ${rank}`,
  youLabel: 'YOU',
  pointsLabel: 'pts',
  emptyState: 'No scores yet. Be the first to play!',
  currentPlayerSummary: (rank) => <>You are currently #{rank}.</>,
};

<Leaderboards entries={entries} currentPlayerName="Explorer" content={content} />;
```

The stylesheet includes the component styles and design-token CSS variables. MapLibre's
CSS is included in that stylesheet.

## Develop

```sh
npm install
npm run demo
npm run build
npm run typecheck
npm run lint
```

`npm run demo` starts the example app. `npm run build` generates an ESM bundle
and TypeScript declarations in `dist/`.
