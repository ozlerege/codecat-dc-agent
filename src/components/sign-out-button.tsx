"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

export const SignOutButton = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      disabled={isLoading}
      variant="outline"
      className="gap-2"
      aria-label="Sign out"
    >
      <LogOut className="h-4 w-4" />
      {isLoading ? "Signing out..." : "Sign out"}
    </Button>
  );
};

