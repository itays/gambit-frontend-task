// PROTOTYPE (throwaway): "How should the Resource table's selection bar enter
// and leave?" Four variants on the existing / route, switchable via
// ?variant=0|A|B|C, plus ?slow=4 for slow-motion review. Lives on the
// prototype/selection-bar-motion branch only; never merge to main.
import { type CSSProperties, type TransitionEvent, useState } from "react"

import {
  PrototypeSwitcher,
  type PrototypeVariant,
  useSearchParam,
} from "@/components/prototype-switcher"
import { Button } from "@/components/ui/button"

// The toast's existing curve (toast.tsx), reused so the app has one ease-out.
const EASE_OUT_QUINT = "cubic-bezier(0.22, 1, 0.36, 1)"
const EASE_DRAWER = "cubic-bezier(0.32, 0.72, 0, 1)"

const VARIANTS = [
  {
    key: "0",
    name: "Today",
    spec: "No motion. Mounts and unmounts instantly.",
  },
  {
    key: "A",
    name: "Slide in",
    spec: "Enter only: rises from below its sticky spot + fade, 200ms quint. Exit instant.",
  },
  {
    key: "B",
    name: "Lift & settle",
    spec: "Enter 8px rise + scale .98 + fade, 200ms; exit 150ms. Count blurs in on change.",
  },
  {
    key: "C",
    name: "Floating dock",
    spec: "Fixed inverted pill, bottom center. In 300ms drawer curve, out 200ms, same edge.",
  },
] as const satisfies readonly PrototypeVariant[]

type BarProps = { count: number; onClear: () => void; onCreate: () => void }
type MotionProps = BarProps & { ms: (value: number) => string }

export function SelectionBarPrototype(props: BarProps) {
  const variant = useSearchParam("variant") ?? "0"
  const slow = Number(useSearchParam("slow")) || 1
  const ms = (value: number) => `${value * slow}ms`
  return (
    <>
      {variant === "A" && <VariantA {...props} ms={ms} />}
      {variant === "B" && <VariantB {...props} ms={ms} />}
      {variant === "C" && <VariantC {...props} ms={ms} />}
      {!["A", "B", "C"].includes(variant) && <VariantToday {...props} />}
      <PrototypeSwitcher variants={VARIANTS} current={variant} />
    </>
  )
}

// Keeps the bar mounted, showing its last count, until its exit transition ends.
function usePresence(count: number) {
  const open = count > 0
  const [mounted, setMounted] = useState(open)
  const [shownCount, setShownCount] = useState(count)
  if (open && !mounted) setMounted(true)
  if (open && count !== shownCount) setShownCount(count)
  const closing = mounted && !open
  const onTransitionEnd = (event: TransitionEvent) => {
    if (
      closing &&
      event.target === event.currentTarget &&
      event.propertyName === "opacity"
    )
      setMounted(false)
  }
  return { mounted, closing, shownCount, onTransitionEnd }
}

function VariantToday({ count, onClear, onCreate }: BarProps) {
  if (count === 0) return null
  return (
    <section
      aria-label="Selected Resources"
      className="bg-background sticky bottom-4 flex items-center gap-2 rounded-lg border p-2 pl-4 shadow-md"
    >
      <span className="mr-auto text-sm font-medium">{count} selected</span>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear
      </Button>
      <Button size="sm" onClick={onCreate}>
        Create Application
      </Button>
    </section>
  )
}

function VariantA({ count, onClear, onCreate, ms }: MotionProps) {
  if (count === 0) return null
  const style: CSSProperties = {
    transitionDuration: ms(200),
    transitionTimingFunction: EASE_OUT_QUINT,
  }
  return (
    <section
      aria-label="Selected Resources"
      style={style}
      className="bg-background sticky bottom-4 flex items-center gap-2 rounded-lg border p-2 pl-4 shadow-md transition-[translate,opacity] starting:translate-y-[calc(100%+1rem)] starting:opacity-0 motion-reduce:starting:translate-y-0"
    >
      <span className="mr-auto text-sm font-medium">{count} selected</span>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear
      </Button>
      <Button size="sm" onClick={onCreate}>
        Create Application
      </Button>
    </section>
  )
}

function VariantB({ count, onClear, onCreate, ms }: MotionProps) {
  const { mounted, closing, shownCount, onTransitionEnd } = usePresence(count)
  if (!mounted) return null
  const style: CSSProperties = closing
    ? { transitionDuration: ms(150), transitionTimingFunction: "ease-out" }
    : { transitionDuration: ms(200), transitionTimingFunction: EASE_OUT_QUINT }
  return (
    <section
      aria-label="Selected Resources"
      inert={closing}
      data-closing={closing || undefined}
      onTransitionEnd={onTransitionEnd}
      style={style}
      className="bg-background sticky bottom-4 flex origin-bottom items-center gap-2 rounded-lg border p-2 pl-4 shadow-md transition-[translate,scale,opacity] data-closing:translate-y-2 data-closing:scale-[0.98] data-closing:opacity-0 motion-reduce:data-closing:translate-y-0 motion-reduce:data-closing:scale-100 starting:translate-y-2 starting:scale-[0.98] starting:opacity-0 motion-reduce:starting:translate-y-0 motion-reduce:starting:scale-100"
    >
      <span className="mr-auto text-sm font-medium">
        <span
          key={shownCount}
          style={{ transitionDuration: ms(150) }}
          className="inline-block tabular-nums transition-[opacity,filter] ease-out starting:opacity-0 starting:blur-[2px]"
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

function VariantC({ count, onClear, onCreate, ms }: MotionProps) {
  const { mounted, closing, shownCount, onTransitionEnd } = usePresence(count)
  if (!mounted) return null
  const style: CSSProperties = closing
    ? { transitionDuration: ms(200), transitionTimingFunction: EASE_OUT_QUINT }
    : { transitionDuration: ms(300), transitionTimingFunction: EASE_DRAWER }
  return (
    <section
      aria-label="Selected Resources"
      inert={closing}
      data-closing={closing || undefined}
      onTransitionEnd={onTransitionEnd}
      style={style}
      className="bg-foreground text-background fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit items-center gap-1 rounded-full p-1.5 pl-5 shadow-xl transition-[translate,opacity] data-closing:translate-y-[calc(100%+1.5rem)] data-closing:opacity-0 motion-reduce:data-closing:translate-y-0 starting:translate-y-[calc(100%+1.5rem)] starting:opacity-0 motion-reduce:starting:translate-y-0"
    >
      <span className="mr-3 text-sm font-medium tabular-nums">
        {shownCount} selected
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="text-background hover:bg-background/15 hover:text-background dark:hover:bg-background/15 rounded-full"
        onClick={onClear}
      >
        Clear
      </Button>
      <Button size="sm" className="rounded-full" onClick={onCreate}>
        Create Application
      </Button>
    </section>
  )
}
