import { expect, type Page, test } from "@playwright/test"

async function expectShownNames(page: Page, expected: string[]) {
  await expect(page.getByRole("status")).toHaveText(
    `${expected.length} of 12 Resources`
  )
  const names = await page
    .getByRole("table")
    .locator("tbody tr td:nth-child(2)")
    .allTextContents()
  expect(names.sort()).toEqual([...expected].sort())
}

test("narrows the Resource inventory and clears back to all of it", async ({
  page,
}) => {
  const pageErrors: Error[] = []
  page.on("pageerror", (error) => pageErrors.push(error))
  await page.goto("/")
  const status = page.getByRole("status")
  const search = page.getByRole("searchbox", {
    name: "Search Resources by name",
  })
  const clearFilters = page.getByRole("button", { name: "Clear filters" })

  await expect(status).toHaveText("12 of 12 Resources")
  await expect(clearFilters).toBeHidden()

  await page.getByRole("button", { name: "Filter by Provider" }).click()
  const menu = page.getByRole("menu")
  await expect(menu).toBeInViewport({ ratio: 1 })
  for (const provider of ["AWS", "GCP"]) {
    const item = menu.getByRole("menuitemcheckbox", { name: provider })
    await item.click()
    await expect(item).toBeChecked()
  }
  await page.keyboard.press("Escape")
  await expect(menu).toBeHidden()

  const providerFilter = page.getByRole("button", {
    name: "Filter by Provider, 2 selected",
  })
  await expect(providerFilter.getByText("2", { exact: true })).toBeVisible()
  await expect(status).toHaveText("9 of 12 Resources")

  await search.fill("ST")
  await expectShownNames(page, [
    "analytics-etl-staging",
    "payments-webhooks-staging",
  ])

  await clearFilters.click()
  await expect(status).toHaveText("12 of 12 Resources")
  await expect(search).toHaveValue("")
  await expect(
    page.getByRole("button", { name: "Filter by Provider", exact: true })
  ).toBeVisible()
  await expect(clearFilters).toBeHidden()

  expect(pageErrors).toEqual([])
})

test("shows an empty state whose action restores the inventory", async ({
  page,
}) => {
  await page.goto("/")
  const table = page.getByRole("table")

  await page
    .getByRole("searchbox", { name: "Search Resources by name" })
    .fill("no-such-resource")

  await expect(table.getByText("No matching Resources")).toBeVisible()
  await expect(page.getByRole("status")).toHaveText("0 of 12 Resources")

  await table.getByRole("button", { name: "Clear filters" }).click()
  await expect(page.getByRole("status")).toHaveText("12 of 12 Resources")
})
