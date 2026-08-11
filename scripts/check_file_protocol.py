"""核实 file:// 直接打开 game.html 是否可用

README 一直写「直接在浏览器中打开 game.html 即可开始游戏」，
但 Canvas 绘制本地 PNG 在 file:// 协议下可能被浏览器拦（跨源污染）。
这个脚本用 file:// 打开一局，检查素材是否真的加载出来了。

用法:
    PYTHONIOENCODING=utf-8 PYTHONUTF8=1 python scripts/check_file_protocol.py
"""
import os
import sys

from playwright.sync_api import sync_playwright

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAME = os.path.join(PROJECT_ROOT, "game.html")


def main():
    console = []
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-proxy-server"])
        page = browser.new_page(viewport={"width": 1400, "height": 860})
        page.on("console", lambda m: console.append(f"{m.type}: {m.text}"))
        page.on("pageerror", lambda e: errors.append(str(e)))

        page.goto("file:///" + GAME.replace("\\", "/"), wait_until="load", timeout=30000)
        page.wait_for_timeout(2500)

        loaded = page.evaluate("() => typeof game !== 'undefined'")
        print(f"JS 模块加载: {'OK' if loaded else 'FAIL'}")
        if not loaded:
            print("console:", console[:10])
            browser.close()
            return 1

        page.click("#newGameBtn")
        page.wait_for_timeout(400)
        page.locator("#saveSlots .save-slot").first.click()
        page.wait_for_timeout(400)
        page.click('.player-count-btn[data-count="1"]')
        page.wait_for_timeout(400)
        page.click('.class-card[data-class="warrior"]')
        page.wait_for_timeout(400)
        page.click('.difficulty-card[data-difficulty="normal"]')
        page.wait_for_timeout(400)
        page.click('.map-card[data-map="forest"]')
        page.wait_for_timeout(200)
        page.click("#startGameBtn")
        page.wait_for_timeout(6000)

        info = page.evaluate("""() => {
            // loadedImages 的结构是 {players:{id:img}, enemies:{...}, bosses, weapons, items}
            const cats = ['players', 'enemies', 'bosses', 'weapons', 'items'];
            const per = {};
            let total = 0, ok = 0;
            for (const c of cats) {
                const bucket = loadedImages[c] || {};
                const ids = Object.keys(bucket);
                const good = ids.filter(k => bucket[k] && bucket[k].naturalWidth > 0).length;
                per[c] = good + '/' + ids.length;
                total += ids.length;
                ok += good;
            }
            return {
                state: game.state,
                per, assetsTotal: total, assetsOk: ok,
                tileOk: !!(mapTileImages.forest && mapTileImages.forest.naturalWidth > 0),
                treeOk: environmentImages.trees.filter(t => t && t.naturalWidth > 0).length,
                enemies: game.enemies.length
            };
        }""")
        print(f"游戏状态: {info['state']}")
        print(f"精灵素材总计: {info['assetsOk']}/{info['assetsTotal']} 加载成功")
        for k, v in info["per"].items():
            print(f"    {k:9} {v}")
        print(f"地图瓦片(forest): {'OK' if info['tileOk'] else 'FAIL'}")
        print(f"树木素材: {info['treeOk']}/40 加载成功")
        print(f"场上敌人: {info['enemies']}")

        # file:// 下 drawImage 本地图会污染画布，getImageData 会抛 SecurityError。
        # 游戏本身不读像素，所以只影响这类检测手段，不影响运行。
        try:
            non_black = page.evaluate("""() => {
                const c = game.canvas;
                const d = c.getContext('2d').getImageData(
                    Math.floor(c.width/2)-60, Math.floor(c.height/2)-60, 120, 120).data;
                let n = 0;
                for (let i = 0; i < d.length; i += 4) {
                    if (d[i] + d[i+1] + d[i+2] > 60) n++;
                }
                return n;
            }""")
            print(f"画布中心 120x120 非黑像素: {non_black}/14400")
        except Exception as e:
            print(f"画布像素检测不可用（预期行为）: {str(e).splitlines()[0][:90]}")
            print("  -> file:// 下画布被本地图片污染，只影响像素采样，不影响游戏渲染")

        shot = os.path.join(PROJECT_ROOT, "docs", "screenshots", "file_protocol.png")
        page.screenshot(path=shot)
        browser.close()

    errs = [c for c in console if c.startswith("error")]
    print(f"\nconsole error: {len(errs)} 条")
    for e in errs[:10]:
        print("  *", e[:160])
    print(f"未捕获 JS 异常: {errors if errors else '无'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
