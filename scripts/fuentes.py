"""Baja las fuentes de Google Fonts y las deja servidas desde el propio sitio.

Uso: python3 scripts/fuentes.py   (desde la raíz del repo)
Genera public/assets/fonts/*.woff2 y landing.css / precios.css (solo latín y
latín extendido). El @font-face de cada CSS va copiado en línea en
src/pages/index.html y src/layouts/PrecioLayout.astro: si se regenera, copiarlo.
"""
import re, urllib.request, os, collections

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
PEDIDOS = {
    'landing': 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&display=swap',
    'precios': 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
}
OUT = 'public/assets/fonts'

def bajar(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA})).read().decode()

def caras(css):
    res = []
    for sub, body in re.findall(r'/\* ([\w-]+) \*/\s*@font-face \{(.*?)\}', css, re.S):
        g = lambda k: re.search(k + r':\s*([^;]+);', body).group(1).strip()
        res.append(dict(sub=sub, fam=g('font-family').strip("'"), style=g('font-style'), w=int(g('font-weight')),
                        url=re.search(r'url\(([^)]+)\)', body).group(1), ur=g('unicode-range')))
    return res

os.makedirs(OUT, exist_ok=True)
for nombre, url in PEDIDOS.items():
    grp = collections.OrderedDict()
    for f in caras(bajar(url)):
        if f['sub'] in ('latin', 'latin-ext'):
            grp.setdefault((f['fam'], f['style'], f['sub'], f['url'], f['ur']), []).append(f['w'])
    css = ['/* Fuentes servidas desde el propio sitio (antes: Google Fonts, que bloqueaba el primer pintado).\n   Solo latín y latín extendido: el sitio está en español. Generado por scripts/fuentes.py. */']
    for (fam, style, sub, furl, ur), ws in grp.items():
        fn = f"{fam.lower().replace(' ', '')}-{sub}.woff2"
        urllib.request.urlretrieve(furl, f'{OUT}/{fn}')
        wr = f'{min(ws)} {max(ws)}' if len(ws) > 1 else str(ws[0])
        css.append(f"@font-face{{font-family:'{fam}';font-style:{style};font-weight:{wr};font-display:swap;src:url(/assets/fonts/{fn}) format('woff2');unicode-range:{ur}}}")
    open(f'{OUT}/{nombre}.css', 'w').write('\n'.join(css) + '\n')
    print(nombre, len(grp), 'caras')
