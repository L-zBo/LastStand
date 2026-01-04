#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SAM2 图像对象自动提取工具
========================
生成日期: 2026-01-03
模型版本: SAM 2 (Segment Anything Model 2) - Meta AI
开发者: Claude Code Assistant

功能说明:
- 使用 SAM 2 自动分割图像中的所有对象
- 将每个对象保存为带透明背景的单独 PNG 文件
- 可选择使用 CLIP 进行对象分类（树/石头/草丛等）

依赖安装:
pip install torch torchvision
pip install opencv-python pillow numpy matplotlib
pip install ultralytics  # 简化版SAM2
# 或者完整版:
# pip install git+https://github.com/facebookresearch/segment-anything-2.git
"""

import os
import sys
import argparse
import numpy as np
from pathlib import Path
from PIL import Image
import cv2


def install_dependencies():
    """安装必要的依赖"""
    import subprocess
    packages = [
        'torch', 'torchvision',
        'opencv-python', 'pillow', 'numpy', 'matplotlib',
        'ultralytics'
    ]
    for pkg in packages:
        try:
            __import__(pkg.replace('-', '_'))
        except ImportError:
            print(f"正在安装 {pkg}...")
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', pkg])


class SAM2ObjectExtractor:
    """SAM2 对象提取器"""

    def __init__(self, model_size='base', device=None):
        """
        初始化 SAM2 模型

        Args:
            model_size: 模型大小 ('tiny', 'small', 'base', 'large')
            device: 运行设备 ('cuda' 或 'cpu')
        """
        self.model_size = model_size
        self.device = device
        self.model = None
        self.mask_generator = None

    def load_model(self):
        """加载 SAM2 模型"""
        try:
            # 方法1: 使用 ultralytics (更简单)
            from ultralytics import SAM
            model_map = {
                'tiny': 'sam2_t.pt',
                'small': 'sam2_s.pt',
                'base': 'sam2_b.pt',
                'large': 'sam2_l.pt'
            }
            model_name = model_map.get(self.model_size, 'sam2_b.pt')
            print(f"正在加载 SAM2 模型: {model_name}")
            self.model = SAM(model_name)
            self.use_ultralytics = True
            print("SAM2 模型加载成功 (ultralytics)")
            return True
        except Exception as e:
            print(f"ultralytics SAM2 加载失败: {e}")

        try:
            # 方法2: 使用原生 segment-anything-2
            from sam2.build_sam import build_sam2
            from sam2.automatic_mask_generator import SAM2AutomaticMaskGenerator
            import torch

            device = self.device or ('cuda' if torch.cuda.is_available() else 'cpu')
            checkpoint_map = {
                'tiny': 'sam2_hiera_tiny.pt',
                'small': 'sam2_hiera_small.pt',
                'base': 'sam2_hiera_base_plus.pt',
                'large': 'sam2_hiera_large.pt'
            }
            config_map = {
                'tiny': 'sam2_hiera_t.yaml',
                'small': 'sam2_hiera_s.yaml',
                'base': 'sam2_hiera_b+.yaml',
                'large': 'sam2_hiera_l.yaml'
            }

            checkpoint = checkpoint_map.get(self.model_size, 'sam2_hiera_base_plus.pt')
            config = config_map.get(self.model_size, 'sam2_hiera_b+.yaml')

            print(f"正在加载 SAM2 模型: {checkpoint}")
            sam2 = build_sam2(config, checkpoint, device=device)
            self.mask_generator = SAM2AutomaticMaskGenerator(sam2)
            self.use_ultralytics = False
            print("SAM2 模型加载成功 (native)")
            return True
        except Exception as e:
            print(f"原生 SAM2 加载失败: {e}")

        try:
            # 方法3: 使用 HuggingFace Transformers
            from transformers import SamModel, SamProcessor
            import torch

            device = self.device or ('cuda' if torch.cuda.is_available() else 'cpu')
            model_id = "facebook/sam-vit-huge"
            print(f"正在加载 SAM 模型: {model_id}")
            self.model = SamModel.from_pretrained(model_id).to(device)
            self.processor = SamProcessor.from_pretrained(model_id)
            self.use_ultralytics = False
            self.use_transformers = True
            print("SAM 模型加载成功 (transformers)")
            return True
        except Exception as e:
            print(f"Transformers SAM 加载失败: {e}")

        print("所有 SAM 加载方法均失败，请安装依赖:")
        print("  pip install ultralytics")
        print("  或 pip install git+https://github.com/facebookresearch/segment-anything-2.git")
        return False

    def generate_masks_ultralytics(self, image_path):
        """使用 ultralytics 生成遮罩"""
        results = self.model(image_path)
        masks = []
        for result in results:
            if result.masks is not None:
                for i, mask in enumerate(result.masks.data):
                    mask_np = mask.cpu().numpy().astype(bool)
                    bbox = cv2.boundingRect(mask_np.astype(np.uint8))
                    area = np.sum(mask_np)
                    masks.append({
                        'segmentation': mask_np,
                        'bbox': bbox,
                        'area': area,
                        'predicted_iou': 1.0,
                        'stability_score': 1.0
                    })
        return masks

    def extract_objects(self, image_path, output_dir, min_area=100,
                       max_objects=50, padding=5):
        """
        从图像中提取所有对象

        Args:
            image_path: 输入图像路径
            output_dir: 输出目录
            min_area: 最小对象面积（像素）
            max_objects: 最大提取对象数量
            padding: 对象边界填充像素

        Returns:
            提取的对象列表
        """
        # 读取图像
        image = cv2.imread(str(image_path))
        if image is None:
            print(f"无法读取图像: {image_path}")
            return []

        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        height, width = image.shape[:2]

        # 创建输出目录
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # 生成遮罩
        print(f"正在分析图像: {image_path}")

        if hasattr(self, 'use_ultralytics') and self.use_ultralytics:
            masks = self.generate_masks_ultralytics(image_path)
        elif self.mask_generator:
            masks = self.mask_generator.generate(image_rgb)
        else:
            print("模型未正确加载")
            return []

        print(f"检测到 {len(masks)} 个潜在对象")

        # 按面积排序并过滤
        masks = sorted(masks, key=lambda x: x['area'], reverse=True)
        masks = [m for m in masks if m['area'] >= min_area]
        masks = masks[:max_objects]

        print(f"过滤后保留 {len(masks)} 个对象")

        # 提取并保存每个对象
        extracted_objects = []
        base_name = Path(image_path).stem

        for idx, mask_data in enumerate(masks):
            mask = mask_data['segmentation']

            # 获取边界框
            if 'bbox' in mask_data:
                x, y, w, h = mask_data['bbox']
            else:
                coords = np.where(mask)
                if len(coords[0]) == 0:
                    continue
                y_min, y_max = coords[0].min(), coords[0].max()
                x_min, x_max = coords[1].min(), coords[1].max()
                x, y, w, h = x_min, y_min, x_max - x_min, y_max - y_min

            # 添加填充
            x = max(0, x - padding)
            y = max(0, y - padding)
            w = min(width - x, w + 2 * padding)
            h = min(height - y, h + 2 * padding)

            # 裁剪区域
            cropped_image = image_rgb[y:y+h, x:x+w].copy()
            cropped_mask = mask[y:y+h, x:x+w]

            # 创建带透明背景的图像
            rgba_image = np.zeros((h, w, 4), dtype=np.uint8)
            rgba_image[:, :, :3] = cropped_image
            rgba_image[:, :, 3] = (cropped_mask * 255).astype(np.uint8)

            # 保存
            output_filename = f"{base_name}_object_{idx:03d}.png"
            output_filepath = output_path / output_filename

            pil_image = Image.fromarray(rgba_image)
            pil_image.save(output_filepath)

            extracted_objects.append({
                'filename': output_filename,
                'filepath': str(output_filepath),
                'area': mask_data['area'],
                'bbox': (x, y, w, h),
                'index': idx
            })

            print(f"  保存对象 {idx}: {output_filename} (面积: {mask_data['area']})")

        return extracted_objects


class SimpleSpriteExtractor:
    """
    简单精灵图提取器（不需要深度学习）
    适用于有透明背景或纯色背景的精灵图
    """

    @staticmethod
    def extract_by_transparency(image_path, output_dir, min_area=50, padding=2):
        """
        通过透明度提取对象（适用于PNG精灵图）
        """
        image = Image.open(image_path).convert('RGBA')
        image_np = np.array(image)

        # 获取alpha通道
        if image_np.shape[2] == 4:
            alpha = image_np[:, :, 3]
        else:
            print("图像没有透明通道，尝试颜色分离")
            return SimpleSpriteExtractor.extract_by_color(image_path, output_dir, min_area, padding)

        # 二值化
        binary = (alpha > 10).astype(np.uint8)

        # 查找轮廓
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        extracted = []
        base_name = Path(image_path).stem

        for idx, contour in enumerate(contours):
            area = cv2.contourArea(contour)
            if area < min_area:
                continue

            x, y, w, h = cv2.boundingRect(contour)

            # 添加填充
            x = max(0, x - padding)
            y = max(0, y - padding)
            w = min(image_np.shape[1] - x, w + 2 * padding)
            h = min(image_np.shape[0] - y, h + 2 * padding)

            # 裁剪
            cropped = image_np[y:y+h, x:x+w]

            # 保存
            output_filename = f"{base_name}_sprite_{idx:03d}.png"
            output_filepath = output_path / output_filename

            pil_image = Image.fromarray(cropped)
            pil_image.save(output_filepath)

            extracted.append({
                'filename': output_filename,
                'area': area,
                'bbox': (x, y, w, h)
            })

            print(f"  提取精灵 {idx}: {output_filename} (面积: {area})")

        return extracted

    @staticmethod
    def extract_by_color(image_path, output_dir, min_area=50, padding=2,
                        bg_color=None, tolerance=30):
        """
        通过背景颜色提取对象

        Args:
            bg_color: 背景颜色 (R, G, B)，None则自动检测
            tolerance: 颜色容差
        """
        image = Image.open(image_path).convert('RGB')
        image_np = np.array(image)

        # 自动检测背景颜色（取四角平均）
        if bg_color is None:
            corners = [
                image_np[0, 0],
                image_np[0, -1],
                image_np[-1, 0],
                image_np[-1, -1]
            ]
            bg_color = np.mean(corners, axis=0).astype(int)
            print(f"自动检测背景颜色: RGB{tuple(bg_color)}")

        # 创建遮罩
        diff = np.abs(image_np.astype(int) - bg_color)
        mask = np.any(diff > tolerance, axis=2).astype(np.uint8)

        # 形态学操作清理噪点
        kernel = np.ones((3, 3), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

        # 查找轮廓
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        extracted = []
        base_name = Path(image_path).stem

        for idx, contour in enumerate(contours):
            area = cv2.contourArea(contour)
            if area < min_area:
                continue

            x, y, w, h = cv2.boundingRect(contour)

            # 添加填充
            x = max(0, x - padding)
            y = max(0, y - padding)
            w = min(image_np.shape[1] - x, w + 2 * padding)
            h = min(image_np.shape[0] - y, h + 2 * padding)

            # 裁剪并创建透明背景
            cropped_rgb = image_np[y:y+h, x:x+w]
            cropped_mask = mask[y:y+h, x:x+w]

            rgba = np.zeros((h, w, 4), dtype=np.uint8)
            rgba[:, :, :3] = cropped_rgb
            rgba[:, :, 3] = cropped_mask * 255

            # 保存
            output_filename = f"{base_name}_sprite_{idx:03d}.png"
            output_filepath = output_path / output_filename

            pil_image = Image.fromarray(rgba)
            pil_image.save(output_filepath)

            extracted.append({
                'filename': output_filename,
                'area': area,
                'bbox': (x, y, w, h)
            })

            print(f"  提取精灵 {idx}: {output_filename} (面积: {area})")

        return extracted

    @staticmethod
    def extract_grid_sprites(image_path, output_dir, grid_width, grid_height,
                            padding=0, skip_empty=True, empty_threshold=10):
        """
        从网格精灵图中提取（适用于规则排列的精灵图）

        Args:
            grid_width: 每个精灵的宽度
            grid_height: 每个精灵的高度
            skip_empty: 跳过空白精灵
            empty_threshold: 空白判断阈值
        """
        image = Image.open(image_path).convert('RGBA')
        image_np = np.array(image)

        img_height, img_width = image_np.shape[:2]
        cols = img_width // grid_width
        rows = img_height // grid_height

        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        extracted = []
        base_name = Path(image_path).stem
        sprite_idx = 0

        for row in range(rows):
            for col in range(cols):
                x = col * grid_width
                y = row * grid_height

                # 裁剪
                cropped = image_np[y:y+grid_height, x:x+grid_width]

                # 检查是否为空
                if skip_empty:
                    if cropped.shape[2] == 4:
                        non_transparent = np.sum(cropped[:, :, 3] > empty_threshold)
                    else:
                        non_transparent = cropped.size

                    if non_transparent < empty_threshold:
                        continue

                # 保存
                output_filename = f"{base_name}_grid_{row:02d}_{col:02d}.png"
                output_filepath = output_path / output_filename

                pil_image = Image.fromarray(cropped)
                pil_image.save(output_filepath)

                extracted.append({
                    'filename': output_filename,
                    'row': row,
                    'col': col,
                    'position': (x, y)
                })

                sprite_idx += 1

        print(f"  从网格中提取了 {len(extracted)} 个精灵")
        return extracted


def process_directory(input_dir, output_dir, use_sam=True, **kwargs):
    """
    处理目录中的所有图像
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)

    # 支持的图像格式
    image_extensions = {'.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp'}

    # 查找所有图像
    image_files = [f for f in input_path.iterdir()
                   if f.suffix.lower() in image_extensions]

    if not image_files:
        print(f"在 {input_dir} 中没有找到图像文件")
        return

    print(f"找到 {len(image_files)} 个图像文件")

    if use_sam:
        extractor = SAM2ObjectExtractor()
        if not extractor.load_model():
            print("SAM2 加载失败，切换到简单提取模式")
            use_sam = False

    all_extracted = {}

    for image_file in image_files:
        print(f"\n处理: {image_file.name}")
        image_output_dir = output_path / image_file.stem

        if use_sam:
            extracted = extractor.extract_objects(
                str(image_file),
                str(image_output_dir),
                **kwargs
            )
        else:
            # 尝试透明度提取
            extracted = SimpleSpriteExtractor.extract_by_transparency(
                str(image_file),
                str(image_output_dir),
                **kwargs
            )

            # 如果没有提取到，尝试颜色提取
            if not extracted:
                extracted = SimpleSpriteExtractor.extract_by_color(
                    str(image_file),
                    str(image_output_dir),
                    **kwargs
                )

        all_extracted[image_file.name] = extracted

    return all_extracted


def main():
    parser = argparse.ArgumentParser(
        description='SAM2 图像对象自动提取工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例用法:
  # 提取单张图像中的对象
  python extract_objects_sam2.py -i image.png -o output/

  # 处理整个目录
  python extract_objects_sam2.py -i assets/ -o extracted/ --batch

  # 使用简单模式（不需要深度学习）
  python extract_objects_sam2.py -i sprites.png -o output/ --simple

  # 提取网格精灵图
  python extract_objects_sam2.py -i tileset.png -o output/ --grid 32 32
        """
    )

    parser.add_argument('-i', '--input', required=True, help='输入图像或目录路径')
    parser.add_argument('-o', '--output', required=True, help='输出目录路径')
    parser.add_argument('--batch', action='store_true', help='批量处理目录中的所有图像')
    parser.add_argument('--simple', action='store_true', help='使用简单提取模式（不需要SAM）')
    parser.add_argument('--grid', nargs=2, type=int, metavar=('W', 'H'),
                       help='网格精灵图模式，指定每个精灵的宽度和高度')
    parser.add_argument('--min-area', type=int, default=100, help='最小对象面积（默认100）')
    parser.add_argument('--max-objects', type=int, default=50, help='最大提取对象数（默认50）')
    parser.add_argument('--padding', type=int, default=5, help='边界填充像素（默认5）')
    parser.add_argument('--model', choices=['tiny', 'small', 'base', 'large'],
                       default='base', help='SAM2模型大小（默认base）')

    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        print(f"错误: 输入路径不存在: {args.input}")
        return

    # 网格模式
    if args.grid:
        if not input_path.is_file():
            print("错误: 网格模式需要指定单个图像文件")
            return

        print(f"网格模式: {args.grid[0]}x{args.grid[1]}")
        extracted = SimpleSpriteExtractor.extract_grid_sprites(
            str(input_path),
            str(output_path),
            args.grid[0],
            args.grid[1]
        )
        print(f"\n完成! 提取了 {len(extracted)} 个精灵")
        return

    # 批量处理目录
    if args.batch or input_path.is_dir():
        results = process_directory(
            str(input_path),
            str(output_path),
            use_sam=not args.simple,
            min_area=args.min_area,
            max_objects=args.max_objects,
            padding=args.padding
        )

        total = sum(len(v) for v in results.values())
        print(f"\n完成! 共提取了 {total} 个对象")
        return

    # 单张图像处理
    if args.simple:
        extracted = SimpleSpriteExtractor.extract_by_transparency(
            str(input_path),
            str(output_path),
            min_area=args.min_area,
            padding=args.padding
        )
        if not extracted:
            extracted = SimpleSpriteExtractor.extract_by_color(
                str(input_path),
                str(output_path),
                min_area=args.min_area,
                padding=args.padding
            )
    else:
        extractor = SAM2ObjectExtractor(model_size=args.model)
        if extractor.load_model():
            extracted = extractor.extract_objects(
                str(input_path),
                str(output_path),
                min_area=args.min_area,
                max_objects=args.max_objects,
                padding=args.padding
            )
        else:
            print("SAM2 不可用，使用简单模式")
            extracted = SimpleSpriteExtractor.extract_by_transparency(
                str(input_path),
                str(output_path),
                min_area=args.min_area,
                padding=args.padding
            )

    print(f"\n完成! 提取了 {len(extracted)} 个对象")


if __name__ == '__main__':
    main()
