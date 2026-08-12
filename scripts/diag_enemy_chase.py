"""敌人追击行为诊断

修好「敌人静默消失」后暴露出新现象：玩家不动时，场上敌人 60 秒不减少、击杀停滞。
本脚本采样敌人与玩家的距离随时间的变化，判断到底是
  (a) 敌人根本没在移动（AI 或避障卡死）
  (b) 敌人在动但被障碍物挡住（提高障碍物密度后新引入）
  (c) 敌人靠近了但玩家打不到（射程/攻击链路问题）

用法:
    PYTHONIOENCODING=utf-8 PYTHONUTF8=1 python scripts/diag_enemy_chase.py
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
BASE = f"http://127.0.0.1:{PORT}"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve():
    handler = functools.partial(QuietHandler, directory=PROJECT_ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


SNAP = """() => {
    const p = game.player;
    return {
        t: Math.round(game.gameTime),
        kills: game.killCount,
        alive: game.enemies.length,
        weapons: p.weapons.map(w => w.id + ':' + (w.range || '-')),
        baseRange: Math.round(p.attackRange),
        rangeMult: p.rangeMultiplier,
        projectiles: game.weaponProjectiles.length,
        enemies: game.enemies.map(e => ({
            type: e.type,
            hp: Math.round(e.health),
            d: Math.round(Math.hypot(e.x - p.x, e.y - p.y)),
            sp: e.speed !== undefined ? Number(e.speed.toFixed(2)) : null,
            x: Math.round(e.x), y: Math.round(e.y)
        }))
    };
}"""


def main():
    httpd = serve()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-proxy-server"])
        page = browser.new_page(viewport={"width": 1600, "height": 900})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{BASE}/game.html", wait_until="load", timeout=30000)
        page.wait_for_timeout(1200)

        page.click("#newGameBtn")
        page.wait_for_timeout(400)
        page.locator("#saveSlots .save-slot").first.click()
        page.wait_for_timeout(400)
        page.click('.player-count-btn[data-count="1"]')
        page.wait_for_timeout(400)
        page.click('.class-card[data-class="ranger"]')
        page.wait_for_timeout(400)
        page.click('.difficulty-card[data-difficulty="normal"]')
        page.wait_for_timeout(400)
        page.click('.map-card[data-map="forest"]')
        page.wait_for_timeout(200)
        page.click("#startGameBtn")
        page.wait_for_timeout(4500)

        first = page.evaluate(SNAP)
        print(f"玩家武器: {first['weapons']}   基础射程 {first['baseRange']}  射程系数 {first['rangeMult']}")
        print(f"障碍物总数: {page.evaluate('() => game.obstacles.length')}")
        print()
        print("t(s)  击杀 场上 飞行物 | 每只敌人到玩家的距离")
        prev_pos = {}
        for i in range(10):
            page.wait_for_timeout(5000)
            s = page.evaluate(SNAP)
            dists = " ".join(f"{e['type'][:4]}:{e['d']:5}" for e in s["enemies"][:6])
            print(f"{s['t']:4}  {s['kills']:4} {s['alive']:4} {s['projectiles']:6} | {dists}")
            # 位移检测
            moved = 0
            for idx, e in enumerate(s["enemies"]):
                key = f"{idx}"
                if key in prev_pos:
                    dx = abs(e["x"] - prev_pos[key][0]) + abs(e["y"] - prev_pos[key][1])
                    if dx > 3:
                        moved += 1
                prev_pos[key] = (e["x"], e["y"])
            if s["enemies"]:
                print(f"      -> 本采样周期内位置变化过的敌人: {moved}/{len(s['enemies'])}")

        last = page.evaluate(SNAP)
        print("\n--- 敌人明细 ---")
        for e in last["enemies"]:
            print(f"    {e['type']:14} hp={e['hp']:5} 距玩家={e['d']:5} speed={e['sp']}")

        # 是否被障碍物包围
        stuck = page.evaluate("""() => {
            return game.enemies.map(e => {
                const near = getNearbyObstacles(e.x, e.y);
                let blocking = 0;
                near.forEach(o => {
                    const d = Math.hypot(o.x - e.x, o.y - e.y);
                    if (d < (o.size || 30) + 14) blocking++;
                });
                return { type: e.type, nearObstacles: near.length, blocking: blocking };
            });
        }""")
        print("\n--- 敌人周围障碍物 ---")
        for s in stuck:
            print(f"    {s['type']:14} 附近障碍物 {s['nearObstacles']:3} 个，其中重叠 {s['blocking']}")

        if errors:
            print("\n未捕获 JS 异常:")
            for e in errors[:10]:
                print("   !", e)
        else:
            print("\n未捕获 JS 异常: 无")

        browser.close()
    httpd.shutdown()
    return 0


if __name__ == "__main__":
    sys.exit(main())
