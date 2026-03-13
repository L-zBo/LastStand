"""
Re-extract weapons and items from PNG/工具武器.png with CORRECT grid coordinates.

Actual grid: 4 rows x 11 columns = 44 cells
(Codex wrongly assumed 6 rows x 10 columns with cell size 18px)

Row pixel ranges: [(9,37), (39,67), (69,97), (99,126)]
Col pixel ranges: [(8,36), (38,66), (68,95), (98,126), (128,156),
                   (158,186), (188,216), (218,246), (248,276), (278,306), (308,336)]
"""

import os
import sys
from PIL import Image
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'PNG', '工具武器.png')

# Background color to remove (RGB 104, 101, 87)
BG_COLOR = np.array([104, 101, 87])
TOLERANCE = 15

# Actual grid coordinates (measured from sprite sheet analysis)
ROW_RANGES = [(9, 37), (39, 67), (69, 97), (99, 126)]
COL_RANGES = [
    (8, 36), (38, 66), (68, 95), (98, 126), (128, 156),
    (158, 186), (188, 216), (218, 246), (248, 276), (278, 306), (308, 336)
]

SCALE = 4  # 4x nearest-neighbor upscale


def extract_cell(img_array, row, col):
    """Extract a single cell from the sprite sheet."""
    y1, y2 = ROW_RANGES[row]
    x1, x2 = COL_RANGES[col]
    return img_array[y1:y2+1, x1:x2+1].copy()


def remove_background(cell):
    """Remove background color, replacing with transparent."""
    rgb = cell[:, :, :3]
    diff = np.abs(rgb.astype(int) - BG_COLOR.astype(int))
    is_bg = np.all(diff < TOLERANCE, axis=2)

    # Create RGBA
    h, w = cell.shape[:2]
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, :3] = rgb
    rgba[:, :, 3] = 255
    rgba[is_bg, 3] = 0  # transparent where background
    rgba[is_bg, :3] = 0

    return rgba


def trim_transparent(rgba):
    """Trim transparent borders."""
    alpha = rgba[:, :, 3]
    rows = np.any(alpha > 0, axis=1)
    cols = np.any(alpha > 0, axis=0)

    if not np.any(rows) or not np.any(cols):
        return rgba  # all transparent, return as-is

    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]

    return rgba[rmin:rmax+1, cmin:cmax+1]


def scale_nearest(rgba, factor):
    """Scale up with nearest-neighbor interpolation."""
    img = Image.fromarray(rgba, 'RGBA')
    new_size = (img.width * factor, img.height * factor)
    return img.resize(new_size, Image.NEAREST)


def save_sprite(img_array, row, col, output_path):
    """Extract, clean, and save a sprite from given cell."""
    cell = extract_cell(img_array, row, col)
    rgba = remove_background(cell)
    trimmed = trim_transparent(rgba)
    scaled = scale_nearest(trimmed, SCALE)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    scaled.save(output_path)
    return True


# ============================================================
# MAPPING: game asset name -> (row, col) in actual 4x11 grid
# ============================================================

# Weapons -> assets/weapons/
WEAPON_MAP = {
    # Melee
    'dagger':         (1, 1),   # Silver blade
    'sword':          (1, 1),   # Silver blade (shared)
    'holyBlade':      (1, 1),   # Silver blade (shared)
    'axe':            (2, 1),   # Orange-handled axe
    'shadowBlade':    (3, 3),   # Gray hatchet
    'bloodAxe':       (3, 4),   # Battle axe
    'hammer':         (3, 0),   # Hammer
    'spear':          (3, 1),   # Long-handled tool
    'scythe':         (2, 6),   # Curved pickaxe
    'katana':         (1, 1),   # Silver blade (shared)
    # Staves
    'staff':          (3, 2),   # Long tool/staff
    'arcaneStaff':    (3, 2),   # Shared with staff
    'fireball':       (2, 5),   # Orange orb
    'inferno':        (2, 5),   # Orange orb (shared)
    'iceStaff':       (2, 4),   # Blue item
    'lightningStaff': (1, 3),   # Star shape
    'necroStaff':     (3, 2),   # Shared with staff
    # Ranged
    'bow':            (2, 10),  # Orange wedge/arrow
    'phoenixBow':     (2, 10),  # Shared
    'crossbow':       (2, 10),  # Shared
    'longbow':        (2, 10),  # Shared
    # Special
    'wand':           (2, 3),   # Wand-like tool
    'scepter':        (1, 3),   # Star/scepter
    'orb':            (2, 0),   # Stone orb
    'tome':           (1, 7),   # Book
    'whip':           (2, 2),   # Flexible tool
}

# Items -> assets/items/
ITEM_MAP = {
    # Potions
    'healthPotion':   (1, 6),   # Orange potion vessel
    'manaPotion':     (1, 6),   # Shared
    'speedPotion':    (1, 6),   # Shared
    'strengthPotion': (3, 5),   # Different item for variety
    'poisonPotion':   (1, 6),   # Shared
    # Gems
    'ruby':           (0, 8),   # Red/orange round gem
    'emerald':        (0, 7),   # Green gem
    'sapphire':       (2, 9),   # Blue diamond
    'diamond':        (2, 9),   # Blue diamond (shared)
    'amethyst':       (2, 7),   # Pink orb
    'topaz':          (2, 5),   # Orange sphere
    # Currency
    'coin':           (1, 9),   # Orange cube/coin
    'coinBag':        (1, 10),  # Money bag
    'goldBar':        (0, 4),   # Gold rectangular block
    # Keys & Scrolls
    'key':            (0, 2),   # Metallic key shape
    'goldenKey':      (0, 2),   # Shared
    'scroll':         (0, 1),   # Brown scroll
    'magicScroll':    (3, 7),   # Golden page
    # Equipment
    'shield':         (1, 4),   # Gray shield/book shape
    'helmet':         (3, 6),   # Bucket/helmet
    'ring':           (1, 3),   # Star/ring shape
    'necklace':       (3, 9),   # Large pink orb
    'amulet':         (1, 3),   # Star shape (shared with ring)
    'gloves':         (3, 8),   # Orange gloves
    'boots':          (0, 5),   # Gray block
    'armor':          (0, 5),   # Gray block (shared)
    'cape':           (0, 6),   # Green leaf/cape
    # Other items
    'bomb':           (1, 2),   # Dark bomb
    'torch':          (0, 3),   # Orange torch
    'map':            (1, 5),   # Orange layered item
    'compass':        (0, 2),   # Metallic shape (shared with key)
    'hourglass':      (1, 8),   # Hourglass
    'crystal':        (0, 9),   # Green crystal
    'skull':          (1, 0),   # White skull/round
    'heart':          (0, 10),  # Orange round gem
    'feather':        (2, 8),   # Golden feather
    'bone':           (0, 0),   # White bone
}


def main():
    if not os.path.exists(SRC):
        print(f"ERROR: Source file not found: {SRC}")
        sys.exit(1)

    img = Image.open(SRC).convert('RGB')
    img_array = np.array(img)
    print(f"Source image: {img.width}x{img.height}")
    print(f"Grid: {len(ROW_RANGES)} rows x {len(COL_RANGES)} cols = {len(ROW_RANGES)*len(COL_RANGES)} cells")
    print()

    weapons_dir = os.path.join(ROOT, 'assets', 'weapons')
    items_dir = os.path.join(ROOT, 'assets', 'items')

    # Extract weapons
    print(f"Extracting {len(WEAPON_MAP)} weapons...")
    ok = 0
    for name, (row, col) in WEAPON_MAP.items():
        out = os.path.join(weapons_dir, f'{name}.png')
        try:
            save_sprite(img_array, row, col, out)
            print(f"  OK  {name} <- cell ({row},{col})")
            ok += 1
        except Exception as e:
            print(f"  ERR {name}: {e}")
    print(f"  Done: {ok}/{len(WEAPON_MAP)}\n")

    # Extract items
    print(f"Extracting {len(ITEM_MAP)} items...")
    ok2 = 0
    for name, (row, col) in ITEM_MAP.items():
        out = os.path.join(items_dir, f'{name}.png')
        try:
            save_sprite(img_array, row, col, out)
            print(f"  OK  {name} <- cell ({row},{col})")
            ok2 += 1
        except Exception as e:
            print(f"  ERR {name}: {e}")
    print(f"  Done: {ok2}/{len(ITEM_MAP)}\n")

    print("=" * 40)
    print(f"Total: {ok + ok2}/{len(WEAPON_MAP) + len(ITEM_MAP)} sprites extracted")
    print("=" * 40)


if __name__ == '__main__':
    main()
