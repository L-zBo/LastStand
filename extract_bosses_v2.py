from PIL import Image
import os
import numpy as np
from scipy import ndimage

def get_background_color(img_array):
    """检测背景色（使用图片四角的颜色）"""
    corners = [
        img_array[0, 0],
        img_array[0, -1],
        img_array[-1, 0],
        img_array[-1, -1]
    ]
    bg_color = np.mean(corners, axis=0).astype(np.uint8)
    return bg_color

def is_background_pixel(pixel, bg_color, threshold=15):
    """判断像素是否为背景色 - 使用更严格的阈值"""
    # 只比较RGB，不比较Alpha
    diff = np.sum(np.abs(pixel[:3].astype(int) - bg_color[:3].astype(int)))
    return diff < threshold

def extract_bosses_by_grid(image_path, output_dir):
    """使用网格方法提取Boss - 手动指定大致位置"""
    print(f"正在处理: {image_path}")

    img = Image.open(image_path).convert("RGBA")
    img_array = np.array(img)
    height, width = img_array.shape[:2]

    print(f"图片尺寸: {width}x{height}")

    # 检测背景色
    bg_color = get_background_color(img_array)
    print(f"检测到背景色: RGB({bg_color[0]}, {bg_color[1]}, {bg_color[2]})")

    # 创建二值掩码 - 使用更严格的阈值
    mask = np.zeros((height, width), dtype=bool)
    for r in range(height):
        for c in range(width):
            if not is_background_pixel(img_array[r, c], bg_color, threshold=15):
                mask[r, c] = True

    print(f"检测到 {np.sum(mask)} 个非背景像素")

    # 使用连通区域标记
    labeled_array, num_features = ndimage.label(mask)
    print(f"找到 {num_features} 个连通区域")

    # 获取所有区域的信息
    regions = []
    for label_idx in range(1, num_features + 1):
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

        # 过滤掉太小的区域
        if width_r < 10 or height_r < 10:
            continue

        regions.append({
            'label': label_idx,
            'min_row': min_row,
            'max_row': max_row,
            'min_col': min_col,
            'max_col': max_col,
            'width': width_r,
            'height': height_r,
            'area': area
        })

    print(f"过滤后剩余 {len(regions)} 个有效区域")

    # 按面积排序
    regions = sorted(regions, key=lambda r: r['area'], reverse=True)

    os.makedirs(output_dir, exist_ok=True)

    all_sprites = []
    for boss_idx, region in enumerate(regions):
        min_row = region['min_row']
        max_row = region['max_row']
        min_col = region['min_col']
        max_col = region['max_col']

        # 添加padding
        padding = 2
        min_row = max(0, min_row - padding)
        max_row = min(img_array.shape[0] - 1, max_row + padding)
        min_col = max(0, min_col - padding)
        max_col = min(img_array.shape[1] - 1, max_col + padding)

        sprite_height = max_row - min_row + 1
        sprite_width = max_col - min_col + 1

        # 提取精灵区域 - 不去除背景，保留原始颜色
        sprite_region = img_array[min_row:max_row+1, min_col:max_col+1].copy()

        # 只将明确的背景色（完全匹配）设为透明
        for r in range(sprite_region.shape[0]):
            for c in range(sprite_region.shape[1]):
                if is_background_pixel(sprite_region[r, c], bg_color, threshold=10):
                    sprite_region[r, c, 3] = 0

        sprite_img = Image.fromarray(sprite_region, 'RGBA')

        # 保存
        filename = f"boss_{boss_idx}.png"
        output_path = os.path.join(output_dir, filename)
        sprite_img.save(output_path)

        print(f"  Boss {boss_idx + 1}: {sprite_width}x{sprite_height} 像素 (面积: {region['area']}) -> {filename}")

        all_sprites.append({
            'image': sprite_img,
            'width': sprite_width,
            'height': sprite_height,
            'filename': filename
        })

    return all_sprites

if __name__ == "__main__":
    # 处理BOSS.png
    image_path = r"F:\VsCodeproject\roge game\PNG\BOSS.png"
    output_dir = r"F:\VsCodeproject\roge game\extracted_sprites\bosses_v2"

    print("=" * 60)
    print("Boss精灵提取工具 V2（更严格的背景检测）")
    print("=" * 60)

    sprites = extract_bosses_by_grid(image_path, output_dir)

    print("\n" + "=" * 60)
    print(f"提取完成！共提取 {len(sprites)} 个Boss精灵")
    print("=" * 60)
