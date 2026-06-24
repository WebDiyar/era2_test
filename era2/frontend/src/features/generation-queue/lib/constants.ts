import type { GenType } from "@/entities/generation-task";

export const MAX_CONCURRENT = 2;
export const FAIL_RATE = 0.15;

export const STORAGE_KEY = "era2:generation-queue";

// больше строк — включаем виртуализацию (TaskList)
export const VIRTUALIZE_THRESHOLD = 40;

// размер пачки демо стресс-теста виртуализации
export const STRESS_BATCH = 1000;

export const INIT_DELAY_MS = 600;
// > 0 — эмуляция сбоя загрузки (ErrorState)
export const INIT_FAIL_RATE = 0.1;

export const ERROR_MESSAGES = [
  "Недостаточно кредитов",
  "Превышено время ожидания",
  "Модель временно недоступна",
];

interface TypeSpeed {
  stepMin: number;
  stepMax: number;
  intervalMin: number;
  intervalMax: number;
  totalSec: number;
}

// video/audio «генерируются» дольше: меньше шаг и реже тик
export const TYPE_SPEED: Record<GenType, TypeSpeed> = {
  text: { stepMin: 8, stepMax: 16, intervalMin: 400, intervalMax: 650, totalSec: 8 },
  image: { stepMin: 5, stepMax: 11, intervalMin: 450, intervalMax: 700, totalSec: 20 },
  audio: { stepMin: 3, stepMax: 7, intervalMin: 500, intervalMax: 750, totalSec: 40 },
  video: { stepMin: 2, stepMax: 5, intervalMin: 550, intervalMax: 800, totalSec: 75 },
};
