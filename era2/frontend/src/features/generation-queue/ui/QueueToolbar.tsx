import { useEffect, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import type { SortOrder, StatusFilter, TypeFilter } from "../model/selectors";

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

const TYPE_LABELS: Record<TypeFilter, string> = {
  all: "Все типы",
  text: "Текст",
  image: "Изображение",
  video: "Видео",
  audio: "Аудио",
};

interface Props {
  status: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
  type: TypeFilter;
  onTypeChange: (t: TypeFilter) => void;
  sort: SortOrder;
  onSortChange: (s: SortOrder) => void;
  onSearchChange: (q: string) => void;
}

const pill =
  "flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-secondary px-4 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function QueueToolbar({
  status,
  onStatusChange,
  type,
  onTypeChange,
  sort,
  onSortChange,
  onSearchChange,
}: Props) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => onSearchChange(query), 300);
    return () => clearTimeout(t);
  }, [query, onSearchChange]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div
        role="group"
        aria-label="Фильтр по статусу"
        className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:px-0 sm:pb-0"
      >
        {STATUS_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            aria-pressed={status === chip.value}
            onClick={() => onStatusChange(chip.value)}
            className={cn(
              "h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              status === chip.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:ml-auto sm:flex-nowrap">
        <div className="relative flex-1 sm:flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по промпту"
            aria-label="Поиск по тексту промпта"
            className="h-9 w-full rounded-full border border-border bg-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-56"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label={`Тип: ${TYPE_LABELS[type]}`} className={pill}>
              {TYPE_LABELS[type]}
              <ChevronDown className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {(Object.keys(TYPE_LABELS) as TypeFilter[]).map((value) => (
              <DropdownMenuItem key={value} onClick={() => onTypeChange(value)}>
                {TYPE_LABELS[value]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label={`Сортировка: ${SORT_LABELS[sort]}`} className={pill}>
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
