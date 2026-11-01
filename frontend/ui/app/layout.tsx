import type { Metadata } from 'next';
import '@meridiani/components/style.css';
import './globals.css';
import { gameText } from './gameText';

export const metadata: Metadata = {
  title: gameText.metadata.title,
  description: gameText.metadata.description,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
