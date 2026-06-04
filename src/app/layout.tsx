import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ACADEX - Excellence Scolaire',
  description: 'Plateforme premium de gestion scolaire pour collèges et lycées au Bénin.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-primary/20 selection:text-primary">
        {children}
      </body>
    </html>
  );
}