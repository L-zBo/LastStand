from PIL import Image
import numpy as np
import os

# 读取boss_0（包含多个Boss的大区域）
img = Image.open(r"F:\VsCodeproject\roge game\extracted_sprites\bosses_v2\boss_0.png").convert("RGBA")
img_array = np.array(img)
height, width = img_array.shape[:2]

print(f"boss_0尺寸: {width}x{height}")

# 分析每一列的非透明像素数量，找到分隔点
col_pixel_counts = []
for c in range(width):
    count = np.sum(img_array[:, c, 3] > 0)
    col_pixel_counts.append(count)

print("\n每列的非透明像素数量（前20列）:")
for i in range(min(20, len(col_pixel_counts))):
    print(f"列 {i}: {col_pixel_counts[i]} 像素")

# 找到列之间的间隙（非透明像素数量很少的列）
gaps = []
for i in range(width):
    if col_pixel_counts[i] < 5:  # 少于5个像素认为是间隙
        gaps.append(i)

print(f"\n找到 {len(gaps)} 个间隙列")

# 将连续的间隙合并
gap_ranges = []
if gaps:
    start = gaps[0]
    end = gaps[0]
    for i in range(1, len(gaps)):
        if gaps[i] == end + 1:
            end = gaps[i]
        else:
            if end - start >= 2:  # 至少3列的间隙
                gap_ranges.append((start, end))
            start = gaps[i]
            end = gaps[i]
    if end - start >= 2:
        gap_ranges.append((start, end))

print(f"合并后的间隙范围: {gap_ranges}")

# 根据间隙分割Boss
output_dir = r"F:\VsCodeproject\roge game\extracted_sprites\bosses_manual"
os.makedirs(output_dir, exist_ok=True)

# 如果没有明显的间隙，尝试按宽度均分
if len(gap_ranges) < 2:
    print("\n没有找到足够的间隙，尝试分析行来分割...")

    # 分析每一行的非透明像素分布
    for r in range(min(10, height)):
        row_pixels = np.where(img_array[r, :, 3] > 0)[0]
        if len(row_pixels) > 0:
            print(f"行 {r}: 非透明像素列范围 {row_pixels[0]}-{row_pixels[-1]}")

    # 手动定义分割点（基于可视化观察）
    # 从可视化图可以看到，boss_0包含了右侧的多个Boss
    # 我们需要更智能的方法来分割它们

    print("\n由于Boss在原图中是连在一起的，无法自动分割")
    print("建议：保留boss_0作为一个整体，或者手动编辑原图添加分隔")
else:
    # 根据间隙分割
    split_points = [0] + [(start + end) // 2 for start, end in gap_ranges] + [width]

    for i in range(len(split_points) - 1):
        start_col = split_points[i]
        end_col = split_points[i + 1]

        # 提取这个区域
        region = img_array[:, start_col:end_col, :]

        # 找到实际内容的行范围
        row_has_content = np.any(region[:, :, 3] > 0, axis=1)
        if not np.any(row_has_content):
            continue

        min_row = np.argmax(row_has_content)
        max_row = len(row_has_content) - np.argmax(row_has_content[::-1]) - 1

        # 裁剪
        cropped = region[min_row:max_row+1, :, :]

        # 保存
        sprite_img = Image.fromarray(cropped, 'RGBA')
        filename = f"boss_0_part{i}.png"
        output_path = os.path.join(output_dir, filename)
        sprite_img.save(output_path)

        print(f"保存: {filename} ({cropped.shape[1]}x{cropped.shape[0]})")
