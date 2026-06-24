import { AlertTriangle } from "lucide-react";
import { Button } from "@/shared/ui/button";

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[18px] border border-border bg-card/40 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 dark:text-red-400">
        <AlertTriangle className="size-6" />
      </div>
      <p className="mt-4 text-base font-medium text-foreground">Не удалось загрузить очередь</p>
      <p className="mt-1 text-sm text-muted-foreground">Что-то пошло не так при инициализации.</p>
      <Button variant="ghost" className="mt-5" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  );
}
