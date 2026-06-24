import type { ReactNode } from "react";
import type { GenerationTask } from "@/entities/generation-task";
import { cn } from "@/shared/lib/utils";
import { TaskTypeIcon } from "./TaskTypeIcon";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { TaskActions } from "./TaskActions";
import type { TaskActionHandlers } from "./TaskActions";
import { formatPercent, taskMeta } from "../lib/formatEta";

interface Props extends TaskActionHandlers {
  task: GenerationTask;
  queuePosition?: number | null;
  dragHandle?: ReactNode;
}

export function TaskCard({ task, queuePosition, dragHandle, ...handlers }: Props) {
  const isRunning = task.status === "running";

  return (
    <article
      aria-label={`Задача: ${task.prompt}. Статус: ${task.status}.`}
      className={cn(
        "rounded-[18px] border bg-card p-4",
        isRunning ? "border-primary/30" : "border-border",
      )}
    >
      <div className="flex gap-3">
        {dragHandle}
        <TaskTypeIcon type={task.type} className="size-11" />
        <div className="min-w-0 flex-1">
          <p
            className="line-clamp-2 text-sm font-medium leading-snug text-foreground"
            title={task.prompt}
          >
            {task.prompt}
          </p>
          <div className="mt-1.5 flex min-w-0 items-center gap-2 text-[13px] text-muted-foreground">
            <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[12px]">
              <span className="size-1.5 rounded-full bg-primary" />
              {task.modelName}
            </span>
            <span className="truncate">{taskMeta(task, queuePosition)}</span>
          </div>
        </div>
      </div>

      {isRunning && (
        <ProgressBar value={task.progress} className="mt-3" label={`Прогресс: ${formatPercent(task.progress)}`} />
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} />
          {isRunning && (
            <span className="font-mono text-sm text-primary">{formatPercent(task.progress)}</span>
          )}
        </div>
        <TaskActions status={task.status} {...handlers} />
      </div>
    </article>
  );
}
