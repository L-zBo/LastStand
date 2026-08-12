"""Boss 波专项验证

长局压测靠随机撞 Boss 不可靠（玩家可能死在 Boss 手里），Boss 那条链
——刷 Boss → 击杀结算 → 遗物选择 → 商店 → 下一波——一直没有必测覆盖。
这里把波次直接推到第 10 波，把整条链走一遍。

覆盖：
  - 第 10 波能刷出 Boss，属性/类型正确（BOSS_ORDER 首个是 bear）
  - 真实击杀路径（玩家打死，不是手工调 handleEnemyKill）下 bossKills 累加
  - firstBoss 成就实时解锁
  - Boss 波结束先弹遗物选择，选完遗物真正进 player.relics 且 onEquip 生效
  - 遗物选完进商店，购买扣钱且效果落到玩家身上
  - 关商店后波次推进到 11 且恢复 playing
  - 第 120 波的 Boss 是 dragon，击杀后 dragonKills 累加

用法:
    PYTHONIOENCODING=utf-8 PYTHONUTF8=1 python scripts/verify_boss_wave.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from playwright.sync_api import sync_playwright
import _gamedriver as gd

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8128
BASE = f"http://127.0.0.1:{PORT}"

results = []
page_errors = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(f"{'[OK]  ' if ok else '[FAIL]'} {name}" + (f"  -- {detail}" if detail else ""), flush=True)
    return ok


# 把玩家变强并拉到 Boss 身边，让「真实击杀」在几帧内完成，
# 不改动击杀链路本身（bossKills / 成就 / 掉落都要按正常流程走）。
BUFF_PLAYER = """() => {
    const p = game.player;
    p.maxHealth = 999999; p.health = 999999;
    p.attack = 500;
    p.attackCooldown = 100;
    p.attackRange = 400;
    // 经验门槛拉到天上：不然攻击力 500 会几秒一次升级，
    // 游戏一直停在 levelup，updateWaveSpawning 不跑，Boss 永远刷不出来。
    p.maxExp = 99999999;
    p.exp = 0;
}"""

JUMP_TO_WAVE = """(n) => {
    game.enemies = [];
    game.wave.current = n;
    startNewWave();
}"""


def wait_for(page, expr, timeout_ms=25000, tick=250, exclude=()):
    """轮询直到 expr 为真，期间自动点掉升级/商店/遗物弹窗。

    不消化弹窗的话，游戏会停在 levelup，波次生成不推进，
    等 Boss 就是死等。
    exclude 传状态名可以放过指定界面 —— 等 Boss 死的时候必须放过
    relicSelection，否则遗物会被轮询自己选掉，后面就没得验了。
    """
    waited = 0
    while waited < timeout_ms:
        if page.evaluate(f"() => !!({expr})"):
            return True
        gd.dismiss_blocking(page, exclude=exclude)
        page.wait_for_timeout(tick)
        waited += tick
    return False


def main():
    httpd = gd.serve(PROJECT_ROOT, PORT)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-proxy-server"])
        page = browser.new_page(viewport={"width": 1600, "height": 900})
        page.on("pageerror", lambda e: page_errors.append(str(e)))

        gd.start_run(page, BASE, cls="ranger", difficulty="easy", map_name="forest")
        page.evaluate("() => localStorage.removeItem('laststand_achievements')")
        page.evaluate("() => beginAchievementSession()")
        page.evaluate(BUFF_PLAYER)

        # ---------- 第 10 波：刷 Boss ----------
        page.evaluate(JUMP_TO_WAVE, 10)
        page.wait_for_timeout(500)
        check("跳到第 10 波", page.evaluate("() => game.wave.current") == 10)

        got = wait_for(page, "game.enemies.some(e => e.isBoss)", 40000)
        boss = page.evaluate("""() => {
            const b = game.enemies.find(e => e.isBoss);
            if (!b) return null;
            return {type: b.type, bossType: b.bossType, hp: Math.round(b.maxHealth),
                    size: b.size, isElite: b.isElite, dmg: b.damage,
                    skillCd: b.skillCooldown};
        }""")
        check("第 10 波刷出 Boss", got and boss is not None, str(boss))
        if boss:
            check("Boss 类型按 BOSS_ORDER 取第一个（bear）",
                  boss["bossType"] == "bear", f"bossType={boss['bossType']}")
            check("Boss 属性成型", boss["type"] == "boss" and boss["hp"] > 0
                  and boss["isElite"] and boss["skillCd"] > 0, str(boss))

        # ---------- 真实击杀 Boss ----------
        page.evaluate("""() => {
            const b = game.enemies.find(e => e.isBoss);
            if (b) {
                b.x = game.player.x + 40;
                b.y = game.player.y;
                b.health = 1;          // 血削到 1，让玩家的下一次攻击真正打死它
            }
        }""")
        killed = wait_for(page, "game.bossKills > 0", 20000,
                          exclude=("relicSelection",))
        # 击杀结算和「把尸体从 game.enemies 里 filter 掉」不在同一步，
        # bossKills 刚变 1 时 Boss 可能还在数组里，多等几帧再查存活。
        page.wait_for_timeout(600)
        after_kill = page.evaluate("""() => ({
            bossKills: game.bossKills,
            dragonKills: game.dragonKills,
            unlocked: Object.keys(getActiveAchievementProgress().unlocked),
            bossAlive: game.enemies.some(e => e.isBoss && e.health > 0),
            loopErrors: game._loopErrorCount || 0
        })""")
        check("Boss 被真实击杀且 bossKills 累加",
              killed and after_kill["bossKills"] == 1 and not after_kill["bossAlive"],
              str(after_kill))
        check("firstBoss 成就实时解锁", "firstBoss" in after_kill["unlocked"],
              f"已解锁 {after_kill['unlocked']}")

        # ---------- Boss 波结束 → 遗物选择 ----------
        page.evaluate("() => { game.enemies = []; }")
        in_relic = wait_for(page, "game.state === 'relicSelection'", 15000,
                            exclude=("relicSelection",))
        # 遗物面板关闭只是 add('hidden')，DOM 会留着，
        # 光数 .relic-option 的个数上一轮的残留也算数，必须连可见性一起查。
        relic_ui = page.evaluate("""() => {
            const screen = document.getElementById('relicSelectionScreen');
            return {
                state: game.state,
                options: document.querySelectorAll('.relic-option').length,
                visible: !!screen && !screen.classList.contains('hidden'),
                relicsBefore: (game.player.relics || []).length
            };
        }""")
        check("Boss 波结束先进遗物选择",
              in_relic and relic_ui["visible"] and relic_ui["options"] > 0,
              str(relic_ui))

        before_equip = page.evaluate("""() => ({
            speed: game.player.speed, attack: game.player.attack,
            crit: game.player.critChance, dr: game.player.damageReduction,
            expMul: game.player.expMultiplier, counter: game.player.counterAttack,
            lifeSteal: game.player.lifeSteal, cd: game.player.attackCooldown,
            dashCd: game.player.dashMaxCooldown, maxHp: game.player.maxHealth
        })""")
        page.locator(".relic-option").first.click(force=True)
        page.wait_for_timeout(800)
        after_equip = page.evaluate("""() => ({
            relics: (game.player.relics || []).map(r => r.id),
            state: game.state,
            snap: {speed: game.player.speed, attack: game.player.attack,
                   crit: game.player.critChance, dr: game.player.damageReduction,
                   expMul: game.player.expMultiplier, counter: game.player.counterAttack,
                   lifeSteal: game.player.lifeSteal, cd: game.player.attackCooldown,
                   dashCd: game.player.dashMaxCooldown, maxHp: game.player.maxHealth}
        })""")
        check("遗物真的装到玩家身上",
              len(after_equip["relics"]) == relic_ui["relicsBefore"] + 1,
              f"{after_equip['relics']}")
        # onEquip 型遗物会改属性；bloodPendant/frozenOrb/phoenixFeather 只挂钩子不改属性
        changed = [k for k in before_equip
                   if before_equip[k] != after_equip["snap"][k]]
        hook_only = {"bloodPendant", "frozenOrb", "phoenixFeather", "infinityGem"}
        got_relic = after_equip["relics"][-1] if after_equip["relics"] else None
        check("onEquip 遗物已生效（纯钩子型除外）",
              bool(changed) or got_relic in hook_only,
              f"拿到 {got_relic}，属性变化 {changed}")

        # ---------- 遗物选完 → 商店 ----------
        in_shop = wait_for(page, "game.state === 'waveComplete'", 15000)
        shop = page.evaluate("""() => ({
            state: game.state,
            items: document.querySelectorAll('#shopItems .shop-item').length,
            gold: game.player.gold,
            shopOpen: !!document.getElementById('shopScreen')
        })""")
        check("遗物选完进入商店", in_shop and shop["shopOpen"], str(shop))

        # 给够钱，买第一件商品，验证扣钱 + 效果落地。
        # 先把被 BUFF_PLAYER 拉到极端的属性恢复成常规值：attackCooldown 停在 100
        # 时「疾风药剂」的 Math.max(100, cd*0.9) 算出来还是 100，看着像没生效；
        # 血量满的时候治疗类同理。
        buy = page.evaluate("""() => {
            const p = game.player;
            p.gold = 9999;
            p.attackCooldown = 500;
            p.attackRange = 200;
            p.maxHealth = 200;
            p.health = 100;
            updateShopUI();
            const item = shopState.items[0];
            const keys = ['gold', 'health', 'attack', 'speed', 'maxHealth', 'critChance',
                          'attackRange', 'attackCooldown', 'healthRegen', 'vampireHeal',
                          'goldMultiplier', 'rangeMultiplier'];
            const snap = () => Object.fromEntries(keys.map(k => [k, p[k]]));
            const before = snap();
            purchaseItem(0);
            const after = snap();
            return {name: item.name, price: item.price,
                    gold0: before.gold, gold1: after.gold,
                    changed: keys.filter(k => before[k] !== after[k])};
        }""")
        check("商店购买扣除金币",
              buy["gold1"] == buy["gold0"] - buy["price"],
              f"买「{buy['name']}」{buy['price']} 金：{buy['gold0']} -> {buy['gold1']}")
        non_gold = [k for k in buy["changed"] if k != "gold"]
        check("商店道具效果落到玩家身上", bool(non_gold),
              f"「{buy['name']}」改变了 {non_gold}")

        # ---------- 关商店 → 下一波 ----------
        page.evaluate("() => closeShopAndContinue()")
        page.wait_for_timeout(1200)
        nxt = page.evaluate("() => ({state: game.state, wave: game.wave.current, "
                            "err: game._loopErrorCount || 0})")
        check("关商店后推进到第 11 波并恢复战斗",
              nxt["wave"] == 11 and nxt["state"] == "playing", str(nxt))

        # ---------- 第 120 波：巨龙 ----------
        dragon_type = page.evaluate("() => getBossTypeByWave(120)")
        check("第 120 波的 Boss 是巨龙", dragon_type == "dragon", dragon_type)

        page.evaluate(BUFF_PLAYER)
        page.evaluate(JUMP_TO_WAVE, 120)
        page.wait_for_timeout(400)
        # 直接造一只 120 波的 Boss 摆到玩家面前，避免等满一整波的小怪
        page.evaluate("""() => {
            const b = new Enemy(game.player.x + 40, game.player.y, 'boss');
            b.health = 1;
            game.enemies.push(b);
            game.wave.enemiesSpawned++;
            game.wave.totalEnemies++;
            game.wave.bossSpawned = true;
        }""")
        spawned_dragon = page.evaluate(
            "() => (game.enemies.find(e => e.isBoss) || {}).bossType")
        check("第 120 波生成的 Boss 实体是巨龙", spawned_dragon == "dragon",
              str(spawned_dragon))

        killed_dragon = wait_for(page, "game.dragonKills > 0", 20000)
        dragon_state = page.evaluate("""() => ({
            dragonKills: game.dragonKills, bossKills: game.bossKills,
            unlocked: Object.keys(getActiveAchievementProgress().unlocked),
            err: game._loopErrorCount || 0
        })""")
        check("击杀巨龙后 dragonKills 累加",
              killed_dragon and dragon_state["dragonKills"] == 1, str(dragon_state))
        check("killDragon 成就解锁", "killDragon" in dragon_state["unlocked"],
              f"已解锁 {dragon_state['unlocked']}")
        check("Boss 全流程主循环零异常", dragon_state["err"] == 0,
              f"loopErrors={dragon_state['err']}")

        shot = os.path.join(PROJECT_ROOT, "docs", "screenshots", "boss_wave.png")
        os.makedirs(os.path.dirname(shot), exist_ok=True)
        page.screenshot(path=shot)
        check("Boss 波截图已保存", os.path.exists(shot))

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
