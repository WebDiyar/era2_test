import type { GenerationTask } from "@/entities/generation-task";
import { TaskTypeIcon } from "./TaskTypeIcon";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { TaskActions } from "./TaskActions";
import type { TaskActionHandlers } from "./TaskActions";
import { formatPercent, taskMeta } from "../lib/formatEta";

interface Props extends TaskActionHandlers {
  task: GenerationTask;
  queuePosition?: number | null;
}

export function TaskCard({ task, queuePosition, ...handlers }: Props) {
  const isRunning = task.status === "running";

  return (
    <div className="rounded-[18px] border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <TaskTypeIcon type={task.type} className="size-10" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium text-foreground">{task.prompt}</p>
          <div className="mt-1 inline-flex items-center gap-1.5 font-mono text-[12px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            {task.modelName}
          </div>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <div className="mt-3 flex items-center justify-between text-[13px] text-muted-foreground">
        <span className="truncate">{taskMeta(task, queuePosition)}</span>
        {isRunning && (
          <span className="font-mono text-sm text-primary">{formatPercent(task.progress)}</span>
        )}
      </div>

      {isRunning && <ProgressBar value={task.progress} className="mt-2.5" />}

      <div className="mt-3 flex justify-end">
        <TaskActions status={task.status} {...handlers} />
      </div>
    </div>
  );
}
