import { expect, test } from "@playwright/test";

test("renders a private scanner entry point", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Certificate Scanner" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open camera" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose image" })).toBeVisible();
  await expect(page.getByText("On-device processing")).toBeVisible();
});
