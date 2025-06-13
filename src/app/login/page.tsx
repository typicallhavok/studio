
import LoginForm from '@/components/auth/LoginForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-4 text-primary hover:text-primary/80 transition-colors justify-center">
            <ShieldCheck className="h-10 w-10" />
            <span className="text-3xl font-semibold tracking-tight font-headline">TrustLedger</span>
          </Link>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to access your evidence dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
       <p className="mt-8 text-center text-sm text-slate-400">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-accent hover:text-accent/80 underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
