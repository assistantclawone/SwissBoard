import { WallBody } from '@/components/wall/wall-body';

/**
 * Server-Wrapper für die Wand-Seite.
 * Ermöglicht `next export` (statischer Export für GitHub Pages/Cloudflare),
 * indem diese Route eine generateStaticParams liefert. Die eigentliche Logik
 * (lokal, localStorage) liegt im Client-Komponent WallBody.
 */
export async function generateStaticParams() {
  // Alle Wände entstehen zur Laufzeit im Browser (localStorage).
  // Ein Platzhalter-Fall sorgt dafür, dass die dynamische Route beim
  // statischen Export einen Referenz-Pfad erzeugt.
  return [{ id: 'beispiel' }];
}

export default function WallPage({ params }: { params: { id: string } }) {
  return <WallBody id={params.id} />;
}
