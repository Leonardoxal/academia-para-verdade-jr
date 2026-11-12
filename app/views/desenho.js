// Desenho livre (#desenhar): criatividade e imaginação, sem placar nem nível. O desenho fica só neste aparelho
// enquanto a página está aberta; "Guardar" baixa uma imagem para o aparelho da família.
import { link, toast } from '../ui.js';

// Cores de vitral (as mesmas famílias dos jogos) e as de base; o branco serve de borracha.
const CORES = ['#1d2433', '#c8243f', '#2a62b8', '#1f875a', '#e6a32a', '#7a3a8f', '#a8541f', '#f2c6d0', '#8fd3ff', '#ffffff'];
const PINCEIS = [['Fino', 4], ['Médio', 10], ['Grosso', 22]];
export const IDEIAS = [
  'Desenhe o que você mais gostou da história de hoje.', 'Desenhe sua família rezando junto.', 'Desenhe um animal que Deus criou e onde ele mora.',
  'Desenhe o seu anjo da guarda cuidando de você.', 'Desenhe a sua casa e quem mora nela.', 'Desenhe uma igreja com os vitrais coloridos.',
  'Desenhe o céu de noite: a Lua e as estrelas.', 'Desenhe uma árvore em cada estação do ano.', 'Desenhe um santo de que você gosta.',
];

export function desenhar() {
  return `<section class="infantil jogos jg-desenho">
    <div class="jg-barra"><a class="btn pequeno" href="#jogos">Voltar aos jogos</a><span class="jg-titulo">Desenho livre</span></div>
    <p class="jg-cena" id="dz-ideia" aria-live="polite">${IDEIAS[0]}</p>
    <div class="dz-ferr" role="toolbar" aria-label="Ferramentas de desenho">
      ${CORES.map((c, i) => `<button type="button" class="dz-cor${i === 0 ? ' ativa' : ''}" data-cor="${c}" style="background:${c}" aria-label="Cor ${i + 1}${c === '#ffffff' ? ' (branco, serve de borracha)' : ''}" aria-pressed="${i === 0}"></button>`).join('')}
      ${PINCEIS.map(([r, n], i) => `<button type="button" class="btn pequeno dz-pincel${i === 1 ? ' ativa' : ''}" data-pincel="${n}" aria-pressed="${i === 1}">${r}</button>`).join('')}
      <button type="button" class="btn pequeno" id="dz-outra">Outra ideia</button>
      <button type="button" class="btn pequeno" id="dz-guardar">Guardar desenho</button>
      <button type="button" class="btn pequeno perigo" id="dz-limpar">Começar de novo</button>
    </div>
    <canvas id="dz-tela" class="dz-tela" role="img" aria-label="Folha de desenho"></canvas>
    <p class="meta">Desenhe com o dedo ou o mouse. Depois, peça à criança que conte o que desenhou: falar sobre o desenho também é linguagem. Papel e lápis de cor de verdade valem tanto quanto esta tela. ${link('jogos', 'Voltar aos jogos')}</p>
  </section>`;
}

desenhar.ligar = (root) => {
  const tela = root.querySelector('#dz-tela');
  const ctx2 = tela.getContext('2d');
  const escala = window.devicePixelRatio || 1;
  const largura = tela.clientWidth;
  const altura = Math.max(320, Math.min(window.innerHeight * 0.62, largura * 0.75));
  tela.width = largura * escala; tela.height = altura * escala; tela.style.height = `${altura}px`;
  ctx2.scale(escala, escala);
  const branco = () => { ctx2.fillStyle = '#ffffff'; ctx2.fillRect(0, 0, largura, altura); };
  branco();
  let cor = CORES[0]; let pincel = 10; let anterior = null;
  ctx2.lineCap = 'round'; ctx2.lineJoin = 'round';

  const ponto = (ev) => { const r = tela.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
  tela.addEventListener('pointerdown', (ev) => { tela.setPointerCapture(ev.pointerId); anterior = ponto(ev); ctx2.fillStyle = cor; ctx2.beginPath(); ctx2.arc(anterior.x, anterior.y, pincel / 2, 0, Math.PI * 2); ctx2.fill(); });
  tela.addEventListener('pointermove', (ev) => {
    if (!anterior) return;
    const p = ponto(ev);
    ctx2.strokeStyle = cor; ctx2.lineWidth = pincel;
    ctx2.beginPath(); ctx2.moveTo(anterior.x, anterior.y); ctx2.lineTo(p.x, p.y); ctx2.stroke();
    anterior = p;
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => tela.addEventListener(t, () => { anterior = null; }));

  const marcar = (sel, el) => root.querySelectorAll(sel).forEach((b) => { b.classList.toggle('ativa', b === el); b.setAttribute('aria-pressed', String(b === el)); });
  root.querySelector('.dz-ferr').addEventListener('click', (ev) => {
    const c = ev.target.closest('[data-cor]'); const p = ev.target.closest('[data-pincel]');
    if (c) { cor = c.dataset.cor; marcar('[data-cor]', c); }
    if (p) { pincel = Number(p.dataset.pincel); marcar('[data-pincel]', p); }
  });
  let ideia = 0;
  root.querySelector('#dz-outra').addEventListener('click', () => { ideia = (ideia + 1) % IDEIAS.length; root.querySelector('#dz-ideia').textContent = IDEIAS[ideia]; });
  root.querySelector('#dz-limpar').addEventListener('click', () => { if (confirm('Apagar o desenho e começar de novo?')) branco(); });
  root.querySelector('#dz-guardar').addEventListener('click', () => {
    tela.toBlob((blob) => {
      if (!blob) { toast('Não foi possível guardar o desenho.'); return; }
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: url, download: `desenho-${new Date().toISOString().slice(0, 10)}.png` }).click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }, 'image/png');
  });
};
