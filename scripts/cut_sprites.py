"""
精灵图切割脚本
根据不同角色类型的实际尺寸进行切割
"""

from PIL import Image
import os

def cut_sprites():
    # 加载角色怪物图
    source_path = r"F:\VsCodeproject\roge game\PNG\角色，怪物.png"
    output_dir = r"F:\VsCodeproject\roge game\assets"

    img = Image.open(source_path)
    img_width, img_height = img.size
    print(f"图片尺寸: {img_width} x {img_height}")

    # 创建输出目录
    players_dir = os.path.join(output_dir, "players_new")
    enemies_dir = os.path.join(output_dir, "enemies_new")
    os.makedirs(players_dir, exist_ok=True)
    os.makedirs(enemies_dir, exist_ok=True)

    # 定义切割区域
    # 格式: (x, y, width, height, name, category)
    sprites_to_cut = []

    # 第1排 - 玩家角色 (32x32)
    # 玩家角色在最上面，有4个方向的动画
    player_y = 0
    player_size = 32
    for i in range(12):  # 大约12帧玩家动画
        x = i * player_size
        if x + player_size <= img_width:
            sprites_to_cut.append((x, player_y, player_size, player_size, f"player_{i}", "players_new"))

    # 第2排 - 小型怪物 (16x16 到 24x24)
    row2_y = 32
    small_sizes = [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16]
    x_pos = 0
    for i, size in enumerate(small_sizes):
        if x_pos + size <= img_width:
            sprites_to_cut.append((x_pos, row2_y, size, size, f"small_enemy_{i}", "enemies_new"))
            x_pos += size

    # 第3排 - 中型怪物 (32x32)
    row3_y = 64
    medium_size = 32
    for i in range(12):
        x = i * medium_size
        if x + medium_size <= img_width:
            sprites_to_cut.append((x, row3_y, medium_size, medium_size, f"medium_enemy_{i}", "enemies_new"))

    # 第4排 - 大型怪物 (48x48)
    row4_y = 96
    large_size = 48
    for i in range(8):
        x = i * large_size
        if x + large_size <= img_width:
            sprites_to_cut.append((x, row4_y, large_size, large_size, f"large_enemy_{i}", "enemies_new"))

    # 第5排 - 精英怪物 (64x48)
    row5_y = 144
    elite_width = 64
    elite_height = 48
    for i in range(5):
        x = i * elite_width
        if x + elite_width <= img_width:
            sprites_to_cut.append((x, row5_y, elite_width, elite_height, f"elite_enemy_{i}", "enemies_new"))

    # 执行切割
    for x, y, w, h, name, category in sprites_to_cut:
        try:
            if x + w <= img_width and y + h <= img_height:
                sprite = img.crop((x, y, x + w, y + h))
                # 检查是否为空白图片
                if sprite.getbbox() is not None:  # 有内容
                    save_path = os.path.join(output_dir, category, f"{name}.png")
                    sprite.save(save_path)
                    print(f"已保存: {name}.png ({w}x{h})")
        except Exception as e:
            print(f"切割 {name} 时出错: {e}")

    print("\n切割完成!")

if __name__ == "__main__":
    cut_sprites()
