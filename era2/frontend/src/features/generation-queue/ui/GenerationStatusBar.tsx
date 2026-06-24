import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, Loader2 } from "lucide-react";
import type { GenerationTask } from "@/entities/generation-task";
import { useLocation, useNavigate } from "@/shared/routing";
import { useQueue } from "../model/useQueue";
import { selectActiveTasks, selectAvgProgress } from "../model/selectors";
import { ProgressBar } from "./ProgressBar";
import { TaskTypeIcon } from "./TaskTypeIcon";
import { formatPercent, generationTitle, pluralGenerations } from "../lib/formatEta";

export function GenerationStatusBar() {
  const { tasks } = useQueue();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const active = selectActiveTasks(tasks);
  const avg = selectAvgProgress(tasks);
  // running вперёд (по прогрессу), затем queued
  const ordered = [...active].sort((a, b) =>
    a.status !== b.status ? (a.status === "running" ? -1 : 1) : b.progress - a.progress,
  );

  // виден поверх любого экрана, кроме самой страницы очереди
  const visible = active.length > 0 && pathname !== "/queue";
  const openQueue = () => navigate("/queue");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-50 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-85 sm:p-0 sm:pb-0"
        >
          {/* mobile — слим-бар на всю ширину */}
          <div className="md:hidden">
            <MobileBar count={active.length} avg={avg} onOpen={openQueue} />
          </div>

          {/* desktop / tablet — плавающая карточка */}
          <div className="hidden md:block">
            {collapsed ? (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="flex w-full items-center gap-2 rounded-full border border-primary/25 bg-card/95 px-4 py-3 shadow-2xl backdrop-blur"
              >
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {active.length} {pluralGenerations(active.length)}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="font-mono text-sm text-primary">{avg}%</span>
              </button>
            ) : (
              <div className="overflow-hidden rounded-[18px] border border-primary/20 bg-card/95 shadow-2xl backdrop-blur">
                {active.length === 1 ? (
                  <SingleCard task={ordered[0]} onOpen={openQueue} />
                ) : (
                  <ExpandedCard
                    tasks={ordered}
                    count={active.length}
                    avg={avg}
                    onOpen={openQueue}
                    onCollapse={() => setCollapsed(true)}
                  />
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MobileBar({ count, avg, onOpen }: { count: number; avg: number; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative block w-full overflow-hidden rounded-md border border-primary/20 bg-card/95 px-4 py-3 text-left shadow-2xl backdrop-blur"
    >
      <span className="absolute inset-x-0 top-0 h-0.5 bg-foreground/10">
        <span
          className="block h-full bg-primary transition-[width] duration-300"
          style={{ width: `${avg}%` }}
        />
      </span>
      <div className="flex items-center gap-3">
        <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">Генерации идут</p>
          <p className="text-xs text-muted-foreground">
            {count} активны · {avg}%
          </p>
        </div>
        <ArrowRight className="size-4 shrink-0 text-primary" />
      </div>
    </button>
  );
}

function SingleCard({ task, onOpen }: { task: GenerationTask; onOpen: () => void }) {
  const running = task.status === "running";
  return (
    <button type="button" onClick={onOpen} className="block w-full p-4 text-left">
      <div className="flex items-center gap-2">
        <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
        <p className="flex-1 truncate text-sm font-semibold text-foreground">
          {generationTitle(task.type)}
        </p>
        <ArrowRight className="size-4 text-muted-foreground" />
      </div>
      <p className="ml-6 mt-0.5 truncate font-mono text-xs text-muted-foreground">
        {task.modelName} · {running ? formatPercent(task.progress) : "в очереди"}
      </p>

      <div className="mt-3 flex gap-3">
        <div className="size-11 shrink-0 rounded-[10px] bg-accent" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[13px] text-foreground">{task.prompt}</p>
          {running && <ProgressBar value={task.progress} className="mt-2" />}
        </div>
      </div>
    </button>
  );
}

function ExpandedCard({
  tasks,
  count,
  avg,
  onOpen,
  onCollapse,
}: {
  tasks: GenerationTask[];
  count: number;
  avg: number;
  onOpen: () => void;
  onCollapse: () => void;
}) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-2">
        <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-primary" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Генерации идут</p>
          <p className="text-xs text-muted-foreground">
            {count} активны · {avg}%
          </p>
        </div>
        <button
          type="button"
          onClick={onCollapse}
          className="-mr-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Свернуть"
        >
          <ChevronDown className="size-4" />
        </button>
      </div>

      <div className="mt-3 space-y-2.5">
        {tasks.slice(0, 3).map((task) => (
          <div key={task.id} className="flex items-center gap-2.5">
            <TaskTypeIcon type={task.type} className="size-8 rounded-sm" />
            <span className="w-24 shrink-0 truncate text-[13px] text-foreground">{task.prompt}</span>
            {task.status === "running" ? (
              <>
                <ProgressBar value={task.progress} className="flex-1" />
                <span className="w-9 shrink-0 text-right font-mono text-[11px] text-primary">
                  {formatPercent(task.progress)}
                </span>
              </>
            ) : (
              <span className="flex-1 text-right font-mono text-[11px] text-muted-foreground">
                в очереди
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-border pt-2">
        <button
          type="button"
          onClick={onOpen}
          className="flex w-full items-center justify-center gap-1.5 rounded-[10px] py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
        >
          Открыть очередь
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
