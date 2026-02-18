import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Twitter to Newsletter',
  description: 'Compose newsletters from your tweets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
