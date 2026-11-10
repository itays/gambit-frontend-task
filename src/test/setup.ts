import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// jsdom has no layout; React Flow hides nodes until it measures them, so report a nonzero size.
class ResizeObserver {
  readonly callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe(target: Element) {
    this.callback([{ target } as ResizeObserverEntry], this)
  }
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserver
globalThis.DOMMatrixReadOnly ??= class {
  m22 = 1
} as unknown as typeof DOMMatrixReadOnly
Object.defineProperties(HTMLElement.prototype, {
  offsetWidth: {
    get(this: HTMLElement) {
      return Number.parseFloat(this.style.width) || 1
    },
  },
  offsetHeight: {
    get(this: HTMLElement) {
      return Number.parseFloat(this.style.height) || 1
    },
  },
})

afterEach(() => {
  cleanup()
})
