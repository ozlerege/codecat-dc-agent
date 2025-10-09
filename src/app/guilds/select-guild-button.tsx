"use client";

import { PixelButton } from "@/components/pixel-button";

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
    <PixelButton
      type="button"
      disabled={disabled || isLoading}
      onClick={onSelect}
      className="w-full mt-4"
      variant="ghost"
    >
      {isLoading ? "Selecting..." : label}
    </PixelButton>
  );
}
