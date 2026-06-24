import { describe, it, expect } from "vitest";
import type { GenerationTask, TaskStatus } from "@/entities/generation-task";
import {
  selectCounts,
  selectVisible,
  selectQueuePosition,
  selectQueuePositions,
  selectQueuedOrdered,
  selectNextToStart,
  selectActiveTasks,
  selectAvgProgress,
} from "./selectors";

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

describe("selectNextToStart — лимит слотов и FIFO", () => {
  const MAX = 2;

  it("оба слота свободны → берём первые две queued в порядке очереди", () => {
    const tasks = [task("q1", "queued"), task("q2", "queued"), task("q3", "queued")];
    expect(selectNextToStart(tasks, MAX)).toEqual(["q1", "q2"]);
  });

  it("один слот занят → берём только одну следующую", () => {
    const tasks = [task("r", "running"), task("q1", "queued"), task("q2", "queued")];
    expect(selectNextToStart(tasks, MAX)).toEqual(["q1"]);
  });

  it("оба слота заняты → не запускаем ничего", () => {
    const tasks = [task("r1", "running"), task("r2", "running"), task("q1", "queued")];
    expect(selectNextToStart(tasks, MAX)).toEqual([]);
  });

  it("FIFO следует порядку массива (после drag-reorder), а не createdAt", () => {
    // q3 раньше по времени, но стоит позже в очереди → запускаем q1
    const tasks = [task("q1", "queued", { createdAt: 100 }), task("q3", "queued", { createdAt: 1 })];
    expect(selectNextToStart(tasks, 1)).toEqual(["q1"]);
  });

  it("нет queued → пусто", () => {
    expect(selectNextToStart([task("d", "done")], MAX)).toEqual([]);
  });
});

describe("selectCounts", () => {
  it("считает по статусам и общий total", () => {
    const tasks = [
      task("1", "queued"),
      task("2", "queued"),
      task("3", "running"),
      task("4", "done"),
      task("5", "failed"),
      task("6", "canceled"),
    ];
    expect(selectCounts(tasks)).toEqual({ queued: 2, running: 1, done: 1, failed: 1, canceled: 1, total: 6 });
  });
});

describe("позиции в очереди", () => {
  const tasks = [task("a", "queued"), task("r", "running"), task("b", "queued"), task("c", "queued")];

  it("selectQueuePosition: 1-based по порядку очереди, null для не-queued", () => {
    expect(selectQueuePosition(tasks, "a")).toBe(1);
    expect(selectQueuePosition(tasks, "b")).toBe(2);
    expect(selectQueuePosition(tasks, "c")).toBe(3);
    expect(selectQueuePosition(tasks, "r")).toBeNull();
  });

  it("selectQueuePositions: карта всех позиций сразу", () => {
    const map = selectQueuePositions(tasks);
    expect([...map.entries()]).toEqual([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]);
  });
});

describe("selectQueuedOrdered", () => {
  it("возвращает queued в порядке массива", () => {
    const tasks = [task("a", "queued"), task("r", "running"), task("b", "queued")];
    expect(selectQueuedOrdered(tasks).map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("фильтрует по запросу (без регистра)", () => {
    const tasks = [
      task("a", "queued", { prompt: "Котик в космосе" }),
      task("b", "queued", { prompt: "Собака на пляже" }),
    ];
    expect(selectQueuedOrdered(tasks, "КОТ").map((t) => t.id)).toEqual(["a"]);
  });
});

describe("selectVisible — фильтр, поиск, сортировка", () => {
  const tasks = [
    task("1", "queued", { createdAt: 10, progress: 0, type: "image", prompt: "Закат над морем" }),
    task("2", "running", { createdAt: 30, progress: 60, type: "video", prompt: "Дрон над городом" }),
    task("3", "done", { createdAt: 20, progress: 100, type: "text", prompt: "Стих про море" }),
  ];

  it("фильтр по статусу", () => {
    expect(selectVisible(tasks, { status: "running", sort: "newest" }).map((t) => t.id)).toEqual(["2"]);
  });

  it("фильтр по типу", () => {
    expect(selectVisible(tasks, { status: "all", type: "video", sort: "newest" }).map((t) => t.id)).toEqual(["2"]);
  });

  it("поиск по промпту без регистра", () => {
    expect(selectVisible(tasks, { status: "all", sort: "newest", query: "МОРЕ" }).map((t) => t.id).sort()).toEqual([
      "1",
      "3",
    ]);
  });

  it("сортировка newest/oldest по createdAt", () => {
    expect(selectVisible(tasks, { status: "all", sort: "newest" }).map((t) => t.id)).toEqual(["2", "3", "1"]);
    expect(selectVisible(tasks, { status: "all", sort: "oldest" }).map((t) => t.id)).toEqual(["1", "3", "2"]);
  });

  it("сортировка по прогрессу (по убыванию)", () => {
    expect(selectVisible(tasks, { status: "all", sort: "progress" }).map((t) => t.id)).toEqual(["3", "2", "1"]);
  });

  it("не мутирует исходный массив", () => {
    const before = tasks.map((t) => t.id);
    selectVisible(tasks, { status: "all", sort: "oldest" });
    expect(tasks.map((t) => t.id)).toEqual(before);
  });
});

describe("агрегаты статус-бара", () => {
  it("selectActiveTasks: running + queued", () => {
    const tasks = [task("1", "running"), task("2", "queued"), task("3", "done"), task("4", "failed")];
    expect(selectActiveTasks(tasks).map((t) => t.id)).toEqual(["1", "2"]);
  });

  it("selectAvgProgress: среднее по running", () => {
    const tasks = [task("1", "running", { progress: 40 }), task("2", "running", { progress: 60 }), task("3", "queued")];
    expect(selectAvgProgress(tasks)).toBe(50);
  });

  it("selectAvgProgress: нет running → 0", () => {
    expect(selectAvgProgress([task("1", "queued")])).toBe(0);
  });
});
