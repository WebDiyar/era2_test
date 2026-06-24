import { Download, MoreHorizontal, RotateCcw, Trash2, X } from "lucide-react";
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
}

interface Props extends TaskActionHandlers {
  status: TaskStatus;
}

const iconBtn =
  "flex size-9 items-center justify-center rounded-[10px] border border-white/[0.06] bg-white/[0.02] text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function TaskActions({ status, onCancel, onRetry, onDownload, onDelete }: Props) {
  const canCancel = status === "running" || status === "queued";
  const canRetry = status === "failed" || status === "canceled";

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
          <button type="button" className={iconBtn} aria-label="Ещё">
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
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
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-red-400 focus:text-red-400"
            onClick={onDelete}
          >
            <Trash2 className="size-4" /> Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
