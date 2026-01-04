from PIL import Image
import os
import numpy as np
from collections import deque

# 打开精灵表
spritesheet = Image.open('lpc-trees/lpc-trees/trees-green.png')
width, height = spritesheet.size
print(f'精灵表大小: {width}x{height}')

# 创建输出目录
os.makedirs('environment', exist_ok=True)

def get_largest_connected_component(img):
    """
    获取图片中最大的连通区域，去除其他零散像素和其他树的残留
    """
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    data = np.array(img)
    alpha = data[:, :, 3]
    non_transparent = alpha > 10

    if not np.any(non_transparent):
        return img

    h, w = alpha.shape
    visited = np.zeros((h, w), dtype=bool)
    components = []

    def bfs(start_y, start_x):
        queue = deque([(start_y, start_x)])
        component = []

        while queue:
            y, x = queue.popleft()
            if y < 0 or y >= h or x < 0 or x >= w:
                continue
            if visited[y, x] or not non_transparent[y, x]:
                continue

            visited[y, x] = True
            component.append((y, x))

            for dy in [-1, 0, 1]:
                for dx in [-1, 0, 1]:
                    if dy == 0 and dx == 0:
                        continue
                    queue.append((y + dy, x + dx))

        return component

    for y in range(h):
        for x in range(w):
            if non_transparent[y, x] and not visited[y, x]:
                component = bfs(y, x)
                if len(component) > 100:
                    components.append(component)

    if not components:
        return img

    largest = max(components, key=len)

    new_data = np.zeros_like(data)
    for y, x in largest:
        new_data[y, x] = data[y, x]

    return Image.fromarray(new_data)

def extract_and_clean(img, x, y, w, h, name, min_size=100):
    """从指定图片提取区域并清理"""
    img_w, img_h = img.size
    x = max(0, x)
    y = max(0, y)
    x2 = min(x + w, img_w)
    y2 = min(y + h, img_h)

    region = img.crop((x, y, x2, y2))
    cleaned = get_largest_connected_component(region)

    bbox = cleaned.getbbox()
    if bbox:
        cleaned = cleaned.crop(bbox)

    cleaned.save(f'environment/{name}')
    print(f'Saved {name} ({cleaned.size[0]}x{cleaned.size[1]})')
    return cleaned

def extract_simple(img, x, y, w, h, name):
    """简单提取，不做连通区域分析（用于已经独立的精灵）"""
    img_w, img_h = img.size
    x2 = min(x + w, img_w)
    y2 = min(y + h, img_h)

    region = img.crop((x, y, x2, y2))

    # 只裁剪透明边界
    if region.mode == 'RGBA':
        bbox = region.getbbox()
        if bbox:
            region = region.crop(bbox)

    region.save(f'environment/{name}')
    print(f'Saved {name} ({region.size[0]}x{region.size[1]})')
    return region

print('\n=== 提取树木 ===')

# tree_0: 完整的中型树
extract_and_clean(spritesheet, 448, 160, 160, 200, 'tree_0.png')

# tree_1: 第2行有树干的完整树
extract_and_clean(spritesheet, 0, 64, 65, 110, 'tree_1.png')

# tree_2: 第2行完整的圆顶树
extract_and_clean(spritesheet, 64, 64, 70, 110, 'tree_2.png')

# tree_3: 第5行完整的松树
extract_and_clean(spritesheet, 0, 400, 150, 180, 'tree_3.png')

# tree_4: 第6行完整的多枝树
extract_and_clean(spritesheet, 0, 530, 130, 200, 'tree_4.png')

# tree_5: 第6行大型橡树
extract_and_clean(spritesheet, 176, 530, 220, 220, 'tree_5.png')

# tree_6: 巨型橡树
extract_and_clean(spritesheet, 350, 416, 280, 280, 'tree_6.png')

# tree_7: 最大的树（完美参考）
extract_and_clean(spritesheet, 620, 430, 350, 350, 'tree_7.png')

print('\n=== 提取灌木/草丛 ===')

# 从精灵表第4行提取圆形灌木（y≈288-350）
# bush_0: 圆形灌木（已经OK）
extract_and_clean(spritesheet, 128, 285, 50, 50, 'bush_0.png')

# bush_1: 椭圆形灌木（x≈176）
extract_and_clean(spritesheet, 176, 285, 50, 55, 'bush_1.png')

# bush_2: 云朵形灌木（x≈224-288）
extract_and_clean(spritesheet, 224, 275, 65, 65, 'bush_2.png')

print('\n=== 从 rockpack.png 提取石头 ===')

# 打开石头精灵表
try:
    rocksheet = Image.open('rockpack.png')
    rock_w, rock_h = rocksheet.size
    print(f'石头精灵表大小: {rock_w}x{rock_h}')

    # 石头精灵表是 64x64，包含多个石头
    # 布局大约是 2列 x 3行，每个石头约 32x20
    extract_simple(rocksheet, 0, 0, 32, 25, 'rock_0.png')     # 左上大石头
    extract_simple(rocksheet, 32, 0, 32, 25, 'rock_1.png')    # 右上石头组
    extract_simple(rocksheet, 0, 25, 32, 20, 'rock_2.png')    # 中间左石头

except Exception as e:
    print(f'无法加载石头精灵表: {e}')

print('\n完成! 所有素材已从真实素材中提取到 environment 目录')
