"""
Generate PWA icons for PagePause app with book + clock design
"""
from PIL import Image, ImageDraw
import os

# Create icons directory if it doesn't exist
os.makedirs('icons', exist_ok=True)

# Define sizes
sizes = [72, 96, 128, 144, 152, 192, 384, 512]
maskable_sizes = [192, 512]

def draw_book_icon(draw, size, is_maskable=False):
    """Draw book with clock badge icon"""
    # Scale factor
    scale = size / 48
    padding = size * 0.2 if is_maskable else 0
    offset = padding / 2
    actual_size = size - padding
    inner_scale = actual_size / 48
    
    # Colors
    bg_color = (26, 77, 62)  # --primary-color
    book_color = (74, 157, 127)  # --secondary-color
    clock_color = (255, 152, 0)  # --warning (orange)
    white = (255, 255, 255)
    
    # Background
    if is_maskable:
        draw.rectangle([0, 0, size, size], fill=bg_color)
    else:
        # Rounded rectangle background
        draw.rounded_rectangle([0, 0, size, size], radius=size*0.15, fill=bg_color)
    
    # Helper function to scale coordinates
    def s(coord):
        return coord * inner_scale + offset
    
    # Draw open book
    # Left page
    left_page = [
        (s(4), s(12)),
        (s(4), s(36)),
        (s(8), s(32)),
        (s(14), s(32)),
        (s(20), s(36)),
        (s(24), s(36)),
        (s(24), s(12)),
        (s(20), s(8)),
        (s(14), s(8)),
        (s(8), s(12))
    ]
    draw.polygon(left_page, fill=book_color, outline=white, width=max(1, int(2*inner_scale)))
    
    # Right page
    right_page = [
        (s(24), s(12)),
        (s(24), s(36)),
        (s(28), s(32)),
        (s(34), s(32)),
        (s(40), s(36)),
        (s(44), s(36)),
        (s(44), s(12)),
        (s(40), s(8)),
        (s(34), s(8)),
        (s(28), s(12))
    ]
    draw.polygon(right_page, fill=book_color, outline=white, width=max(1, int(2*inner_scale)))
    
    # Center spine
    draw.line([(s(24), s(12)), (s(24), s(36))], fill=white, width=max(1, int(2*inner_scale)))
    
    # Page lines (left)
    for y in [18, 22, 26]:
        draw.line([(s(8), s(y)), (s(20), s(y))], fill=white, width=max(1, int(inner_scale)))
    
    # Page lines (right)
    for y in [18, 22, 26]:
        draw.line([(s(28), s(y)), (s(40), s(y))], fill=white, width=max(1, int(inner_scale)))
    
    # Clock badge (circle)
    clock_radius = s(7)
    clock_center = (s(38), s(10))
    draw.ellipse(
        [clock_center[0] - clock_radius, clock_center[1] - clock_radius,
         clock_center[0] + clock_radius, clock_center[1] + clock_radius],
        fill=clock_color,
        outline=white,
        width=max(1, int(2*inner_scale))
    )
    
    # Clock hands
    # Minute hand (vertical)
    draw.line([clock_center, (clock_center[0], clock_center[1] - s(4))], 
              fill=white, width=max(2, int(2*inner_scale)))
    # Hour hand (horizontal)
    draw.line([clock_center, (clock_center[0] + s(3), clock_center[1])], 
              fill=white, width=max(2, int(2*inner_scale)))
    
    # Clock center dot
    dot_radius = max(1, s(1))
    draw.ellipse(
        [clock_center[0] - dot_radius, clock_center[1] - dot_radius,
         clock_center[0] + dot_radius, clock_center[1] + dot_radius],
        fill=white
    )

# Generate regular icons
for size in sizes:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_book_icon(draw, size, is_maskable=False)
    filename = f'icons/icon-{size}.png'
    img.save(filename)
    print(f'✓ Created {filename}')

# Generate maskable icons
for size in maskable_sizes:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_book_icon(draw, size, is_maskable=True)
    filename = f'icons/icon-maskable-{size}.png'
    img.save(filename)
    print(f'✓ Created {filename}')

print(f'\n✅ Successfully generated {len(sizes) + len(maskable_sizes)} icons!')
