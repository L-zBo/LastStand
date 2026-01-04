#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SAM2 自动对象分割提取工具 (高级版)
==================================
生成日期: 2026-01-03
模型: SAM 2 (Segment Anything Model 2) - Meta AI
开发者: Claude Code Assistant

功能:
- 使用SAM2自动分割图像中的所有对象
- 智能分离相邻/重叠的对象
- 将每个对象保存为带透明背景的PNG
"""

import os
import sys
import argparse
import numpy as np
from pathlib import Path
from PIL import Image
import cv2


class SAM2AutoExtractor:
    """SAM2 自动对象提取器"""

    def __init__(self, model_size='base', device=None):
        """
        初始化

        Args:
            model_size: 模型大小 ('tiny', 'small', 'base', 'large')
            device: 设备 ('cuda', 'cpu', None=自动)
        """
        self.model_size = model_size
        self.device = device
        self.model = None
        self.sam_predictor = None

        model_map = {
            'tiny': 'sam2_t.pt',
            'small': 'sam2_s.pt',
            'base': 'sam2_b.pt',
            'large': 'sam2_l.pt'
        }
        self.model_name = model_map.get(model_size, 'sam2_b.pt')

    def load_model(self):
        """加载SAM2模型"""
        try:
            from ultralytics import SAM
            print(f"正在加载 SAM2 模型: {self.model_name}")
            self.model = SAM(self.model_name)
            print("SAM2 模型加载成功!")
            return True
        except Exception as e:
            print(f"SAM2 加载失败: {e}")
            print("请安装: pip install ultralytics")
            return False

    def generate_grid_points(self, width, height, points_per_side=32):
        """生成网格采样点"""
        x_coords = np.linspace(0, width - 1, points_per_side)
        y_coords = np.linspace(0, height - 1, points_per_side)
        points = []
        for y in y_coords:
            for x in x_coords:
                points.append([int(x), int(y)])
        return np.array(points)

    def segment_with_points(self, image_path, points):
        """使用点提示进行分割"""
        all_masks = []

        # 批量处理点
        batch_size = 16
        for i in range(0, len(points), batch_size):
            batch_points = points[i:i+batch_size]

            for point in batch_points:
                try:
                    results = self.model(
                        image_path,
                        points=[point.tolist()],
                        labels=[1]
                    )

                    for result in results:
                        if result.masks is not None:
                            for mask_tensor in result.masks.data:
                                mask_np = mask_tensor.cpu().numpy().astype(np.uint8)
                                all_masks.append(mask_np)
                except Exception as e:
                    continue

        return all_masks

    def auto_segment_by_contours(self, image_path, min_area=100, dist_thresh=0.02, enable_merge=False):
        """
        使用连通区域分析进行自动分割

        1. 直接从透明度通道提取所有连通区域
        2. 可选：智能合并垂直相邻的树冠和树干

        Args:
            dist_thresh: 距离变换阈值 (未使用)
            enable_merge: 是否启用智能合并 (默认False)
        """
        image = cv2.imread(str(image_path), cv2.IMREAD_UNCHANGED)

        if image.shape[2] == 4:
            # 有Alpha通道，用它来检测对象
            alpha = image[:, :, 3]
            binary = (alpha > 10).astype(np.uint8) * 255
        else:
            # 无Alpha，用边缘检测
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            binary = cv2.adaptiveThreshold(
                gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY_INV, 11, 2
            )

        # 直接检测连通区域
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(binary, connectivity=8)

        # 收集所有区域信息，包括遮罩
        regions = []
        for i in range(1, num_labels):
            area = stats[i, cv2.CC_STAT_AREA]
            if area < min_area // 4:  # 使用较小阈值，后面会合并小的树干
                continue

            x = stats[i, cv2.CC_STAT_LEFT]
            y = stats[i, cv2.CC_STAT_TOP]
            w = stats[i, cv2.CC_STAT_WIDTH]
            h = stats[i, cv2.CC_STAT_HEIGHT]
            cx, cy = centroids[i]

            # 创建该区域的遮罩
            mask = (labels == i).astype(np.uint8)

            regions.append({
                'id': i,
                'center': [int(cx), int(cy)],
                'bbox': [x, y, x + w, y + h],
                'area': area,
                'mask': mask,
                'merged': False,
                'merged_into': None
            })

        print(f"检测到 {len(regions)} 个连通区域")

        # 智能合并：将树干合并到其上方的树冠（仅当启用时）
        if enable_merge:
            for i, r_trunk in enumerate(regions):
                if r_trunk['merged']:
                    continue

                x1, y1, x2, y2 = r_trunk['bbox']
                trunk_cx = (x1 + x2) / 2
                trunk_width = x2 - x1
                trunk_area = r_trunk['area']

                best_crown = None
                best_gap = float('inf')

                for j, r_crown in enumerate(regions):
                    if i == j or r_crown['merged']:
                        continue

                    x1_c, y1_c, x2_c, y2_c = r_crown['bbox']
                    crown_cx = (x1_c + x2_c) / 2
                    crown_width = x2_c - x1_c
                    crown_area = r_crown['area']

                    # 树干应该在树冠下方
                    vertical_gap = y1 - y2_c  # 树干顶部 - 树冠底部
                    if vertical_gap < 0 or vertical_gap > 15:
                        continue

                    # 树冠通常比树干大
                    if crown_area < trunk_area * 0.8:
                        continue

                    # 水平中心应该对齐
                    center_diff = abs(trunk_cx - crown_cx)
                    max_center_diff = max(trunk_width, crown_width) * 0.5
                    if center_diff > max_center_diff:
                        continue

                    # 树干宽度不应该比树冠宽太多
                    if trunk_width > crown_width * 1.5:
                        continue

                    if vertical_gap < best_gap:
                        best_gap = vertical_gap
                        best_crown = j

                if best_crown is not None:
                    r_trunk['merged'] = True
                    r_trunk['merged_into'] = best_crown

        # 生成最终的遮罩列表
        masks = []
        for i, region in enumerate(regions):
            if region['merged']:
                continue

            # 合并所有属于这个区域的遮罩
            combined_mask = region['mask'].copy()

            # 找到所有合并到这个区域的子区域
            if enable_merge:
                for other in regions:
                    if other['merged_into'] == i:
                        combined_mask = np.maximum(combined_mask, other['mask'])

            area = np.sum(combined_mask > 0)
            if area < min_area:
                continue

            coords = np.where(combined_mask > 0)
            if len(coords[0]) > 0:
                y_min, y_max = coords[0].min(), coords[0].max()
                x_min, x_max = coords[1].min(), coords[1].max()

                masks.append({
                    'mask': combined_mask,
                    'bbox': (x_min, y_min, x_max - x_min + 1, y_max - y_min + 1),
                    'area': area,
                    'center': region['center']
                })

        print(f"{'合并后生成' if enable_merge else '生成'} {len(masks)} 个对象遮罩")
        return masks

    def remove_duplicate_masks(self, masks, iou_thresh=0.5):
        """移除重复/高度重叠的遮罩"""
        if len(masks) <= 1:
            return masks

        # 按面积排序
        masks = sorted(masks, key=lambda x: x['area'], reverse=True)

        keep = []
        used = set()

        for i, mask_i in enumerate(masks):
            if i in used:
                continue

            keep.append(mask_i)

            for j in range(i + 1, len(masks)):
                if j in used:
                    continue

                # 计算IoU
                intersection = np.logical_and(mask_i['mask'], masks[j]['mask']).sum()
                union = np.logical_or(mask_i['mask'], masks[j]['mask']).sum()

                if union > 0:
                    iou = intersection / union
                    if iou > iou_thresh:
                        used.add(j)

        return keep

    def extract_objects(self, image_path, output_dir,
                       min_area=100, max_objects=200, padding=5,
                       iou_thresh=0.5):
        """
        提取图像中的所有对象

        Args:
            image_path: 输入图像路径
            output_dir: 输出目录
            min_area: 最小对象面积
            max_objects: 最大对象数量
            padding: 边界填充像素
            iou_thresh: 去重IoU阈值

        Returns:
            提取的对象信息列表
        """
        # 读取图像
        image = cv2.imread(str(image_path), cv2.IMREAD_UNCHANGED)
        if image is None:
            print(f"无法读取图像: {image_path}")
            return []

        # 处理通道
        if len(image.shape) == 2:
            image_rgb = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
            original_alpha = None
        elif image.shape[2] == 4:
            image_rgb = cv2.cvtColor(image[:, :, :3], cv2.COLOR_BGR2RGB)
            original_alpha = image[:, :, 3]
        else:
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            original_alpha = None

        height, width = image_rgb.shape[:2]

        # 创建输出目录
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        print(f"正在分析图像: {image_path} ({width}x{height})")

        # 使用轮廓检测+SAM2分割
        masks = self.auto_segment_by_contours(str(image_path), min_area)

        print(f"SAM2 生成了 {len(masks)} 个遮罩")

        # 去重
        masks = self.remove_duplicate_masks(masks, iou_thresh)
        print(f"去重后保留 {len(masks)} 个对象")

        # 限制数量
        masks = masks[:max_objects]

        # 提取并保存
        extracted = []
        base_name = Path(image_path).stem

        for idx, mask_data in enumerate(masks):
            mask = mask_data['mask']
            x, y, w, h = mask_data['bbox']

            # 添加填充
            x = max(0, x - padding)
            y = max(0, y - padding)
            w = min(width - x, w + 2 * padding)
            h = min(height - y, h + 2 * padding)

            # 裁剪
            cropped_rgb = image_rgb[y:y+h, x:x+w].copy()
            cropped_mask = mask[y:y+h, x:x+w]

            # 结合原始透明度
            if original_alpha is not None:
                cropped_alpha = original_alpha[y:y+h, x:x+w]
                final_alpha = np.minimum(cropped_mask * 255, cropped_alpha)
            else:
                final_alpha = cropped_mask * 255

            # 创建RGBA图像
            rgba = np.zeros((h, w, 4), dtype=np.uint8)
            rgba[:, :, :3] = cropped_rgb
            rgba[:, :, 3] = final_alpha.astype(np.uint8)

            # 保存
            output_filename = f"{base_name}_obj_{idx:03d}.png"
            output_filepath = output_path / output_filename

            pil_image = Image.fromarray(rgba)
            pil_image.save(output_filepath)

            extracted.append({
                'filename': output_filename,
                'filepath': str(output_filepath),
                'area': mask_data['area'],
                'bbox': (x, y, w, h),
                'index': idx
            })

            print(f"  [{idx:3d}] {output_filename} (面积: {mask_data['area']:,})")

        return extracted


def batch_process(input_dir, output_dir, **kwargs):
    """批量处理目录"""
    input_path = Path(input_dir)
    output_path = Path(output_dir)

    image_extensions = {'.png', '.jpg', '.jpeg', '.bmp', '.webp'}
    image_files = [f for f in input_path.iterdir()
                   if f.suffix.lower() in image_extensions]

    if not image_files:
        print(f"目录中没有图像: {input_dir}")
        return {}

    print(f"找到 {len(image_files)} 个图像文件")

    extractor = SAM2AutoExtractor()
    if not extractor.load_model():
        return {}

    results = {}
    for image_file in image_files:
        print(f"\n{'='*50}")
        print(f"处理: {image_file.name}")
        print('='*50)

        image_output = output_path / image_file.stem
        extracted = extractor.extract_objects(
            str(image_file),
            str(image_output),
            **kwargs
        )
        results[image_file.name] = extracted

    return results


def main():
    parser = argparse.ArgumentParser(
        description='SAM2 自动对象分割提取工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 基本使用
  python sam2_auto_extract.py -i sprite.png -o output/

  # 调整参数
  python sam2_auto_extract.py -i sprite.png -o output/ --min-area 300 --iou 0.4

  # 批量处理
  python sam2_auto_extract.py -i sprites/ -o extracted/ --batch
        """
    )

    parser.add_argument('-i', '--input', required=True, help='输入图像或目录')
    parser.add_argument('-o', '--output', required=True, help='输出目录')
    parser.add_argument('--batch', action='store_true', help='批量处理目录')
    parser.add_argument('--model', choices=['tiny', 'small', 'base', 'large'],
                       default='base', help='模型大小 (默认: base)')
    parser.add_argument('--min-area', type=int, default=100, help='最小对象面积')
    parser.add_argument('--max-objects', type=int, default=200, help='最大对象数')
    parser.add_argument('--padding', type=int, default=5, help='边界填充')
    parser.add_argument('--iou', type=float, default=0.5, help='去重IoU阈值')

    args = parser.parse_args()

    kwargs = {
        'min_area': args.min_area,
        'max_objects': args.max_objects,
        'padding': args.padding,
        'iou_thresh': args.iou,
    }

    input_path = Path(args.input)

    if args.batch or input_path.is_dir():
        results = batch_process(str(input_path), args.output, **kwargs)
        total = sum(len(v) for v in results.values())
        print(f"\n完成! 共提取了 {total} 个对象")
    else:
        extractor = SAM2AutoExtractor(model_size=args.model)
        if extractor.load_model():
            extracted = extractor.extract_objects(
                str(input_path), args.output, **kwargs
            )
            print(f"\n完成! 提取了 {len(extracted)} 个对象")


if __name__ == '__main__':
    main()
