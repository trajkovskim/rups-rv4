'use client';

import dynamic from 'next/dynamic';

const Game = dynamic(() => import('./Game'), {
  ssr: false,
  loading: () => (
    <main style={{ padding: '2rem', color: '#17213d', fontFamily: 'system-ui, sans-serif' }}>
      Loading Meridiani…
    </main>
  ),
});

export default function Home() {
  return <Game />;
}
