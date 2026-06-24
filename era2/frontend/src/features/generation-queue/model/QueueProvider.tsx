import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import type { Dispatch, ReactNode } from "react";
import { SEED_TASKS } from "@/entities/generation-task";
import { initialQueueState, queueReducer } from "./queueReducer";
import type { QueueAction, QueueState } from "./queueReducer";
import { useQueueEngine } from "./queueEngine";
import { loadTasks, saveTasks } from "../lib/storage";
import { INIT_DELAY_MS, INIT_FAIL_RATE } from "../lib/constants";

interface QueueContextValue {
  state: QueueState;
  dispatch: Dispatch<QueueAction>;
  reload: () => void;
}

const QueueContext = createContext<QueueContextValue | null>(null);

export function QueueProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(queueReducer, initialQueueState);
  const [nonce, setNonce] = useState(0);

  // первичная «загрузка»: задержка + возможный сбой, затем стор или сид
  useEffect(() => {
    let alive = true;
    dispatch({ type: "INIT_START" });
    const timer = setTimeout(() => {
      if (!alive) return;
      if (Math.random() < INIT_FAIL_RATE) {
        dispatch({ type: "INIT_ERROR" });
        return;
      }
      dispatch({ type: "INIT_SUCCESS", tasks: loadTasks() ?? SEED_TASKS });
    }, INIT_DELAY_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [nonce]);

  // персист в localStorage
  useEffect(() => {
    if (state.phase === "ready") saveTasks(state.tasks);
  }, [state.tasks, state.phase]);

  useQueueEngine(state, dispatch);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const value = useMemo(() => ({ state, dispatch, reload }), [state, reload]);

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}

export function useQueueContext() {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error("useQueue must be used inside QueueProvider");
  return ctx;
}
