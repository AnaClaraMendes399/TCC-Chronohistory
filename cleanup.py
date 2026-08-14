import re
import os

css_file = r'c:\Users\SENAI DS 2025\Desktop\TCC CORRETO\TCC-Chronohistory\medieval.css'
html_file = r'c:\Users\SENAI DS 2025\Desktop\TCC CORRETO\TCC-Chronohistory\index.html'

def clean_css(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remover !important
    content = content.replace(' !important', '')
    
    # Suavizar as cores
    content = content.replace('--brown-dark:    #3B2A1A;', '--brown-dark:    #1F1A17;')
    content = content.replace('--gold:          #C9A227;', '--gold:          #C2A574;')
    content = content.replace('--gold-dim:      #A68A56;', '--gold-dim:      #8B7552;')
    
    # Remover box-shadow pesados
    content = re.sub(r'box-shadow:[^;]+;', 'box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);', content)
    
    # Remover text-shadow pesado
    content = re.sub(r'text-shadow:[^;]+;', 'text-shadow: none;', content)
    
    # Remover bordas excessivas
    content = re.sub(r'border:[^;]+solid[^;]+;', 'border: 1px solid var(--gold-dim);', content)
    
    # Arredondar bordas um pouco mais (moderno)
    content = content.replace('border-radius: 0;', 'border-radius: 6px;')
    content = content.replace('border-radius: 0', 'border-radius: 6px')
    
    # Substituir linear-gradients por fundos mais suaves
    content = re.sub(r'background: linear-gradient\([^;]+;', 'background: var(--brown-dark);', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

def clean_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    content = content.replace(' !important', '')
    content = re.sub(r'box-shadow:[^;]+;', 'box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);', content)
    content = re.sub(r'text-shadow:[^;]+;', 'text-shadow: none;', content)
    content = re.sub(r'background: linear-gradient\([^;]+;', 'background: #1F1A17;', content)
    content = re.sub(r'border:[^;]+solid[^;]+;', 'border: 1px solid #8B7552;', content)
    content = content.replace('border-radius: 0;', 'border-radius: 6px;')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

clean_css(css_file)
clean_html(html_file)

print("CSS e HTML limpos!")
