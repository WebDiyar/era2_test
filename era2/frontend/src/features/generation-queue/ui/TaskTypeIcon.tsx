import { Image as ImageIcon, MessageSquare, Music, Play } from "lucide-react";
import type { GenType } from "@/entities/generation-task";
import { cn } from "@/shared/lib/utils";

const ICONS: Record<GenType, typeof Play> = {
  text: MessageSquare,
  image: ImageIcon,
  video: Play,
  audio: Music,
};

export function TaskTypeIcon({ type, className }: { type: GenType; className?: string }) {
  const Icon = ICONS[type];
  return (
    <div
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-md border border-white/5 bg-[#241813] text-[#ff8d5e]",
        className,
      )}
    >
      <Icon className="size-5" />
    </div>
  );
}
