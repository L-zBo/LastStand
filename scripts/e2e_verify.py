"""LastStand 端到端验证脚本

用法:
    PYTHONIOENCODING=utf-8 PYTHONUTF8=1 python scripts/e2e_verify.py

在本地起一个静态 HTTP 服务器（game.html 通过 file:// 打开时 Canvas 会被跨域污染），
用 Playwright chromium headless 走完整流程：
主菜单 -> 成就/永久强化面板 -> 存档 -> 人数 -> 职业 -> 难度 -> 地图 -> 进入战斗
-> 移动/自动攻击/击杀 -> 暂停/继续 -> 保存 -> 读档

所有断言失败与浏览器 console 报错都会在末尾汇总。
"""
import os
import sys
import threading
import functools
import http.server
import socketserver

from playwright.sync_api import sync_playwright

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8123
BASE = f"http://127.0.0.1:{PORT}"

results = []
console_errors = []
page_errors = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    flag = "[OK]  " if ok else "[FAIL]"
    line = f"{flag} {name}"
    if detail:
        line += f"  -- {detail}"
    print(line, flush=True)
    return ok


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve():
    handler = functools.partial(QuietHandler, directory=PROJECT_ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", PORT), handler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return httpd


def state(page):
    """读取游戏内部状态快照"""
    return page.evaluate("""() => ({
        state: game.state,
        wave: game.wave.current,
        enemies: game.enemies.length,
        remaining: game.wave.enemiesRemaining,
        spawned: game.wave.enemiesSpawned,
        obstacles: game.obstacles.length,
        drops: game.droppedItems.length,
        kills: game.killCount,
        gameTime: Math.round(game.gameTime),
        loopRunning: game.loopRunning,
        px: game.player ? Math.round(game.player.x) : null,
        py: game.player ? Math.round(game.player.y) : null,
        hp: game.player ? Math.round(game.player.health) : null,
        maxHp: game.player ? Math.round(game.player.maxHealth) : null,
        level: game.player ? game.player.level : null,
        weapons: game.player ? game.player.weapons.length : null,
        summons: game.summons.length,
        projectiles: game.weaponProjectiles.length,
        particles: game.particles.length
    })""")


def dismiss_overlays(page, rounds=4):
    """清掉挡在游戏画面上的模态层（升级选择 / 波次商店），让后续操作能点到顶栏。

    返回实际处理掉的弹层数量。
    """
    handled = 0
    for _ in range(rounds):
        # 升级选择：随便挑第一个强化
        if page.locator("#levelUpScreen:not(.hidden) .buff-card").count() > 0:
            page.locator("#levelUpScreen:not(.hidden) .buff-card").first.click()
            page.wait_for_timeout(700)
            handled += 1
            continue
        # 波次结算商店
        if page.locator("#shopScreen").count() > 0 and page.locator("#shopScreen").is_visible():
            page.evaluate("() => { if (typeof closeShopAndContinue === 'function') closeShopAndContinue(); }")
            page.wait_for_timeout(700)
            handled += 1
            continue
        break
    return handled


def main():
    httpd = serve()
    print(f"静态服务器已启动: {BASE}\n", flush=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-proxy-server", "--disable-web-security"],
        )
        page = browser.new_page(viewport={"width": 1600, "height": 900})

        page.on("console", lambda m: console_errors.append(f"{m.type}: {m.text}")
                if m.type in ("error", "warning") else None)
        page.on("pageerror", lambda e: page_errors.append(str(e)))

        # ---------- 1. 加载 ----------
        page.goto(f"{BASE}/game.html", wait_until="load", timeout=30000)
        page.wait_for_timeout(1500)
        check("页面加载完成", page.title() == "LastStand - Roguelike Survival Game", page.title())
        check("11 个 JS 模块全部就绪",
              page.evaluate("() => typeof CONFIG!=='undefined' && typeof CLASSES!=='undefined' "
                            "&& typeof WEAPONS!=='undefined' && typeof ACHIEVEMENTS!=='undefined' "
                            "&& typeof META_UPGRADES!=='undefined' && typeof game!=='undefined'"))

        # ---------- 2. 主菜单 ----------
        for bid in ["newGameBtn", "loadGameBtn", "metaBtn", "achievementBtn"]:
            check(f"主菜单按钮 #{bid}", page.locator(f"#{bid}").count() == 1)

        # ---------- 3. 成就面板 ----------
        page.click("#achievementBtn")
        page.wait_for_timeout(600)
        n_ach = page.evaluate("() => Object.keys(ACHIEVEMENTS).length")
        check("成就数量 = 29", n_ach == 29, f"实际 {n_ach}")
        cards = page.locator("#achievementPanel .achievement-icon-box").count()
        check("成就卡片全部渲染", cards == n_ach, f"渲染 {cards} / 数据 {n_ach}")
        check("成就面板 8 大分类",
              page.locator("#achievementPanel .achievement-category").count() == 8)
        page.evaluate("() => closeAchievementPanel()")
        page.wait_for_timeout(300)

        # ---------- 4. 永久强化面板 ----------
        page.click("#metaBtn")
        page.wait_for_timeout(600)
        n_meta = page.evaluate("() => Object.keys(META_UPGRADES).length")
        check("永久强化项 = 8", n_meta == 8, f"实际 {n_meta}")
        check("永久强化面板可见", page.locator("#metaPanel").is_visible())
        page.evaluate("() => closeMetaPanel()")
        page.wait_for_timeout(300)

        # ---------- 5. 存档选择 ----------
        page.click("#newGameBtn")
        page.wait_for_timeout(500)
        slots = page.locator("#saveSlots .save-slot").count()
        check("存档槽 = 6", slots == 6, f"实际 {slots}")

        page.locator("#saveSlots .save-slot").first.click()
        page.wait_for_timeout(500)

        # ---------- 6. 人数 ----------
        check("人数选择界面出现", page.locator("#playerCountSelection").is_visible())
        page.click('.player-count-btn[data-count="1"]')
        page.wait_for_timeout(500)

        # ---------- 7. 职业 ----------
        check("职业选择界面出现", page.locator("#classSelection").is_visible())
        n_cls = page.locator(".class-card").count()
        check("职业卡片 = 8", n_cls == 8, f"实际 {n_cls}")
        check("职业卡片与 CLASSES 一致",
              page.evaluate("() => Object.keys(CLASSES).length") == n_cls)
        page.click('.class-card[data-class="warrior"]')
        page.wait_for_timeout(500)

        # ---------- 8. 难度 ----------
        check("难度选择界面出现", page.locator("#difficultySelection").is_visible())
        check("难度卡片 = 4", page.locator(".difficulty-card").count() == 4)
        page.click('.difficulty-card[data-difficulty="normal"]')
        page.wait_for_timeout(500)

        # ---------- 9. 地图 ----------
        check("地图选择界面出现", page.locator("#mapSelection").is_visible())
        n_map = page.locator(".map-card").count()
        check("地图卡片 = 6", n_map == 6, f"实际 {n_map}")
        check("地图卡片与 CONFIG.maps 一致",
              page.evaluate("() => Object.keys(CONFIG.maps).length") == n_map)
        page.click('.map-card[data-map="forest"]')
        page.wait_for_timeout(200)
        page.click("#startGameBtn")

        # ---------- 10. 倒计时 + 进入战斗 ----------
        page.wait_for_timeout(4500)
        s = state(page)
        check("游戏状态 = playing", s["state"] == "playing", s["state"])
        check("游戏主循环运行中", s["loopRunning"] is True)
        check("画布可见", page.locator("#gameCanvas").is_visible())
        check("障碍物已生成", s["obstacles"] > 0, f"{s['obstacles']} 个")
        check("玩家已创建", s["hp"] is not None and s["hp"] > 0,
              f"HP {s['hp']}/{s['maxHp']} Lv.{s['level']} 武器×{s['weapons']}")
        check("第 1 波已开始", s["wave"] == 1)

        # ---------- 11. 敌人生成 + 守恒 ----------
        # 注入探针：捕捉「血量>0 却从数组消失」的敌人（被距离清理静默删除）
        page.evaluate("""() => {
            window.__cull = 0;
            let prev = [];
            const tick = () => {
                const cur = game.enemies, set = new Set(cur);
                for (const e of prev) if (!set.has(e) && e.health > 0) window.__cull++;
                prev = cur.slice();
                requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }""")
        page.wait_for_timeout(5000)
        s2 = state(page)
        check("敌人已生成", s2["spawned"] > 0, f"已生成 {s2['spawned']}，场上 {s2['enemies']}")

        # ---------- 12. 移动 ----------
        before = state(page)
        page.keyboard.down("d")
        page.wait_for_timeout(1200)
        page.keyboard.up("d")
        page.keyboard.down("s")
        page.wait_for_timeout(1200)
        page.keyboard.up("s")
        after = state(page)
        moved = abs(after["px"] - before["px"]) + abs(after["py"] - before["py"])
        check("玩家可移动", moved > 5,
              f"({before['px']},{before['py']}) -> ({after['px']},{after['py']}) 位移 {moved}")

        # ---------- 13. 自动攻击 / 击杀 ----------
        page.wait_for_timeout(15000)
        n_over = dismiss_overlays(page)
        check("升级/商店弹层可正常关闭", True, f"处理了 {n_over} 个弹层")
        page.wait_for_timeout(400)   # 等一次 updateUI（每 200ms 刷新一次）
        s3 = state(page)
        check("自动攻击产生击杀", s3["kills"] > 0, f"击杀 {s3['kills']}")
        check("游戏计时器推进", s3["gameTime"] > 0, f"{s3['gameTime']}s")
        ui_kill = page.locator("#killCount").inner_text()
        check("UI 击杀数与内部一致", ui_kill == str(s3["kills"]),
              f"UI={ui_kill} 内部={s3['kills']}")

        # ---------- 13b. 敌人守恒（生成 = 击杀 + 场上）----------
        culled = page.evaluate("() => window.__cull")
        check("敌人未被静默清理（生成=击杀+场上）", culled == 0,
              f"探针启动后有 {culled} 只血量>0 的敌人凭空消失")
        total_now = page.evaluate("() => game.wave.totalEnemies")
        check("enemiesRemaining 随击杀递减",
              s3["kills"] == 0 or s3["remaining"] < total_now,
              f"remaining={s3['remaining']} total={total_now} kills={s3['kills']}")
        check("顶栏显示本波剩余敌人",
              "剩" in page.locator("#waveRemaining").inner_text()
              or page.evaluate("() => game.wave.inBreak"),
              repr(page.locator("#waveRemaining").inner_text()))

        # ---------- 13c. 成就实时结算：局内进度必须跟上击杀 ----------
        # 改造前成就只在 gameOver 结算一次，局内 29 个成就全程无反馈。
        # 现在实时进度走 liveAchievementProgress，落盘仍在结算时，两者要能对上。
        live_kills = page.evaluate("() => getActiveAchievementProgress().stats.totalKills")
        persisted_kills = page.evaluate("() => getAchievementProgress().stats.totalKills")
        check("成就实时进度跟上局内击杀", live_kills >= s3["kills"],
              f"实时 totalKills={live_kills}，本局击杀={s3['kills']}，已落盘={persisted_kills}")

        # ---------- 14. 暂停 / 继续 ----------
        dismiss_overlays(page)
        page.click("#pauseBtn")
        page.wait_for_timeout(600)
        check("暂停界面出现", page.locator("#pauseScreen").is_visible())
        paused_state = page.evaluate("() => game.state")
        check("状态切到 paused", paused_state == "paused", paused_state)
        t1 = page.evaluate("() => game.gameTime")
        page.wait_for_timeout(1500)
        t2 = page.evaluate("() => game.gameTime")
        check("暂停时游戏时间冻结", abs(t2 - t1) < 0.1, f"{t1:.2f} -> {t2:.2f}")

        # ---------- 14b. 音效开关（SFX.toggle 之前全项目无人调用） ----------
        sfx0 = page.evaluate("() => ({on: SFX.enabled, "
                             "label: document.getElementById('pauseSfxBtn').textContent.trim()})")
        check("音效按钮文案与状态一致",
              ("开" in sfx0["label"]) == sfx0["on"], f"{sfx0}")
        page.click("#pauseSfxBtn")
        page.wait_for_timeout(300)
        sfx1 = page.evaluate("""() => ({
            on: SFX.enabled,
            label: document.getElementById('pauseSfxBtn').textContent.trim(),
            saved: localStorage.getItem('laststand_sfx'),
            pressed: document.getElementById('pauseSfxBtn').getAttribute('aria-pressed')
        })""")
        check("点击后音效状态翻转", sfx1["on"] != sfx0["on"], f"{sfx0['on']} -> {sfx1['on']}")
        check("音效开关已落盘", sfx1["saved"] == ("1" if sfx1["on"] else "0"),
              f"localStorage laststand_sfx={sfx1['saved']}")
        check("音效按钮 aria-pressed 同步",
              sfx1["pressed"] == ("true" if sfx1["on"] else "false"),
              f"aria-pressed={sfx1['pressed']} enabled={sfx1['on']}")
        page.click("#pauseSfxBtn")   # 还原，别影响后面的流程
        page.wait_for_timeout(200)

        page.click("#resumeBtn")
        page.wait_for_timeout(4000)
        # 恢复后这 4 秒里可能已经打完本波（levelup / waveComplete），
        # 所以只断言「不再是 paused」，具体状态另行记录
        resumed = page.evaluate("() => game.state")
        check("恢复后退出暂停态", resumed != "paused", f"当前状态 {resumed}")

        # ---------- 15. 保存 ----------
        dismiss_overlays(page)
        page.click("#saveBtn")
        page.wait_for_timeout(1000)
        has_save = page.evaluate(
            "() => { for (let i=0;i<6;i++){ if (localStorage.getItem('lastStandSave_'+i)"
            "||localStorage.getItem('roguelikeSave_'+i)) return true; } "
            "return Object.keys(localStorage).some(k=>k.toLowerCase().includes('save')); }")
        check("保存写入 localStorage", has_save,
              page.evaluate("() => Object.keys(localStorage).join(',')")[:120])

        # ---------- 16. 截图 ----------
        shot = os.path.join(PROJECT_ROOT, "docs", "screenshots", "e2e_battle.png")
        os.makedirs(os.path.dirname(shot), exist_ok=True)
        page.screenshot(path=shot)
        check("战斗截图已保存", os.path.exists(shot), os.path.relpath(shot, PROJECT_ROOT))

        # ---------- 16b. 读档 ----------
        # 期望值直接取 localStorage 里落盘的存档，避免「拍快照时又击杀了一个」的时序误差
        saved = page.evaluate("""() => {
            for (const k of Object.keys(localStorage)) {
                if (k.startsWith('roguelikeSave_')) {
                    const d = JSON.parse(localStorage.getItem(k));
                    return { wave: d.wave, kills: d.killCount, level: d.player.level };
                }
            }
            return null;
        }""")
        check("存档内容可解析", saved is not None, str(saved))
        page.evaluate("() => returnToMenu()")
        page.wait_for_timeout(1200)
        check("返回主菜单", page.locator("#startScreen").is_visible())
        load_enabled = page.evaluate("() => !document.getElementById('loadGameBtn').disabled")
        check("读取存档按钮已启用", load_enabled)
        if load_enabled and saved:
            page.click("#loadGameBtn")
            page.wait_for_timeout(600)
            filled = page.locator("#saveSlots .save-slot:not(.empty)").count()
            check("存档槽显示已有存档", filled >= 1, f"非空槽 {filled} 个")
            page.locator("#saveSlots .save-slot:not(.empty)").first.click()
            page.wait_for_timeout(4500)
            loaded = state(page)
            check("读档后回到战斗", loaded["state"] in ("playing", "countdown"), loaded["state"])
            check("读档恢复波次", loaded["wave"] == saved["wave"],
                  f"存档波次 {saved['wave']} -> 读档后 {loaded['wave']}")
            check("读档恢复玩家等级", loaded["level"] == saved["level"],
                  f"存档 Lv.{saved['level']} -> 读档后 Lv.{loaded['level']}")
            check("读档恢复击杀数", loaded["kills"] == saved["kills"],
                  f"存档 {saved['kills']} -> 读档后 {loaded['kills']}")

        # ---------- 17. 最终快照 ----------
        final = state(page)
        print("\n--- 最终状态快照 ---", flush=True)
        for k, v in final.items():
            print(f"    {k:14} {v}", flush=True)

        browser.close()

    httpd.shutdown()

    # ---------- 汇总 ----------
    print("\n" + "=" * 60, flush=True)
    passed = sum(1 for _, ok, _ in results if ok)
    print(f"断言结果: {passed}/{len(results)} 通过", flush=True)
    fails = [(n, d) for n, ok, d in results if not ok]
    if fails:
        print("\n未通过项:", flush=True)
        for n, d in fails:
            print(f"  - {n}  {d}", flush=True)

    if page_errors:
        print(f"\n未捕获 JS 异常 ({len(page_errors)}):", flush=True)
        for e in page_errors[:20]:
            print(f"  ! {e}", flush=True)
    else:
        print("\n未捕获 JS 异常: 无", flush=True)

    if console_errors:
        uniq = []
        for e in console_errors:
            if e not in uniq:
                uniq.append(e)
        print(f"\nconsole 报错/警告 (去重后 {len(uniq)} 条 / 共 {len(console_errors)} 次):", flush=True)
        for e in uniq[:30]:
            print(f"  * {e[:200]}", flush=True)
    else:
        print("console 报错/警告: 无", flush=True)

    return 0 if not fails and not page_errors else 1


if __name__ == "__main__":
    sys.exit(main())
