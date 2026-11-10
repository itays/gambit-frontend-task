import { expect, test } from "@playwright/test"

test.use({ colorScheme: "light" })

test("renders the Resource inventory and toggles the theme", async ({
  page,
}) => {
  const pageErrors: Error[] = []
  page.on("pageerror", (error) => pageErrors.push(error))

  await page.goto("/")

  await expect(
    page.getByRole("heading", { level: 1, name: "Cloud Inventory" })
  ).toBeVisible()
  const table = page.getByRole("table")
  await expect(table.getByRole("row").nth(1)).toContainText("critical")
  await expect(
    table.getByRole("columnheader", { name: "Criticality" })
  ).toHaveAttribute("aria-sort", "descending")

  // The theme class is applied in the same effect flush that registers the
  // keydown listener, so it marks the app as interactive.
  const root = page.locator("html")
  await expect(root).toContainClass("light")

  await page.getByRole("button", { name: "Toggle theme" }).click()
  await expect(root).toContainClass("dark")
  await expect(root).not.toContainClass("light")

  await page.keyboard.press("d")
  await expect(root).toContainClass("light")
  await expect(root).not.toContainClass("dark")

  expect(pageErrors).toEqual([])
})
