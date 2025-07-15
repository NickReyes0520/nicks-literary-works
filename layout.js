
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
