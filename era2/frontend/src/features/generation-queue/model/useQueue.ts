import { useCallback, useMemo } from "react";
import type { GenerationTask } from "@/entities/generation-task";
import { useQueueContext } from "./QueueProvider";
import { selectCounts } from "./selectors";

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

  return {
    phase: state.phase,
    tasks: state.tasks,
    counts,
    cancel,
    retry,
    remove,
    clearDone,
    restore,
    reload,
  };
}
