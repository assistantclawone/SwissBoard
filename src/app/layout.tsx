import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'SwissBoard',
  description: 'Eine kollaborative Plattform für ECAP, mit Fokus auf Datenschutz.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased h-full', 'bg-background')}>
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
        <footer className="border-t border-border/60 py-3 text-center text-xs text-muted-foreground">
          🌿 SwissBoard läuft <span className="font-medium">lokal-first</span>: Ihre Daten bleiben ausschliesslich in Ihrem Browser. Kein Server, kein Cloud-Speicher, niemand sonst hat Zugriff.
        </footer>
      </body>
    </html>
  );
}
