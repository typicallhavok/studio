import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <ShieldCheck className="h-8 w-8" />
          <h1 className="text-2xl font-headline font-semibold tracking-tight">Chain of Custody</h1>
        </Link>
        {/* Navigation items can be added here if needed, for example:
        <nav className="flex gap-4">
          <Link href="#features" className="hover:text-primary-foreground/80">Features</Link>
          <Link href="#pricing" className="hover:text-primary-foreground/80">Pricing</Link>
          <Link href="/login" className="hover:text-primary-foreground/80">Login</Link>
        </nav>
        */}
      </div>
    </header>
  );
}
