import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent, { type UserEvent } from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { App } from "@/App"
import { ThemeProvider } from "@/components/theme-provider"
import { resources } from "@/data/resources"
import type { Resource } from "@/domain"

const CRITICALITY_ASCENDING = ["low", "medium", "high", "critical"]
const criticalityRank = (criticality: string) =>
  CRITICALITY_ASCENDING.indexOf(criticality.toLowerCase())

function renderApp({
  advanceTimers,
}: {
  advanceTimers?: (ms: number) => void
} = {}) {
  const user = userEvent.setup(advanceTimers && { advanceTimers })
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
  it("lists every Resource with a selection checkbox and six populated columns", () => {
    renderApp()

    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1)
    expect(rows).toHaveLength(resources.length)
    for (const row of rows) {
      const [selectCell, ...cells] = within(row).getAllByRole("cell")
      expect(within(selectCell).getByRole("checkbox")).not.toBeChecked()
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
    await waitFor(() => expectShownNames(expected))

    await user.clear(searchBox())
    await user.type(searchBox(), "Sso")
    await waitFor(() =>
      expectShownNames(namesWhere((r) => r.name.includes("sso")))
    )
  })

  it("applies the search only once typing pauses", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const user = renderApp({ advanceTimers: vi.advanceTimersByTime })

      await user.type(searchBox(), "sso")

      expectShownNames(namesWhere(() => true))
      expect(
        screen.getByRole("button", { name: "Clear filters" })
      ).toBeVisible()

      act(() => vi.advanceTimersByTime(1000))
      expectShownNames(namesWhere((r) => r.name.includes("sso")))

      await user.clear(searchBox())
      await user.type(searchBox(), "payments")
      await user.click(screen.getByRole("button", { name: "Clear filters" }))
      act(() => vi.advanceTimersByTime(1000))
      expect(searchBox()).toHaveValue("")
      expectShownNames(namesWhere(() => true))
    } finally {
      vi.useRealTimers()
    }
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
    expect(within(filterButton("Provider")).getByText("2")).toBeVisible()
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
    await waitFor(() => expectShownNames(["payments-db-prod"]))
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
    await waitFor(() =>
      expect(screen.queryByRole("table")).not.toBeInTheDocument()
    )

    await user.click(screen.getByRole("button", { name: "Go to Resources" }))
    expect(screen.getByRole("tab", { name: "Resources" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(screen.getByRole("table")).toBeVisible()
  })
})

function rowCheckbox(name: string) {
  return screen.getByRole("checkbox", { name: `Select ${name}` })
}

function headerCheckbox() {
  return screen.getByRole("checkbox", {
    name: "Select all matching Resources",
  })
}

function selectionBar() {
  return screen.queryByRole("region", { name: "Selected Resources" })
}

async function selectResources(user: UserEvent, names: string[]) {
  for (const name of names) await user.click(rowCheckbox(name))
}

async function expectSelected(names: string[]) {
  for (const resource of resources) {
    const checkbox = rowCheckbox(resource.name)
    if (names.includes(resource.name)) expect(checkbox).toBeChecked()
    else expect(checkbox).not.toBeChecked()
  }
  if (names.length === 0)
    await waitFor(() => expect(selectionBar()).not.toBeInTheDocument())
  else expect(selectionBar()).toHaveTextContent(`${names.length} selected`)
}

describe("Selecting Resources", () => {
  it("shows the selection bar with the count and hides it on Clear", async () => {
    const user = renderApp()
    await expectSelected([])

    await selectResources(user, ["payments-api-prod", "identity-sso-gateway"])
    await expectSelected(["payments-api-prod", "identity-sso-gateway"])

    await user.click(rowCheckbox("payments-api-prod"))
    await expectSelected(["identity-sso-gateway"])

    await user.click(
      within(selectionBar() as HTMLElement).getByRole("button", {
        name: "Clear",
      })
    )
    await expectSelected([])
  })

  it("keeps Resources hidden by filters selected and counted", async () => {
    const user = renderApp()
    await selectResources(user, ["payments-api-prod", "identity-sso-gateway"])

    await pickFilterValues(user, "Provider", ["AWS"])
    expect(
      screen.queryByRole("checkbox", { name: "Select identity-sso-gateway" })
    ).not.toBeInTheDocument()
    expect(selectionBar()).toHaveTextContent("2 selected")

    await user.click(screen.getByRole("button", { name: "Clear filters" }))
    await expectSelected(["payments-api-prod", "identity-sso-gateway"])
  })

  it("selects and deselects only the Resources matching the filters from the header", async () => {
    const user = renderApp()
    const gcp = namesWhere((r) => r.provider === "GCP")
    expect(gcp.length).toBeGreaterThan(1)
    await selectResources(user, ["identity-sso-gateway"])

    await pickFilterValues(user, "Provider", ["GCP"])
    expect(headerCheckbox()).not.toBeChecked()
    await user.click(rowCheckbox(gcp[0]))
    expect(headerCheckbox()).toHaveAttribute("aria-checked", "mixed")

    await user.click(headerCheckbox())
    expect(headerCheckbox()).toBeChecked()
    expect(selectionBar()).toHaveTextContent(`${gcp.length + 1} selected`)

    await user.click(screen.getByRole("button", { name: "Clear filters" }))
    await expectSelected([...gcp, "identity-sso-gateway"])
    expect(headerCheckbox()).toHaveAttribute("aria-checked", "mixed")

    await pickFilterValues(user, "Provider", ["GCP"])
    await user.click(headerCheckbox())
    expect(headerCheckbox()).not.toBeChecked()
    await user.click(screen.getByRole("button", { name: "Clear filters" }))
    await expectSelected(["identity-sso-gateway"])
  })
})

function createDialog() {
  return screen.queryByRole("dialog", { name: "Create Application" })
}

async function openCreateDialog(user: UserEvent) {
  await user.click(
    within(selectionBar() as HTMLElement).getByRole("button", {
      name: "Create Application",
    })
  )
  return screen.findByRole("dialog", { name: "Create Application" })
}

async function createApplication(
  user: UserEvent,
  resourceNames: string[],
  name: string,
  description = ""
) {
  await user.click(screen.getByRole("tab", { name: "Resources" }))
  await selectResources(user, resourceNames)
  const dialog = await openCreateDialog(user)
  await user.type(within(dialog).getByRole("textbox", { name: "Name" }), name)
  if (description) {
    await user.type(
      within(dialog).getByRole("textbox", { name: "Description" }),
      description
    )
  }
  await user.click(within(dialog).getByRole("button", { name: "Create" }))
  return dialog
}

function applicationItems() {
  return within(
    screen.getByRole("list", { name: "Applications" })
  ).getAllByRole("button")
}

function applicationItem(name: string) {
  return within(screen.getByRole("list", { name: "Applications" })).getByRole(
    "button",
    { name: new RegExp(`^${name}`) }
  )
}

describe("Creating an Application", () => {
  it("reviews the selected Resources and keeps the selection on Cancel", async () => {
    const user = renderApp()
    await selectResources(user, ["payments-api-prod", "payments-db-prod"])

    await pickFilterValues(user, "Provider", ["Azure"])
    const dialog = await openCreateDialog(user)
    expect(within(dialog).getByText("payments-api-prod")).toBeVisible()
    expect(within(dialog).getByText("payments-db-prod")).toBeVisible()

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(createDialog()).not.toBeInTheDocument())
    await user.click(screen.getByRole("button", { name: "Clear filters" }))
    await expectSelected(["payments-api-prod", "payments-db-prod"])
  })

  it("requires a name that is not blank", async () => {
    const user = renderApp()
    const dialog = await createApplication(user, ["payments-api-prod"], "   ")

    const name = within(dialog).getByRole("textbox", { name: "Name" })
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Name is required"
    )
    expect(name).toHaveAttribute("aria-invalid", "true")
    expect(createDialog()).toBeVisible()
  })

  it("switches to the new, highlighted Application and clears the selection", async () => {
    const user = renderApp()
    await createApplication(
      user,
      ["payments-api-prod", "payments-db-prod", "identity-sso-gateway"],
      "  Payments API  ",
      "Card payments and their identity dependency"
    )

    await waitFor(() => expect(createDialog()).not.toBeInTheDocument())
    expect(
      await screen.findByText('Created Application "Payments API"')
    ).toBeVisible()
    expect(screen.getByRole("tab", { name: "Applications" })).toHaveAttribute(
      "aria-selected",
      "true"
    )

    const item = applicationItem("Payments API")
    expect(item).toHaveAttribute("aria-current", "true")
    expect(within(item).getByText("Payments API").textContent).toBe(
      "Payments API"
    )
    expect(item).toHaveTextContent(
      "Card payments and their identity dependency"
    )
    expect(item).toHaveTextContent("3 Resources")
    expect(within(item).getByText("critical")).toBeVisible()
    expect(within(item).getByText("AWS")).toBeVisible()
    expect(within(item).getByText("Azure")).toBeVisible()
    expect(within(item).queryByText("GCP")).not.toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "Resources" }))
    await expectSelected([])
  })

  it("shows the highest Criticality among its Resources and only the Providers spanned", async () => {
    const user = renderApp()
    const gcp = resources.filter((r) => r.provider === "GCP")
    const highest = gcp.reduce((max, r) =>
      criticalityRank(r.criticality) > criticalityRank(max.criticality)
        ? r
        : max
    )
    await createApplication(
      user,
      gcp.map((r) => r.name),
      "Analytics"
    )

    const item = applicationItem("Analytics")
    expect(item).toHaveTextContent(`${gcp.length} Resources`)
    expect(within(item).getByText(highest.criticality)).toBeVisible()
    expect(within(item).getByText("GCP")).toBeVisible()
    expect(within(item).queryByText("AWS")).not.toBeInTheDocument()
    expect(within(item).queryByText("Azure")).not.toBeInTheDocument()
  })

  it("rejects a name used by another Application, ignoring case", async () => {
    const user = renderApp()
    await createApplication(user, ["payments-api-prod"], "Payments API")

    const dialog = await createApplication(
      user,
      ["payments-db-prod"],
      " payments api "
    )

    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      'An Application named "payments api" already exists'
    )
    expect(createDialog()).toBeVisible()
  })

  it("adds the same Resource to two Applications and selects either from the list", async () => {
    const user = renderApp()
    await createApplication(user, ["payments-api-prod"], "Payments API")
    await createApplication(
      user,
      ["payments-api-prod", "payments-db-prod"],
      "Checkout"
    )

    const items = applicationItems()
    expect(
      items.map(
        (item) => within(item).getByText(/^\d+ Resources?$/).textContent
      )
    ).toEqual(["1 Resource", "2 Resources"])
    expect(items[0]).toBe(applicationItem("Payments API"))
    expect(items[1]).toBe(applicationItem("Checkout"))
    expect(applicationItem("Checkout")).toHaveAttribute("aria-current", "true")
    expect(applicationItem("Payments API")).not.toHaveAttribute("aria-current")

    await user.click(applicationItem("Payments API"))
    expect(applicationItem("Payments API")).toHaveAttribute(
      "aria-current",
      "true"
    )
    expect(applicationItem("Checkout")).not.toHaveAttribute("aria-current")
  })
})

function graphNodeLabels(graph: HTMLElement) {
  return Array.from(
    graph.querySelectorAll('[aria-roledescription="node"]'),
    (node) => node.getAttribute("aria-label")
  )
}

describe("Application detail", () => {
  it("shows the selected Application with a graph linking it to each member Resource", async () => {
    const user = renderApp()
    await createApplication(
      user,
      ["payments-api-prod", "identity-sso-gateway"],
      "Payments API",
      "Card payments and SSO"
    )
    await createApplication(user, ["payments-db-prod"], "Ledger")

    let graph = within(
      screen.getByRole("region", { name: "Ledger" })
    ).getByRole("application", { name: "Ledger graph" })
    expect(graphNodeLabels(graph)).toEqual(["Ledger", "payments-db-prod"])

    await user.click(applicationItem("Payments API"))
    const detail = screen.getByRole("region", { name: "Payments API" })
    expect(detail).toHaveTextContent("Card payments and SSO")
    graph = within(detail).getByRole("application", {
      name: "Payments API graph",
    })
    expect(graphNodeLabels(graph)).toEqual([
      "Payments API",
      "payments-api-prod",
      "identity-sso-gateway",
    ])
    for (const name of ["payments-api-prod", "identity-sso-gateway"]) {
      expect(
        within(graph).getByRole("group", {
          name: `Payments API includes ${name}`,
        })
      ).toBeInTheDocument()
    }

    const resource = resources.find(
      (candidate) => candidate.name === "identity-sso-gateway"
    )
    if (!resource) throw new Error("identity-sso-gateway fixture is missing")
    const resourceNode = within(graph).getByRole("group", {
      name: resource.name,
    })
    for (const text of [
      resource.type,
      resource.provider,
      resource.criticality,
      resource.region,
      resource.owner,
      ...resource.tags,
    ]) {
      expect(within(resourceNode).getByText(text)).toBeVisible()
    }
  })
})
