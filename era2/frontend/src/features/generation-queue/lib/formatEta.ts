import type { GenerationTask } from "@/entities/generation-task";

export function formatEta(sec?: number): string {
  if (sec == null || sec <= 0) return "—";
  if (sec < 60) return `${Math.round(sec)} сек`;
  return `${Math.round(sec / 60)} мин`;
}

export function formatPercent(progress: number): string {
  return `${Math.round(progress)}%`;
}

export function taskMeta(task: GenerationTask, queuePosition?: number | null): string {
  switch (task.status) {
    case "running":
      return `≈${formatEta(task.etaSec)} · ${task.credits} cr`;
    case "queued":
      return `${queuePosition ? `позиция ${queuePosition} в очереди` : "в очереди"} · ${task.credits} cr`;
    case "done":
      return `готово · ${task.credits} cr`;
    case "failed":
      return task.error ?? "ошибка генерации";
    case "canceled":
      return "отменено пользователем";
  }
}
