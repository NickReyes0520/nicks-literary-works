// app/page.js
export default function Home() {
  return (
    <main style={{padding:'2rem'}}>
      <h2>Welcome to Nick’s Literary Works</h2>
      <p>Stay tuned: the full bookstore is coming soon!</p>
    </main>
  );
}
// app/layout.js
export const metadata = {
  title: "Nick’s Literary Works",
  description: "Ink the truth, shape the soul—stories that linger beyond the final page.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header style={{padding:'1rem',borderBottom:'1px solid #ddd'}}>
          <h1>Nick’s Literary Works</h1>
        </header>
        {children}
      </body>
    </html>
  );
}
{
  "name": "nicks-literary-works",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "18.3.0",
    "react-dom": "18.3.0"
  }
}
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};
module.exports = nextConfig;
