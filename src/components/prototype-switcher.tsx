// PROTOTYPE (throwaway): floating ?variant= switcher. Lives on the
// prototype/selection-bar-motion branch only; never merge to main.
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useSyncExternalStore } from "react"

const URL_CHANGE = "prototype:urlchange"

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange)
  window.addEventListener(URL_CHANGE, onChange)
  return () => {
    window.removeEventListener("popstate", onChange)
    window.removeEventListener(URL_CHANGE, onChange)
  }
}

export function useSearchParam(name: string) {
  return useSyncExternalStore(subscribe, () =>
    new URLSearchParams(window.location.search).get(name)
  )
}

function setSearchParam(name: string, value: string | null) {
  const url = new URL(window.location.href)
  if (value === null) url.searchParams.delete(name)
  else url.searchParams.set(name, value)
  window.history.replaceState(null, "", url)
  window.dispatchEvent(new Event(URL_CHANGE))
}

export type PrototypeVariant = { key: string; name: string; spec: string }

export function PrototypeSwitcher({
  variants,
  current,
}: {
  variants: readonly PrototypeVariant[]
  current: string
}) {
  const slow = useSearchParam("slow") !== null
  const index = Math.max(
    0,
    variants.findIndex(({ key }) => key === current)
  )
  const variant = variants[index]

  const step = (delta: number) =>
    setSearchParam(
      "variant",
      variants[(index + delta + variants.length) % variants.length].key
    )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
      if (
        event.target instanceof HTMLElement &&
        event.target.closest(
          "input, textarea, [contenteditable], [role=tablist], [role=menu], [role=dialog]"
        )
      )
        return
      step(event.key === "ArrowLeft" ? -1 : 1)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  })

  if (!import.meta.env.DEV) return null

  return (
    <div className="fixed top-1.5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1 rounded-full bg-black py-1 pr-1.5 pl-1 font-mono text-xs text-white shadow-lg ring-1 ring-white/25">
      <button
        type="button"
        aria-label="Previous variant"
        className="rounded-full p-1.5 hover:bg-white/15"
        onClick={() => step(-1)}
      >
        <ChevronLeft className="size-4" />
      </button>
      <div className="flex w-72 flex-col px-1 py-0.5">
        <span className="font-semibold">
          {variant.key} ({variant.name})
        </span>
        <span className="text-white/60">{variant.spec}</span>
      </div>
      <button
        type="button"
        aria-label="Next variant"
        className="rounded-full p-1.5 hover:bg-white/15"
        onClick={() => step(1)}
      >
        <ChevronRight className="size-4" />
      </button>
      <button
        type="button"
        aria-pressed={slow}
        className="rounded-full px-2 py-1 hover:bg-white/15 aria-pressed:bg-white aria-pressed:text-black"
        onClick={() => setSearchParam("slow", slow ? null : "4")}
      >
        slow ×4
      </button>
    </div>
  )
}
