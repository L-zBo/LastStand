from PIL import Image
import numpy as np

# 读取原图
img = Image.open(r"F:\VsCodeproject\roge game\PNG\BOSS.png").convert("RGBA")
img_array = np.array(img)

print("原图尺寸:", img.size)
print()

# 手动标注Boss的大致位置（通过观察原图）
# 格式: (名称, 大致中心位置)
boss_positions = [
    ("熊（左上）", (50, 40)),
    ("青蛙（中上）", (160, 40)),
    ("眼球怪（中间）", (115, 115)),
    ("火焰怪（中间偏右）", (165, 90)),
    ("大龙（右上）", (255, 75)),
    ("甲虫（右下）", (135, 115)),
    ("蜘蛛（左下）", (55, 115)),
]

print(f"预期的Boss数量: {len(boss_positions)}")
print()

# 检查每个位置的颜色
bg_color = np.array([104, 101, 87, 255])

for name, (x, y) in boss_positions:
    pixel = img_array[y, x]
    diff = np.sum(np.abs(pixel.astype(int) - bg_color.astype(int)))
    is_bg = diff < 30

    print(f"{name} 位置({x}, {y}):")
    print(f"  颜色: RGBA{tuple(pixel)}")
    print(f"  与背景差异: {diff}")
    print(f"  是否为背景: {is_bg}")
    print()
