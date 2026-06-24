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

export function TaskRow({ task, queuePosition, dragHandle, ...handlers }: Props) {
  const isRunning = task.status === "running";

  return (
    <article
      aria-label={`Задача: ${task.prompt}. Статус: ${task.status}.`}
      className={cn(
        "rounded-[18px] border bg-card px-4 py-4 transition-colors",
        isRunning ? "border-primary/30" : "border-border hover:border-foreground/15",
      )}
    >
      <div className="flex items-center gap-4">
        {dragHandle}
        <TaskTypeIcon type={task.type} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium text-foreground" title={task.prompt}>
            {task.prompt}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 font-mono text-[12px]">
              <span className="size-1.5 rounded-full bg-primary" />
              {task.modelName}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="truncate">{taskMeta(task, queuePosition)}</span>
          </div>
          {isRunning && (
            <ProgressBar value={task.progress} className="mt-3" label={`Прогресс: ${formatPercent(task.progress)}`} />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {isRunning && (
            <span className="font-mono text-sm text-primary">{formatPercent(task.progress)}</span>
          )}
          <StatusBadge status={task.status} />
          <TaskActions status={task.status} {...handlers} />
        </div>
      </div>
    </article>
  );
}
