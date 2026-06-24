import type { TaskStatus } from "@/entities/generation-task";
import { cn } from "@/shared/lib/utils";

const CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  queued: { label: "В очереди", className: "bg-white/[0.04] text-muted-foreground border-white/10" },
  running: { label: "Идёт", className: "bg-primary text-primary-foreground border-transparent" },
  done: { label: "Готово", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  failed: { label: "Ошибка", className: "bg-red-500/15 text-red-400 border-red-500/25" },
  canceled: { label: "Отменено", className: "bg-white/[0.04] text-muted-foreground/70 border-white/10" },
};

export function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  const cfg = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-sm border px-2.5 text-xs font-medium",
        cfg.className,
        className,
      )}
    >
      {cfg.label}
    </span>
  );
}
