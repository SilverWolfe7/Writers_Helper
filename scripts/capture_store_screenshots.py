"""
Capture App Store / Mac App Store / Microsoft Store screenshots for Writer's Helper.

Usage:
  /opt/plugins-venv/bin/python3 /app/scripts/capture_store_screenshots.py

Outputs (PNG, full-quality):
  /app/store-screenshots/macos/*.png    (2560 x 1600 — Retina MBP 13")
  /app/store-screenshots/windows/*.png  (1920 x 1080 — Microsoft Store)
"""
import asyncio
import os
from playwright.async_api import async_playwright

BASE = "https://voice-notes-writer-1.preview.emergentagent.com"
EMAIL = "admin@scribeverse.app"
PASSWORD = "admin123"

HIDE_BADGE_CSS = """
a[href*="app.emergent.sh"],
a[href*="emergent.sh"],
a[href*="emergentagent.com/badge"],
iframe[src*="emergent"],
#emergent-badge,
#made-with-emergent,
[data-emergent-badge],
.emergent-badge,
div[class*="made-with-emergent"] { display: none !important; visibility: hidden !important; }
"""

MAC_SIZE = (2560, 1600)
WIN_SIZE = (1920, 1080)


async def hide_badge(page):
    await page.add_style_tag(content=HIDE_BADGE_CSS)


async def capture_flow(page, out_dir):
    os.makedirs(out_dir, exist_ok=True)

    # 1) Dashboard
    await page.goto(f"{BASE}/", wait_until="networkidle")
    await page.wait_for_timeout(1500)
    await hide_badge(page)
    await page.screenshot(path=f"{out_dir}/01-dashboard.png", full_page=False, type="png")
    print(f"  ✓ {out_dir}/01-dashboard.png")

    # 2) Project page (Notes tab)
    await page.click('a[href^="/projects/"]:not([href*="/dictate"])')
    await page.wait_for_timeout(2500)
    await hide_badge(page)
    await page.screenshot(path=f"{out_dir}/02-project-notes.png", full_page=False, type="png")
    print(f"  ✓ {out_dir}/02-project-notes.png")

    # 3) Note editor on a specific rich note ("Thomas — first letter fragment" has the
    #    nicest multi-character tagging). Fall back to the first edit button.
    edit_buttons = await page.query_selector_all('[data-testid^="edit-note-"]')
    # Find the one within the "Thomas" card if possible
    target_btn = None
    cards = await page.query_selector_all('[data-testid^="note-card-"]')
    for card in cards:
        h3 = await card.query_selector("h3")
        if h3:
            text = (await h3.text_content()) or ""
            if "Thomas" in text:
                target_btn = await card.query_selector('[data-testid^="edit-note-"]')
                break
    if not target_btn and edit_buttons:
        target_btn = edit_buttons[0]
    if target_btn:
        await target_btn.click()
        await page.wait_for_timeout(1200)
        # Scroll the editor into view at the top
        await page.evaluate("window.scrollTo(0, 0)")
        await hide_badge(page)
        await page.screenshot(path=f"{out_dir}/03-note-editor.png", full_page=False, type="png")
        print(f"  ✓ {out_dir}/03-note-editor.png")
        cancel = await page.query_selector('button:has-text("Cancel")')
        if cancel:
            await cancel.click()
            await page.wait_for_timeout(400)

    # 4) Dictation canvas
    dictate = await page.query_selector('[data-testid="start-dictate-button"]')
    if dictate:
        await dictate.click()
        await page.wait_for_timeout(2000)
        await hide_badge(page)
        await page.screenshot(path=f"{out_dir}/04-dictate.png", full_page=False, type="png")
        print(f"  ✓ {out_dir}/04-dictate.png")

    # 5) Characters tab
    await page.go_back()
    await page.wait_for_timeout(1500)
    chars_tab = await page.query_selector('[data-testid="tab-characters"]')
    if chars_tab:
        await chars_tab.click()
        await page.wait_for_timeout(1200)
        await hide_badge(page)
        await page.screenshot(path=f"{out_dir}/05-characters.png", full_page=False, type="png")
        print(f"  ✓ {out_dir}/05-characters.png")

    # 6) Acts tab
    acts_tab = await page.query_selector('[data-testid="tab-acts"]')
    if acts_tab:
        await acts_tab.click()
        await page.wait_for_timeout(1200)
        await hide_badge(page)
        await page.screenshot(path=f"{out_dir}/06-acts.png", full_page=False, type="png")
        print(f"  ✓ {out_dir}/06-acts.png")


async def login(page):
    await page.goto(f"{BASE}/login", wait_until="networkidle")
    await page.wait_for_timeout(800)
    await page.fill('input[type="email"]', EMAIL)
    await page.fill('input[type="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await page.wait_for_url(f"{BASE}/", timeout=15000)
    await page.wait_for_timeout(1500)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        for label, (w, h) in (("macos", MAC_SIZE), ("windows", WIN_SIZE)):
            print(f"\n=== {label} — {w}x{h} ===")
            ctx = await browser.new_context(viewport={"width": w, "height": h})
            page = await ctx.new_page()
            await login(page)
            await capture_flow(page, f"/app/store-screenshots/{label}")
            await ctx.close()

        await browser.close()
    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
