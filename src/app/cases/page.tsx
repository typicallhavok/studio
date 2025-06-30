'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import CasesSection from '@/components/cases/CasesSection';
import type { ReactNode } from 'react';

function ProtectedLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?callbackUrl=/cases');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 border-l border-r border-white/20 shadow-2xl">
        <div className="h-full flex justify-center mt-4">
          <main className="w-full max-w-6xl bg-card rounded-xl shadow-xl overflow-hidden flex flex-col">
            <div className="flex-1 p-6 overflow-y-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function CasesPage() {
  return (
    <ProtectedLayout>
      <CasesSection />
    </ProtectedLayout>
  );
}