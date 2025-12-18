from PIL import Image
import numpy as np

# 读取原图
original = Image.open(r"F:\VsCodeproject\roge game\PNG\BOSS.png").convert("RGBA")
orig_array = np.array(original)

print("原图尺寸:", original.size)
print()

# 读取所有提取的Boss
import os
boss_dir = r"F:\VsCodeproject\roge game\extracted_sprites\bosses_v2"

for i in range(10):
    boss_path = os.path.join(boss_dir, f"boss_{i}.png")
    if not os.path.exists(boss_path):
        break

    boss_img = Image.open(boss_path).convert("RGBA")
    boss_array = np.array(boss_img)

    # 统计非透明像素
    non_transparent = np.sum(boss_array[:, :, 3] > 0)

    print(f"boss_{i}.png:")
    print(f"  尺寸: {boss_img.size[0]}x{boss_img.size[1]}")
    print(f"  非透明像素: {non_transparent}")

    # 检查是否有边缘像素（可能被截断）
    # 检查四条边是否有非透明像素
    top_edge = np.any(boss_array[0, :, 3] > 0)
    bottom_edge = np.any(boss_array[-1, :, 3] > 0)
    left_edge = np.any(boss_array[:, 0, 3] > 0)
    right_edge = np.any(boss_array[:, -1, 3] > 0)

    edges = []
    if top_edge: edges.append("上")
    if bottom_edge: edges.append("下")
    if left_edge: edges.append("左")
    if right_edge: edges.append("右")

    if edges:
        print(f"  警告：{','.join(edges)}边缘有内容，可能被截断")

    print()
