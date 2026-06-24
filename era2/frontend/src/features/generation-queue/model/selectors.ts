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

// queued в порядке массива — источник правды для FIFO/позиций/reorder
export function selectQueuedOrdered(tasks: GenerationTask[], query?: string): GenerationTask[] {
  let res = tasks.filter((t) => t.status === "queued");
  const q = query?.trim().toLowerCase();
  if (q) res = res.filter((t) => t.prompt.toLowerCase().includes(q));
  return res;
}

export function selectQueuePosition(tasks: GenerationTask[], id: string): number | null {
  const idx = tasks.filter((t) => t.status === "queued").findIndex((t) => t.id === id);
  return idx === -1 ? null : idx + 1;
}

// все позиции разом — O(n) для большого списка
export function selectQueuePositions(tasks: GenerationTask[]): Map<string, number> {
  const map = new Map<string, number>();
  let pos = 0;
  for (const t of tasks) if (t.status === "queued") map.set(t.id, ++pos);
  return map;
}

// какие queued стартовать, чтобы running ≤ max (чистая — под юнит-тест)
export function selectNextToStart(tasks: GenerationTask[], max: number): string[] {
  const running = tasks.filter((t) => t.status === "running").length;
  const free = max - running;
  if (free <= 0) return [];
  return tasks
    .filter((t) => t.status === "queued")
    .slice(0, free)
    .map((t) => t.id);
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

// средний прогресс по running (как в макете)
export function selectAvgProgress(tasks: GenerationTask[]): number {
  const running = tasks.filter((t) => t.status === "running");
  if (!running.length) return 0;
  return Math.round(running.reduce((sum, t) => sum + t.progress, 0) / running.length);
}
