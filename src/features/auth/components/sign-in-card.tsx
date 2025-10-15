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
import { PixelButton } from "@/components/pixel-button";

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
    <PixelButton
      onClick={handleSignIn}
      disabled={isSigningIn}
      variant="discord"
      className="gap-2"
    >
      {isSigningIn ? "Connecting..." : "Sign in with Discord"}
    </PixelButton>
  );
}
