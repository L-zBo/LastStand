"""敌人生成/清理逻辑回归验证脚本

针对两个已修复的缺陷做回归：
  1. wave.js getSpawnPosition() 曾在整个 8000x6000 世界随机取点（只要求离玩家 >=400），
     而 main.js 的清理条件是 max(canvasW, canvasH) * 2（约 2480），
     导致大量敌人刚生成就在清理半径外，下一帧被 filter 静默删除 —— 不计击杀、不补生成，
     checkWaveComplete 的「enemies.length === 0」提前成立，波次白送。
     现已改为「玩家周围环形生成 + 超距重投」，敌人总数守恒。
  2. game.wave.enemiesRemaining 曾是死字段（只在 startNewWave 赋值、从不递减）。
     现已随击杀递减，并显示在顶栏「🌊 波次 (剩N)」。

判定标准：culled 必须为 0；有击杀时 enemiesRemaining 必须小于 totalEnemies。

用法:
    PYTHONIOENCODING=utf-8 PYTHONUTF8=1 python scripts/repro_enemy_cull.py
"""
import os
import sys
import threading
import functools
import http.server
import socketserver

from playwright.sync_api import sync_playwright

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8124
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


# 在游戏开始前注入探针：包裹 getSpawnPosition 记录每次生成点到玩家的距离
PROBE = """
() => {
    window.__probe = { spawns: [], culled: 0, cullLog: [] };
    const origSpawn = window.getSpawnPosition;
    window.getSpawnPosition = function () {
        const pos = origSpawn.apply(this, arguments);
        const d = Math.hypot(pos.x - game.player.x, pos.y - game.player.y);
        window.__probe.spawns.push(Math.round(d));
        return pos;
    };
    // 每帧对比敌人数组，捕捉「非死亡却消失」的敌人
    let prev = [];
    const tick = () => {
        const cur = game.enemies;
        const curSet = new Set(cur);
        for (const e of prev) {
            if (!curSet.has(e) && e.health > 0) {
                window.__probe.culled++;
                window.__probe.cullLog.push({
                    type: e.type,
                    hp: Math.round(e.health),
                    dist: Math.round(Math.hypot(e.x - game.player.x, e.y - game.player.y))
                });
            }
        }
        prev = cur.slice();
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return true;
}
"""


def main():
    httpd = serve()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-proxy-server"])
        page = browser.new_page(viewport={"width": 1600, "height": 900})
        page.goto(f"{BASE}/game.html", wait_until="load", timeout=30000)
        page.wait_for_timeout(1200)

        # 走到进入游戏
        page.click("#newGameBtn")
        page.wait_for_timeout(400)
        page.locator("#saveSlots .save-slot").first.click()
        page.wait_for_timeout(400)
        page.click('.player-count-btn[data-count="1"]')
        page.wait_for_timeout(400)
        page.click('.class-card[data-class="ranger"]')   # 游侠：远程，攻击范围大
        page.wait_for_timeout(400)
        page.click('.difficulty-card[data-difficulty="normal"]')
        page.wait_for_timeout(400)
        page.click('.map-card[data-map="forest"]')
        page.wait_for_timeout(200)
        page.click("#startGameBtn")
        page.wait_for_timeout(4200)

        page.evaluate(PROBE)

        geo = page.evaluate("""() => ({
            canvasW: CONFIG.canvas.width,
            canvasH: CONFIG.canvas.height,
            worldW: CONFIG.world.width,
            worldH: CONFIG.world.height,
            cullRadius: Math.max(CONFIG.canvas.width, CONFIG.canvas.height) * 2,
            minSpawnDist: 400
        })""")
        print("--- 几何参数 ---")
        for k, v in geo.items():
            print(f"    {k:14} {v}")
        world_diag = (geo["worldW"] ** 2 + geo["worldH"] ** 2) ** 0.5
        print(f"    {'世界对角线':14} {world_diag:.0f}")
        print(f"    => 生成距离上限 {geo['cullRadius'] * 0.7:.0f}（清理半径 {geo['cullRadius']} 的 70%），"
              f"生成必然落在清理半径内\n")

        # 观察 60 秒
        print("--- 观察 60 秒（玩家不操作）---")
        for i in range(6):
            page.wait_for_timeout(10000)
            s = page.evaluate("""() => ({
                wave: game.wave.current,
                spawned: game.wave.enemiesSpawned,
                total: game.wave.totalEnemies,
                remaining: game.wave.enemiesRemaining,
                alive: game.enemies.length,
                kills: game.killCount,
                state: game.state,
                culled: window.__probe.culled,
                spawnCount: window.__probe.spawns.length
            })""")
            print(f"  t={(i+1)*10:3}s  波次{s['wave']}  状态{s['state']:14} "
                  f"生成{s['spawned']}/{s['total']}  场上{s['alive']}  "
                  f"击杀{s['kills']}  被清理{s['culled']}  remaining字段={s['remaining']}")
            # 波次完成会弹商店，自动关掉继续观察
            if s["state"] == "waveComplete":
                page.evaluate("() => { if (typeof closeShopAndContinue==='function') closeShopAndContinue(); }")
                page.wait_for_timeout(500)

        pr = page.evaluate("() => window.__probe")
        spawns = pr["spawns"]
        cull_radius = geo["cullRadius"]
        print("\n--- 生成距离分布 ---")
        if spawns:
            spawns_sorted = sorted(spawns)
            n = len(spawns)
            print(f"    样本 {n} 个，最小 {spawns_sorted[0]}，中位 {spawns_sorted[n//2]}，最大 {spawns_sorted[-1]}")
            beyond = [d for d in spawns if d >= cull_radius]
            print(f"    生成即在清理半径({cull_radius})之外: {len(beyond)}/{n} = {len(beyond)*100//n}%"
                  f"   {'<- 应为 0%' if beyond else 'OK'}")
        else:
            print("    （观察窗口内没有新的生成事件，探针注入前本波已刷完）")
        print(f"\n--- 非死亡消失（被距离清理）的敌人: {pr['culled']} 只 ---")
        for c in pr["cullLog"][:15]:
            print(f"    type={c['type']:8} hp={c['hp']:5} 消失时距玩家={c['dist']}")

        final = page.evaluate("""() => ({
            wave: game.wave.current, kills: game.killCount,
            spawned: game.wave.enemiesSpawned, total: game.wave.totalEnemies,
            remaining: game.wave.enemiesRemaining
        })""")
        cull_ok = pr["culled"] == 0
        remain_ok = final["kills"] == 0 or final["remaining"] < final["total"]
        print("\n--- 结论 ---")
        print(f"    60 秒后推进到第 {final['wave']} 波，累计击杀 {final['kills']} 只，"
              f"被静默清理 {pr['culled']} 只")
        print(f"    [{'OK' if cull_ok else 'FAIL'}] 敌人守恒：血量>0 的敌人没有凭空消失")
        print(f"    [{'OK' if remain_ok else 'FAIL'}] enemiesRemaining = {final['remaining']} / "
              f"totalEnemies = {final['total']}（应随击杀递减）")

        browser.close()
    httpd.shutdown()
    return 0 if (cull_ok and remain_ok) else 1


if __name__ == "__main__":
    sys.exit(main())
