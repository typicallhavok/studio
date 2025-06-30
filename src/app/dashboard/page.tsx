'use client';
import DashboardSection from '@/components/dashboard/DashboardSection';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Loader2, Menu } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';

function ProtectedLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const bgcolor1 = 'bg-[#120b1a]';
  const bgcolor2 = 'bg-gradient-to-bl from-purple-900 via slate-900 to-black';
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?callbackUrl=/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-background`}>
        
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  const user = session?.user;

  return (
    <div className={`min-h-screen bg-background`}>
      <Navbar />
      <div className="container mx-auto px-4 border-l border-r border-white/20 shadow-2xl min-h-screen">
        <div className="flex">
          

          <div className={`flex-1 flex justify-center transition-all duration-300 ${
            isSidebarCollapsed ? 'ml-0' : 'md:ml-4'
          }`}>
            <main className="w-full max-w-5xl rounded-xl p-6">
              {children}
            </main>
          </div>
        </div>
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
