import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: "Nick’s Literary Works",
  description: "Ink the truth, shape the soul—stories that linger beyond the final page.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{fontFamily:'sans-serif',margin:0}}>
        <header style={{padding:'1rem',borderBottom:'1px solid #ddd'}}>
          <h1 style={{margin:0}}>Nick’s Literary Works</h1>
        </header>
        {children}
      </body>
    </html>
  );
}
