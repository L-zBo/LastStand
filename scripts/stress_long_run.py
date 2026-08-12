"""LastStand 长局压力测试

前面几个脚本只验证了开局几十秒。这个脚本自动消化升级/商店/遗物弹窗，
一路推到第 10 波以后，覆盖此前完全没验证过的内容：

  - 波次推进与敌人守恒（生成 = 击杀 + 场上，不允许凭空消失）
  - Boss 波（第 10 波）能否正常刷 Boss、能否击杀、bossKills 是否累加
  - 商店与遗物选择流程不卡死
  - 成就实时解锁（首杀 / 波次 / Boss）
  - 数组是否无限增长（粒子、掉落、飘字、计时器）
  - 主循环异常计数必须为 0
  - 帧率采样

用法:
    PYTHONIOENCODING=utf-8 PYTHONUTF8=1 python scripts/stress_long_run.py [秒数]
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from playwright.sync_api import sync_playwright
import _gamedriver as gd

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8126
BASE = f"http://127.0.0.1:{PORT}"
DURATION = int(sys.argv[1]) if len(sys.argv) > 1 else 240

results = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(f"{'[OK]  ' if ok else '[FAIL]'} {name}" + (f"  -- {detail}" if detail else ""), flush=True)
    return ok


CULL_PROBE = """() => {
    window.__cull = 0;
    window.__nanHp = 0;
    window.__nanPos = 0;
    let prev = [];
    const tick = () => {
        const cur = game.enemies, set = new Set(cur);
        for (const e of prev) {
            if (!set.has(e) && e.health > 0) window.__cull++;
        }
        for (const e of cur) {
            if (Number.isNaN(e.health)) window.__nanHp++;
            // 坐标 NaN 的敌人画不出来也打不到，却挡着 checkWaveComplete
            if (!Number.isFinite(e.x) || !Number.isFinite(e.y)) window.__nanPos++;
        }
        prev = cur.slice();
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}"""

FPS_PROBE = """() => {
    window.__frames = 0;
    const tick = () => { window.__frames++; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
}"""


def main():
    httpd = gd.serve(PROJECT_ROOT, PORT)
    page_errors = []
    console_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-proxy-server"])
        page = browser.new_page(viewport={"width": 1600, "height": 900})
        page.on("pageerror", lambda e: page_errors.append(str(e)))
        page.on("console", lambda m: console_errors.append(f"{m.type}: {m.text}")
                if m.type == "error" else None)

        # 游侠：远程，能持续输出，适合长跑
        gd.start_run(page, BASE, cls="ranger", difficulty="easy", map_name="forest")
        page.evaluate(CULL_PROBE)
        page.evaluate(FPS_PROBE)

        s0 = gd.snapshot(page)
        check("开局有初始武器", len(s0["weapons"]) > 0, f"{s0['weapons']}")
        check("障碍物密度已提升", s0["obstacles"] > 400, f"{s0['obstacles']} 个")
        print(f"\n开局: {s0['weapons']}  基础射程 {s0['attackRange']}  "
              f"障碍物 {s0['obstacles']}\n", flush=True)

        print(f"{'时间':>5} {'波次':>4} {'状态':<14} {'击杀':>5} {'场上':>4} "
              f"{'等级':>4} {'金币':>5} {'粒子':>5} {'掉落':>4} {'计时器':>5} {'循环异常':>6}")
        handled_total = {}
        for i in range(DURATION // 10):
            h = gd.run_for(page, 10, tick=0.5)
            for k, v in h.items():
                handled_total[k] = handled_total.get(k, 0) + v
            s = gd.snapshot(page)
            print(f"{s['gameTime']:5} {s['wave']:4} {s['state']:<14} {s['kills']:5} "
                  f"{s['alive']:4} {s['level']:4} {s['gold']:5} {s['particles']:5} "
                  f"{s['drops']:4} {s['timers']:5} {s['loopErrors']:6}", flush=True)
            if s["state"] == "gameover":
                print("  (玩家阵亡，提前结束)", flush=True)
                break

        final = gd.snapshot(page)
        cull = page.evaluate("() => window.__cull")
        nan_hp = page.evaluate("() => window.__nanHp")
        nan_pos = page.evaluate("() => window.__nanPos")
        frames = page.evaluate("() => window.__frames")

        print(f"\n弹窗自动处理次数: {handled_total}", flush=True)
        print("\n--- 断言 ---", flush=True)

        check("主循环零异常", final["loopErrors"] == 0, f"{final['loopErrors']} 次")
        check("无未捕获 JS 异常", len(page_errors) == 0,
              "; ".join(page_errors[:3]))
        check("敌人守恒（无凭空消失）", cull == 0, f"{cull} 只")
        check("无 NaN 血量敌人", nan_hp == 0, f"{nan_hp} 次采样命中")
        check("无 NaN 坐标敌人", nan_pos == 0, f"{nan_pos} 次采样命中")
        check("波次有推进", final["wave"] > 1, f"到第 {final['wave']} 波")
        check("持续产生击杀", final["kills"] >= 10, f"{final['kills']} 杀")
        check("玩家有成长", final["level"] > 1 or final["gold"] > 0,
              f"Lv.{final['level']} 金币 {final['gold']}")
        check("粒子数组未失控", final["particles"] < 600, f"{final['particles']}")
        check("飘字数组未失控", final["damageNumbers"] <= 60, f"{final['damageNumbers']}")
        check("掉落物未堆积", final["drops"] < 300, f"{final['drops']}")
        check("游戏内计时器未泄漏", final["timers"] < 200, f"{final['timers']}")
        check("enemiesRemaining 有效",
              final["remaining"] <= final["total"],
              f"remaining={final['remaining']} total={final['total']}")

        fps = frames / DURATION
        check("平均帧率 > 30", fps > 30, f"{fps:.1f} fps（{frames} 帧 / {DURATION}s）")

        # 成就
        ach = page.evaluate("""() => {
            const p = getActiveAchievementProgress();
            return { unlocked: Object.keys(p.unlocked), stats: p.stats };
        }""")
        check("成就已实时解锁", len(ach["unlocked"]) > 0,
              f"{ach['unlocked']}")
        check("成就统计跟上实际击杀",
              ach["stats"]["totalKills"] >= final["kills"] * 0.9,
              f"成就统计 {ach['stats']['totalKills']} vs 本局击杀 {final['kills']}")

        # Boss
        # 靠长跑撞 Boss 不可靠，两个方向都会误报：
        #   1) 玩家可能死在 Boss 手里，那时 bossKills=0 是事实而非缺陷；
        #   2) Boss 不是波次一开始就出场，而是刷到本波后段才补进来（wave.js 的
        #      updateWaveSpawning），压测正好停在第 10 波前半段时场上根本没有 Boss。
        # 所以这里只对「已经跨过第 10 波」这一种确定情形下断言，其余如实报告。
        # Boss 全流程（生成 / 击杀 / 遗物 / 商店 / 巨龙）的必测覆盖在 verify_boss_wave.py。
        if final["state"] == "gameover":
            print(f"[跳过] 玩家在第 {final['wave']} 波阵亡（HP {final['hp']}），"
                  f"Boss 击杀断言不适用，bossKills={final['bossKills']}；"
                  f"Boss 流程见 verify_boss_wave.py", flush=True)
        elif final["wave"] > 10:
            check("跨过 Boss 波说明 Boss 已被击杀", final["bossKills"] > 0,
                  f"bossKills={final['bossKills']} wave={final['wave']}")
        elif final["wave"] == 10:
            boss_on_field = page.evaluate(
                "() => ({spawned: !!game.wave.bossSpawned, "
                "onField: game.enemies.some(e => e.isBoss || e.type === 'boss'), "
                "progress: game.wave.enemiesSpawned + '/' + game.wave.totalEnemies})")
            print(f"[跳过] 收工时正停在第 10 波刷怪中（{boss_on_field['progress']}），"
                  f"Boss 出场在本波后段：{boss_on_field}；"
                  f"Boss 流程见 verify_boss_wave.py", flush=True)
        else:
            print(f"[跳过] 未到第 10 波（当前 {final['wave']}），Boss 相关断言未覆盖", flush=True)

        print("\n--- 最终快照 ---", flush=True)
        for k, v in final.items():
            print(f"    {k:18} {v}", flush=True)

        shot = os.path.join(PROJECT_ROOT, "docs", "screenshots", "stress_long_run.png")
        os.makedirs(os.path.dirname(shot), exist_ok=True)
        page.screenshot(path=shot)

        browser.close()
    httpd.shutdown()

    passed = sum(1 for _, ok, _ in results if ok)
    print("\n" + "=" * 60, flush=True)
    print(f"断言结果: {passed}/{len(results)} 通过", flush=True)
    fails = [(n, d) for n, ok, d in results if not ok]
    for n, d in fails:
        print(f"  - {n}  {d}", flush=True)
    if console_errors:
        uniq = list(dict.fromkeys(console_errors))
        print(f"\nconsole error（去重 {len(uniq)}）:", flush=True)
        for e in uniq[:15]:
            print(f"  * {e[:180]}", flush=True)
    return 0 if not fails else 1


if __name__ == "__main__":
    sys.exit(main())
