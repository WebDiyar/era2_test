import { useEffect, useRef } from "react";
import type { Dispatch } from "react";
import type { GenType } from "@/entities/generation-task";
import type { QueueAction, QueueState } from "./queueReducer";
import { selectNextToStart } from "./selectors";
import { ERROR_MESSAGES, FAIL_RATE, MAX_CONCURRENT, TYPE_SPEED } from "../lib/constants";

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randomError = () => ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];
const etaFor = (type: GenType, progress: number) =>
  Math.max(1, Math.round(((100 - progress) / 100) * TYPE_SPEED[type].totalSec));

export function useQueueEngine(state: QueueState, dispatch: Dispatch<QueueAction>) {
  const timers = useRef(new Map<string, ReturnType<typeof setInterval>>());
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (state.phase !== "ready") return;
    for (const id of selectNextToStart(state.tasks, MAX_CONCURRENT)) {
      dispatch({ type: "START", id });
    }
  }, [state.tasks, state.phase, dispatch]);

  useEffect(() => {
    if (state.phase !== "ready") {
      timers.current.forEach((t) => clearInterval(t));
      timers.current.clear();
      return;
    }

    const runningIds = new Set(state.tasks.filter((t) => t.status === "running").map((t) => t.id));

    // снимаем таймеры у не-running — без «дотиков» после cancel/done/fail
    for (const [id, timer] of timers.current) {
      if (!runningIds.has(id)) {
        clearInterval(timer);
        timers.current.delete(id);
      }
    }

    for (const task of state.tasks) {
      if (task.status !== "running" || timers.current.has(task.id)) continue;

      const cfg = TYPE_SPEED[task.type];
      const willFail = Math.random() < FAIL_RATE;
      const failAt = rand(20, 85);

      const interval = setInterval(() => {
        const current = stateRef.current.tasks.find((t) => t.id === task.id);
        if (!current || current.status !== "running") return;

        const next = current.progress + rand(cfg.stepMin, cfg.stepMax);
        if (willFail && next >= failAt) {
          dispatch({ type: "FAIL", id: task.id, error: randomError() });
        } else if (next >= 100) {
          dispatch({ type: "COMPLETE", id: task.id });
        } else {
          dispatch({ type: "TICK", id: task.id, progress: next, etaSec: etaFor(task.type, next) });
        }
      }, rand(cfg.intervalMin, cfg.intervalMax));

      timers.current.set(task.id, interval);
    }
  }, [state.tasks, state.phase, dispatch]);

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearInterval(t));
      map.clear();
    };
  }, []);
}
