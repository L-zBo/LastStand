"""击杀重复计数复现脚本

现象：一波只生成 5 只敌人，killCount 已经到 5，场上却还有 2 只活的。
怀疑 handleEnemyKill(enemy, killer) 没有防重入 —— 同一帧内多个伤害源
（玩家近战 / 武器投射物 / 召唤物 / 敌人爆炸溅射 / 毒伤）都把血量已 <=0 的
同一只敌人判定为「我击杀的」，于是 killCount++、掉落、经验、吸血全部重复结算。

脚本给 handleEnemyKill 打补丁统计每只敌人被结算的次数。

用法:
    PYTHONIOENCODING=utf-8 PYTHONUTF8=1 python scripts/repro_double_kill.py
"""
import os
import sys
import threading
import functools
import http.server
import socketserver

from playwright.sync_api import sync_playwright

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8126

PROBE = """
() => {
    window.__kill = { calls: 0, uniq: 0, dup: 0, dupDetail: [] };
    const orig = window.handleEnemyKill;
    const seen = new WeakSet();
    window.handleEnemyKill = function (enemy, killer) {
        window.__kill.calls++;
        if (seen.has(enemy)) {
            window.__kill.dup++;
            window.__kill.dupDetail.push({
                type: enemy.type,
                hp: Math.round(enemy.health),
                exp: enemy.expValue
            });
        } else {
            seen.add(enemy);
            window.__kill.uniq++;
        }
        return orig.apply(this, arguments);
    };
    return true;
}
"""


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
        js_errors = []
        page.on("pageerror", lambda e: js_errors.append(str(e)))
        page.on("console", lambda m: js_errors.append(f"console.{m.type}: {m.text}")
                if m.type == "error" else None)
        page.goto(f"http://127.0.0.1:{PORT}/game.html", wait_until="load", timeout=30000)
        page.wait_for_timeout(1200)

        page.click("#newGameBtn")
        page.wait_for_timeout(400)
        page.locator("#saveSlots .save-slot").first.click()
        page.wait_for_timeout(400)
        page.click('.player-count-btn[data-count="1"]')
        page.wait_for_timeout(400)
        # 召唤师：随从 + 自身攻击同时存在，最容易触发重复结算
        page.click('.class-card[data-class="summoner"]')
        page.wait_for_timeout(400)
        page.click('.difficulty-card[data-difficulty="easy"]')
        page.wait_for_timeout(400)
        page.click('.map-card[data-map="forest"]')
        page.wait_for_timeout(200)
        page.click("#startGameBtn")
        # 等倒计时结束、initGame 完成后再打补丁，否则会被后续初始化绕开
        page.wait_for_timeout(4500)

        patched = page.evaluate(PROBE)
        diag = page.evaluate("""() => ({
            state: game.state,
            hasFn: typeof handleEnemyKill,
            isSpawning: game.wave.isSpawning,
            loopRunning: game.loopRunning,
            total: game.wave.totalEnemies
        })""")
        print(f"补丁注入: {patched}  游戏诊断: {diag}", flush=True)

        # 刷怪链路诊断：getSpawnPosition 能否正常返回、间隔判定是否卡死
        spawn_diag = page.evaluate("""() => {
            const out = {};
            try {
                const pos = getSpawnPosition();
                out.pos = {x: Math.round(pos.x), y: Math.round(pos.y)};
                out.dist = Math.round(Math.hypot(pos.x - game.player.x, pos.y - game.player.y));
            } catch (e) {
                out.error = String(e);
            }
            out.canvas = {w: CONFIG.canvas.width, h: CONFIG.canvas.height};
            out.cullRadius = (typeof getEnemyCullRadius === 'function') ? getEnemyCullRadius() : 'MISSING';
            out.lastSpawnTime = game.wave.lastSpawnTime;
            out.now = Date.now();
            out.sinceLastSpawn = Date.now() - game.wave.lastSpawnTime;
            out.gap = CONFIG.wave.timeBetweenSpawns;
            out.inBreak = game.wave.inBreak;
            return out;
        }""")
        print(f"刷怪链路诊断: {spawn_diag}", flush=True)
        if js_errors:
            print(f"!! 进入战斗后已捕获 {len(js_errors)} 条 JS 错误:", flush=True)
            for e in js_errors[:5]:
                print(f"    {e[:300]}", flush=True)

        for i in range(6):
            page.wait_for_timeout(10000)
            # 清掉升级弹窗，让战斗继续（卡片刚弹出时有入场动画，用 force 跳过可点性等待）
            try:
                if page.locator("#levelUpScreen:not(.hidden) .buff-card").count() > 0:
                    page.locator("#levelUpScreen:not(.hidden) .buff-card").first.click(
                        force=True, timeout=5000)
                    page.wait_for_timeout(500)
            except Exception as e:
                print(f"    (升级弹窗点击跳过: {str(e).splitlines()[0][:60]})", flush=True)
            try:
                if page.locator("#shopScreen").count() > 0 and page.locator("#shopScreen").is_visible():
                    page.evaluate("() => { if (typeof closeShopAndContinue==='function') closeShopAndContinue(); }")
                    page.wait_for_timeout(500)
            except Exception:
                pass
            s = page.evaluate("""() => ({
                wave: game.wave.current,
                spawned: game.wave.enemiesSpawned,
                total: game.wave.totalEnemies,
                alive: game.enemies.length,
                kills: game.killCount,
                remaining: game.wave.enemiesRemaining,
                k: window.__kill
            })""")
            k = s["k"]
            print(f"  t={(i+1)*10:3}s  波次{s['wave']}  生成{s['spawned']}/{s['total']}  "
                  f"场上{s['alive']}  killCount={s['kills']}  "
                  f"结算调用{k['calls']}(唯一{k['uniq']} 重复{k['dup']})  剩余字段={s['remaining']}",
                  flush=True)

        k = page.evaluate("() => window.__kill")
        final = page.evaluate("""() => ({
            kills: game.killCount, alive: game.enemies.length,
            spawnedTotal: game.wave.enemiesSpawned, wave: game.wave.current
        })""")
        print("\n--- 结论 ---")
        print(f"    handleEnemyKill 被调用 {k['calls']} 次，其中作用于不同敌人 {k['uniq']} 次，"
              f"对同一敌人重复调用 {k['dup']} 次")
        print(f"    game.killCount = {final['kills']}，实际死亡敌人 = {k['uniq']}")
        # 重复「调用」是正常的：同一帧内多个伤害源都可能把同一只敌人打到 0 血以下。
        # 真正的判据是防重入闸有没有拦住重复「结算」—— killCount 必须等于唯一敌人数。
        ok = final["kills"] == k["uniq"]
        if ok:
            print(f"    [OK] 防重入生效：{k['dup']} 次重复调用被拦下，击杀数与实际死亡数一致")
            if k["dupDetail"]:
                print(f"         （被拦下的重复调用示例，血量已为负说明确实是同一只怪的二次结算）")
                for d in k["dupDetail"][:5]:
                    print(f"         type={d['type']:8} 调用时 hp={d['hp']} exp={d['exp']}")
        else:
            print(f"    [FAIL] 击杀数 {final['kills']} != 实际死亡 {k['uniq']}，"
                  f"经验/掉落/吸血会多算")
            for d in k["dupDetail"][:10]:
                print(f"        重复: type={d['type']:8} 结算时 hp={d['hp']} exp={d['exp']}")

        browser.close()
    httpd.shutdown()
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
