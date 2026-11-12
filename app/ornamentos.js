// Ornamentos da identidade gótica católica, desenhados em SVG de linha (herdam currentColor):
// rosácea (emblema e raiz da árvore do conhecimento) e fachada de catedral (ilustração do painel).
// Decorativos: todos levam aria-hidden.

const f = (n) => n.toFixed(1);

/** Rosácea de oito lóbulos com dezesseis raios, como as das fachadas góticas. */
export function rosacea(tamanho = 34, classe = '') {
  const raios = Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI) / 8;
    return `<line x1="${f(50 + 11 * Math.cos(a))}" y1="${f(50 + 11 * Math.sin(a))}" x2="${f(50 + 40 * Math.cos(a))}" y2="${f(50 + 40 * Math.sin(a))}"/>`;
  }).join('');
  const lobulos = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4 + Math.PI / 8;
    return `<circle cx="${f(50 + 29 * Math.cos(a))}" cy="${f(50 + 29 * Math.sin(a))}" r="11"/>`;
  }).join('');
  return `<svg class="rosacea ${classe}" viewBox="0 0 100 100" width="${tamanho}" height="${tamanho}" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
    <circle cx="50" cy="50" r="47"/><circle cx="50" cy="50" r="41"/>${raios}${lobulos}<circle cx="50" cy="50" r="11"/><circle cx="50" cy="50" r="4" fill="currentColor"/></svg>`;
}

/**
 * Cruz latina gótica: braços com terminais ogivais (pontas de lanceta) ladeados por lóbulos (trevo),
 * haste inferior mais longa e veio central gravado. Simétrica; legível a partir de ~16 px.
 */
export function cruz(altura = 34, classe = '') {
  const tri = (x1, y1, x2, y2) => `<circle cx="${x1}" cy="${y1}" r="2.3"/><circle cx="${x2}" cy="${y2}" r="2.3"/>`;
  return `<svg class="cruz ${classe}" viewBox="0 0 40 60" height="${altura}" width="${f((altura * 40) / 60)}" aria-hidden="true">
    <g fill="currentColor">
      <rect x="17.4" y="9" width="5.2" height="43"/><rect x="7" y="17.4" width="26" height="5.2"/>
      <path d="M17.4 10C17.4 6.6 18.9 4.4 20 1.5 21.1 4.4 22.6 6.6 22.6 10Z"/>
      <path d="M17.4 51C17.4 54.6 18.9 56.8 20 59.5 21.1 56.8 22.6 54.6 22.6 51Z"/>
      <path d="M8 17.4C4.6 17.4 2.4 18.9.5 20 2.4 21.1 4.6 22.6 8 22.6Z"/>
      <path d="M32 17.4C35.4 17.4 37.6 18.9 39.5 20 37.6 21.1 35.4 22.6 32 22.6Z"/>
      ${tri(16.6, 9.2, 23.4, 9.2)}${tri(8.6, 16.6, 8.6, 23.4)}${tri(31.4, 16.6, 31.4, 23.4)}${tri(16.6, 50.8, 23.4, 50.8)}
    </g>
    <path class="cruz-veio" d="M20 6V55M4 20H36" fill="none" stroke-width=".9"/>
    <path class="cruz-veio" d="M20 16.2 23.8 20 20 23.8 16.2 20Z" fill="none" stroke-width=".9"/></svg>`;
}

/** Lanceta: janela estreita de arco ogival, de largura w e altura h, a partir do canto inferior esquerdo (x, y). */
const lanceta = (x, y, w, h) => `<path d="M${x} ${y}V${y - h + w}C${x} ${y - h + w * 0.35} ${x + w * 0.3} ${y - h + 2} ${x + w / 2} ${y - h}C${x + w * 0.7} ${y - h + 2} ${x + w} ${y - h + w * 0.35} ${x + w} ${y - h + w}V${y}"/>`;

/** Fachada de catedral gótica: duas torres com flechas, portal ogival, rosácea e lancetas. */
export function fachada(classe = 'fachada') {
  const rosa = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return `<line x1="160" y1="96" x2="${f(160 + 21 * Math.cos(a))}" y2="${f(96 + 21 * Math.sin(a))}"/>`;
  }).join('');
  return `<svg class="${classe}" viewBox="0 0 320 230" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">
    <path d="M6 228h308"/>
    <path d="M22 228V74h62v154M236 228V74h62v154"/>
    <path d="M22 74l31-62 31 62M236 74l31-62 31 62"/><path d="M53 12V2M267 12V2M48 6h10M262 6h10"/>
    ${lanceta(40, 140, 12, 40)}${lanceta(56, 140, 12, 40)}${lanceta(254, 140, 12, 40)}${lanceta(270, 140, 12, 40)}
    ${lanceta(44, 210, 22, 46)}${lanceta(258, 210, 22, 46)}
    <path d="M84 228V88l76-52 76 52v140"/><path d="M160 36V20M153 26h14"/>
    <circle cx="160" cy="96" r="25"/><circle cx="160" cy="96" r="21"/><circle cx="160" cy="96" r="6"/>${rosa}
    <path d="M128 228V176C128 150 146 134 160 126 174 134 192 150 192 176V228"/>
    <path d="M136 228V178C136 158 150 145 160 139 170 145 184 158 184 178V228"/><path d="M160 139V228"/>
    ${lanceta(100, 200, 14, 52)}${lanceta(206, 200, 14, 52)}
    <path d="M84 132h152" stroke-dasharray="2 5"/></svg>`;
}
