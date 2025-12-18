from PIL import Image
import os
import numpy as np
from scipy import ndimage
from scipy.spatial.distance import cdist

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

def is_background_pixel(pixel, bg_color, threshold=30):
    """判断像素是否为背景色"""
    diff = np.sum(np.abs(pixel.astype(int) - bg_color.astype(int)))
    return diff < threshold

def get_region_info(labeled_array, label_idx):
    """获取区域的信息"""
    positions = np.where(labeled_array == label_idx)
    if len(positions[0]) == 0:
        return None

    min_row = np.min(positions[0])
    max_row = np.max(positions[0])
    min_col = np.min(positions[1])
    max_col = np.max(positions[1])

    center_row = (min_row + max_row) / 2
    center_col = (min_col + max_col) / 2
    width = max_col - min_col + 1
    height = max_row - min_row + 1
    area = len(positions[0])

    return {
        'label': label_idx,
        'min_row': min_row,
        'max_row': max_row,
        'min_col': min_col,
        'max_col': max_col,
        'center': np.array([center_row, center_col]),
        'width': width,
        'height': height,
        'area': area
    }

def group_regions_into_bosses(regions, max_distance=15):
    """将靠近的区域分组成Boss"""
    # 过滤掉太小的噪点区域
    regions = [r for r in regions if r['width'] >= 10 and r['height'] >= 10 or r['area'] >= 100]

    if len(regions) == 0:
        return []

    # 创建区域分组
    groups = []
    used = set()

    # 按面积排序，大区域优先
    regions_sorted = sorted(regions, key=lambda r: r['area'], reverse=True)

    for i, region in enumerate(regions_sorted):
        if region['label'] in used:
            continue

        # 创建新组 - 每个区域单独成组，不合并
        # 这样可以保持Boss分离，即使某些Boss的部分可能被分成多个区域
        group = [region]
        used.add(region['label'])
        groups.append(group)

    return groups

def extract_bosses_smart(image_path, output_dir):
    """智能提取Boss精灵"""
    print(f"正在处理: {image_path}")

    img = Image.open(image_path).convert("RGBA")
    img_array = np.array(img)
    height, width = img_array.shape[:2]

    print(f"图片尺寸: {width}x{height}")

    # 检测背景色
    bg_color = get_background_color(img_array)
    print(f"检测到背景色: RGB({bg_color[0]}, {bg_color[1]}, {bg_color[2]})")

    # 创建二值掩码
    mask = np.zeros((height, width), dtype=bool)
    for r in range(height):
        for c in range(width):
            if not is_background_pixel(img_array[r, c], bg_color):
                mask[r, c] = True

    print(f"检测到 {np.sum(mask)} 个非背景像素")

    # 不使用膨胀，直接检测连通区域
    labeled_array, num_features = ndimage.label(mask)
    print(f"找到 {num_features} 个连通区域")

    # 获取所有区域的信息
    regions = []
    for label_idx in range(1, num_features + 1):
        info = get_region_info(labeled_array, label_idx)
        if info:
            regions.append(info)

    print(f"过滤后剩余 {len(regions)} 个有效区域")

    # 将区域分组成Boss
    boss_groups = group_regions_into_bosses(regions, max_distance=25)
    print(f"分组后得到 {len(boss_groups)} 个Boss")

    os.makedirs(output_dir, exist_ok=True)

    all_sprites = []
    for boss_idx, group in enumerate(boss_groups):
        # 计算组的总边界
        min_row = min(r['min_row'] for r in group)
        max_row = max(r['max_row'] for r in group)
        min_col = min(r['min_col'] for r in group)
        max_col = max(r['max_col'] for r in group)

        # 添加padding
        min_row = max(0, min_row - 2)
        max_row = min(height - 1, max_row + 2)
        min_col = max(0, min_col - 2)
        max_col = min(width - 1, max_col + 2)

        sprite_height = max_row - min_row + 1
        sprite_width = max_col - min_col + 1

        # 提取精灵区域
        sprite_region = img_array[min_row:max_row+1, min_col:max_col+1].copy()

        # 将背景色替换为透明
        for r in range(sprite_region.shape[0]):
            for c in range(sprite_region.shape[1]):
                if is_background_pixel(sprite_region[r, c], bg_color):
                    sprite_region[r, c, 3] = 0

        sprite_img = Image.fromarray(sprite_region, 'RGBA')

        # 保存
        filename = f"boss_{boss_idx}.png"
        output_path = os.path.join(output_dir, filename)
        sprite_img.save(output_path)

        group_size = len(group)
        print(f"  Boss {boss_idx + 1}: {sprite_width}x{sprite_height} 像素 ({group_size} 个区域) -> {filename}")

        all_sprites.append({
            'image': sprite_img,
            'width': sprite_width,
            'height': sprite_height,
            'filename': filename,
            'num_regions': group_size
        })

    return all_sprites

if __name__ == "__main__":
    # 处理BOSS.png
    image_path = r"F:\VsCodeproject\roge game\PNG\BOSS.png"
    output_dir = r"F:\VsCodeproject\roge game\extracted_sprites\bosses"

    print("=" * 60)
    print("Boss精灵提取工具（智能分组）")
    print("=" * 60)

    sprites = extract_bosses_smart(image_path, output_dir)

    print("\n" + "=" * 60)
    print(f"提取完成！共提取 {len(sprites)} 个Boss精灵")
    print("=" * 60)
