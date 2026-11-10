import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { App } from "@/App"
import { ThemeProvider } from "@/components/theme-provider"
import { resources } from "@/data/resources"

const CRITICALITY_ASCENDING = ["low", "medium", "high", "critical"]
const criticalityRank = (criticality: string) =>
  CRITICALITY_ASCENDING.indexOf(criticality.toLowerCase())

function renderApp() {
  const user = userEvent.setup()
  render(
    <ThemeProvider defaultTheme="light">
      <App />
    </ThemeProvider>
  )
  return user
}

function columnHeader(name: string) {
  return screen.getByRole("columnheader", { name })
}

function readColumn(name: string) {
  const table = screen.getByRole("table")
  const index = within(table)
    .getAllByRole("columnheader")
    .indexOf(columnHeader(name))
  return within(table)
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[index].textContent ?? "")
}

function expectOrdered<T>(values: T[], compare: (a: T, b: T) => number) {
  for (let i = 1; i < values.length; i++) {
    expect(
      compare(values[i - 1], values[i]),
      `${values[i - 1]} before ${values[i]}`
    ).toBeLessThanOrEqual(0)
  }
}

const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

describe("Resource inventory", () => {
  it("lists every Resource with all six columns populated", () => {
    renderApp()

    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1)
    expect(rows).toHaveLength(resources.length)
    for (const row of rows) {
      const cells = within(row).getAllByRole("cell")
      expect(cells).toHaveLength(6)
      for (const cell of cells) expect(cell.textContent).not.toBe("")
    }
  })

  it("orders by Criticality (critical first), then by name", () => {
    renderApp()

    const names = readColumn("Name")
    const criticalities = readColumn("Criticality")
    expect(criticalities[0]).toBe("critical")
    expectOrdered(
      names.map((name, i) => ({
        name,
        rank: criticalityRank(criticalities[i]),
      })),
      (a, b) => b.rank - a.rank || byText(a.name, b.name)
    )
    expect(columnHeader("Criticality")).toHaveAttribute(
      "aria-sort",
      "descending"
    )
  })

  it("sorts by Criticality rank, not alphabetically", async () => {
    const user = renderApp()

    await user.click(screen.getByRole("button", { name: "Criticality" }))
    expect(columnHeader("Criticality")).toHaveAttribute(
      "aria-sort",
      "ascending"
    )
    expect(readColumn("Criticality")[0]).toBe("low")
    expectOrdered(
      readColumn("Criticality").map(criticalityRank),
      (a, b) => a - b
    )

    await user.click(screen.getByRole("button", { name: "Criticality" }))
    expect(columnHeader("Criticality")).toHaveAttribute(
      "aria-sort",
      "descending"
    )
    expectOrdered(
      readColumn("Criticality").map(criticalityRank),
      (a, b) => b - a
    )
  })

  it("sorts by name in both directions", async () => {
    const user = renderApp()

    await user.click(screen.getByRole("button", { name: "Name" }))
    expect(columnHeader("Name")).toHaveAttribute("aria-sort", "ascending")
    expect(columnHeader("Criticality")).not.toHaveAttribute("aria-sort")
    expectOrdered(readColumn("Name"), byText)

    await user.click(screen.getByRole("button", { name: "Name" }))
    expect(columnHeader("Name")).toHaveAttribute("aria-sort", "descending")
    expectOrdered(readColumn("Name"), (a, b) => byText(b, a))
  })

  it("sorts by Open Issues in both directions", async () => {
    const user = renderApp()

    await user.click(screen.getByRole("button", { name: "Open Issues" }))
    expect(columnHeader("Open Issues")).toHaveAttribute(
      "aria-sort",
      "descending"
    )
    expectOrdered(readColumn("Open Issues").map(Number), (a, b) => b - a)

    await user.click(screen.getByRole("button", { name: "Open Issues" }))
    expect(columnHeader("Open Issues")).toHaveAttribute(
      "aria-sort",
      "ascending"
    )
    expectOrdered(readColumn("Open Issues").map(Number), (a, b) => a - b)
  })
})

describe("Applications tab", () => {
  it("shows the empty state and links back to Resources", async () => {
    const user = renderApp()

    await user.click(screen.getByRole("tab", { name: "Applications" }))
    expect(screen.getByText("No applications yet")).toBeVisible()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Go to Resources" }))
    expect(screen.getByRole("tab", { name: "Resources" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(screen.getByRole("table")).toBeVisible()
  })
})
