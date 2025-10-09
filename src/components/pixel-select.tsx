"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from "react";

interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  disabled?: boolean;
}

const SelectContext = createContext<SelectContextValue | undefined>(undefined);

function useSelectContext() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a Select component");
  }
  return context;
}

interface PixelSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}

export function PixelSelect({
  value,
  onValueChange,
  disabled = false,
  children,
}: PixelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider
      value={{ value, onValueChange, isOpen, setIsOpen, disabled }}
    >
      <div ref={selectRef} className="relative inline-block w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

interface PixelSelectTriggerProps {
  className?: string;
  children: ReactNode;
}

export function PixelSelectTrigger({
  className,
  children,
}: PixelSelectTriggerProps) {
  const { isOpen, setIsOpen, disabled } = useSelectContext();

  return (
    <button
      type="button"
      onClick={() => !disabled && setIsOpen(!isOpen)}
      disabled={disabled}
      className={cn(
        "relative font-mono text-sm font-bold uppercase tracking-wider",
        "px-4 py-3 w-full",
        "flex items-center justify-between gap-4",
        "bg-card text-card-foreground",
        "shadow-[0_0_0_3px_var(--color-border)]",
        "transition-all duration-75",
        !disabled &&
          "hover:shadow-[0_0_0_3px_var(--color-border),2px_2px_0_var(--color-border)]",
        !disabled && "hover:translate-x-[-1px] hover:translate-y-[-1px]",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {/* Corner pixels */}
      <span className="absolute left-0 top-0 h-[3px] w-[3px] bg-border" />
      <span className="absolute right-0 top-0 h-[3px] w-[3px] bg-border" />
      <span className="absolute bottom-0 left-0 h-[3px] w-[3px] bg-border" />
      <span className="absolute bottom-0 right-0 h-[3px] w-[3px] bg-border" />

      {children}

      {isOpen ? (
        <ChevronUp className="h-4 w-4 shrink-0" />
      ) : (
        <ChevronDown className="h-4 w-4 shrink-0" />
      )}
    </button>
  );
}

interface PixelSelectValueProps {
  placeholder?: string;
  children?: ReactNode;
}

export function PixelSelectValue({
  placeholder,
  children,
}: PixelSelectValueProps) {
  const { value } = useSelectContext();

  if (children && value) {
    return <div className="flex-1 text-left">{children}</div>;
  }

  return (
    <span className={cn("flex-1 text-left", !value && "text-muted-foreground")}>
      {value ? value : placeholder || "Select..."}
    </span>
  );
}

interface PixelSelectContentProps {
  children: ReactNode;
  className?: string;
}

export function PixelSelectContent({
  children,
  className,
}: PixelSelectContentProps) {
  const { isOpen } = useSelectContext();

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "absolute top-[calc(100%+8px)] left-0 right-0 z-50",
        "bg-card",
        "shadow-[0_0_0_3px_var(--color-border),4px_4px_0_var(--color-border)]",
        "max-h-[300px] overflow-y-auto",
        className
      )}
    >
      {/* Corner pixels for dropdown */}
      <span className="absolute left-0 top-0 h-[3px] w-[3px] bg-border z-10" />
      <span className="absolute right-0 top-0 h-[3px] w-[3px] bg-border z-10" />
      <span className="absolute bottom-0 left-0 h-[3px] w-[3px] bg-border z-10" />
      <span className="absolute bottom-0 right-0 h-[3px] w-[3px] bg-border z-10" />

      {children}
    </div>
  );
}

interface PixelSelectItemProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function PixelSelectItem({
  value,
  children,
  className,
  disabled = false,
}: PixelSelectItemProps) {
  const { value: selectedValue, onValueChange, setIsOpen } = useSelectContext();

  const handleSelect = () => {
    onValueChange?.(value);
    setIsOpen(false);
  };

  return (
    <button
      type="button"
      onClick={handleSelect}
      disabled={disabled}
      className={cn(
        "w-full px-4 py-3 text-left",
        "font-mono text-sm font-bold uppercase tracking-wider",
        "transition-colors duration-75",
        "hover:bg-primary hover:text-primary-foreground",
        selectedValue === value && "bg-secondary text-secondary-foreground",
        "border-b-[3px] border-border last:border-b-0",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}
