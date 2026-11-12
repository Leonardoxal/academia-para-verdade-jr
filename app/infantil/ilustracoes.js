// Ilustrações infantis do site, em SVG, nas cores da marca. Decorativas (aria-hidden).
// Mesmos animais dos cadernos em PDF. Larguras em px; x e y aninham o desenho numa cena maior.
const K = '#5B3F2C';
const OURO = '#B8862B';
const VINHO = '#7A1F34';

const caixa = (vbW, vbH, interno, { w = 40, x, y } = {}) => {
  const pos = x === undefined ? '' : ` x="${x}" y="${y}"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" width="${w}" height="${(w * vbH / vbW).toFixed(2)}"${pos} aria-hidden="true" focusable="false"><g stroke="${K}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${interno}</g></svg>`;
};

export const peixe = (cor = '#2F6FB5', o = {}) => caixa(130, 80, `
  <path d="M104 40 L126 18 Q120 40 126 62 Z" fill="${cor}"/>
  <path d="M14 40 C30 8 84 6 104 40 C84 74 30 72 14 40 Z" fill="${cor}"/>
  <path d="M58 13 Q68 0 84 12 Z" fill="${cor}"/>
  <path d="M50 22 Q58 40 50 58" fill="none"/>
  <circle cx="32" cy="36" r="6" fill="#fff"/><circle cx="31" cy="36" r="2.6" fill="${K}" stroke="none"/>
  <path d="M19 48 Q25 52 31 49" fill="none"/>`, o);

export const passaro = (cor = '#E4B73B', o = {}) => caixa(110, 92, `
  <path d="M22 56 L2 44 L6 64 Z" fill="${cor}"/>
  <path d="M46 78 L46 90 M58 78 L58 90" fill="none"/>
  <ellipse cx="50" cy="54" rx="32" ry="24" fill="${cor}"/>
  <path d="M32 52 Q50 32 68 54 Q50 68 32 52 Z" fill="#fff" fill-opacity=".38"/>
  <circle cx="78" cy="34" r="15" fill="${cor}"/>
  <path d="M90 29 L107 36 L91 43 Z" fill="#E8902E"/>
  <circle cx="82" cy="31" r="3.2" fill="${K}" stroke="none"/>`, o);

export const ovelha = (o = {}) => caixa(130, 100, `
  <path d="M42 76 L42 95 M60 80 L60 97 M86 80 L86 97 M102 74 L102 93" fill="none" stroke-width="6"/>
  <g fill="#fff">
    <circle cx="40" cy="48" r="20"/><circle cx="62" cy="38" r="22"/><circle cx="86" cy="40" r="22"/>
    <circle cx="104" cy="54" r="18"/><circle cx="48" cy="68" r="18"/><circle cx="76" cy="68" r="20"/><circle cx="96" cy="68" r="15"/>
  </g>
  <ellipse cx="20" cy="58" rx="14" ry="18" fill="#4B4642"/>
  <ellipse cx="34" cy="48" rx="8" ry="4" fill="#4B4642" transform="rotate(-25 34 48)"/>
  <circle cx="15" cy="53" r="3.2" fill="#fff" stroke="none"/><circle cx="14" cy="53" r="1.5" fill="${K}" stroke="none"/>
  <path d="M12 68 Q18 72 24 68" fill="none" stroke="#fff"/>`, o);

export const gato = (cor = '#E39A3B', o = {}) => caixa(120, 112, `
  <path d="M82 98 Q114 98 108 62" fill="none" stroke="${K}" stroke-width="13"/>
  <path d="M82 98 Q114 98 108 62" fill="none" stroke="${cor}" stroke-width="7"/>
  <ellipse cx="55" cy="84" rx="29" ry="25" fill="${cor}"/>
  <path d="M33 34 L36 8 L54 24 Z" fill="${cor}"/><path d="M77 34 L74 8 L56 24 Z" fill="${cor}"/>
  <path d="M38 28 L39 16 L48 24 Z" fill="#F2B6B6" stroke="none"/><path d="M72 28 L71 16 L62 24 Z" fill="#F2B6B6" stroke="none"/>
  <circle cx="55" cy="46" r="26" fill="${cor}"/>
  <ellipse cx="45" cy="45" rx="4.5" ry="6" fill="#B7D9A3"/><ellipse cx="65" cy="45" rx="4.5" ry="6" fill="#B7D9A3"/>
  <ellipse cx="45" cy="45" rx="1.6" ry="4" fill="${K}" stroke="none"/><ellipse cx="65" cy="45" rx="1.6" ry="4" fill="${K}" stroke="none"/>
  <path d="M51 54 L59 54 L55 59 Z" fill="#E58C8C"/><path d="M55 59 Q50 64 46 61 M55 59 Q60 64 64 61" fill="none"/>
  <path d="M30 54 L16 51 M30 59 L16 61 M80 54 L94 51 M80 59 L94 61" fill="none" stroke-width="2"/>
  <ellipse cx="44" cy="106" rx="10" ry="6" fill="${cor}"/><ellipse cx="66" cy="106" rx="10" ry="6" fill="${cor}"/>`, o);

export const pato = (o = {}) => caixa(124, 92, `
  <path d="M20 52 L3 40 L14 64 Z" fill="#F2C94C"/>
  <ellipse cx="54" cy="58" rx="36" ry="22" fill="#F2C94C"/>
  <path d="M34 56 Q52 38 72 58 Q52 70 34 56 Z" fill="#fff" fill-opacity=".4"/>
  <circle cx="88" cy="32" r="16" fill="#F2C94C"/>
  <path d="M100 30 Q120 29 116 40 Q106 43 100 40 Z" fill="#E8902E"/>
  <circle cx="90" cy="28" r="3" fill="${K}" stroke="none"/>
  <path d="M6 84 Q18 76 30 84 T54 84 T78 84 T102 84" fill="none" stroke="#2F6FB5"/>`, o);

export const estrela = (cor = OURO, o = {}) => caixa(60, 58, `<path d="M30 3 L38 22 L58 23 L42 36 L48 55 L30 44 L12 55 L18 36 L2 23 L22 22 Z" fill="${cor}"/>`, o);

export const sol = (o = {}) => caixa(100, 100, `
  <g stroke="${OURO}" stroke-width="5">${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<path d="M${50 + 32 * Math.cos(a)} ${50 + 32 * Math.sin(a)} L${50 + 46 * Math.cos(a)} ${50 + 46 * Math.sin(a)}" fill="none"/>`; }).join('')}</g>
  <circle cx="50" cy="50" r="26" fill="#F5CF4A"/>`, o);

export const nuvem = (o = {}) => caixa(120, 60, `<path d="M26 50 Q6 50 8 34 Q10 22 24 24 Q28 6 48 8 Q64 2 74 18 Q96 14 100 32 Q114 34 110 46 Q108 52 98 50 Z" fill="#fff"/>`, o);

export const cruz = (cor = OURO, o = {}) => caixa(60, 80, `
  <path d="M24 4 H36 V24 H54 V36 H36 V76 H24 V36 H6 V24 H24 Z" fill="${cor}"/>
  <circle cx="30" cy="30" r="4" fill="${VINHO}" stroke="none"/>`, o);

/** Selo redondo de cada aula: o desenho do tema. */
const W = { w: 44 };
const SELOS = {
  peixe: () => peixe(undefined, W), passaro: () => passaro(undefined, W), ovelha: () => ovelha(W), gato: () => gato(undefined, W),
  pato: () => pato(W), sol: () => sol(W), estrela: () => estrela(undefined, W), cruz: () => cruz(undefined, W),
};
export const selo = (nome) => (SELOS[nome] ?? SELOS.estrela)();

/** Uma estrela por aula: dourada se a aula foi feita, só contorno se ainda não. */
export function estrelas(feitas, total) {
  const forma = 'M15 2 L19 11 L29 12 L21.5 18.5 L24 28 L15 23 L6 28 L8.5 18.5 L1 12 L11 11 Z';
  const itens = Array.from({ length: total }, (_, i) => `<path transform="translate(${i * 32} 0)" d="${forma}" fill="${i < feitas ? '#D8B86A' : 'none'}" stroke="${i < feitas ? OURO : '#8A8378'}" stroke-width="1.8" stroke-linejoin="round"/>`).join('');
  return `<svg viewBox="0 0 ${Math.max(total, 1) * 32} 30" width="${Math.max(total, 1) * 28}" height="26" role="img" aria-label="${feitas} de ${total} aulas feitas">${itens}</svg>`;
}

/** Ícones de botão (traço, herdam a cor do texto). */
const ICONES = {
  baixar: '<path d="M12 3v12m0 0l-5-5m5 5l5-5M4 20h16"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  clipe: '<path d="M20 11l-8.5 8.5a5 5 0 01-7-7L13 4a3.5 3.5 0 015 5l-8.5 8.5a2 2 0 01-3-3L14 7"/>',
  voltar: '<path d="M15 5l-7 7 7 7"/>',
};
export const icone = (nome) => `<svg class="ico" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[nome]}</svg>`;

/** Janela de vitral da capa: céu, sol, cruz, pássaros e, no chão, a ovelha, o gato e o pato. */
export function cenaVitral() {
  const arco = 'M30 470 V210 Q30 30 260 30 Q490 30 490 210 V470 Z';
  return `<svg class="vitral" viewBox="0 0 520 480" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs>
    <clipPath id="vitral-arco"><path d="${arco}"/></clipPath>
    <linearGradient id="vitral-ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#23408E"/><stop offset="1" stop-color="#A9CBEA"/></linearGradient>
  </defs>
  <g clip-path="url(#vitral-arco)">
    <rect width="520" height="480" fill="url(#vitral-ceu)"/>
    ${estrela('#F5CF4A', { w: 20, x: 110, y: 70 })}${estrela('#F5CF4A', { w: 14, x: 190, y: 110 })}${estrela('#F5CF4A', { w: 18, x: 330, y: 70 })}${estrela('#F5CF4A', { w: 12, x: 400, y: 115 })}
    ${cruz(OURO, { w: 30, x: 245, y: 58 })}
    ${sol({ w: 90, x: 385, y: 150 })}
    ${nuvem({ w: 100, x: 70, y: 175 })}${nuvem({ w: 80, x: 280, y: 215 })}
    ${passaro('#E4B73B', { w: 60, x: 190, y: 160 })}${passaro('#C9473F', { w: 46, x: 320, y: 140 })}${passaro('#4F86C6', { w: 40, x: 120, y: 120 })}
    <path d="M0 360 Q130 320 260 350 T520 340 V480 H0 Z" fill="#9DB88F" stroke="${K}" stroke-width="3"/>
    <ellipse cx="415" cy="430" rx="85" ry="24" fill="#4B86C8" stroke="${K}" stroke-width="3"/>
    ${ovelha({ w: 150, x: 50, y: 335 })}${gato('#E39A3B', { w: 88, x: 225, y: 365 })}${pato({ w: 84, x: 372, y: 372 })}
  </g>
  <path d="${arco}" fill="none" stroke="${OURO}" stroke-width="12"/>
  <path d="${arco}" fill="none" stroke="#D8B86A" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/>
</svg>`;
}
