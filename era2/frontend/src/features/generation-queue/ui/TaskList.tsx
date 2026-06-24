import { useRef } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion, Reorder, useDragControls, useReducedMotion } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import { GripVertical } from "lucide-react";
import type { GenerationTask } from "@/entities/generation-task";
import { cn } from "@/shared/lib/utils";
import { VIRTUALIZE_THRESHOLD } from "../lib/constants";
import { TaskRow } from "./TaskRow";
import { TaskCard } from "./TaskCard";

export interface TaskListProps {
  tasks: GenerationTask[];
  positions: Map<string, number>;
  variant: "row" | "card";
  draggable?: boolean;
  onReorder?: (orderedIds: string[]) => void;
  onMove?: (id: string, dir: -1 | 1) => void;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskList(props: TaskListProps) {
  const { tasks, draggable } = props;
  const virtualize = tasks.length > VIRTUALIZE_THRESHOLD;

  if (virtualize) return <VirtualList {...props} />;
  if (draggable) return <ReorderList {...props} />;
  return <AnimatedList {...props} />;
}

// рендер строки/карточки с колбэками, привязанными к id
function useRowRenderer({
  tasks,
  positions,
  variant,
  draggable,
  onMove,
  onCancel,
  onRetry,
  onDownload,
  onDelete,
}: TaskListProps) {
  return (task: GenerationTask, index: number, dragHandle?: ReactNode) => {
    const id = task.id;
    const canMove = !!draggable && task.status === "queued";
    const shared = {
      task,
      queuePosition: positions.get(id) ?? null,
      dragHandle,
      onCancel: () => onCancel(id),
      onRetry: () => onRetry(id),
      onDownload: () => onDownload(id),
      onDelete: () => onDelete(id),
      ...(canMove
        ? {
            onMoveUp: () => onMove?.(id, -1),
            onMoveDown: () => onMove?.(id, 1),
            canMoveUp: index > 0,
            canMoveDown: index < tasks.length - 1,
          }
        : {}),
    };
    return variant === "card" ? <TaskCard {...shared} /> : <TaskRow {...shared} />;
  };
}

// виртуализация для больших списков (без анимаций/drag ради скорости)
function VirtualList(props: TaskListProps) {
  const { tasks, variant } = props;
  const renderRow = useRowRenderer(props);
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (variant === "card" ? 150 : 92),
    overscan: 8,
  });

  return (
    <div
      ref={parentRef}
      className="scrollbar-thin max-h-[70vh] overflow-auto pr-1"
      aria-label="Список задач генерации"
    >
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((vi) => {
          const task = tasks[vi.index];
          return (
            <div
              key={task.id}
              data-index={vi.index}
              ref={virtualizer.measureElement}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${vi.start}px)` }}
              className="pb-3"
            >
              {renderRow(task, vi.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// drag-to-reorder для queued (Reorder + клавиатура)
function ReorderList(props: TaskListProps) {
  const { tasks, onReorder, onMove } = props;
  const renderRow = useRowRenderer(props);
  const reduce = useReducedMotion();
  const ids = tasks.map((t) => t.id);

  return (
    <Reorder.Group
      axis="y"
      values={ids}
      onReorder={(next) => onReorder?.(next as string[])}
      className="space-y-3"
      aria-label="Очередь задач — перетащите за ручку, чтобы изменить порядок"
    >
      <AnimatePresence initial={false}>
        {tasks.map((task, index) => (
          <DraggableItem
            key={task.id}
            id={task.id}
            reduce={!!reduce}
            onMoveUp={() => onMove?.(task.id, -1)}
            onMoveDown={() => onMove?.(task.id, 1)}
            renderRow={(handle) => renderRow(task, index, handle)}
          />
        ))}
      </AnimatePresence>
    </Reorder.Group>
  );
}

function DraggableItem({
  id,
  reduce,
  onMoveUp,
  onMoveDown,
  renderRow,
}: {
  id: string;
  reduce: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  renderRow: (handle: ReactNode) => ReactNode;
}) {
  const controls = useDragControls();

  const handle = (
    <button
      type="button"
      aria-label="Перетащить для изменения порядка (стрелки вверх/вниз — с клавиатуры)"
      onPointerDown={(e) => controls.start(e)}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          onMoveUp();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          onMoveDown();
        }
      }}
      className="flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
    >
      <GripVertical className="size-4" />
    </button>
  );

  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={controls}
      className="list-none"
      {...(reduce
        ? { transition: { duration: 0 } }
        : {
            initial: { opacity: 0, y: 8 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, scale: 0.97 },
            transition: { duration: 0.2, ease: "easeOut" },
          })}
    >
      {renderRow(handle)}
    </Reorder.Item>
  );
}

// обычный список с анимацией появления/удаления
function AnimatedList(props: TaskListProps) {
  const { tasks } = props;
  const renderRow = useRowRenderer(props);
  const reduce = useReducedMotion();

  return (
    <div className="space-y-3" aria-label="Список задач генерации">
      <AnimatePresence initial={false}>
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            layout={!reduce}
            {...(reduce
              ? {}
              : {
                  initial: { opacity: 0, y: 8 },
                  animate: { opacity: 1, y: 0 },
                  exit: { opacity: 0, scale: 0.97 },
                  transition: { duration: 0.2, ease: "easeOut" },
                })}
          >
            {renderRow(task, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
