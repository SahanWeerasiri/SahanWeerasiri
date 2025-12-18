#!/usr/bin/env python3
"""
Generate screenshots using imgkit (wkhtmltoimage)
Lightweight and fast
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

def generate_screenshots():
    print("📸 Generating screenshots...")
    
    # Setup paths
    base_dir = Path(__file__).parent.parent
    html_file = base_dir / 'data' / 'index.html'
    screenshot_dir = base_dir / 'data' / 'screenshots'
    
    # Create output directory
    screenshot_dir.mkdir(parents=True, exist_ok=True)
    
    if not html_file.exists():
        print(f"❌ HTML file not found: {html_file}")
        return False
    
    # Configure imgkit options
    options = {
        'format': 'png',
        'quality': 90,
        'encoding': "UTF-8",
        'enable-local-file-access': None,
        'quiet': ''
    }
    
    try:
        print("   Generating full page screenshot...")
        imgkit.from_file(
            str(html_file),
            str(screenshot_dir / 'stats-full.png'),
            options=options
        )
        
        print("   Generating social media preview...")
        custom_options = options.copy()
        custom_options.update({'width': 1200, 'height': 630})
        imgkit.from_file(
            str(html_file),
            str(screenshot_dir / 'stats-social.png'),
            options=custom_options
        )
        
        print("   Generating README screenshot...")
        custom_options = options.copy()
        custom_options.update({'width': 1280, 'height': 720})
        imgkit.from_file(
            str(html_file),
            str(screenshot_dir / 'stats-readme.png'),
            options=custom_options
        )
        
        print(f"✅ Screenshots saved to: {screenshot_dir}")
        return True
        
    except Exception as e:
        print(f"❌ Error generating screenshots: {e}")
        return False

if __name__ == "__main__":
    success = generate_screenshots()
    sys.exit(0 if success else 1)