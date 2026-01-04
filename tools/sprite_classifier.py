#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
精灵图分类器
==================================
生成日期: 2026-01-03
开发者: Claude Code Assistant

功能:
- 根据尺寸和形状自动分类提取的精灵图
- 将精灵分为: 树木(trees)、灌木(bushes)、树干(stumps)
- 复制分类后的素材到游戏资源目录
"""

import os
import shutil
from pathlib import Path
from PIL import Image
import argparse


class SpriteClassifier:
    """精灵图分类器"""

    # 分类阈值
    TREE_MIN_AREA = 3000        # 树木最小面积
    TREE_MIN_HEIGHT = 60        # 树木最小高度
    TREE_MIN_ASPECT = 0.5       # 树木最小宽高比 (width/height)

    BUSH_MAX_HEIGHT = 80        # 灌木最大高度
    BUSH_MIN_AREA = 500         # 灌木最小面积
    BUSH_MIN_ASPECT = 0.6       # 灌木最小宽高比 (偏圆形)

    STUMP_MAX_HEIGHT = 50       # 树干最大高度
    STUMP_MAX_ASPECT = 0.8      # 树干最大宽高比 (偏窄)

    def __init__(self):
        self.categories = {
            'trees': [],      # 完整的树木 (障碍物)
            'bushes': [],     # 灌木/草 (装饰/树冠)
            'stumps': [],     # 树干/木桩 (小障碍物)
            'unknown': []     # 未分类
        }

    def analyze_sprite(self, image_path):
        """分析单个精灵图的属性"""
        try:
            img = Image.open(image_path)

            # 确保有Alpha通道
            if img.mode != 'RGBA':
                img = img.convert('RGBA')

            width, height = img.size

            # 计算实际内容区域（非透明像素）
            pixels = img.load()
            min_x, min_y = width, height
            max_x, max_y = 0, 0
            pixel_count = 0

            for y in range(height):
                for x in range(width):
                    if pixels[x, y][3] > 10:  # Alpha > 10
                        min_x = min(min_x, x)
                        min_y = min(min_y, y)
                        max_x = max(max_x, x)
                        max_y = max(max_y, y)
                        pixel_count += 1

            if pixel_count == 0:
                return None

            content_width = max_x - min_x + 1
            content_height = max_y - min_y + 1
            aspect_ratio = content_width / content_height if content_height > 0 else 0

            return {
                'path': image_path,
                'filename': os.path.basename(image_path),
                'width': content_width,
                'height': content_height,
                'area': pixel_count,
                'aspect_ratio': aspect_ratio,
                'bbox': (min_x, min_y, max_x, max_y)
            }
        except Exception as e:
            print(f"分析失败 {image_path}: {e}")
            return None

    def classify_sprite(self, info):
        """根据属性分类精灵图"""
        if info is None:
            return 'unknown'

        height = info['height']
        area = info['area']
        aspect = info['aspect_ratio']

        # 树干/木桩: 小而窄
        if height < self.STUMP_MAX_HEIGHT and aspect < self.STUMP_MAX_ASPECT and area < 2000:
            return 'stumps'

        # 灌木/草: 矮而宽（圆形）
        if height < self.BUSH_MAX_HEIGHT and aspect > self.BUSH_MIN_ASPECT and area > self.BUSH_MIN_AREA:
            if area < self.TREE_MIN_AREA:
                return 'bushes'

        # 树木: 大型，有高度
        if area >= self.TREE_MIN_AREA and height >= self.TREE_MIN_HEIGHT:
            return 'trees'

        # 较小但有高度的可能是小树
        if height >= 50 and area >= 1500:
            return 'trees'

        # 小型圆形物体归类为灌木
        if aspect > 0.7 and area >= self.BUSH_MIN_AREA:
            return 'bushes'

        return 'unknown'

    def process_directory(self, input_dir):
        """处理目录中的所有精灵图"""
        input_path = Path(input_dir)

        if not input_path.exists():
            print(f"目录不存在: {input_dir}")
            return

        # 获取所有PNG文件
        png_files = sorted(input_path.glob("*.png"))

        print(f"找到 {len(png_files)} 个精灵图")
        print("-" * 50)

        for png_file in png_files:
            info = self.analyze_sprite(str(png_file))
            if info:
                category = self.classify_sprite(info)
                info['category'] = category
                self.categories[category].append(info)

                print(f"{info['filename']:30} -> {category:10} "
                      f"({info['width']}x{info['height']}, area={info['area']:,})")

        print("-" * 50)
        print(f"\n分类统计:")
        for cat, items in self.categories.items():
            print(f"  {cat}: {len(items)} 个")

    def copy_to_game_assets(self, output_base_dir, prefix=""):
        """将分类后的素材复制到游戏资源目录"""
        output_base = Path(output_base_dir)

        # 创建子目录
        dirs = {
            'trees': output_base / 'trees',
            'bushes': output_base / 'bushes',
            'stumps': output_base / 'stumps'
        }

        for dir_path in dirs.values():
            dir_path.mkdir(parents=True, exist_ok=True)

        copied = {'trees': 0, 'bushes': 0, 'stumps': 0}

        for category, items in self.categories.items():
            if category == 'unknown':
                continue

            for i, info in enumerate(items):
                src = info['path']
                new_name = f"{prefix}{category[:-1]}_{i:02d}.png"  # tree_00.png
                dst = dirs[category] / new_name

                shutil.copy2(src, dst)
                copied[category] += 1
                print(f"复制: {info['filename']} -> {dst}")

        print(f"\n复制完成:")
        for cat, count in copied.items():
            print(f"  {cat}: {count} 个")

        return copied

    def export_classification_report(self, output_file):
        """导出分类报告"""
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("# 精灵图分类报告\n\n")

            for category, items in self.categories.items():
                f.write(f"## {category.upper()} ({len(items)} 个)\n\n")

                if items:
                    f.write("| 文件名 | 尺寸 | 面积 | 宽高比 |\n")
                    f.write("|--------|------|------|--------|\n")

                    for info in items:
                        f.write(f"| {info['filename']} | "
                               f"{info['width']}x{info['height']} | "
                               f"{info['area']:,} | "
                               f"{info['aspect_ratio']:.2f} |\n")

                f.write("\n")

        print(f"报告已保存: {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description='精灵图分类器 - 自动分类树木、灌木、树干',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 分析并分类
  python sprite_classifier.py -i extracted/trees_sam2

  # 分类并复制到游戏资源目录
  python sprite_classifier.py -i extracted/trees_sam2 -o assets/environment --copy

  # 导出报告
  python sprite_classifier.py -i extracted/trees_sam2 --report classification.md
        """
    )

    parser.add_argument('-i', '--input', required=True, help='输入目录（包含提取的精灵图）')
    parser.add_argument('-o', '--output', help='输出目录（游戏资源目录）')
    parser.add_argument('--copy', action='store_true', help='复制分类后的素材到输出目录')
    parser.add_argument('--prefix', default='green_', help='文件名前缀 (默认: green_)')
    parser.add_argument('--report', help='导出分类报告文件')

    args = parser.parse_args()

    classifier = SpriteClassifier()
    classifier.process_directory(args.input)

    if args.copy and args.output:
        classifier.copy_to_game_assets(args.output, prefix=args.prefix)

    if args.report:
        classifier.export_classification_report(args.report)


if __name__ == '__main__':
    main()
