import type { GenerationTask, GenType, TaskStatus } from "@/entities/generation-task";

const TYPES: GenType[] = ["text", "image", "video", "audio"];
const MODELS = ["Veo 3", "Midjourney v7", "Claude Sonnet 4.5", "GPT-4o", "Flux 1.1 Pro", "Suno v4", "Sora 2", "Kling 2.5 Turbo"];
const PROMPTS = [
  "Кинематографичный кадр с драматическим светом",
  "Минималистичная иллюстрация в тёплых тонах",
  "Эмбиент-трек с мягкими синтезаторами",
  "Короткий ролик: плавный пролёт камеры",
  "Портрет в стиле барокко при свечах",
  "Изометрическая сцена уютного интерьера",
];

// детерминированный «random» — стресс-набор воспроизводим
function pick<T>(arr: T[], n: number): T {
  return arr[n % arr.length];
}

// демо-набор для виртуализации; без running — слоты держит движок
export function makeStressTasks(count: number, startId: number): GenerationTask[] {
  const now = Date.now();
  const statuses: TaskStatus[] = ["queued", "done", "failed", "canceled"];
  return Array.from({ length: count }, (_, i) => {
    const id = startId + i;
    const status = pick(statuses, i + (i % 3));
    const type = pick(TYPES, i);
    return {
      id: `stress-${id}`,
      type,
      modelName: pick(MODELS, i),
      prompt: `${pick(PROMPTS, i)} #${id}`,
      status,
      progress: status === "done" ? 100 : status === "failed" || status === "canceled" ? (i * 7) % 90 : 0,
      createdAt: now - i * 1000,
      credits: 5 + (i % 20) * 5,
      ...(status === "failed" ? { error: "Превышено время ожидания" } : {}),
    } satisfies GenerationTask;
  });
}
