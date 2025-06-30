import { ShieldCheck, LogOut, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import {
  LayoutDashboard,
  Upload,
  Shield,
  Search,
  FileCheck,
  Clock
} from 'lucide-react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();
  const pathname = usePathname();
  const { isDarkMode, toggleTheme } = useTheme();

  const navItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Cases", href: "/cases", icon: Search },
    pathname.includes("/chain") && { title: "Chain of Custody", href: "/chain", icon: Clock },
    { title: "Logs", href: "/logs", icon: FileCheck },
  ].filter(Boolean);

  const isActive = (path: string) => pathname.includes(path);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-background/10 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-2xl">
      <div className="container flex h-16 items-center justify-between m-auto px-32">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <span className="text-xl font-semibold tracking-tight font-headline text-card-foreground">TrustLedger</span>
        </Link>
        <div className="flex items-center gap-8">
          {/* Navigation Items */}
        </div>

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-card-foreground hover:text-background hover:bg-primary'
                  }`}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </nav>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
