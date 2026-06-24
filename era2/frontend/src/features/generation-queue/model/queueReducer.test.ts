import { describe, it, expect } from "vitest";
import type { GenerationTask, TaskStatus } from "@/entities/generation-task";
import { queueReducer, initialQueueState } from "./queueReducer";
import type { QueueState } from "./queueReducer";

function task(id: string, status: TaskStatus, over: Partial<GenerationTask> = {}): GenerationTask {
  return {
    id,
    type: "text",
    modelName: "GPT-4o",
    prompt: `prompt ${id}`,
    status,
    progress: status === "done" ? 100 : 0,
    createdAt: Number(id.replace(/\D/g, "")) || 0,
    credits: 10,
    ...over,
  };
}

function ready(tasks: GenerationTask[]): QueueState {
  return { phase: "ready", tasks };
}

describe("queueReducer — фазы инициализации", () => {
  it("INIT_START → loading, список пуст", () => {
    const s = queueReducer(ready([task("1", "done")]), { type: "INIT_START" });
    expect(s).toEqual({ phase: "loading", tasks: [] });
  });

  it("INIT_SUCCESS → ready с задачами", () => {
    const tasks = [task("1", "queued")];
    expect(queueReducer(initialQueueState, { type: "INIT_SUCCESS", tasks })).toEqual(ready(tasks));
  });

  it("INIT_ERROR → error", () => {
    expect(queueReducer(initialQueueState, { type: "INIT_ERROR" }).phase).toBe("error");
  });
});

describe("queueReducer — переходы конечного автомата", () => {
  it("START: queued → running, только для queued", () => {
    const s = queueReducer(ready([task("1", "queued"), task("2", "done")]), { type: "START", id: "1" });
    expect(s.tasks[0].status).toBe("running");
    // done не трогаем
    expect(queueReducer(s, { type: "START", id: "2" }).tasks[1].status).toBe("done");
  });

  it("TICK: растит прогресс у running и ограничивает 100", () => {
    const s = queueReducer(ready([task("1", "running", { progress: 40 })]), {
      type: "TICK",
      id: "1",
      progress: 150,
      etaSec: 5,
    });
    expect(s.tasks[0].progress).toBe(100);
    expect(s.tasks[0].etaSec).toBe(5);
  });

  it("TICK: не трогает не-running", () => {
    const s = queueReducer(ready([task("1", "queued")]), { type: "TICK", id: "1", progress: 50 });
    expect(s.tasks[0].progress).toBe(0);
  });

  it("COMPLETE: running → done, progress 100", () => {
    const s = queueReducer(ready([task("1", "running", { progress: 80 })]), { type: "COMPLETE", id: "1" });
    expect(s.tasks[0]).toMatchObject({ status: "done", progress: 100 });
  });

  it("COMPLETE: queued нельзя завершить", () => {
    const s = queueReducer(ready([task("1", "queued")]), { type: "COMPLETE", id: "1" });
    expect(s.tasks[0].status).toBe("queued");
  });

  it("FAIL: running → failed с текстом ошибки", () => {
    const s = queueReducer(ready([task("1", "running")]), { type: "FAIL", id: "1", error: "Превышено время ожидания" });
    expect(s.tasks[0]).toMatchObject({ status: "failed", error: "Превышено время ожидания" });
  });

  it("CANCEL: и running, и queued → canceled; done не трогаем", () => {
    const base = ready([task("1", "running"), task("2", "queued"), task("3", "done")]);
    expect(queueReducer(base, { type: "CANCEL", id: "1" }).tasks[0].status).toBe("canceled");
    expect(queueReducer(base, { type: "CANCEL", id: "2" }).tasks[1].status).toBe("canceled");
    expect(queueReducer(base, { type: "CANCEL", id: "3" }).tasks[2].status).toBe("done");
  });

  it("RETRY: failed/canceled → queued, прогресс и ошибка сброшены", () => {
    const base = ready([task("1", "failed", { progress: 50, error: "x" }), task("2", "canceled", { progress: 30 })]);
    const r1 = queueReducer(base, { type: "RETRY", id: "1" });
    expect(r1.tasks[0]).toMatchObject({ status: "queued", progress: 0, error: undefined });
    const r2 = queueReducer(base, { type: "RETRY", id: "2" });
    expect(r2.tasks[1]).toMatchObject({ status: "queued", progress: 0 });
  });

  it("RETRY: done нельзя повторить", () => {
    const s = queueReducer(ready([task("1", "done")]), { type: "RETRY", id: "1" });
    expect(s.tasks[0].status).toBe("done");
  });
});

describe("queueReducer — удаление и восстановление", () => {
  it("DELETE: удаляет по id", () => {
    const s = queueReducer(ready([task("1", "done"), task("2", "queued")]), { type: "DELETE", id: "1" });
    expect(s.tasks.map((t) => t.id)).toEqual(["2"]);
  });

  it("CLEAR_DONE: убирает только done", () => {
    const s = queueReducer(
      ready([task("1", "done"), task("2", "queued"), task("3", "done"), task("4", "failed")]),
      { type: "CLEAR_DONE" },
    );
    expect(s.tasks.map((t) => t.id)).toEqual(["2", "4"]);
  });

  it("RESTORE/BULK_ADD: добавляют без дублей по id", () => {
    const base = ready([task("1", "done")]);
    const restored = queueReducer(base, { type: "RESTORE", tasks: [task("1", "done"), task("2", "queued")] });
    expect(restored.tasks.map((t) => t.id)).toEqual(["1", "2"]);
    const added = queueReducer(base, { type: "BULK_ADD", tasks: [task("9", "queued")] });
    expect(added.tasks.map((t) => t.id)).toEqual(["1", "9"]);
  });
});

describe("queueReducer — REORDER_QUEUED", () => {
  it("переставляет queued по заданному порядку, не трогая остальные задачи на их местах", () => {
    const base = ready([
      task("A", "running"),
      task("B", "queued"),
      task("C", "done"),
      task("D", "queued"),
      task("E", "queued"),
    ]);
    const s = queueReducer(base, { type: "REORDER_QUEUED", orderedIds: ["E", "B", "D"] });
    // queued-слоты (индексы 1,3,4) теперь заняты E,B,D; A(running) и C(done) на местах
    expect(s.tasks.map((t) => t.id)).toEqual(["A", "E", "C", "B", "D"]);
    expect(s.tasks[0].status).toBe("running");
    expect(s.tasks[2].status).toBe("done");
  });

  it("при частичном orderedIds (поиск скрыл часть) невидимые queued остаются на местах", () => {
    const base = ready([task("A", "queued"), task("B", "queued"), task("C", "queued")]);
    // B скрыта фильтром; пользователь поменял местами видимые A и C
    const s = queueReducer(base, { type: "REORDER_QUEUED", orderedIds: ["C", "A"] });
    expect(s.tasks.map((t) => t.id)).toEqual(["C", "B", "A"]);
  });
});
