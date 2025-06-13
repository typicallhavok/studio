
import RegisterForm from '@/components/auth/RegisterForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
           <Link href="/" className="inline-flex items-center gap-3 mb-4 text-primary hover:text-primary/80 transition-colors justify-center">
            <ShieldCheck className="h-10 w-10" />
            <span className="text-3xl font-semibold tracking-tight font-headline">TrustLedger</span>
          </Link>
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <UserPlus className="h-6 w-6" />
            Create Account
          </CardTitle>
          <CardDescription>Sign up to start managing your evidence securely.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
      <p className="mt-8 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-accent hover:text-accent/80 underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}
