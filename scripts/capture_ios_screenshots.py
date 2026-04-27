"""
Capture iOS App Store screenshots (1290 x 2796, iPhone 6.7") for Writer's Helper
via the Expo web export served at /ios.html.

Usage:
  /opt/plugins-venv/bin/python3 /app/scripts/capture_ios_screenshots.py

Output:
  /app/store-screenshots/ios/*.png  (PNG, 1290 x 2796)
"""
import asyncio
import os
from playwright.async_api import async_playwright

BASE = "https://voice-notes-writer-1.preview.emergentagent.com"
EMAIL = "admin@scribeverse.app"
PASSWORD = "admin123"
OUT = "/app/store-screenshots/ios"

# iPhone 15 Pro Max logical viewport is 430x932; Apple ships App Store screenshots
# at the 3x pixel size (1290x2796). Playwright renders at device_scale_factor × viewport.
VIEWPORT = {"width": 430, "height": 932}
DSF = 3

HIDE_BADGE_CSS = """
a[href*="app.emergent.sh"],
a[href*="emergent.sh"],
a[href*="emergentagent.com/badge"],
iframe[src*="emergent"],
#emergent-badge,
#made-with-emergent,
[data-emergent-badge],
.emergent-badge { display: none !important; visibility: hidden !important; }
"""


async def hide_badge(page):
    await page.add_style_tag(content=HIDE_BADGE_CSS)


async def wait_for_testid(page, testid, timeout=15000):
    await page.wait_for_selector(f'[data-testid="{testid}"]', timeout=timeout)


async def login(page):
    await page.goto(f"{BASE}/ios.html", wait_until="networkidle")
    # Expo hydrates async — wait for the login input
    await wait_for_testid(page, "login-email-input")
    await page.fill('[data-testid="login-email-input"]', EMAIL)
    await page.fill('[data-testid="login-password-input"]', PASSWORD)
    await page.click('[data-testid="login-submit-button"]')
    # Projects screen: "new-project-button" appears once logged in
    await wait_for_testid(page, "new-project-button", timeout=20000)
    await page.wait_for_timeout(800)


async def capture(page, name):
    await hide_badge(page)
    await page.wait_for_timeout(400)
    await page.screenshot(path=f"{OUT}/{name}.png", full_page=False, type="png")
    print(f"  ✓ {OUT}/{name}.png")


async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(
            viewport=VIEWPORT,
            device_scale_factor=DSF,
            is_mobile=True,
            has_touch=True,
            user_agent=(
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
            ),
        )
        page = await ctx.new_page()

        await login(page)

        # 1) Dashboard (Projects screen)
        await capture(page, "01-your-writing-desk")

        # 2) Open "The Hollow Lantern" project
        # Find the card with that title's testID — project-card-<id>
        cards = await page.query_selector_all('[data-testid^="project-card-"]')
        target = None
        for c in cards:
            text = (await c.text_content()) or ""
            if "Hollow Lantern" in text:
                target = c
                break
        if not target and cards:
            target = cards[0]
        if target:
            await target.tap()
            await wait_for_testid(page, "header-dictate-button")
            await page.wait_for_timeout(1500)
            await capture(page, "02-project-world")

        # 3) Tap a note card to open the editor
        note_cards = await page.query_selector_all('[data-testid^="note-card-"]')
        chosen = None
        for nc in note_cards:
            text = (await nc.text_content()) or ""
            if "Thomas" in text or "first letter" in text.lower():
                chosen = nc
                break
        if not chosen and note_cards:
            chosen = note_cards[0]
        if chosen:
            await chosen.tap()
            await wait_for_testid(page, "note-save-button")
            await page.wait_for_timeout(800)
            await capture(page, "03-every-line-filed-right")
            # Note editor back button has no testID — match by its "← Back" text
            back_loc = page.get_by_text("← Back", exact=True).first
            await back_loc.tap()
            await wait_for_testid(page, "header-dictate-button")
            await page.wait_for_timeout(600)

        # 4) Dictation canvas (header-dictate-button from project screen)
        if not await page.query_selector('[data-testid="header-dictate-button"]'):
            cards = await page.query_selector_all('[data-testid^="project-card-"]')
            if cards:
                for c in cards:
                    text = (await c.text_content()) or ""
                    if "Hollow Lantern" in text:
                        await c.tap()
                        break
                await wait_for_testid(page, "header-dictate-button")
                await page.wait_for_timeout(800)
        dict_btn = await page.query_selector('[data-testid="header-dictate-button"]')
        if dict_btn:
            await dict_btn.tap()
            await wait_for_testid(page, "record-toggle-button")
            await page.wait_for_timeout(1200)
            await capture(page, "04-dictate-edit-tag")
            back = await page.query_selector('[data-testid="back-from-dictate"]')
            if back:
                await back.tap()
                await page.wait_for_timeout(600)

        # 5) Setup / mic-permissions screen — navigate from Projects header
        back_proj = await page.query_selector('[data-testid="back-to-dashboard"]')
        if back_proj:
            await back_proj.tap()
            await page.wait_for_timeout(600)
        setup_btn = await page.query_selector('[data-testid="open-setup-button"]')
        if setup_btn:
            await setup_btn.tap()
            await wait_for_testid(page, "setup-status-label")
            await page.wait_for_timeout(800)
            await capture(page, "05-setup-privacy")

        await ctx.close()
        await browser.close()
    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
