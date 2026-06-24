import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "@/shared/routing";
import { cn } from "@/shared/lib/utils";
import { useQueue } from "../model/useQueue";
import { selectActiveTasks, selectAvgProgress } from "../model/selectors";
import { ProgressBar } from "./ProgressBar";
import { TaskTypeIcon } from "./TaskTypeIcon";
import { formatPercent } from "../lib/formatEta";

export function GenerationStatusBar() {
  const { tasks } = useQueue();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const active = selectActiveTasks(tasks);
  const avg = selectAvgProgress(tasks);
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
          className="fixed bottom-6 right-6 z-50 w-[340px]"
        >
          {collapsed ? (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="flex w-full items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-3 text-sm shadow-2xl backdrop-blur"
            >
              <Loader2 className="size-4 animate-spin text-primary" />
              <span className="font-medium text-foreground">
                {active.length} {active.length === 1 ? "генерация" : "генераций"}
              </span>
              <span className="font-mono text-primary">{avg}%</span>
              <ArrowRight className="ml-auto size-4 text-muted-foreground" />
            </button>
          ) : (
            <div className="overflow-hidden rounded-[18px] border border-border bg-card/95 shadow-2xl backdrop-blur">
              {active.length === 1 ? (
                <CompactCard task={active[0]} onOpen={openQueue} />
              ) : (
                <ExpandedCard
                  tasks={active}
                  avg={avg}
                  onOpen={openQueue}
                  onCollapse={() => setCollapsed(true)}
                />
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CompactCard({
  task,
  onOpen,
}: {
  task: ReturnType<typeof selectActiveTasks>[number];
  onOpen: () => void;
}) {
  return (
    <button type="button" onClick={onOpen} className="block w-full p-4 text-left">
      <div className="flex items-center gap-3">
        <TaskTypeIcon type={task.type} className="size-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{task.modelName}</p>
          <p className="truncate text-xs text-muted-foreground">{task.prompt}</p>
        </div>
        <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <ProgressBar value={task.progress} />
        <span className="font-mono text-xs text-primary">{formatPercent(task.progress)}</span>
      </div>
    </button>
  );
}

function ExpandedCard({
  tasks,
  avg,
  onOpen,
  onCollapse,
}: {
  tasks: ReturnType<typeof selectActiveTasks>;
  avg: number;
  onOpen: () => void;
  onCollapse: () => void;
}) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
        <p className="text-sm font-medium text-foreground">
          Генерации идут · {tasks.length} активны · {avg}%
        </p>
        <button
          type="button"
          onClick={onCollapse}
          className="ml-auto text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Свернуть"
        >
          <ChevronDown className="size-4" />
        </button>
      </div>

      <div className="mt-3 space-y-2.5">
        {tasks.slice(0, 3).map((task) => (
          <div key={task.id} className="flex items-center gap-2">
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                task.status === "running" ? "bg-primary" : "bg-muted-foreground",
              )}
            />
            <span className="w-24 shrink-0 truncate font-mono text-[11px] text-muted-foreground">
              {task.modelName}
            </span>
            <ProgressBar value={task.progress} />
            <span className="w-9 shrink-0 text-right font-mono text-[11px] text-primary">
              {formatPercent(task.progress)}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-3 flex items-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-80"
      >
        Открыть очередь
        <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
