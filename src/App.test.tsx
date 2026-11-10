import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent, { type UserEvent } from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { App } from "@/App"
import { ThemeProvider } from "@/components/theme-provider"
import { resources } from "@/data/resources"
import type { Resource } from "@/domain"

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

function searchBox() {
  return screen.getByRole("searchbox", { name: "Search Resources by name" })
}

function filterButton(attribute: string) {
  return screen.getByRole("button", {
    name: new RegExp(`^Filter by ${attribute}`),
  })
}

async function pickFilterValues(
  user: UserEvent,
  attribute: string,
  values: string[]
) {
  await user.click(filterButton(attribute))
  const menu = await screen.findByRole("menu")
  for (const value of values) {
    await user.click(
      within(menu).getByRole("menuitemcheckbox", { name: value })
    )
  }
  await user.keyboard("{Escape}")
  await waitFor(() =>
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  )
}

function namesWhere(predicate: (resource: Resource) => boolean) {
  return resources
    .filter(predicate)
    .map((resource) => resource.name)
    .sort()
}

function expectShownNames(expected: string[]) {
  expect([...readColumn("Name")].sort()).toEqual(expected)
  expect(screen.getByRole("status")).toHaveTextContent(
    `${expected.length} of ${resources.length} Resources`
  )
}

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

describe("Filtering Resources", () => {
  it("counts every Resource and hides Clear filters when nothing is active", () => {
    renderApp()

    expect(screen.getByRole("status")).toHaveTextContent(
      `${resources.length} of ${resources.length} Resources`
    )
    expect(
      screen.queryByRole("button", { name: "Clear filters" })
    ).not.toBeInTheDocument()
  })

  it("searches names case-insensitively by substring", async () => {
    const user = renderApp()

    await user.type(searchBox(), "PAYMENTS-")

    const expected = namesWhere((r) => r.name.includes("payments-"))
    expect(expected.length).toBeGreaterThan(1)
    expect(expected.length).toBeLessThan(resources.length)
    expectShownNames(expected)

    await user.clear(searchBox())
    await user.type(searchBox(), "Sso")
    expectShownNames(namesWhere((r) => r.name.includes("sso")))
  })

  it("combines values within one attribute with OR", async () => {
    const user = renderApp()

    await pickFilterValues(user, "Provider", ["AWS"])
    expectShownNames(namesWhere((r) => r.provider === "AWS"))
    expect(filterButton("Provider")).toHaveAccessibleName(
      "Filter by Provider, 1 selected"
    )

    await pickFilterValues(user, "Provider", ["GCP"])
    expectShownNames(
      namesWhere((r) => r.provider === "AWS" || r.provider === "GCP")
    )
    expect(filterButton("Provider")).toHaveAccessibleName(
      "Filter by Provider, 2 selected"
    )
    expect(filterButton("Environment")).toHaveAccessibleName(
      "Filter by Environment"
    )
  })

  it("combines attributes and the search with AND", async () => {
    const user = renderApp()

    await pickFilterValues(user, "Provider", ["AWS"])
    await pickFilterValues(user, "Environment", ["production"])
    expectShownNames(
      namesWhere((r) => r.provider === "AWS" && r.environment === "production")
    )

    await pickFilterValues(user, "Criticality", ["critical", "high"])
    expectShownNames(
      namesWhere(
        (r) =>
          r.provider === "AWS" &&
          r.environment === "production" &&
          (r.criticality === "critical" || r.criticality === "high")
      )
    )
    expect(filterButton("Criticality")).toHaveAccessibleName(
      "Filter by Criticality, 2 selected"
    )

    await user.type(searchBox(), "db")
    expectShownNames(["payments-db-prod"])
  })

  it("unchecking the last value removes that filter", async () => {
    const user = renderApp()

    await pickFilterValues(user, "Environment", ["staging"])
    await pickFilterValues(user, "Environment", ["staging"])

    expectShownNames(namesWhere(() => true))
    expect(filterButton("Environment")).toHaveAccessibleName(
      "Filter by Environment"
    )
  })

  it("clears the search and every filter", async () => {
    const user = renderApp()

    await user.type(searchBox(), "a")
    await pickFilterValues(user, "Provider", ["AWS", "Azure"])
    await pickFilterValues(user, "Environment", ["production"])
    await pickFilterValues(user, "Criticality", ["critical"])
    await user.click(screen.getByRole("button", { name: "Clear filters" }))

    expectShownNames(namesWhere(() => true))
    expect(searchBox()).toHaveValue("")
    for (const attribute of ["Provider", "Environment", "Criticality"]) {
      expect(filterButton(attribute)).toHaveAccessibleName(
        `Filter by ${attribute}`
      )
    }
    expect(
      screen.queryByRole("button", { name: "Clear filters" })
    ).not.toBeInTheDocument()

    await user.click(filterButton("Provider"))
    for (const item of await screen.findAllByRole("menuitemcheckbox")) {
      expect(item).not.toBeChecked()
    }
  })

  it("keeps the chosen sort on filtered results", async () => {
    const user = renderApp()

    await pickFilterValues(user, "Provider", ["AWS", "GCP"])
    await user.click(screen.getByRole("button", { name: "Open Issues" }))

    expectOrdered(readColumn("Open Issues").map(Number), (a, b) => b - a)
    expectShownNames(
      namesWhere((r) => r.provider === "AWS" || r.provider === "GCP")
    )
  })

  it("shows an empty state that clears filters when nothing matches", async () => {
    const user = renderApp()

    await pickFilterValues(user, "Provider", ["Azure"])
    await pickFilterValues(user, "Environment", ["development"])

    expect(
      namesWhere(
        (r) => r.provider === "Azure" && r.environment === "development"
      )
    ).toEqual([])
    const table = screen.getByRole("table")
    expect(within(table).getByText("No matching Resources")).toBeVisible()
    expect(screen.getByRole("status")).toHaveTextContent(
      `0 of ${resources.length} Resources`
    )

    await user.click(
      within(table).getByRole("button", { name: "Clear filters" })
    )

    expect(
      within(table).queryByText("No matching Resources")
    ).not.toBeInTheDocument()
    expectShownNames(namesWhere(() => true))
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
