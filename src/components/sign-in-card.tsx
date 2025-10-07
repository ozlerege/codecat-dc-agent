"use client";

import { Button } from "@/components/ui/button";
import { signInWithDiscord } from "@/lib/supabase/client";
import { FaDiscord } from "react-icons/fa";
import { useState } from "react";

export const SignInCard = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithDiscord();
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 items-center justify-center min-h-screen p-8">
      <div className="flex flex-col gap-4 items-center text-center max-w-md">
        <h1 className="text-4xl font-bold tracking-tight">
          Jules Discord Developer Agent
        </h1>
        <p className="text-muted-foreground text-lg">
          AI-powered development tasks directly from Discord
        </p>
      </div>
      
      <Button
        onClick={handleSignIn}
        disabled={isLoading}
        size="lg"
        className="gap-2"
        aria-label="Sign in with Discord"
      >
        <FaDiscord className="h-5 w-5" />
        {isLoading ? "Connecting..." : "Sign in with Discord"}
      </Button>
    </div>
  );
};

