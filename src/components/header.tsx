import Link from 'next/link';
import Image from 'next/image';
import { UserNav } from './auth/user-nav';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="mr-6 flex items-center gap-3">
          <Image src="/ecap-logo.svg" alt="ECAP Logo" width={80} height={24} />
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
