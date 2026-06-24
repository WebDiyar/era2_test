import { useEffect, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import type { SortOrder, StatusFilter } from "../model/selectors";

const STATUS_CHIPS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "queued", label: "В очереди" },
  { value: "running", label: "Идёт" },
  { value: "done", label: "Готово" },
  { value: "failed", label: "Ошибка" },
];

const SORT_LABELS: Record<SortOrder, string> = {
  newest: "Сначала новые",
  oldest: "Сначала старые",
  progress: "По прогрессу",
};

interface Props {
  status: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
  sort: SortOrder;
  onSortChange: (s: SortOrder) => void;
  onSearchChange: (q: string) => void;
}

export function QueueToolbar({ status, onStatusChange, sort, onSortChange, onSearchChange }: Props) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => onSearchChange(query), 300);
    return () => clearTimeout(t);
  }, [query, onSearchChange]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 overflow-x-auto">
        {STATUS_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            onClick={() => onStatusChange(chip.value)}
            className={cn(
              "h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
              status === chip.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по промпту"
            className="h-9 w-56 rounded-full border border-border bg-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-full bg-secondary px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {SORT_LABELS[sort]}
              <ChevronDown className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {(Object.keys(SORT_LABELS) as SortOrder[]).map((value) => (
              <DropdownMenuItem key={value} onClick={() => onSortChange(value)}>
                {SORT_LABELS[value]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
