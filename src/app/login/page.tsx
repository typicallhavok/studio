import LoginForm from '@/components/auth/LoginForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="container mx-auto px-4 border-l border-r border-white/20 shadow-2xl min-h-screen flex flex-col items-center justify-center">
        <Card className="w-full max-w-md shadow-xl bg-card border border-border">
          <CardHeader className="text-center">
            <Link href="/" className="inline-flex items-center gap-3 mb-4 text-primary hover:text-primary/80 transition-colors justify-center">
              <ShieldCheck className="h-10 w-10" />
              <span className="text-3xl font-semibold tracking-tight font-headline">TrustLedger</span>
            </Link>
            <CardTitle className="text-2xl font-bold text-card-foreground">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground">Sign in to access your evidence dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-primary hover:text-primary/80 underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
