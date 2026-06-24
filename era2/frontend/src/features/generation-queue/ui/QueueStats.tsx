import type { QueueCounts } from "../model/selectors";
import { cn } from "@/shared/lib/utils";

const ITEMS = [
  { key: "queued", label: "В очереди", dot: "bg-muted-foreground" },
  { key: "running", label: "Идёт", dot: "bg-primary" },
  { key: "done", label: "Готово", dot: "bg-emerald-400" },
  { key: "failed", label: "Ошибка", dot: "bg-red-400" },
] as const;

export function QueueStats({ counts }: { counts: QueueCounts }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {ITEMS.map((it) => (
        <div key={it.key} className="rounded-[18px] border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={cn("size-2 rounded-full", it.dot)} />
            {it.label}
          </div>
          <div className="mt-3 text-[32px] font-semibold leading-none text-foreground">
            {counts[it.key]}
          </div>
        </div>
      ))}
    </div>
  );
}
