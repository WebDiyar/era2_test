import type { ReactNode } from "react";
import { AuthProvider } from "@/features/auth";
import { ThemeProvider } from "@/features/theme-switcher";
import { QueueProvider } from "@/features/generation-queue";
import { RouterProvider } from "@/shared/routing";
import { TooltipProvider } from "@/shared/ui/tooltip";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <RouterProvider>
            <QueueProvider>{children}</QueueProvider>
          </RouterProvider>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
