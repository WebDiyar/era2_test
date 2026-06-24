import { useCallback, useMemo } from "react";
import type { GenerationTask } from "@/entities/generation-task";
import { useQueueContext } from "./QueueProvider";
import { selectCounts, selectQueuedOrdered } from "./selectors";
import { makeStressTasks } from "../lib/stress";
import { STRESS_BATCH } from "../lib/constants";

export function useQueue() {
  const { state, dispatch, reload } = useQueueContext();

  const counts = useMemo(() => selectCounts(state.tasks), [state.tasks]);

  const cancel = useCallback((id: string) => dispatch({ type: "CANCEL", id }), [dispatch]);
  const retry = useCallback((id: string) => dispatch({ type: "RETRY", id }), [dispatch]);
  const remove = useCallback((id: string) => dispatch({ type: "DELETE", id }), [dispatch]);
  const clearDone = useCallback(() => dispatch({ type: "CLEAR_DONE" }), [dispatch]);
  const restore = useCallback(
    (tasks: GenerationTask[]) => dispatch({ type: "RESTORE", tasks }),
    [dispatch],
  );

  const reorderQueued = useCallback(
    (orderedIds: string[]) => dispatch({ type: "REORDER_QUEUED", orderedIds }),
    [dispatch],
  );

  // клавиатурная альтернатива drag
  const moveQueued = useCallback(
    (id: string, dir: -1 | 1) => {
      const ids = selectQueuedOrdered(state.tasks).map((t) => t.id);
      const from = ids.indexOf(id);
      const to = from + dir;
      if (from === -1 || to < 0 || to >= ids.length) return;
      [ids[from], ids[to]] = [ids[to], ids[from]];
      dispatch({ type: "REORDER_QUEUED", orderedIds: ids });
    },
    [state.tasks, dispatch],
  );

  const addStress = useCallback(
    () => dispatch({ type: "BULK_ADD", tasks: makeStressTasks(STRESS_BATCH, state.tasks.length + 1) }),
    [dispatch, state.tasks.length],
  );

  return {
    phase: state.phase,
    tasks: state.tasks,
    counts,
    cancel,
    retry,
    remove,
    clearDone,
    restore,
    reorderQueued,
    moveQueued,
    addStress,
    reload,
  };
}
