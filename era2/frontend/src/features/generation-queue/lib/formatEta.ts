import type { GenerationTask, GenType } from "@/entities/generation-task";

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
      return `${task.durationLabel ? `${task.durationLabel} · ` : ""}готово · ${task.credits} cr`;
    case "failed":
      return task.error ?? "ошибка генерации";
    case "canceled":
      return "отменено пользователем";
  }
}

const TYPE_GENITIVE: Record<GenType, string> = {
  text: "текста",
  image: "изображения",
  video: "видео",
  audio: "аудио",
};

export function generationTitle(type: GenType): string {
  return `Генерация ${TYPE_GENITIVE[type]}`;
}

export function pluralGenerations(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "генерация";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "генерации";
  return "генераций";
}
