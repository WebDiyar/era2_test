import type { GenerationTask, GenType } from "@/entities/generation-task";

export type StatusFilter = "all" | "queued" | "running" | "done" | "failed";
export type TypeFilter = "all" | GenType;
export type SortOrder = "newest" | "oldest" | "progress";

export interface QueueCounts {
  queued: number;
  running: number;
  done: number;
  failed: number;
  canceled: number;
  total: number;
}

export function selectCounts(tasks: GenerationTask[]): QueueCounts {
  const counts: QueueCounts = { queued: 0, running: 0, done: 0, failed: 0, canceled: 0, total: tasks.length };
  for (const t of tasks) counts[t.status] += 1;
  return counts;
}

// позиция (1-based) среди queued по FIFO; null — если задача не в очереди
export function selectQueuePosition(tasks: GenerationTask[], id: string): number | null {
  const queued = tasks
    .filter((t) => t.status === "queued")
    .sort((a, b) => a.createdAt - b.createdAt);
  const idx = queued.findIndex((t) => t.id === id);
  return idx === -1 ? null : idx + 1;
}

export interface VisibleOptions {
  status: StatusFilter;
  type?: TypeFilter;
  query?: string;
  sort: SortOrder;
}

export function selectVisible(tasks: GenerationTask[], opts: VisibleOptions): GenerationTask[] {
  let res = tasks;
  if (opts.status !== "all") res = res.filter((t) => t.status === opts.status);
  if (opts.type && opts.type !== "all") res = res.filter((t) => t.type === opts.type);

  const q = opts.query?.trim().toLowerCase();
  if (q) res = res.filter((t) => t.prompt.toLowerCase().includes(q));

  const sorted = [...res];
  switch (opts.sort) {
    case "newest":
      sorted.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case "oldest":
      sorted.sort((a, b) => a.createdAt - b.createdAt);
      break;
    case "progress":
      sorted.sort((a, b) => b.progress - a.progress);
      break;
  }
  return sorted;
}

// — агрегаты для глобального статус-бара —
export function selectActiveTasks(tasks: GenerationTask[]): GenerationTask[] {
  return tasks.filter((t) => t.status === "running" || t.status === "queued");
}

export function selectAvgProgress(tasks: GenerationTask[]): number {
  const active = selectActiveTasks(tasks);
  if (!active.length) return 0;
  return Math.round(active.reduce((sum, t) => sum + t.progress, 0) / active.length);
}
