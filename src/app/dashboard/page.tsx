
'use client';
import DashboardSection from '@/components/dashboard/DashboardSection';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldCheck, LogOut, Settings, UserCircle, LayoutDashboard, BarChart3, FileText, FolderSearch, Cpu, Loader2 } from 'lucide-react';

// Mock sidebar items for demonstration
const sidebarNavItems = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Evidence Log", href: "/dashboard/evidence", icon: FileText },
  { title: "Chain of Custody", href: "/dashboard/chain", icon: BarChart3 },
  { title: "Tamper Detection", href: "/dashboard/tamper", icon: Cpu },
  { title: "Case Files", href: "/dashboard/cases", icon: FolderSearch },
];

function ProtectedLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <span className="text-xl font-semibold tracking-tight font-headline">TrustLedger</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Welcome, {user?.name || user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/settings')}>
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => {
              logout();
              router.push('/login');
            }}>
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden md:flex md:w-64 flex-col border-r border-border p-4 space-y-4 bg-card">
          <nav className="flex-grow">
            <ul className="space-y-2">
              {sidebarNavItems.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                      ${router.pathname === item.href ? 'bg-primary text-primary-foreground' : 'hover:bg-muted hover:text-foreground'}`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto border-t border-border pt-4">
             <Link href="/dashboard/profile" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted hover:text-foreground">
                <UserCircle className="h-5 w-5" />
                Profile
             </Link>
            <Button variant="outline" className="w-full mt-2" onClick={() => {
                logout();
                router.push('/login');
              }}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}


export default function DashboardPage() {
  return (
    <ProtectedLayout>
      <DashboardSection />
    </ProtectedLayout>
  );
}
