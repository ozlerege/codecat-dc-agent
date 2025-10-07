"use client";

import { Button } from "@/components/ui/button";

type SelectGuildButtonProps = {
  label?: string;
  isLoading?: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

export function SelectGuildButton({
  label = "Select",
  isLoading = false,
  disabled = false,
  onSelect,
}: SelectGuildButtonProps) {
  return (
    <Button
      type="button"
      disabled={disabled || isLoading}
      className="w-full sm:w-auto"
      onClick={onSelect}
    >
      {isLoading ? "Selecting..." : label}
    </Button>
  );
}
