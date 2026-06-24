import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { AuthProvider } from "@/features/auth";
import { ThemeProvider } from "@/features/theme-switcher";
import { QueueProvider } from "@/features/generation-queue";
import { RouterProvider } from "@/shared/routing";
import { TooltipProvider } from "@/shared/ui/tooltip";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    // reducedMotion="user" — все framer-motion анимации уважают системную настройку
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <RouterProvider>
              <QueueProvider>{children}</QueueProvider>
            </RouterProvider>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
