import type { GenerationTask } from "@/entities/generation-task";
import { STORAGE_KEY } from "./constants";

// рехидрация: running → queued (прогресс сохраняем), движок продолжит с учётом лимита слотов
export function loadTasks(): GenerationTask[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GenerationTask[];
    if (!Array.isArray(parsed)) return null;
    return parsed.map((t) =>
      t.status === "running" ? { ...t, status: "queued", etaSec: undefined } : t,
    );
  } catch {
    return null;
  }
}

export function saveTasks(tasks: GenerationTask[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    /* нет доступа / квота — игнорируем */
  }
}
