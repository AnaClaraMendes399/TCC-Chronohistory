import re
import os

css_file = r'c:\Users\SENAI DS 2025\Desktop\TCC CORRETO\TCC-Chronohistory\medieval.css'
html_file = r'c:\Users\SENAI DS 2025\Desktop\TCC CORRETO\TCC-Chronohistory\index.html'

def process_css(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Colors - more mature, readable
    content = content.replace('--brown-dark:    #3B2A1A;', '--brown-dark:    #2A2421;')
    content = content.replace('--brown-mid:     #5C4033;', '--brown-mid:     #423630;')
    content = content.replace('--gold:          #C9A227;', '--gold:          #C4A777;')
    content = content.replace('--gold-light:    #E8C84A;', '--gold-light:    #D6B984;')
    content = content.replace('--gold-dim:      #A68A56;', '--gold-dim:      #917E62;')
    
    # 2. Text Shadows (Remove from descriptions, keep on titles but soften)
    content = re.sub(r'text-shadow:\s*2px\s*2px\s*0\s*rgba\(0,\s*0,\s*0,\s*0\.6\)\s*!important;', 'text-shadow: none !important;', content)
    content = re.sub(r'text-shadow:\s*1px\s*1px\s*0\s*rgba\(255,255,255,0\.5\)\s*!important;', 'text-shadow: none !important;', content)
    content = re.sub(r'text-shadow:[^;]+;', lambda m: m.group(0) if 'hero-title' in m.group(0) else 'text-shadow: 1px 1px 0 rgba(0,0,0,0.3) !important;', content)
    
    # 3. Soften glowing box shadows (rgba 0 0 Xpx) but keep hard solid shadows (pixel art identity)
    # The pixel art identity comes from: 3px 3px 0 var(--brown-dark)
    # We remove the glowing parts like `0 0 60px rgba(...)`
    content = re.sub(r',\s*0\s*0\s*\d+px\s*rgba\([^)]+\)', '', content)
    
    # 4. Soften clouds
    content = content.replace('rgba(255,255,255,0.35)', 'rgba(255,255,255,0.03)')
    content = content.replace('rgba(255,255,255,0.3)', 'rgba(255,255,255,0.02)')
    content = content.replace('rgba(255,255,255,0.25)', 'rgba(255,255,255,0.02)')
    content = content.replace('rgba(255,255,255,0.2)', 'rgba(255,255,255,0.01)')
    content = content.replace('rgba(255,255,255,0.18)', 'rgba(255,255,255,0.01)')
    content = content.replace('rgba(255,255,255,0.15)', 'rgba(255,255,255,0.01)')
    
    # 5. Tone down parchment backgrounds for comfortable reading
    content = content.replace('rgba(245,230,200,0.97)', 'rgba(245,240,230,0.97)')
    content = content.replace('rgba(237,217,163,0.96)', 'rgba(237,232,220,0.96)')
    content = content.replace('rgba(228,205,140,0.97)', 'rgba(228,222,210,0.97)')
    
    # 6. Make body text inside cards purely dark gray for max readability
    content = content.replace('color: var(--brown-dark) !important;', 'color: #2A2421 !important;')
    
    # Keep border-radius: 0 to keep the pixel blocky identity, but ensure text is readable.
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

def process_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # In index.html, let's remove the inline style section that duplicates CSS
    # It starts at <style> and ends at </style>
    # We will just strip the content of the inline <style> block related to medieval since it's already in medieval.css
    # But wait, looking at index.html earlier, the <style> block contains media queries for tailwind.
    # Let's just fix the container spacing.
    # Increase padding for readability
    content = content.replace('padding: 1rem 0.75rem;', 'padding: 2rem 1rem;')
    content = content.replace('padding: 1.25rem 1rem;', 'padding: 3rem 1.5rem;')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

process_css(css_file)
process_html(html_file)

print("Refined CSS and HTML while keeping identity.")
