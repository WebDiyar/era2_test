export type GenType = "text" | "image" | "video" | "audio";

export type TaskStatus = "queued" | "running" | "done" | "failed" | "canceled";

export interface GenerationTask {
  id: string;
  type: GenType;
  modelName: string;
  prompt: string;
  status: TaskStatus;
  progress: number; // 0–100
  createdAt: number; // epoch ms
  credits: number;
  etaSec?: number;
  durationLabel?: string;
  error?: string; // только при failed
}
