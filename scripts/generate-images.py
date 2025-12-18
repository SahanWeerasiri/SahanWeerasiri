#!/usr/bin/env python3
"""
Generate images from separate HTML components using imgkit
"""

import os
import sys
from pathlib import Path

# Try to import imgkit
try:
    import imgkit
except ImportError:
    print("Installing imgkit...")
    os.system(f"{sys.executable} -m pip install imgkit")
    import imgkit

def generate_component_images():
    print("📸 Generating component images...")
    
    # Setup paths
    base_dir = Path(__file__).parent.parent
    components_dir = base_dir / 'data' / 'components'
    images_dir = base_dir / 'data' / 'images'
    
    # Create output directory
    images_dir.mkdir(parents=True, exist_ok=True)
    
    # Check if components exist
    component_files = [
        ('profile-header.html', 'profile-header.png', {'width': 800, 'height': 400}),
        ('languages.html', 'languages.png', {'width': 800, 'height': 500}),
        ('github-stats.html', 'github-stats.png', {'width': 1000, 'height': 600})
    ]
    
    # Configure imgkit options
    base_options = {
        'format': 'png',
        'quality': 100,
        'encoding': "UTF-8",
        'enable-local-file-access': None,
        'quiet': ''
    }
    
    success_count = 0
    
    for html_file, image_file, size in component_files:
        html_path = components_dir / html_file
        image_path = images_dir / image_file
        
        if not html_path.exists():
            print(f"   ❌ Component not found: {html_file}")
            continue
        
        try:
            print(f"   Generating {image_file}...")
            
            # Merge options with size
            options = base_options.copy()
            options.update(size)
            
            # Generate image
            imgkit.from_file(
                str(html_path),
                str(image_path),
                options=options
            )
            
            # Verify the image was created
            if image_path.exists():
                file_size = image_path.stat().st_size / 1024  # KB
                print(f"     ✅ Generated: {image_file} ({file_size:.1f} KB)")
                success_count += 1
            else:
                print(f"     ❌ Failed to create: {image_file}")
                
        except Exception as e:
            print(f"     ❌ Error generating {image_file}: {e}")
    
    # Generate a combined image for GitHub stats animation (multiple frames for GIF)
    generate_github_stats_animation(components_dir, images_dir)
    
    print(f"\n✅ Successfully generated {success_count}/3 component images")
    print(f"📁 Location: {images_dir}")
    
    return success_count > 0

def generate_github_stats_animation(components_dir, images_dir):
    """Generate multiple frames for GitHub stats animation"""
    print("\n🎬 Generating GitHub stats animation frames...")
    
    stats_html = components_dir / 'github-stats.html'
    if not stats_html.exists():
        print("   ❌ GitHub stats component not found")
        return
    
    # Create animation frames directory
    frames_dir = images_dir / 'frames'
    frames_dir.mkdir(parents=True, exist_ok=True)
    
    # Base options
    options = {
        'format': 'png',
        'quality': 90,
        'encoding': "UTF-8",
        'enable-local-file-access': None,
        'quiet': '',
        'width': 1000,
        'height': 600
    }
    
    try:
        # Generate multiple frames with different states
        for i in range(5):
            frame_file = frames_dir / f'frame-{i:02d}.png'
            
            # Read HTML content
            with open(stats_html, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            # Add animation state to HTML
            if i > 0:
                # Add pulse animation to different stat items for each frame
                html_content = html_content.replace(
                    '</body>',
                    f'''
                    <script>
                        // Highlight different stats in each frame
                        document.addEventListener('DOMContentLoaded', () => {{
                            const items = document.querySelectorAll('.stat-item');
                            if (items[{i-1}]) {{
                                items[{i-1}].style.transform = 'scale(1.1)';
                                items[{i-1}].style.boxShadow = '0 0 20px rgba(88, 166, 255, 0.5)';
                            }}
                        }});
                    </script>
                    </body>
                    '''
                )
            
            # Generate frame
            imgkit.from_string(
                html_content,
                str(frame_file),
                options=options
            )
            
            if frame_file.exists():
                print(f"     ✅ Frame {i+1}/5 generated")
        
        print("   🎥 All animation frames generated!")
        
        # Create GIF using imagemagick if available
        create_gif_from_frames(frames_dir, images_dir)
        
    except Exception as e:
        print(f"   ❌ Error generating animation: {e}")

def create_gif_from_frames(frames_dir, images_dir):
    """Create GIF from frames using ImageMagick"""
    try:
        # Check if ImageMagick is available
        result = os.system('which convert > /dev/null 2>&1')
        if result != 0:
            print("   ℹ️ ImageMagick not found, skipping GIF creation")
            print("   💡 Install with: sudo apt-get install imagemagick")
            return
        
        # Create GIF from frames
        gif_path = images_dir / 'github-stats.gif'
        
        # Use ImageMagick to create animated GIF
        cmd = [
            'convert',
            '-delay', '100',  # 100ms between frames
            '-loop', '0',     # Loop forever
            '-resize', '800x480',
            str(frames_dir / 'frame-*.png'),
            str(gif_path)
        ]
        
        os.system(' '.join(cmd))
        
        if gif_path.exists():
            gif_size = gif_path.stat().st_size / 1024
            print(f"   🎉 GIF created: github-stats.gif ({gif_size:.1f} KB)")
        else:
            print("   ❌ Failed to create GIF")
            
    except Exception as e:
        print(f"   ❌ Error creating GIF: {e}")

def main():
    print("=" * 50)
    print("GitHub Stats Image Generator")
    print("=" * 50)
    
    success = generate_component_images()
    
    if success:
        print("\n✨ All images generated successfully!")
        
        # List generated files
        images_dir = Path(__file__).parent.parent / 'data' / 'images'
        print("\n📁 Generated files:")
        for file in sorted(images_dir.glob('*')):
            if file.is_file():
                size = file.stat().st_size / 1024
                print(f"   - {file.name} ({size:.1f} KB)")
        
        # Check for frames directory
        frames_dir = images_dir / 'frames'
        if frames_dir.exists():
            print(f"\n🎬 Animation frames ({len(list(frames_dir.glob('*.png')))} frames)")
    else:
        print("\n❌ Some images failed to generate")
        sys.exit(1)

if __name__ == "__main__":
    main()