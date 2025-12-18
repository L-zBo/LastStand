from PIL import Image
import numpy as np

# 读取BOSS图片
img = Image.open(r"F:\VsCodeproject\roge game\PNG\BOSS.png").convert("RGBA")
img_array = np.array(img)
height, width = img_array.shape[:2]

print(f"图片尺寸: {width}x{height}")

# 检测背景色
corners = [
    img_array[0, 0],
    img_array[0, -1],
    img_array[-1, 0],
    img_array[-1, -1]
]
bg_color = np.mean(corners, axis=0).astype(np.uint8)
print(f"检测到的背景色: RGBA({bg_color[0]}, {bg_color[1]}, {bg_color[2]}, {bg_color[3]})")

# 检查四个角的实际颜色
print("\n四个角的实际颜色:")
print(f"左上角: RGBA{tuple(img_array[0, 0])}")
print(f"右上角: RGBA{tuple(img_array[0, -1])}")
print(f"左下角: RGBA{tuple(img_array[-1, 0])}")
print(f"右下角: RGBA{tuple(img_array[-1, -1])}")

# 采样一些Boss区域的颜色
print("\n采样Boss区域的颜色:")
# 熊的位置（左上）
print(f"熊区域 (30, 30): RGBA{tuple(img_array[30, 30])}")
# 青蛙的位置（中上）
print(f"青蛙区域 (30, 150): RGBA{tuple(img_array[30, 150])}")
# 大龙的位置（中间）
print(f"大龙区域 (80, 150): RGBA{tuple(img_array[80, 150])}")

# 测试不同阈值下的非背景像素数量
print("\n不同阈值下的非背景像素数量:")
for threshold in [10, 20, 30, 40, 50, 60]:
    count = 0
    for r in range(height):
        for c in range(width):
            diff = np.sum(np.abs(img_array[r, c].astype(int) - bg_color.astype(int)))
            if diff >= threshold:
                count += 1
    print(f"阈值 {threshold}: {count} 个非背景像素 ({count/(height*width)*100:.1f}%)")
