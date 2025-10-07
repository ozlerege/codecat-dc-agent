/**
 * Sign In Card Component
 * 
 * Landing page component for Discord authentication.
 * Uses the centralized auth module for sign in operations.
 * 
 * @module features/auth/components
 */

"use client";

import { Button } from "@/components/ui/button";
import { FaDiscord } from "react-icons/fa";
import { useAuth } from "../hooks/use-auth";
import { APP_CONFIG } from "@/lib/config/constants";

/**
 * Sign in card component
 * 
 * Displays app branding and Discord sign in button.
 * Handles loading states during OAuth redirect.
 * 
 * @example
 * ```tsx
 * import { SignInCard } from '@/features/auth/components/sign-in-card';
 * 
 * export default function HomePage() {
 *   return <SignInCard />;
 * }
 * ```
 */
export function SignInCard() {
  const { signIn, isSigningIn } = useAuth();

  const handleSignIn = () => {
    signIn();
  };

  return (
    <div className="flex flex-col gap-8 items-center justify-center min-h-screen p-8">
      <div className="flex flex-col gap-4 items-center text-center max-w-md">
        <h1 className="text-4xl font-bold tracking-tight">
          {APP_CONFIG.name}
        </h1>
        <p className="text-muted-foreground text-lg">
          {APP_CONFIG.description}
        </p>
      </div>
      
      <Button
        onClick={handleSignIn}
        disabled={isSigningIn}
        size="lg"
        className="gap-2"
        aria-label="Sign in with Discord"
      >
        <FaDiscord className="h-5 w-5" />
        {isSigningIn ? "Connecting..." : "Sign in with Discord"}
      </Button>
    </div>
  );
}
