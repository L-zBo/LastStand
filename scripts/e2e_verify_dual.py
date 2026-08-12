"""双人模式端到端验证

单人流程由 scripts/e2e_verify.py 覆盖，这里专测从没验证过的双人分支：
P1/P2 分别选职业、两套面板、两套按键独立响应、双人升级同步等待、
一方阵亡后的升级面板、双人存读档往返。

用法:
    PYTHONIOENCODING=utf-8 PYTHONUTF8=1 python scripts/e2e_verify_dual.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from playwright.sync_api import sync_playwright
import _gamedriver as gd

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8125

results = []
page_errors = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(f"{'[OK]  ' if ok else '[FAIL]'} {name}" + (f"  -- {detail}" if detail else ""), flush=True)
    return ok


def force_level_up(page, who="player"):
    """把指定玩家的经验推到临界再补一点，逼出一次升级。

    升级面板的断言有两个天然干扰源，都得先掐掉：
    1) 面板关闭会恢复战斗，几百毫秒内的击杀经验很容易再顶出一次升级 ——
       弹面板后立刻把两人 maxExp 顶高。
    2) 波次完成判定是「场上无敌人且已刷满」，恰好在这时清完怪就会翻进商店，
       state 变成 waveComplete，会被误读成「面板没关」—— 把本波目标数顶高冻住它。
    """
    page.evaluate("""() => {
        game.wave.totalEnemies = 99999;   // 冻结波次完成判定
        if (game.state !== 'playing') {
            game.state = 'playing';
            document.getElementById('levelUpScreen').classList.add('hidden');
        }
    }""")
    page.wait_for_timeout(150)
    page.evaluate(f"""() => {{
        const p = game.{who};
        p.exp = p.maxExp - 1;
        p.gainExp(1);
    }}""")
    page.wait_for_timeout(500)
    page.evaluate("""() => {
        game.player.maxExp = 9999999;
        if (game.player2) game.player2.maxExp = 9999999;
    }""")


def main():
    httpd = gd.serve(PROJECT_ROOT, PORT)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-proxy-server"])
        page = browser.new_page(viewport={"width": 1600, "height": 900})
        page.on("pageerror", lambda e: page_errors.append(str(e)))

        page.goto(f"http://127.0.0.1:{PORT}/game.html", wait_until="load", timeout=30000)
        page.wait_for_timeout(1200)
        page.evaluate("() => localStorage.clear()")

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
            map: game.selectedMap,
            w1: game.player ? game.player.weapons.map(w => w.id) : [],
            w2: game.player2 ? game.player2.weapons.map(w => w.id) : []
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
        # 本轮新增：职业初始武器要各自发到各自手上，不能串
        check("P1 拿到战士初始武器 sword", "sword" in s["w1"], str(s["w1"]))
        check("P2 拿到法师初始武器 staff", "staff" in s["w2"], str(s["w2"]))

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

        # ---------- 双人 UI 面板（本轮新增的减伤/射程两栏） ----------
        page.wait_for_timeout(600)
        ui = page.evaluate("""() => ({
            d1: document.getElementById('playerDefense').textContent,
            d2: document.getElementById('player2Defense').textContent,
            r1: document.getElementById('playerRange').textContent,
            r2: document.getElementById('player2Range').textContent
        })""")
        bad = [k for k, v in ui.items() if "NaN" in v or "undefined" in v or v.strip() == ""]
        check("双人面板减伤/射程无 NaN", not bad, f"{ui}  异常项={bad}")

        # ---------- 双人升级面板：必须两人都选完才恢复 ----------
        gd.run_for(page, 3, tick=0.5)
        page.evaluate("() => { if (game.state !== 'playing') { game.state = 'playing'; "
                      "document.getElementById('levelUpScreen').classList.add('hidden'); } }")
        force_level_up(page, "player")
        lv = page.evaluate("""() => ({
            state: game.state,
            dual: !document.getElementById('dualPlayerLevelUp').classList.contains('hidden'),
            p1cards: document.querySelectorAll('#p1BuffOptions .buff-card').length,
            p2cards: document.querySelectorAll('#p2BuffOptions .buff-card').length
        })""")
        check("P1 升级弹出双人面板", lv["state"] == "levelup" and lv["dual"], str(lv))
        check("双人面板两侧都生成了选项", lv["p1cards"] > 0 and lv["p2cards"] > 0,
              f"P1 {lv['p1cards']} 张 / P2 {lv['p2cards']} 张")

        page.locator("#p1BuffOptions .buff-card").first.click(force=True)
        page.wait_for_timeout(400)
        mid = page.evaluate("""() => ({
            state: game.state,
            p1done: !document.getElementById('p1Selected').classList.contains('hidden')
        })""")
        check("只有 P1 选完时仍在等待 P2", mid["state"] == "levelup" and mid["p1done"], str(mid))

        page.locator("#p2BuffOptions .buff-card").first.click(force=True)
        page.wait_for_timeout(500)
        done = page.evaluate("""() => ({
            state: game.state,
            hidden: document.getElementById('levelUpScreen').classList.contains('hidden'),
            lv1: game.player.level, lv2: game.player2.level
        })""")
        check("两人都选完后恢复战斗", done["state"] == "playing" and done["hidden"], str(done))

        # ---------- 一方阵亡后的升级面板：不能要求死人也选 ----------
        page.evaluate("() => { game.player2.health = 0; }")
        page.wait_for_timeout(300)
        force_level_up(page, "player")
        dead = page.evaluate("""() => ({
            state: game.state,
            p1cards: document.querySelectorAll('#p1BuffOptions .buff-card').length,
            p2cards: document.querySelectorAll('#p2BuffOptions .buff-card').length,
            p2marked: !document.getElementById('p2Selected').classList.contains('hidden'),
            p2text: document.querySelector('#p2Selected p').textContent
        })""")
        check("P2 阵亡时不再给它出选项", dead["p2cards"] == 0 and dead["p2marked"],
              f"P2 卡片 {dead['p2cards']} 张，遮罩={dead['p2marked']}「{dead['p2text']}」")
        if dead["state"] == "levelup":
            page.locator("#p1BuffOptions .buff-card").first.click(force=True)
            page.wait_for_timeout(400)
        after = page.evaluate("""() => ({
            state: game.state,
            hidden: document.getElementById('levelUpScreen').classList.contains('hidden')
        })""")
        # 判据是「不再卡在 levelup」而不是「必须回到 playing」：
        # 关闭面板会恢复战斗，这一瞬间正好清完本波就会进商店（waveComplete），
        # 那也是正常流程，写死 playing 会误报。
        check("P2 阵亡后 P1 单独选完即可继续",
              after["state"] != "levelup" and after["hidden"],
              f"面板={dead}  选完后={after}")

        # 把 P2 救回来，顺带验证遮罩文案会复原（不能一直顶着「已阵亡」）
        page.evaluate("() => { game.player2.health = game.player2.maxHealth; }")
        # 上一步可能已经翻到商店界面，先消化掉再制造下一次升级，避免两套面板打架
        gd.dismiss_blocking(page)
        page.wait_for_timeout(300)
        force_level_up(page, "player")
        revived = page.evaluate("""() => ({
            p2cards: document.querySelectorAll('#p2BuffOptions .buff-card').length,
            p2text: document.querySelector('#p2Selected p').textContent
        })""")
        check("P2 复活后重新给它出选项且文案复原",
              revived["p2cards"] > 0 and "阵亡" not in revived["p2text"],
              f"P2 卡片 {revived['p2cards']} 张，遮罩文案「{revived['p2text']}」")
        page.locator("#p1BuffOptions .buff-card").first.click(force=True)
        page.wait_for_timeout(300)
        page.locator("#p2BuffOptions .buff-card").first.click(force=True)
        page.wait_for_timeout(300)

        # ---------- 经验/金币共享 ----------
        share = page.evaluate("""() => {
            const before = {e1: game.player.exp, e2: game.player2.exp,
                            g1: game.player.gold, g2: game.player2.gold};
            game.player.gainExp(10);
            game.player.gainGold(10);
            return {before, after: {e1: game.player.exp, e2: game.player2.exp,
                                    g1: game.player.gold, g2: game.player2.gold}};
        }""")
        expShared = share["after"]["e2"] > share["before"]["e2"]
        goldShared = share["after"]["g2"] > share["before"]["g2"]
        check("双人经验共享给队友", expShared,
              f"P2 exp {share['before']['e2']} -> {share['after']['e2']}")
        check("双人金币共享给队友", goldShared,
              f"P2 gold {share['before']['g2']} -> {share['after']['g2']}")

        gd.run_for(page, 10, tick=0.5)
        s3 = page.evaluate("""() => ({
            state: game.state,
            kills: game.killCount,
            p1hp: Math.round(game.player.health),
            p2hp: Math.round(game.player2.health),
            wave: game.wave.current,
            remaining: game.wave.enemiesRemaining,
            enemies: game.enemies.length,
            spawned: game.wave.enemiesSpawned,
            loopErrors: game._loopErrorCount || 0
        })""")
        check("双人战斗正常推进", s3["kills"] > 0 or s3["enemies"] > 0,
              f"击杀 {s3['kills']}，场上 {s3['enemies']}，已生成 {s3['spawned']}")
        check("双人下 enemiesRemaining 正常", s3["remaining"] >= 0,
              f"remaining={s3['remaining']} wave={s3['wave']} state={s3['state']}")
        check("双人主循环无异常帧", s3["loopErrors"] == 0, f"loopErrors={s3['loopErrors']}")

        # ---------- 双人存读档往返 ----------
        page.evaluate("() => { if (game.state !== 'playing') game.state = 'playing'; }")
        saved = page.evaluate("""() => {
            const ok = saveGameToSlot(2);
            const raw = localStorage.getItem('roguelikeSave_2');
            const d = raw ? JSON.parse(raw) : null;
            return {ok, pc: d && d.playerCount, cls2: d && d.selectedClass2,
                    hasP2: !!(d && d.player2),
                    lv1: game.player.level, lv2: game.player2.level,
                    w2: game.player2.weapons.map(w => w.id + '@' + w.level)};
        }""")
        check("双人存档写入成功且含 P2", saved["ok"] and saved["hasP2"] and saved["pc"] == 2,
              str({k: saved[k] for k in ("ok", "pc", "cls2", "hasP2")}))

        page.evaluate("() => { applyLoadedSaveData(getSaveData(2)); }")
        page.wait_for_timeout(1500)
        loaded = page.evaluate("""() => ({
            state: game.state, pc: game.playerCount,
            cls2: game.selectedClass2,
            lv1: game.player.level, lv2: game.player2 ? game.player2.level : null,
            w2: game.player2 ? game.player2.weapons.map(w => w.id + '@' + w.level) : [],
            p2panel: !document.getElementById('p2Panel').classList.contains('hidden')
        })""")
        check("双人读档恢复两名玩家",
              loaded["pc"] == 2 and loaded["cls2"] == "mage" and loaded["p2panel"],
              str(loaded))
        check("双人读档等级/武器一致",
              loaded["lv1"] == saved["lv1"] and loaded["lv2"] == saved["lv2"]
              and loaded["w2"] == saved["w2"],
              f"存 lv{saved['lv1']}/{saved['lv2']} {saved['w2']} -> "
              f"读 lv{loaded['lv1']}/{loaded['lv2']} {loaded['w2']}")

        gd.run_for(page, 4, tick=0.5)
        alive = page.evaluate("() => ({state: game.state, t: Math.round(game.gameTime), "
                              "err: game._loopErrorCount || 0})")
        check("读档后双人循环继续跑", alive["err"] == 0 and alive["state"] != "gameover",
              str(alive))

        # ---------- 职业专属强化必须按各自职业发 ----------
        # 曾经写成 player.className（Player 上没这个属性），永远回落到 game.selectedClass，
        # 于是双人模式下 P2 拿到的是 P1 职业的专属强化。
        cls_buff = page.evaluate("""() => {
            const c = document.getElementById('p2BuffOptions');
            c.innerHTML = '';
            showClassBuffOptionsForPlayer(c, game.player2, 2);
            const tagged = [...c.querySelectorAll('.buff-card')]
                .filter(card => card.querySelector('.tag-class'))
                .map(card => card.querySelector('h3').textContent);
            const mine = (CLASS_BUFFS[game.player2.classType] || []).map(b => b.name);
            const p1s = (CLASS_BUFFS[game.player.classType] || []).map(b => b.name);
            return {tagged, stray: tagged.filter(n => !mine.includes(n)),
                    fromP1: tagged.filter(n => p1s.includes(n)),
                    p1cls: game.player.classType, p2cls: game.player2.classType};
        }""")
        check("P2 的职业专属强化来自 P2 自己的职业",
              len(cls_buff["tagged"]) > 0 and not cls_buff["stray"],
              f"P2({cls_buff['p2cls']}) 拿到 {cls_buff['tagged']}，"
              f"串到 P1({cls_buff['p1cls']}) 的={cls_buff['fromP1']}")

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
