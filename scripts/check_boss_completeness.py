from PIL import Image, ImageDraw
import numpy as np
import os

# 读取原图
original = Image.open(r"F:\VsCodeproject\roge game\PNG\BOSS.png").convert("RGBA")
orig_array = np.array(original)

print("原图尺寸:", original.size)
print()

# 读取所有提取的Boss并在原图上标记
vis_img = original.copy()
draw = ImageDraw.Draw(vis_img)

boss_dir = r"F:\VsCodeproject\roge game\extracted_sprites\bosses"
boss_files = sorted([f for f in os.listdir(boss_dir) if f.startswith("boss_") and f.endswith(".png")])

# 手动定义的区域（用于对比）
boss_regions = [
    ("熊", (10, 5, 90, 80)),
    ("青蛙", (135, 10, 195, 75)),
    ("眼球怪", (85, 75, 145, 150)),
    ("火焰怪", (145, 75, 200, 150)),
    ("大龙", (200, 5, 340, 100)),
    ("甲虫", (200, 100, 290, 150)),
    ("蜘蛛", (10, 85, 85, 150)),
]

colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0), (255, 0, 255), (0, 255, 255), (255, 128, 0)]

print("检查每个Boss的完整性：\n")

for idx, (name, (min_col, min_row, max_col, max_row)) in enumerate(boss_regions):
    # 绘制定义的区域
    draw.rectangle([min_col, min_row, max_col, max_row], outline=colors[idx], width=2)
    draw.text((min_col + 2, min_row + 2), f"{idx}: {name}", fill=colors[idx])

    # 检查这个区域内的非背景像素
    bg_color = np.array([104, 101, 87])
    region = orig_array[min_row:max_row+1, min_col:max_col+1]

    non_bg_pixels = 0
    for r in range(region.shape[0]):
        for c in range(region.shape[1]):
            diff = np.sum(np.abs(region[r, c, :3].astype(int) - bg_color.astype(int)))
            if diff >= 15:
                non_bg_pixels += 1

    region_width = max_col - min_col + 1
    region_height = max_row - min_row + 1

    print(f"Boss {idx} - {name}:")
    print(f"  定义区域: ({min_col}, {min_row}) - ({max_col}, {max_row})")
    print(f"  区域尺寸: {region_width}x{region_height}")
    print(f"  非背景像素: {non_bg_pixels}")

    # 检查边缘是否有内容（可能需要扩大区域）
    # 检查上边缘
    top_edge_pixels = 0
    for c in range(region.shape[1]):
        diff = np.sum(np.abs(region[0, c, :3].astype(int) - bg_color.astype(int)))
        if diff >= 15:
            top_edge_pixels += 1

    # 检查下边缘
    bottom_edge_pixels = 0
    for c in range(region.shape[1]):
        diff = np.sum(np.abs(region[-1, c, :3].astype(int) - bg_color.astype(int)))
        if diff >= 15:
            bottom_edge_pixels += 1

    # 检查左边缘
    left_edge_pixels = 0
    for r in range(region.shape[0]):
        diff = np.sum(np.abs(region[r, 0, :3].astype(int) - bg_color.astype(int)))
        if diff >= 15:
            left_edge_pixels += 1

    # 检查右边缘
    right_edge_pixels = 0
    for r in range(region.shape[0]):
        diff = np.sum(np.abs(region[r, -1, :3].astype(int) - bg_color.astype(int)))
        if diff >= 15:
            right_edge_pixels += 1

    warnings = []
    if top_edge_pixels > 5:
        warnings.append(f"上边缘有{top_edge_pixels}个非背景像素，可能被截断")
    if bottom_edge_pixels > 5:
        warnings.append(f"下边缘有{bottom_edge_pixels}个非背景像素，可能被截断")
    if left_edge_pixels > 5:
        warnings.append(f"左边缘有{left_edge_pixels}个非背景像素，可能被截断")
    if right_edge_pixels > 5:
        warnings.append(f"右边缘有{right_edge_pixels}个非背景像素，可能被截断")

    if warnings:
        print(f"  [!] 警告:")
        for w in warnings:
            print(f"    - {w}")
    else:
        print(f"  [OK] 区域完整")

    print()

# 保存可视化结果
vis_img.save(r"F:\VsCodeproject\roge game\boss_regions_check.png")
print("可视化结果已保存到: boss_regions_check.png")
