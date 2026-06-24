import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  QueueStats,
  QueueToolbar,
  TaskList,
  selectQueuePositions,
  selectQueuedOrdered,
  selectVisible,
  useQueue,
} from "@/features/generation-queue";
import type { SortOrder, StatusFilter, TypeFilter } from "@/features/generation-queue";

export function GenerationQueue() {
  const {
    phase,
    tasks,
    counts,
    cancel,
    retry,
    remove,
    restore,
    clearDone,
    reorderQueued,
    moveQueued,
    addStress,
    reload,
  } = useQueue();
  const isMobile = useIsMobile();

  const [status, setStatus] = useState<StatusFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [query, setQuery] = useState("");

  // вкладка «В очереди» — порядок очереди (drag), без сортировки
  const isQueuedTab = status === "queued";

  const visible = useMemo(() => {
    const base = isQueuedTab
      ? selectQueuedOrdered(tasks, query)
      : selectVisible(tasks, { status, sort, query });
    return type === "all" ? base : base.filter((t) => t.type === type);
  }, [tasks, status, type, sort, query, isQueuedTab]);
  const positions = useMemo(() => selectQueuePositions(tasks), [tasks]);

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

  const handleCancel = useCallback(
    (id: string) => {
      cancel(id);
      toast("Генерация отменена", {
        action: { label: "Вернуть", onClick: () => retry(id) },
      });
    },
    [cancel, retry],
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
    <div className="mx-auto max-w-280 px-4 py-6 md:px-6 md:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Очередь генераций
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Все ваши задачи в реальном времени</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={addStress}
            title="Демо производительности: добавить 1000 задач (виртуализация списка)"
          >
            +1000 (демо)
          </Button>
          <Button variant="ghost" onClick={handleClearDone}>
            Очистить готовые
          </Button>
        </div>
      </header>

      <div className="mt-7">
        <QueueStats counts={counts} />
      </div>

      <div className="mt-6">
        <QueueToolbar
          status={status}
          onStatusChange={setStatus}
          type={type}
          onTypeChange={setType}
          sort={sort}
          onSortChange={setSort}
          onSearchChange={setQuery}
        />
      </div>

      {isQueuedTab && visible.length > 1 && (
        <p className="mt-4 text-xs text-muted-foreground">
          Перетащите задачи за ручку, чтобы изменить порядок выполнения (или стрелки ↑/↓).
        </p>
      )}

      <div className="mt-5">
        {phase === "loading" && <LoadingState />}
        {phase === "error" && <ErrorState onRetry={reload} />}

        {phase === "ready" && visible.length === 0 && (
          <EmptyState
            {...(tasks.length === 0
              ? { title: "Очередь пуста", description: "Здесь появятся ваши задачи генерации." }
              : { title: "Ничего не найдено", description: "Попробуйте изменить фильтр или запрос." })}
          />
        )}

        {phase === "ready" && visible.length > 0 && (
          <TaskList
            tasks={visible}
            positions={positions}
            variant={isMobile ? "card" : "row"}
            draggable={isQueuedTab}
            onReorder={reorderQueued}
            onMove={moveQueued}
            onCancel={handleCancel}
            onRetry={retry}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
