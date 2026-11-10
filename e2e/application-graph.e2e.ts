import { expect, type Locator, type Page, test } from "@playwright/test"

function trackPageErrors(page: Page) {
  const pageErrors: Error[] = []
  page.on("pageerror", (error) => pageErrors.push(error))
  return pageErrors
}

async function createApplication(page: Page, name: string) {
  await page
    .getByRole("region", { name: "Selected Resources" })
    .getByRole("button", { name: "Create Application" })
    .click()
  const dialog = page.getByRole("dialog", { name: "Create Application" })
  await dialog.getByRole("textbox", { name: "Name" }).fill(name)
  await dialog.getByRole("button", { name: "Create" }).click()
  await expect(dialog).toBeHidden()
}

interface Graph {
  graph: Locator
  nodes: Locator
}

function graphOf(page: Page, application: string): Graph {
  const graph = page
    .getByRole("region", { name: application })
    .getByRole("application", { name: `${application} graph` })
  return { graph, nodes: graph.locator('[aria-roledescription="node"]') }
}

async function expectAllInGraph({ graph, nodes }: Graph) {
  await expect(async () => {
    const frame = await graph.boundingBox()
    if (!frame) throw new Error("graph has no box")
    for (const node of await nodes.all()) {
      const box = await node.boundingBox()
      if (!box) throw new Error("node has no box")
      expect(box.x).toBeGreaterThanOrEqual(frame.x)
      expect(box.y).toBeGreaterThanOrEqual(frame.y)
      expect(box.x + box.width).toBeLessThanOrEqual(frame.x + frame.width)
      expect(box.y + box.height).toBeLessThanOrEqual(frame.y + frame.height)
    }
  }).toPass({ timeout: 5000 })
}

test("graphs a new Application around its member Resources", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page)
  await page.goto("/")

  await page.getByRole("button", { name: "Filter by Provider" }).click()
  await page.getByRole("menuitemcheckbox", { name: "GCP" }).click()
  await page.keyboard.press("Escape")
  const gcp = await page
    .getByRole("table")
    .locator("tbody tr td:nth-child(2)")
    .allTextContents()
  expect(gcp.length).toBeGreaterThan(1)
  await page
    .getByRole("checkbox", { name: "Select all matching Resources" })
    .click()
  await createApplication(page, "Analytics")

  const analytics = graphOf(page, "Analytics")
  await expect(analytics.nodes).toHaveCount(gcp.length + 1)
  await expect(analytics.nodes.first()).toHaveAccessibleName("Analytics")
  for (const name of gcp) {
    await expect(
      analytics.graph.getByRole("group", { name, exact: true })
    ).toBeVisible()
    await expect(
      analytics.graph.getByRole("group", { name: `Analytics includes ${name}` })
    ).toBeAttached()
  }
  await expectAllInGraph(analytics)

  await page.getByRole("tab", { name: "Resources" }).click()
  await page.getByRole("button", { name: "Clear filters" }).click()
  await page
    .getByRole("checkbox", { name: "Select identity-sso-gateway" })
    .click()
  await createApplication(page, "Identity")
  await expect(graphOf(page, "Identity").nodes).toHaveCount(2)

  await page
    .getByRole("list", { name: "Applications" })
    .getByRole("button", { name: /^Analytics/ })
    .click()
  await expect(analytics.nodes).toHaveCount(gcp.length + 1)
  await expectAllInGraph(analytics)

  expect(pageErrors).toEqual([])
})

test("pans, zooms, and drags but never edits the graph", async ({ page }) => {
  const pageErrors = trackPageErrors(page)
  await page.goto("/")
  await page.getByRole("checkbox", { name: "Select payments-api-prod" }).click()
  await page.getByRole("checkbox", { name: "Select payments-db-prod" }).click()
  await createApplication(page, "Payments")
  const payments = graphOf(page, "Payments")
  const { graph, nodes } = payments
  const resource = graph.getByRole("group", {
    name: "payments-api-prod",
    exact: true,
  })
  await expect(nodes).toHaveCount(3)
  await expect(graph.getByRole("button", { name: "Fit View" })).toBeVisible()
  await expect(graph.locator(".react-flow__minimap")).toHaveCount(0)

  const start = await resource.boundingBox()
  if (!start) throw new Error("payments-api-prod node has no box")
  await page.mouse.move(start.x + 20, start.y + 20)
  await page.mouse.down()
  await page.mouse.move(start.x + 80, start.y + 60, { steps: 5 })
  await page.mouse.up()
  await expect
    .poll(async () => (await resource.boundingBox())?.x)
    .toBeGreaterThan(start.x + 30)

  const frame = await graph.boundingBox()
  const dragged = await resource.boundingBox()
  if (!frame || !dragged) throw new Error("graph has no box")
  await page.mouse.move(frame.x + 40, frame.y + 40)
  await page.mouse.down()
  await page.mouse.move(frame.x + 140, frame.y + 40, { steps: 5 })
  await page.mouse.up()
  await expect
    .poll(async () => (await resource.boundingBox())?.x)
    .toBeGreaterThan(dragged.x + 50)

  const panned = await resource.boundingBox()
  await graph.getByRole("button", { name: "Zoom In" }).click()
  await expect
    .poll(async () => (await resource.boundingBox())?.width)
    .toBeGreaterThan(panned?.width ?? Number.POSITIVE_INFINITY)
  await graph.getByRole("button", { name: "Fit View" }).click()
  await expectAllInGraph(payments)

  await resource.focus()
  await page.keyboard.press("Backspace")
  await page.keyboard.press("Delete")
  await expect(nodes).toHaveCount(3)
  await expect(graph.locator(".react-flow__handle.connectable")).toHaveCount(0)

  expect(pageErrors).toEqual([])
})

test("stacks the list above the detail on a narrow viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  await page.getByRole("checkbox", { name: "Select payments-api-prod" }).click()
  await createApplication(page, "Payments")

  const list = await page
    .getByRole("list", { name: "Applications" })
    .boundingBox()
  const detail = await page
    .getByRole("region", { name: "Payments" })
    .boundingBox()
  expect(detail?.y).toBeGreaterThanOrEqual((list?.y ?? 0) + (list?.height ?? 0))
  expect(detail?.width).toBeCloseTo(list?.width ?? 0, 0)
})
