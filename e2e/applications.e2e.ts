import { expect, test } from "@playwright/test"

test("groups selected Resources into an Application", async ({ page }) => {
  const pageErrors: Error[] = []
  page.on("pageerror", (error) => pageErrors.push(error))
  await page.goto("/")
  const selectionBar = page.getByRole("region", { name: "Selected Resources" })
  const selectAll = page.getByRole("checkbox", {
    name: "Select all matching Resources",
  })

  await expect(selectionBar).toBeHidden()
  await page
    .getByRole("checkbox", { name: "Select identity-sso-gateway" })
    .click()
  await expect(selectionBar).toContainText("1 selected")
  await expect(
    page.getByRole("row").filter({ hasText: "identity-sso-gateway" })
  ).toHaveAttribute("data-state", "selected")

  await page
    .getByRole("searchbox", { name: "Search Resources by name" })
    .fill("payments")
  await expect(page.getByRole("status")).toHaveText("4 of 12 Resources")
  await selectAll.click()
  await expect(selectAll).toBeChecked()
  await expect(selectionBar).toContainText("5 selected")
  await expect(selectionBar).toBeInViewport()

  await selectionBar.getByRole("button", { name: "Create Application" }).click()
  const dialog = page.getByRole("dialog", { name: "Create Application" })
  await expect(dialog.getByRole("listitem")).toHaveCount(5)
  await dialog.getByRole("button", { name: "Create" }).click()
  await expect(dialog.getByRole("alert")).toHaveText("Name is required")

  await dialog.getByRole("textbox", { name: "Name" }).fill("  Payments API  ")
  await dialog
    .getByRole("textbox", { name: "Description" })
    .fill("Card payments, ledger, and SSO")
  await dialog.getByRole("button", { name: "Create" }).click()

  await expect(dialog).toBeHidden()
  await expect(
    page.getByText('Created Application "Payments API"')
  ).toBeVisible()
  await expect(page.getByRole("tab", { name: "Applications" })).toHaveAttribute(
    "aria-selected",
    "true"
  )
  const item = page
    .getByRole("list", { name: "Applications" })
    .getByRole("button", { name: /^Payments API/ })
  await expect(item).toHaveAttribute("aria-current", "true")
  await expect(item).toContainText("5 Resources")
  await expect(item.getByText("critical")).toBeVisible()
  await expect(item.getByText("AWS")).toBeVisible()
  await expect(item.getByText("Azure")).toBeVisible()

  await page.getByRole("tab", { name: "Resources" }).click()
  await expect(selectionBar).toBeHidden()
  await expect(selectAll).not.toBeChecked()

  expect(pageErrors).toEqual([])
})
