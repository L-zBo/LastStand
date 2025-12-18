from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage
import random

def get_background_color(img_array):
    corners = [
        img_array[0, 0],
        img_array[0, -1],
        img_array[-1, 0],
        img_array[-1, -1]
    ]
    bg_color = np.mean(corners, axis=0).astype(np.uint8)
    return bg_color

def is_background_pixel(pixel, bg_color, threshold=15):
    diff = np.sum(np.abs(pixel[:3].astype(int) - bg_color[:3].astype(int)))
    return diff < threshold

# 读取BOSS图片
img = Image.open(r"F:\VsCodeproject\roge game\PNG\BOSS.png").convert("RGBA")
img_array = np.array(img)
height, width = img_array.shape[:2]

print(f"图片尺寸: {width}x{height}")

# 检测背景色
bg_color = get_background_color(img_array)
print(f"背景色: RGB({bg_color[0]}, {bg_color[1]}, {bg_color[2]})")

# 创建二值掩码
mask = np.zeros((height, width), dtype=bool)
for r in range(height):
    for c in range(width):
        if not is_background_pixel(img_array[r, c], bg_color, threshold=15):
            mask[r, c] = True

print(f"非背景像素: {np.sum(mask)}")

# 连通区域标记
labeled_array, num_features = ndimage.label(mask)
print(f"连通区域数量: {num_features}")

# 创建可视化图片
vis_img = img.copy()
draw = ImageDraw.Draw(vis_img)

# 为每个区域绘制边界框
colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0), (255, 0, 255), (0, 255, 255), (255, 128, 0)]

for label_idx in range(1, min(num_features + 1, 20)):  # 最多显示20个区域
    positions = np.where(labeled_array == label_idx)
    if len(positions[0]) == 0:
        continue

    min_row = np.min(positions[0])
    max_row = np.max(positions[0])
    min_col = np.min(positions[1])
    max_col = np.max(positions[1])

    width_r = max_col - min_col + 1
    height_r = max_row - min_row + 1
    area = len(positions[0])

    # 只显示较大的区域
    if width_r < 10 or height_r < 10:
        continue

    color = colors[(label_idx - 1) % len(colors)]

    # 绘制边界框
    draw.rectangle([min_col, min_row, max_col, max_row], outline=color, width=2)

    # 绘制标签
    draw.text((min_col + 2, min_row + 2), f"{label_idx}", fill=color)

    print(f"区域 {label_idx}: 位置({min_col}, {min_row})-({max_col}, {max_row}), 尺寸{width_r}x{height_r}, 面积{area}")

# 保存可视化结果
vis_img.save(r"F:\VsCodeproject\roge game\boss_regions_visualization.png")
print("\n可视化结果已保存到: boss_regions_visualization.png")
