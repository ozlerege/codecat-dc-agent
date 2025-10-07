/**
 * Sign Out Button Component
 * 
 * Button component for signing out users.
 * Uses the centralized auth module for sign out operations.
 * 
 * @module features/auth/components
 */

"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "../hooks/use-auth";

/**
 * Sign out button component
 * 
 * Displays a button to sign out the current user.
 * Handles loading states and automatic redirect after sign out.
 * 
 * @example
 * ```tsx
 * import { SignOutButton } from '@/features/auth/components/sign-out-button';
 * 
 * export function Header() {
 *   return (
 *     <header>
 *       <SignOutButton />
 *     </header>
 *   );
 * }
 * ```
 */
export function SignOutButton() {
  const { signOut, isSigningOut } = useAuth();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <Button
      onClick={handleSignOut}
      disabled={isSigningOut}
      variant="outline"
      className="gap-2"
      aria-label="Sign out"
    >
      <LogOut className="h-4 w-4" />
      {isSigningOut ? "Signing out..." : "Sign out"}
    </Button>
  );
}
