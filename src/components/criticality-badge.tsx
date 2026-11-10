import { Badge } from "@/components/ui/badge"
import type { Criticality } from "@/domain"
import { cn } from "@/lib/utils"

const CRITICALITY_STYLES: Record<Criticality, string> = {
  critical: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  high: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  medium:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  low: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
}

export const CRITICALITY_BORDER: Record<Criticality, string> = {
  critical: "border-red-500/70",
  high: "border-orange-500/70",
  medium: "border-amber-500/70",
  low: "border-sky-500/70",
}

export function CriticalityBadge({
  criticality,
}: {
  criticality: Criticality
}) {
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", CRITICALITY_STYLES[criticality])}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {criticality}
    </Badge>
  )
}
