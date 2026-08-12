"""LastStand 验证用的共享驱动

把「起静态服务器」「走完开局流程」「自动消化会阻塞主循环的弹窗」这些
每个验证脚本都要重复写的东西收在一起。

关键点：游戏里有四个界面会把 game.state 从 playing 切走并等待玩家输入
（升级选择 / 波次商店 / Boss 遗物选择 / 暂停），脚本不处理的话，
跑长局时会卡在第一次升级，看起来像「游戏卡死」，实际是在等人点。
"""
import functools
import http.server
import socketserver
import threading

# 会阻塞主循环、需要脚本代为点掉的界面
BLOCKING_STATES = ("levelup", "waveComplete", "relicSelection")


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve(project_root, port):
    handler = functools.partial(QuietHandler, directory=project_root)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", port), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def start_run(page, base, cls="warrior", difficulty="normal", map_name="forest",
              players=1, cls2=None):
    """从主菜单一路点到进入战斗（含 3 秒倒计时）"""
    page.goto(f"{base}/game.html", wait_until="load", timeout=30000)
    page.wait_for_timeout(1200)

    page.click("#newGameBtn")
    page.wait_for_timeout(400)
    page.locator("#saveSlots .save-slot").first.click()
    page.wait_for_timeout(400)
    page.click(f'.player-count-btn[data-count="{players}"]')
    page.wait_for_timeout(400)
    page.click(f'.class-card[data-class="{cls}"]')
    page.wait_for_timeout(400)
    if players == 2:
        page.click(f'.class-card[data-class="{cls2 or cls}"]')
        page.wait_for_timeout(400)
    page.click(f'.difficulty-card[data-difficulty="{difficulty}"]')
    page.wait_for_timeout(400)
    page.click(f'.map-card[data-map="{map_name}"]')
    page.wait_for_timeout(200)
    page.click("#startGameBtn")
    page.wait_for_timeout(4500)


def dismiss_blocking(page, exclude=()):
    """如果当前停在需要玩家点击的界面，替玩家点掉。返回被处理的状态名或 None。

    exclude 传状态名元组可以放过某个界面 —— 验证遗物流程本身时，
    不排除的话轮询会顺手把遗物选了，要验的东西就被自己消化掉了。
    """
    state = page.evaluate("() => game.state")
    if state not in BLOCKING_STATES or state in exclude:
        return None

    if state == "levelup":
        # 单人在 #buffOptions，双人在 #p1BuffOptions / #p2BuffOptions
        for sel in ("#buffOptions .buff-card", "#p1BuffOptions .buff-card",
                    "#p2BuffOptions .buff-card"):
            cards = page.locator(sel)
            if cards.count() > 0:
                cards.first.click(force=True)
                page.wait_for_timeout(350)
    elif state == "relicSelection":
        cards = page.locator("#relicScreen .relic-option, .relic-option")
        if cards.count() > 0:
            cards.first.click(force=True)
        page.wait_for_timeout(350)
    elif state == "waveComplete":
        # 商店：直接走「继续」而不买东西
        page.evaluate("""() => {
            if (typeof closeShopAndContinue === 'function') { closeShopAndContinue(); return; }
            const s = document.getElementById('shopScreen');
            if (s) s.classList.add('hidden');
        }""")
        page.wait_for_timeout(350)
    return state


def run_for(page, seconds, tick=1.0, on_tick=None):
    """推进指定秒数（墙钟），期间自动消化阻塞弹窗。

    返回 {状态名: 处理次数} 的统计。
    """
    handled = {}
    steps = int(seconds / tick)
    for i in range(steps):
        page.wait_for_timeout(int(tick * 1000))
        st = dismiss_blocking(page)
        if st:
            handled[st] = handled.get(st, 0) + 1
        if on_tick:
            on_tick(i)
    return handled


SNAPSHOT_JS = """() => {
    const p = game.player;
    return {
        state: game.state,
        wave: game.wave.current,
        gameTime: Math.round(game.gameTime),
        kills: game.killCount,
        alive: game.enemies.length,
        spawned: game.wave.enemiesSpawned,
        total: game.wave.totalEnemies,
        remaining: game.wave.enemiesRemaining,
        bossKills: game.bossKills,
        dragonKills: game.dragonKills,
        perfectWaves: game.perfectWaves,
        obstacles: game.obstacles.length,
        drops: game.droppedItems.length,
        particles: game.particles.length,
        projectiles: game.weaponProjectiles.length,
        enemyProjectiles: game.enemyProjectiles.length,
        summons: game.summons.length,
        damageNumbers: game.damageNumbers.length,
        timers: game.timers.length,
        loopErrors: game._loopErrorCount || 0,
        hp: p ? Math.round(p.health) : null,
        maxHp: p ? Math.round(p.maxHealth) : null,
        level: p ? p.level : null,
        gold: p ? p.gold : null,
        weapons: p ? p.weapons.map(w => w.id + '@' + w.level) : [],
        passives: p ? (p.passives || []).length : 0,
        relics: p ? (p.relics || []).length : 0,
        attackRange: p ? Math.round(p.attackRange) : null,
        rangeMultiplier: p ? p.rangeMultiplier : null
    };
}"""


def snapshot(page):
    return page.evaluate(SNAPSHOT_JS)
