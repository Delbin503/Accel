import { Moon, Sun } from "lucide-react";
import { Button } from "@accel/ui/components/ui/button";
import { useTheme } from "@/providers/theme-context";
import { cn } from "@accel/ui/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      data-slot="theme-toggle"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn("text-muted-foreground hover:text-foreground", className)}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="size-4 transition-transform duration-[var(--duration-normal)]" />
      ) : (
        <Moon className="size-4 transition-transform duration-[var(--duration-normal)]" />
      )}
    </Button>
  );
}
