import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"

export function SelectionBar({
  count,
  onClear,
  onCreate,
}: {
  count: number
  onClear: () => void
  onCreate: () => void
}) {
  const open = count > 0
  // Stays mounted after the selection empties, showing the last count, until
  // its exit transition finishes.
  const [mounted, setMounted] = useState(open)
  const [shownCount, setShownCount] = useState(count)
  if (open && !mounted) setMounted(true)
  if (open && count !== shownCount) setShownCount(count)
  const closing = mounted && !open
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const bar = ref.current
    if (!closing || !bar) return
    let cancelled = false
    // A frame after the closing styles apply, the exit transitions exist. A bar
    // hidden with its tab panel has none, so it unmounts at once.
    const frame = requestAnimationFrame(() => {
      Promise.all(bar.getAnimations().map(({ finished }) => finished)).then(
        () => {
          if (!cancelled) setMounted(false)
        },
        // Reopening mid-exit cancels the transition; the bar stays.
        () => {}
      )
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [closing])

  if (!mounted) return null

  return (
    <section
      ref={ref}
      aria-label="Selected Resources"
      inert={closing}
      data-closing={closing || undefined}
      className="bg-background ease-out-quint sticky bottom-4 flex origin-bottom items-center gap-2 rounded-lg border p-2 pl-4 shadow-md transition-[translate,scale,opacity] duration-200 data-closing:translate-y-2 data-closing:scale-98 data-closing:opacity-0 data-closing:duration-150 data-closing:ease-out motion-reduce:data-closing:translate-y-0 motion-reduce:data-closing:scale-100 starting:translate-y-2 starting:scale-98 starting:opacity-0 motion-reduce:starting:translate-y-0 motion-reduce:starting:scale-100"
    >
      <span className="mr-auto text-sm font-medium">
        <span
          key={shownCount}
          className="inline-block tabular-nums transition-[opacity,filter] duration-150 ease-out starting:opacity-0 starting:blur-[2px]"
        >
          {shownCount}
        </span>{" "}
        selected
      </span>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear
      </Button>
      <Button size="sm" onClick={onCreate}>
        Create Application
      </Button>
    </section>
  )
}
