from PIL import Image
import os
import numpy as np

def get_background_color(img_array):
    """检测背景色"""
    corners = [
        img_array[0, 0],
        img_array[0, -1],
        img_array[-1, 0],
        img_array[-1, -1]
    ]
    bg_color = np.mean(corners, axis=0).astype(np.uint8)
    return bg_color

def is_background_pixel(pixel, bg_color, threshold=15):
    """判断像素是否为背景色"""
    diff = np.sum(np.abs(pixel[:3].astype(int) - bg_color[:3].astype(int)))
    return diff < threshold

def extract_boss_from_region(img_array, bg_color, region_bounds):
    """从指定区域提取Boss"""
    min_col, min_row, max_col, max_row = region_bounds

    # 提取区域
    region = img_array[min_row:max_row+1, min_col:max_col+1].copy()

    # 找到实际内容的边界
    mask = np.zeros((region.shape[0], region.shape[1]), dtype=bool)
    for r in range(region.shape[0]):
        for c in range(region.shape[1]):
            if not is_background_pixel(region[r, c], bg_color, threshold=15):
                mask[r, c] = True

    # 找到非背景像素的边界
    rows_with_content = np.any(mask, axis=1)
    cols_with_content = np.any(mask, axis=0)

    if not np.any(rows_with_content) or not np.any(cols_with_content):
        return None

    actual_min_row = np.argmax(rows_with_content)
    actual_max_row = len(rows_with_content) - np.argmax(rows_with_content[::-1]) - 1
    actual_min_col = np.argmax(cols_with_content)
    actual_max_col = len(cols_with_content) - np.argmax(cols_with_content[::-1]) - 1

    # 添加padding
    padding = 2
    actual_min_row = max(0, actual_min_row - padding)
    actual_max_row = min(region.shape[0] - 1, actual_max_row + padding)
    actual_min_col = max(0, actual_min_col - padding)
    actual_max_col = min(region.shape[1] - 1, actual_max_col + padding)

    # 裁剪到实际内容
    cropped = region[actual_min_row:actual_max_row+1, actual_min_col:actual_max_col+1].copy()

    # 将背景色设为透明
    for r in range(cropped.shape[0]):
        for c in range(cropped.shape[1]):
            if is_background_pixel(cropped[r, c], bg_color, threshold=10):
                cropped[r, c, 3] = 0

    return cropped

def extract_bosses_manual(image_path, output_dir):
    """手动定义区域提取Boss"""
    print(f"正在处理: {image_path}")

    img = Image.open(image_path).convert("RGBA")
    img_array = np.array(img)
    height, width = img_array.shape[:2]

    print(f"图片尺寸: {width}x{height}")

    # 检测背景色
    bg_color = get_background_color(img_array)
    print(f"检测到背景色: RGB({bg_color[0]}, {bg_color[1]}, {bg_color[2]})")

    # 手动定义每个Boss的大致区域 (min_col, min_row, max_col, max_row)
    # 通过观察原图和可视化结果确定
    boss_regions = [
        ("熊", (10, 5, 90, 80)),           # 左上
        ("青蛙", (135, 10, 195, 75)),      # 中上
        ("眼球怪", (85, 75, 145, 150)),    # 中下
        ("火焰怪", (145, 75, 200, 150)),   # 中下偏右
        ("大龙", (200, 5, 340, 100)),      # 右上
        ("甲虫", (200, 100, 290, 150)),    # 右下
        ("蜘蛛", (10, 85, 85, 150)),       # 左下
    ]

    os.makedirs(output_dir, exist_ok=True)

    all_sprites = []
    for boss_idx, (name, region_bounds) in enumerate(boss_regions):
        print(f"\n处理 Boss {boss_idx + 1}: {name}")
        print(f"  区域: {region_bounds}")

        sprite_region = extract_boss_from_region(img_array, bg_color, region_bounds)

        if sprite_region is None:
            print(f"  警告：未找到内容")
            continue

        sprite_img = Image.fromarray(sprite_region, 'RGBA')
        sprite_height, sprite_width = sprite_region.shape[:2]

        # 保存
        filename = f"boss_{boss_idx}_{name}.png"
        output_path = os.path.join(output_dir, filename)
        sprite_img.save(output_path)

        print(f"  尺寸: {sprite_width}x{sprite_height} 像素")
        print(f"  保存: {filename}")

        all_sprites.append({
            'image': sprite_img,
            'width': sprite_width,
            'height': sprite_height,
            'filename': filename,
            'name': name
        })

    return all_sprites

if __name__ == "__main__":
    # 处理BOSS.png
    image_path = r"F:\VsCodeproject\roge game\PNG\BOSS.png"
    output_dir = r"F:\VsCodeproject\roge game\extracted_sprites\bosses"

    print("=" * 60)
    print("Boss精灵提取工具（手动定义区域）")
    print("=" * 60)

    sprites = extract_bosses_manual(image_path, output_dir)

    print("\n" + "=" * 60)
    print(f"提取完成！共提取 {len(sprites)} 个Boss精灵")
    for sprite in sprites:
        print(f"  - {sprite['name']}: {sprite['width']}x{sprite['height']}")
    print("=" * 60)
