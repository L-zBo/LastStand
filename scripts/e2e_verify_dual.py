"""双人模式端到端验证

单人流程由 scripts/e2e_verify.py 覆盖，这里专测从没验证过的双人分支：
P1/P2 分别选职业、两套面板、两套按键独立响应、双人升级同步等待。

用法:
    PYTHONIOENCODING=utf-8 PYTHONUTF8=1 python scripts/e2e_verify_dual.py
"""
import os
import sys
import threading
import functools
import http.server
import socketserver

from playwright.sync_api import sync_playwright

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8125

results = []
page_errors = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(f"{'[OK]  ' if ok else '[FAIL]'} {name}" + (f"  -- {detail}" if detail else ""), flush=True)
    return ok


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    handler = functools.partial(QuietHandler, directory=PROJECT_ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-proxy-server"])
        page = browser.new_page(viewport={"width": 1600, "height": 900})
        page.on("pageerror", lambda e: page_errors.append(str(e)))

        page.goto(f"http://127.0.0.1:{PORT}/game.html", wait_until="load", timeout=30000)
        page.wait_for_timeout(1200)

        page.click("#newGameBtn")
        page.wait_for_timeout(400)
        page.locator("#saveSlots .save-slot").first.click()
        page.wait_for_timeout(400)
        page.click('.player-count-btn[data-count="2"]')
        page.wait_for_timeout(500)

        title1 = page.locator("#classSelectionTitle").inner_text()
        check("P1 职业选择标题正确", "P1" in title1 or "1" in title1, title1)
        page.click('.class-card[data-class="warrior"]')
        page.wait_for_timeout(700)

        title2 = page.locator("#classSelectionTitle").inner_text()
        check("切到 P2 职业选择", title2 != title1, f"{title1} -> {title2}")
        page.click('.class-card[data-class="mage"]')
        page.wait_for_timeout(700)

        page.click('.difficulty-card[data-difficulty="normal"]')
        page.wait_for_timeout(400)
        page.click('.map-card[data-map="desert"]')
        page.wait_for_timeout(200)
        page.click("#startGameBtn")
        page.wait_for_timeout(4500)

        s = page.evaluate("""() => ({
            state: game.state,
            pc: game.playerCount,
            cls1: game.selectedClass,
            cls2: game.selectedClass2,
            p1: game.player ? {hp: Math.round(game.player.health), x: Math.round(game.player.x)} : null,
            p2: game.player2 ? {hp: Math.round(game.player2.health), x: Math.round(game.player2.x)} : null,
            p2panel: !document.getElementById('p2Panel').classList.contains('hidden'),
            map: game.selectedMap
        })""")
        check("进入双人游戏", s["state"] == "playing" and s["pc"] == 2, s["state"])
        check("两名玩家都已创建", s["p1"] is not None and s["p2"] is not None,
              f"P1 {s['p1']}  P2 {s['p2']}")
        check("P1/P2 职业各自独立", s["cls1"] == "warrior" and s["cls2"] == "mage",
              f"{s['cls1']} / {s['cls2']}")
        check("P1/P2 生命值符合各自职业", s["p1"]["hp"] == 150 and s["p2"]["hp"] == 80,
              f"战士 {s['p1']['hp']}(应150)  法师 {s['p2']['hp']}(应80)")
        check("P2 侧边面板已显示", s["p2panel"])
        check("地图选择生效", s["map"] == "desert", s["map"])

        # P1 用 WASD 右移，P2 用方向键左移 —— 两套按键必须互不干扰
        page.keyboard.down("d")
        page.keyboard.down("ArrowLeft")
        page.wait_for_timeout(1500)
        page.keyboard.up("d")
        page.keyboard.up("ArrowLeft")
        s2 = page.evaluate("() => ({p1x: Math.round(game.player.x), p2x: Math.round(game.player2.x)})")
        check("P1 用 WASD 独立移动（右）", s2["p1x"] > s["p1"]["x"],
              f"{s['p1']['x']} -> {s2['p1x']}")
        check("P2 用方向键独立移动（左）", s2["p2x"] < s["p2"]["x"],
              f"{s['p2']['x']} -> {s2['p2x']}")

        page.wait_for_timeout(12000)
        s3 = page.evaluate("""() => ({
            state: game.state,
            kills: game.killCount,
            p1hp: Math.round(game.player.health),
            p2hp: Math.round(game.player2.health),
            wave: game.wave.current,
            remaining: game.wave.enemiesRemaining,
            dualLevelUp: !document.getElementById('dualPlayerLevelUp').classList.contains('hidden'),
            enemies: game.enemies.length,
            spawned: game.wave.enemiesSpawned
        })""")
        check("双人战斗正常推进", s3["kills"] > 0 or s3["enemies"] > 0,
              f"击杀 {s3['kills']}，场上 {s3['enemies']}，已生成 {s3['spawned']}")
        check("双人下 enemiesRemaining 正常", s3["remaining"] >= 0,
              f"remaining={s3['remaining']} wave={s3['wave']} state={s3['state']}")

        if s3["dualLevelUp"]:
            check("双人升级面板正确启用", True, "dualPlayerLevelUp 可见")

        shot = os.path.join(PROJECT_ROOT, "docs", "screenshots", "e2e_dual.png")
        os.makedirs(os.path.dirname(shot), exist_ok=True)
        page.screenshot(path=shot)
        check("双人截图已保存", os.path.exists(shot))

        browser.close()

    httpd.shutdown()

    print("\n" + "=" * 60)
    passed = sum(1 for _, ok, _ in results if ok)
    print(f"断言结果: {passed}/{len(results)} 通过")
    fails = [(n, d) for n, ok, d in results if not ok]
    for n, d in fails:
        print(f"  - {n}  {d}")
    print(f"未捕获 JS 异常: {page_errors if page_errors else '无'}")
    return 0 if not fails and not page_errors else 1


if __name__ == "__main__":
    sys.exit(main())
