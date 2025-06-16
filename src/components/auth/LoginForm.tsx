
'use client';

import { useState } from "react";
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const loginSchema = z.object({
  username: z.string().min(1, { message: 'Username cannot be empty.' }), // Min 1, as backend handles length
  password: z.string().min(1, { message: 'Password cannot be empty.' }), // Min 1, as backend handles length
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Call your custom backend API
      const backendResponse = await fetch('/api/login', { // This URL should point to your backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: data.username, password: data.password }),
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({ message: 'Invalid credentials or server error.' }));
        throw new Error(errorData.message || `Request failed with status ${backendResponse.status}`);
      }

      const backendUser = await backendResponse.json();

      if (!backendUser || !backendUser.username || !backendUser.id) {
          throw new Error('User data not returned from backend.');
      }

      // Step 2: If backend login is successful, sign in with NextAuth using pre-validated credentials
      const result = await signIn('credentials', {
        redirect: false,
        username: backendUser.username,
        id: backendUser.id,
        isPreValidated: 'true',
        callbackUrl: callbackUrl,
      });

      if (result?.error) {
        setError(result.error === "CredentialsSignin" ? "NextAuth sign-in failed after backend validation." : result.error);
        setIsLoading(false);
      } else if (result?.ok) {
        toast({
          title: 'Login Successful',
          description: `Welcome back! Redirecting you now...`,
        });
        router.push(result.url || callbackUrl);
      } else {
        setError("An unknown error occurred during NextAuth sign-in.");
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Login Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="username">username</Label>
        <Input
          id="username"
          type="username"
          placeholder="name@example.com"
          {...register('username')}
          className={formErrors.username ? 'border-destructive' : ''}
          autoComplete="username"
        />
        {formErrors.username && <p className="text-sm text-destructive">{formErrors.username.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="********"
          {...register('password')}
          className={formErrors.password ? 'border-destructive' : ''}
          autoComplete="current-password"
        />
        {formErrors.password && <p className="text-sm text-destructive">{formErrors.password.message}</p>}
      </div>
      <div className="flex items-center justify-between">
        <a href="#" className="text-sm text-accent hover:underline">
          Forgot password?
        </a>
      </div>
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </>
        )}
      </Button>
    </form>
  );
}
