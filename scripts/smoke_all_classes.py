"""全职业冒烟测试

召唤师/死灵法师曾因「gameLoop 里 buildEnemyGrid 排在实体 update 之后」
导致进入战斗第一帧就抛异常、游戏静默卡死（画面还在但不刷怪）。
只测一两个职业发现不了这类问题，这里把 8 个职业逐个跑一遍。

每个职业检查：进战斗不报错、刷怪推进、玩家能移动、有击杀、游戏时间在走。

用法:
    PYTHONIOENCODING=utf-8 PYTHONUTF8=1 python scripts/smoke_all_classes.py
"""
import os
import sys
import threading
import functools
import http.server
import socketserver

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from playwright.sync_api import sync_playwright
import _gamedriver as gd

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8127

CLASSES = [
    ("warrior", "战士", "sword"), ("mage", "法师", "staff"),
    ("assassin", "刺客", "dagger"), ("ranger", "游侠", "bow"),
    ("summoner", "召唤师", "staff"), ("knight", "骑士", "axe"),
    ("paladin", "圣骑士", "sword"), ("necromancer", "死灵法师", "fireball"),
]
MAPS = ["forest", "desert", "dungeon", "snow", "lava", "ocean"]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def run_one(page, cls_id, cls_name, map_id, expect_weapon):
    errs = []
    handler = lambda e: errs.append(str(e))
    page.on("pageerror", handler)

    page.goto(f"http://127.0.0.1:{PORT}/game.html", wait_until="load", timeout=30000)
    page.wait_for_timeout(900)
    page.evaluate("() => localStorage.clear()")

    page.click("#newGameBtn")
    page.wait_for_timeout(350)
    page.locator("#saveSlots .save-slot").first.click()
    page.wait_for_timeout(350)
    page.click('.player-count-btn[data-count="1"]')
    page.wait_for_timeout(350)
    page.click(f'.class-card[data-class="{cls_id}"]')
    page.wait_for_timeout(350)
    page.click('.difficulty-card[data-difficulty="normal"]')
    page.wait_for_timeout(350)
    page.click(f'.map-card[data-map="{map_id}"]')
    page.wait_for_timeout(200)
    page.click("#startGameBtn")
    page.wait_for_timeout(4500)

    t0 = page.evaluate("() => ({t: game.gameTime, x: game.player.x, y: game.player.y})")
    # 初始武器在开局就该发好（CLASSES.startingWeapon），先取一次快照再打
    start_weapons = page.evaluate("() => game.player.weapons.map(w => w.id)")

    # 按住方向键 + 放一次主动技能（Q），把技能分支也带进去跑
    page.keyboard.down("d")
    page.wait_for_timeout(1200)
    page.keyboard.press("q")
    page.wait_for_timeout(1200)
    page.keyboard.up("d")
    # 输出高的职业几秒内就会升级，game.state 切到 levelup 后 gameTime 不再推进。
    # 必须替玩家把升级/商店弹窗点掉，否则「游戏时间在走」这条判定会误判成循环卡死。
    gd.run_for(page, 11, tick=0.5)

    s = page.evaluate("""() => ({
        state: game.state,
        t: game.gameTime,
        spawned: game.wave.enemiesSpawned,
        alive: game.enemies.length,
        kills: game.killCount,
        summons: game.summons.length,
        x: game.player.x, y: game.player.y,
        hp: Math.round(game.player.health)
    })""")
    page.remove_listener("pageerror", handler)

    moved = abs(s["x"] - t0["x"]) + abs(s["y"] - t0["y"]) > 5
    ticking = s["t"] - t0["t"] > 5          # 游戏时间在推进 = 主循环没死
    spawning = s["spawned"] > 0
    has_weapon = expect_weapon in start_weapons
    ok = not errs and ticking and spawning and moved and has_weapon

    return ok, {
        "state": s["state"], "时间": f"{t0['t']:.0f}->{s['t']:.0f}s",
        "刷怪": s["spawned"], "场上": s["alive"], "击杀": s["kills"],
        "召唤物": s["summons"], "HP": s["hp"], "移动": moved,
        "初始武器": ",".join(start_weapons) or "(无)",
        "武器符合预期": has_weapon, "错误": errs[:2],
    }


def main():
    handler = functools.partial(QuietHandler, directory=PROJECT_ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()

    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-proxy-server"])
        page = browser.new_page(viewport={"width": 1500, "height": 880})
        for i, (cid, cname, expect_weapon) in enumerate(CLASSES):
            m = MAPS[i % len(MAPS)]      # 顺带把 6 张地图都覆盖到
            ok, info = run_one(page, cid, cname, m, expect_weapon)
            results.append((cname, m, ok, info))
            flag = "[OK]  " if ok else "[FAIL]"
            print(f"{flag} {cname:6} @{m:8} 状态={info['state']:12} 时间={info['时间']:12} "
                  f"刷怪={info['刷怪']:2} 场上={info['场上']:2} 击杀={info['击杀']:2} "
                  f"召唤物={info['召唤物']} HP={info['HP']:4} "
                  f"武器={info['初始武器']}", flush=True)
            if not info["武器符合预期"]:
                print(f"        !! 初始武器不符：期望 {expect_weapon}，"
                      f"实际 {info['初始武器']}", flush=True)
            if info["错误"]:
                for e in info["错误"]:
                    print(f"        !! {e[:160]}", flush=True)
        browser.close()
    httpd.shutdown()

    print("\n" + "=" * 60)
    passed = sum(1 for _, _, ok, _ in results if ok)
    print(f"全职业冒烟: {passed}/{len(results)} 通过")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
