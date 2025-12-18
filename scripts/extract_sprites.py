from PIL import Image
import os
import numpy as np

def get_background_color(img_array):
    """检测背景色（使用图片四角的颜色）"""
    # 取四个角的颜色的平均值作为背景色
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
    # 计算颜色差异
    diff = np.sum(np.abs(pixel.astype(int) - bg_color.astype(int)))
    return diff < threshold

def find_sprite_rows(img_array, bg_color):
    """找到所有精灵行的位置"""
    height = img_array.shape[0]

    # 对每一行，检查是否有非背景像素
    row_has_content = []
    for row in range(height):
        has_content = False
        for col in range(img_array.shape[1]):
            if not is_background_pixel(img_array[row, col], bg_color):
                has_content = True
                break
        row_has_content.append(has_content)

    # 找到精灵的行范围
    rows = []
    in_row = False
    start_row = 0

    for row in range(height):
        if row_has_content[row] and not in_row:
            in_row = True
            start_row = row
        elif not row_has_content[row] and in_row:
            in_row = False
            rows.append((start_row, row - 1))

    if in_row:
        rows.append((start_row, height - 1))

    return rows

def find_sprite_columns(img_array, row_start, row_end, bg_color):
    """在指定行范围内找到所有精灵的列位置"""
    width = img_array.shape[1]

    # 对每一列，检查是否有非背景像素
    col_has_content = []
    for col in range(width):
        has_content = False
        for row in range(row_start, row_end + 1):
            if not is_background_pixel(img_array[row, col], bg_color):
                has_content = True
                break
        col_has_content.append(has_content)

    # 找到精灵的列范围
    sprites = []
    in_sprite = False
    start_col = 0

    for col in range(width):
        if col_has_content[col] and not in_sprite:
            in_sprite = True
            start_col = col
        elif not col_has_content[col] and in_sprite:
            in_sprite = False
            sprites.append((start_col, col - 1))

    if in_sprite:
        sprites.append((start_col, width - 1))

    return sprites

def extract_sprites_smart(image_path):
    """智能提取精灵"""
    print(f"正在处理: {image_path}")

    img = Image.open(image_path).convert("RGBA")
    img_array = np.array(img)
    height, width = img_array.shape[:2]

    print(f"图片尺寸: {width}x{height}")

    # 检测背景色
    bg_color = get_background_color(img_array)
    print(f"检测到背景色: RGB({bg_color[0]}, {bg_color[1]}, {bg_color[2]})")

    # 找到所有行
    rows = find_sprite_rows(img_array, bg_color)
    print(f"找到 {len(rows)} 行精灵")

    # 提取每一行中的精灵
    all_sprites = []
    for row_idx, (row_start, row_end) in enumerate(rows):
        row_height = row_end - row_start + 1
        print(f"\n处理第 {row_idx + 1} 行 (像素行 {row_start}-{row_end}，高度 {row_height})")

        # 找到这一行中的所有精灵列
        sprite_cols = find_sprite_columns(img_array, row_start, row_end, bg_color)
        print(f"  找到 {len(sprite_cols)} 个精灵")

        for sprite_idx, (col_start, col_end) in enumerate(sprite_cols):
            sprite_width = col_end - col_start + 1

            # 提取精灵（去除背景，转为透明）
            sprite_region = img_array[row_start:row_end+1, col_start:col_end+1].copy()

            # 将背景色替换为透明
            for r in range(sprite_region.shape[0]):
                for c in range(sprite_region.shape[1]):
                    if is_background_pixel(sprite_region[r, c], bg_color):
                        sprite_region[r, c, 3] = 0  # 设置为透明

            sprite_img = Image.fromarray(sprite_region, 'RGBA')

            all_sprites.append({
                'image': sprite_img,
                'width': sprite_width,
                'height': row_height,
                'row': row_idx,
                'sprite_in_row': sprite_idx
            })

            print(f"    精灵 {sprite_idx + 1}: {sprite_width}x{row_height} 像素")

    return all_sprites

def classify_and_save_sprites(sprites, base_output_dir):
    """根据大小和位置分类精灵并保存"""
    if not sprites:
        print("没有找到精灵")
        return

    # 按行分组
    rows = {}
    for sprite in sprites:
        row = sprite['row']
        if row not in rows:
            rows[row] = []
        rows[row].append(sprite)

    print(f"\n\n精灵分类:")
    print(f"共 {len(rows)} 行，{len(sprites)} 个精灵")

    # 分析每行并分类保存
    for row_idx in sorted(rows.keys()):
        row_sprites = rows[row_idx]
        avg_width = sum(s['width'] for s in row_sprites) / len(row_sprites)
        avg_height = sum(s['height'] for s in row_sprites) / len(row_sprites)

        print(f"\n第 {row_idx + 1} 行: {len(row_sprites)} 个精灵")
        print(f"  平均尺寸: {avg_width:.1f}x{avg_height:.1f} 像素")

        # 根据行号和大小判断类型
        # 第一行通常是玩家角色
        if row_idx == 0:
            category = "players"
            category_name = "玩家角色"
        elif avg_height <= 25:
            category = "small_monsters"
            category_name = "小怪"
        elif avg_height <= 35:
            category = "monsters"
            category_name = "普通怪物"
        elif avg_height <= 50:
            category = "elite_monsters"
            category_name = "精英怪物"
        else:
            category = "bosses"
            category_name = "Boss"

        print(f"  -> 分类为: {category_name}")

        # 保存精灵
        output_dir = os.path.join(base_output_dir, category)
        os.makedirs(output_dir, exist_ok=True)

        for i, sprite in enumerate(row_sprites):
            filename = f"row{row_idx}_sprite{i}.png"
            output_path = os.path.join(output_dir, filename)
            sprite['image'].save(output_path)
            print(f"    保存: {filename} ({sprite['width']}x{sprite['height']})")

if __name__ == "__main__":
    # 处理角色，怪物.png
    image_path = r"F:\VsCodeproject\roge game\PNG\角色，怪物.png"
    output_dir = r"F:\VsCodeproject\roge game\extracted_sprites"

    print("=" * 60)
    print("智能精灵提取工具")
    print("=" * 60)

    sprites = extract_sprites_smart(image_path)
    classify_and_save_sprites(sprites, output_dir)

    print("\n" + "=" * 60)
    print("提取完成！")
    print("=" * 60)
