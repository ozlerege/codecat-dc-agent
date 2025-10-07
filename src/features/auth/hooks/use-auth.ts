/**
 * useAuth Hook
 * 
 * Custom React hook for accessing authentication state and operations.
 * Provides convenient access to auth service methods and reactive state.
 * 
 * @module features/auth/hooks
 */

'use client';

import { useSupabase } from '@/lib/supabase/provider';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authService } from '../services/auth-service';
import { ROUTES } from '@/lib/config/constants';
import type { SignInOptions, SignOutOptions } from '../types';

/**
 * Custom hook for authentication
 * 
 * Provides auth state and methods for sign in/out operations.
 * Integrates with React Query for loading states and error handling.
 * 
 * @returns Auth state and methods
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { session, user, isAuthenticated, signIn, signOut, isSigningIn } = useAuth();
 * 
 *   if (!isAuthenticated) {
 *     return <button onClick={() => signIn()}>Sign In</button>;
 *   }
 * 
 *   return (
 *     <div>
 *       <p>Welcome, {user?.email}</p>
 *       <button onClick={() => signOut()}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth() {
  const { session } = useSupabase();
  const router = useRouter();

  const signInMutation = useMutation({
    mutationFn: async (options?: SignInOptions) => {
      await authService.signInWithDiscord(options);
    },
    onError: (error) => {
      console.error('Sign in failed:', error);
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async (options?: SignOutOptions) => {
      await authService.signOut(options);
    },
    onSuccess: (_data, variables) => {
      const redirectTo = variables?.redirectTo ?? ROUTES.home;
      router.push(redirectTo);
      router.refresh();
    },
    onError: (error) => {
      console.error('Sign out failed:', error);
    },
  });

  return {
    // State
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session,
    
    // Sign in
    signIn: signInMutation.mutate,
    signInAsync: signInMutation.mutateAsync,
    isSigningIn: signInMutation.isPending,
    signInError: signInMutation.error,
    
    // Sign out
    signOut: signOutMutation.mutate,
    signOutAsync: signOutMutation.mutateAsync,
    isSigningOut: signOutMutation.isPending,
    signOutError: signOutMutation.error,
    
    // Loading states
    isLoading: signInMutation.isPending || signOutMutation.isPending,
  };
}
