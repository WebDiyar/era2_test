import type { GenerationTask } from "@/entities/generation-task";

export type QueuePhase = "loading" | "ready" | "error";

export interface QueueState {
  phase: QueuePhase;
  tasks: GenerationTask[];
}

export type QueueAction =
  | { type: "INIT_START" }
  | { type: "INIT_SUCCESS"; tasks: GenerationTask[] }
  | { type: "INIT_ERROR" }
  | { type: "START"; id: string }
  | { type: "TICK"; id: string; progress: number; etaSec?: number }
  | { type: "COMPLETE"; id: string }
  | { type: "FAIL"; id: string; error: string }
  | { type: "CANCEL"; id: string }
  | { type: "RETRY"; id: string }
  | { type: "DELETE"; id: string }
  | { type: "CLEAR_DONE" }
  | { type: "RESTORE"; tasks: GenerationTask[] }
  | { type: "BULK_ADD"; tasks: GenerationTask[] }
  | { type: "REORDER_QUEUED"; orderedIds: string[] };

export const initialQueueState: QueueState = { phase: "loading", tasks: [] };

function patch(
  tasks: GenerationTask[],
  id: string,
  fn: (t: GenerationTask) => GenerationTask,
): GenerationTask[] {
  return tasks.map((t) => (t.id === id ? fn(t) : t));
}

export function queueReducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case "INIT_START":
      return { phase: "loading", tasks: [] };
    case "INIT_SUCCESS":
      return { phase: "ready", tasks: action.tasks };
    case "INIT_ERROR":
      return { phase: "error", tasks: [] };

    case "START":
      return {
        ...state,
        tasks: patch(state.tasks, action.id, (t) =>
          t.status === "queued" ? { ...t, status: "running" } : t,
        ),
      };

    case "TICK":
      return {
        ...state,
        tasks: patch(state.tasks, action.id, (t) =>
          t.status === "running"
            ? { ...t, progress: Math.min(100, action.progress), etaSec: action.etaSec }
            : t,
        ),
      };

    case "COMPLETE":
      return {
        ...state,
        tasks: patch(state.tasks, action.id, (t) =>
          t.status === "running"
            ? { ...t, status: "done", progress: 100, etaSec: undefined }
            : t,
        ),
      };

    case "FAIL":
      return {
        ...state,
        tasks: patch(state.tasks, action.id, (t) =>
          t.status === "running"
            ? { ...t, status: "failed", error: action.error, etaSec: undefined }
            : t,
        ),
      };

    case "CANCEL":
      return {
        ...state,
        tasks: patch(state.tasks, action.id, (t) =>
          t.status === "running" || t.status === "queued"
            ? { ...t, status: "canceled", etaSec: undefined }
            : t,
        ),
      };

    case "RETRY":
      return {
        ...state,
        tasks: patch(state.tasks, action.id, (t) =>
          t.status === "failed" || t.status === "canceled"
            ? { ...t, status: "queued", progress: 0, error: undefined, etaSec: undefined }
            : t,
        ),
      };

    case "DELETE":
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };

    case "CLEAR_DONE":
      return { ...state, tasks: state.tasks.filter((t) => t.status !== "done") };

    case "RESTORE": {
      const existing = new Set(state.tasks.map((t) => t.id));
      const add = action.tasks.filter((t) => !existing.has(t.id));
      return { ...state, tasks: [...state.tasks, ...add] };
    }

    case "BULK_ADD": {
      const existing = new Set(state.tasks.map((t) => t.id));
      const add = action.tasks.filter((t) => !existing.has(t.id));
      return { ...state, tasks: [...state.tasks, ...add] };
    }

    // orderedIds = новый порядок ВИДИМЫХ queued (при активном поиске часть скрыта).
    // переставляем только их в своих слотах; queued вне списка и остальные задачи — на местах.
    case "REORDER_QUEUED": {
      const ordered = action.orderedIds;
      const inOrder = new Set(ordered);
      const byId = new Map(state.tasks.map((t) => [t.id, t]));
      let vi = 0;
      const queued = state.tasks
        .filter((t) => t.status === "queued")
        .map((t) => (inOrder.has(t.id) ? byId.get(ordered[vi++])! : t));
      let qi = 0;
      const tasks = state.tasks.map((t) => (t.status === "queued" ? queued[qi++] : t));
      return { ...state, tasks };
    }

    default:
      return state;
  }
}
