'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import CasesSection from '@/components/cases/CasesSection';

function ProtectedLayout({ children }) {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950">
      <Navbar />
      <div className="container mx-auto px-4">
        <div className="flex flex-1 mt-4 rounded-lg overflow-hidden">
          <div className="hidden md:block">
            <Sidebar />
          </div>
          <main className="flex-1 bg-card rounded-lg shadow-xl p-6 overflow-auto ml-10">
            {children}
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