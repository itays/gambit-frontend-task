import { expect, test } from "@playwright/test"

test.use({ colorScheme: "light" })

test("app renders and toggles dark mode from the keyboard", async ({
  page,
}) => {
  const pageErrors: Error[] = []
  page.on("pageerror", (error) => pageErrors.push(error))

  await page.goto("/")

  await expect(
    page.getByRole("heading", { level: 1, name: "Project ready!" })
  ).toBeVisible()
  await expect(page.getByRole("button", { name: "Button" })).toBeVisible()

  // The theme class is applied in the same effect flush that registers the
  // keydown listener, so it marks the app as interactive.
  const root = page.locator("html")
  await expect(root).toContainClass("light")

  await page.keyboard.press("d")

  await expect(root).toContainClass("dark")
  await expect(root).not.toContainClass("light")
  expect(pageErrors).toEqual([])
})
