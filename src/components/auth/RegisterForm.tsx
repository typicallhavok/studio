
'use client';

import { useState } from "react";
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
// Removed useAuth as we are using NextAuth
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);

    // Simulate API call for registration
    // In a real app, you would call your backend API to register the user.
    // NextAuth's CredentialsProvider is for sign-in, not direct registration.
    // You would typically create a user in your database via a separate API endpoint.
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // For this example, we'll assume registration is successful.
    // A real implementation would involve an API call here.
    // If the API call fails, setError with an appropriate message.

    const isMockSuccess = true; // Simulate success

    if (isMockSuccess) {
      toast({
        title: 'Registration Almost Complete!',
        description: `Thank you for registering, ${data.name}. Please log in to continue.`,
      });
      // Instead of logging in directly, redirect to login page.
      // The user (test@example.com) is already "in the database" in the NextAuth mock.
      // If you had a real API, you'd call it here.
      router.push('/login');
    } else {
      setError("Mock registration failed. Please try again."); // Example error
      setIsLoading(false);
    }
    // setIsLoading(false); // This should be set after success too if not redirecting immediately or if further actions
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          {/* <AlertTriangle className="h-4 w-4" /> Assumed to be available from lucide-react or Alert component */}
          <AlertTitle>Registration Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          {...register('name')}
          className={formErrors.name ? 'border-destructive' : ''}
          autoComplete="name"
        />
        {formErrors.name && <p className="text-sm text-destructive">{formErrors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          {...register('email')}
          className={formErrors.email ? 'border-destructive' : ''}
          autoComplete="email"
        />
        {formErrors.email && <p className="text-sm text-destructive">{formErrors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="********"
          {...register('password')}
          className={formErrors.password ? 'border-destructive' : ''}
          autoComplete="new-password"
        />
        {formErrors.password && <p className="text-sm text-destructive">{formErrors.password.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="********"
          {...register('confirmPassword')}
          className={formErrors.confirmPassword ? 'border-destructive' : ''}
          autoComplete="new-password"
        />
        {formErrors.confirmPassword && <p className="text-sm text-destructive">{formErrors.confirmPassword.message}</p>}
      </div>
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Sign Up
          </>
        )}
      </Button>
    </form>
  );
}
