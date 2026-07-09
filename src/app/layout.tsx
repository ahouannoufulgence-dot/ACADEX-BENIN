import type {Metadata} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'ACADEX - Excellence Scolaire',
  description: 'Plateforme premium de gestion scolaire pour collèges et lycées au Bénin.',
  themeColor: '#14532d',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ACADEX',
  },
  icons: {
    icon: '/icons/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/icons/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/icons/manifest.json" />
        <meta name="theme-color" content="#14532d" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" href="/icons/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          #acadex-boot-splash {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 28px;
            transition: opacity 0.4s ease, visibility 0.4s ease;
          }
          #acadex-boot-splash.hidden {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
          }
          #acadex-boot-splash img {
            width: 96px;
            height: 96px;
            object-fit: contain;
            animation: acadex-pulse 1.8s ease-in-out infinite;
          }
          #acadex-boot-splash .acadex-bar-track {
            width: 140px;
            height: 4px;
            border-radius: 999px;
            background: #e5e7eb;
            overflow: hidden;
          }
          #acadex-boot-splash .acadex-bar-fill {
            height: 100%;
            width: 40%;
            border-radius: 999px;
            background: #14532d;
            animation: acadex-loading 1.1s ease-in-out infinite;
          }
          @keyframes acadex-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.06); opacity: 0.85; }
          }
          @keyframes acadex-loading {
            0% { transform: translateX(-120%); }
            100% { transform: translateX(350%); }
          }
        `}} />
      </head>
      <body className="font-body antialiased selection:bg-primary/20 selection:text-primary">
        <div id="acadex-boot-splash">
          <img src="/icons/android-chrome-192x192.png" alt="ACADEX" />
          <div className="acadex-bar-track">
            <div className="acadex-bar-fill" />
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('load', function() {
            setTimeout(function() {
              var splash = document.getElementById('acadex-boot-splash');
              if (splash) splash.classList.add('hidden');
            }, 400);
          });
        `}} />
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}