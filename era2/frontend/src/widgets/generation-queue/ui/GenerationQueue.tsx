import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  QueueStats,
  QueueToolbar,
  TaskRow,
  selectQueuePosition,
  selectVisible,
  useQueue,
} from "@/features/generation-queue";
import type { SortOrder, StatusFilter } from "@/features/generation-queue";

export function GenerationQueue() {
  const { phase, tasks, counts, cancel, retry, remove, restore, clearDone, reload } = useQueue();

  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () => selectVisible(tasks, { status, sort, query }),
    [tasks, status, sort, query],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      remove(id);
      if (task) {
        toast("Задача удалена", {
          action: { label: "Отменить", onClick: () => restore([task]) },
        });
      }
    },
    [tasks, remove, restore],
  );

  const handleClearDone = useCallback(() => {
    const done = tasks.filter((t) => t.status === "done");
    if (!done.length) return;
    clearDone();
    toast(`Удалено готовых: ${done.length}`, {
      action: { label: "Отменить", onClick: () => restore(done) },
    });
  }, [tasks, clearDone, restore]);

  const handleDownload = useCallback(() => toast("Скачивание — заглушка"), []);

  return (
    <div className="mx-auto max-w-280 px-6 py-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Очередь генераций</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Все ваши задачи в реальном времени</p>
        </div>
        <Button variant="ghost" onClick={handleClearDone}>
          Очистить готовые
        </Button>
      </header>

      <div className="mt-7">
        <QueueStats counts={counts} />
      </div>

      <div className="mt-6">
        <QueueToolbar
          status={status}
          onStatusChange={setStatus}
          sort={sort}
          onSortChange={setSort}
          onSearchChange={setQuery}
        />
      </div>

      <div className="mt-5 space-y-3">
        {phase === "loading" && <LoadingState />}
        {phase === "error" && <ErrorState onRetry={reload} />}

        {phase === "ready" && visible.length === 0 && (
          <EmptyState
            {...(tasks.length === 0
              ? { title: "Очередь пуста", description: "Здесь появятся ваши задачи генерации." }
              : { title: "Ничего не найдено", description: "Попробуйте изменить фильтр или запрос." })}
          />
        )}

        {phase === "ready" &&
          visible.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              queuePosition={selectQueuePosition(tasks, task.id)}
              onCancel={() => cancel(task.id)}
              onRetry={() => retry(task.id)}
              onDownload={handleDownload}
              onDelete={() => handleDelete(task.id)}
            />
          ))}
      </div>
    </div>
  );
}
