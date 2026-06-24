import { ArrowDown, ArrowUp, Download, MoreHorizontal, RotateCcw, Trash2, X } from "lucide-react";
import type { TaskStatus } from "@/entities/generation-task";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

export interface TaskActionHandlers {
  onCancel: () => void;
  onRetry: () => void;
  onDownload: () => void;
  onDelete: () => void;
  // перестановка очереди (только queued, опционально)
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

interface Props extends TaskActionHandlers {
  status: TaskStatus;
}

const iconBtn =
  "flex size-9 items-center justify-center rounded-[10px] border border-border bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function TaskActions({
  status,
  onCancel,
  onRetry,
  onDownload,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: Props) {
  const canCancel = status === "running" || status === "queued";
  const canRetry = status === "failed" || status === "canceled";
  const showMove = status === "queued" && (onMoveUp || onMoveDown);

  return (
    <div className="flex items-center gap-1.5">
      {canCancel && (
        <button type="button" className={iconBtn} onClick={onCancel} aria-label="Отменить">
          <X className="size-4" />
        </button>
      )}
      {canRetry && (
        <button type="button" className={iconBtn} onClick={onRetry} aria-label="Повторить">
          <RotateCcw className="size-4" />
        </button>
      )}
      {status === "done" && (
        <button type="button" className={iconBtn} onClick={onDownload} aria-label="Скачать">
          <Download className="size-4" />
        </button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={iconBtn} aria-label="Ещё действия">
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {status === "done" && (
            <DropdownMenuItem className="gap-2" onClick={onDownload}>
              <Download className="size-4" /> Скачать
            </DropdownMenuItem>
          )}
          {canRetry && (
            <DropdownMenuItem className="gap-2" onClick={onRetry}>
              <RotateCcw className="size-4" /> Повторить
            </DropdownMenuItem>
          )}
          {canCancel && (
            <DropdownMenuItem className="gap-2" onClick={onCancel}>
              <X className="size-4" /> Отменить
            </DropdownMenuItem>
          )}
          {showMove && (
            <>
              <DropdownMenuItem className="gap-2" disabled={!canMoveUp} onClick={onMoveUp}>
                <ArrowUp className="size-4" /> Выше в очереди
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" disabled={!canMoveDown} onClick={onMoveDown}>
                <ArrowDown className="size-4" /> Ниже в очереди
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-destructive focus:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-4" /> Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
