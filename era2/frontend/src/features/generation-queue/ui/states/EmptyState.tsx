import { Inbox } from "lucide-react";

interface Props {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = "Очередь пуста",
  description = "Здесь появятся ваши задачи генерации.",
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-white/4 text-muted-foreground">
        <Inbox className="size-6" />
      </div>
      <p className="mt-4 text-base font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
