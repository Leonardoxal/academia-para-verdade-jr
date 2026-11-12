// Leitor de PDF das aulas infantis (pdf.js): abre o PDF publicado no site em modo contínuo ou folhear, com tela cheia.
// Mesma aparência e mesmo modo preferido do leitor da Biblioteca. Guarda só a página em que a pessoa parou, neste aparelho.
const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs';
const WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
const CHAVE_MODO = 'academia-verdade-modo-leitor';

let pdfjs = null;
async function carregarPdfjs() {
  if (!pdfjs) {
    pdfjs = await import(PDFJS);
    pdfjs.GlobalWorkerOptions.workerSrc = WORKER;
  }
  return pdfjs;
}
const lerModo = () => { try { return localStorage.getItem(CHAVE_MODO) === 'folhear' ? 'folhear' : 'continuo'; } catch { return 'continuo'; } };
const gravarModo = (m) => { try { localStorage.setItem(CHAVE_MODO, m); } catch { /* sem armazenamento: vale só nesta visita */ } };
const lerPagina = (chave) => { try { return Number(localStorage.getItem(`aci-pagina-${chave}`)) || 1; } catch { return 1; } };
const gravarPagina = (chave, n) => { try { localStorage.setItem(`aci-pagina-${chave}`, String(n)); } catch { /* idem */ } };

/** Liga o leitor às peças da tela da aula (#inf-leitor-area, #inf-leitor-tela, #inf-leitor-pos, #inf-leitor-pos-cheia). */
export function criarLeitor(root, aoErro = () => {}) {
  const area = root.querySelector('#inf-leitor-area');
  const tela = root.querySelector('#inf-leitor-tela');
  const pos = root.querySelector('#inf-leitor-pos');
  const posCheia = root.querySelector('#inf-leitor-pos-cheia');
  let doc = null, total = 0, pagina = 1, chave = '', modo = lerModo(), observadores = [], redesenho = null, larguraAnterior = window.innerWidth, encerrado = false;

  function mudarPagina(n) {
    pagina = Math.max(1, Math.min(total, n));
    pos.textContent = posCheia.textContent = `Página ${pagina} de ${total}`;
    gravarPagina(chave, pagina);
  }

  async function desenhar(n, canvas, largura, alturaMax = Infinity) {
    const pg = await doc.getPage(n);
    const base = pg.getViewport({ scale: 1 });
    const escala = Math.min(largura / base.width, alturaMax / base.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // limite de memória em celulares
    const vp = pg.getViewport({ scale: escala * dpr });
    canvas.width = vp.width; canvas.height = vp.height;
    canvas.style.width = `${vp.width / dpr}px`; canvas.style.height = `${vp.height / dpr}px`;
    await pg.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
  }
  const desligar = () => { observadores.forEach((o) => o.disconnect()); observadores = []; };

  async function modoContinuo() {
    desligar();
    const base = (await doc.getPage(1)).getViewport({ scale: 1 });
    const largura = Math.min(area.clientWidth, 900);
    area.className = 'leitor-area continuo';
    area.innerHTML = Array.from({ length: total }, (_, i) => `<div class="pg" data-n="${i + 1}" style="aspect-ratio:${base.width}/${base.height};max-width:${largura}px"><canvas aria-label="Página ${i + 1}"></canvas></div>`).join('');
    const desenhadas = new Set();
    const carga = new IntersectionObserver((ents) => ents.forEach((en) => {
      const n = Number(en.target.dataset.n);
      if (en.isIntersecting && !desenhadas.has(n)) { desenhadas.add(n); desenhar(n, en.target.querySelector('canvas'), largura).catch(() => {}); }
    }), { rootMargin: '800px 0px' });
    const atual = new IntersectionObserver((ents) => {
      const cruzando = ents.filter((en) => en.isIntersecting);
      if (cruzando.length) mudarPagina(Number(cruzando[cruzando.length - 1].target.dataset.n));
    }, { rootMargin: '-50% 0px -50% 0px' });
    area.querySelectorAll('.pg').forEach((el) => { carga.observe(el); atual.observe(el); });
    observadores = [carga, atual];
    area.querySelector(`.pg[data-n="${pagina}"]`)?.scrollIntoView();
    mudarPagina(pagina);
  }

  const duas = () => area.clientWidth >= 820;
  async function mostrarFolhas(direcao = 0) {
    const n = duas() ? [pagina, pagina + 1].filter((x) => x <= total) : [pagina];
    const altura = window.innerHeight - (tela.classList.contains('cheia') ? 70 : 180);
    const largura = duas() ? (area.clientWidth - 24) / 2 : area.clientWidth;
    const folhas = document.createElement('div');
    folhas.className = `folhas${direcao > 0 ? ' virar-prox' : direcao < 0 ? ' virar-ant' : ''}`;
    folhas.innerHTML = n.map((x) => `<canvas aria-label="Página ${x}"></canvas>`).join('');
    await Promise.all(n.map((x, i) => desenhar(x, folhas.children[i], largura, altura)));
    area.querySelector('.folhas')?.replaceWith(folhas);
    mudarPagina(pagina);
  }
  async function modoFolhear() {
    desligar();
    area.className = 'leitor-area folhear';
    area.innerHTML = '<button class="btn virar" data-virar="-1" aria-label="Página anterior">‹</button><div class="folhas"></div><button class="btn virar" data-virar="1" aria-label="Próxima página">›</button>';
    await mostrarFolhas();
    area.focus({ preventScroll: true });
  }
  const passo = () => (modo === 'folhear' && duas() ? 2 : 1);
  function virar(d) {
    const alvo = Math.max(1, Math.min(total, pagina + d * passo()));
    if (alvo === pagina) return;
    pagina = alvo;
    mostrarFolhas(d).catch(() => aoErro('Não foi possível mostrar esta página.'));
  }
  const abrirModo = () => (modo === 'folhear' ? modoFolhear() : modoContinuo()).catch(() => aoErro('Não foi possível mostrar o PDF.'));

  area.addEventListener('click', (ev) => { const b = ev.target.closest('[data-virar]'); if (b) virar(Number(b.dataset.virar)); });
  area.addEventListener('keydown', (ev) => {
    if (modo !== 'folhear' || !doc) return;
    if (ev.key === 'ArrowRight' || ev.key === 'PageDown') { ev.preventDefault(); virar(1); }
    if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') { ev.preventDefault(); virar(-1); }
  });
  let toqueX = null;
  area.addEventListener('pointerdown', (ev) => { toqueX = ev.clientX; });
  area.addEventListener('pointerup', (ev) => {
    if (modo !== 'folhear' || toqueX === null) return;
    const dx = ev.clientX - toqueX; toqueX = null;
    if (Math.abs(dx) > 50) virar(dx < 0 ? 1 : -1);
  });

  // Tela cheia: a API do navegador quando existe; no iPhone, o leitor cobre a página (CSS).
  const redesenhar = () => { clearTimeout(redesenho); redesenho = setTimeout(() => { if (doc) abrirModo(); }, 250); };
  const aoRedimensionar = () => { if (window.innerWidth !== larguraAnterior) { larguraAnterior = window.innerWidth; redesenhar(); } };
  function marcarCheia(on) {
    if (tela.classList.contains('cheia') === on) return;
    tela.classList.toggle('cheia', on);
    document.body.classList.toggle('sem-rolagem', on);
    redesenhar();
  }
  function alternarCheia() {
    if (tela.classList.contains('cheia')) { marcarCheia(false); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); return; }
    marcarCheia(true);
    tela.requestFullscreen?.().catch(() => {});
  }
  const aoMudarCheia = () => { if (!document.fullscreenElement) marcarCheia(false); };
  const aoTecla = (ev) => { if (ev.key === 'Escape' && tela.classList.contains('cheia') && !document.fullscreenElement) marcarCheia(false); };
  const aoCliqueTela = (ev) => { if (ev.target.closest('[data-acao="tela-cheia"]')) alternarCheia(); };
  document.addEventListener('fullscreenchange', aoMudarCheia);
  document.addEventListener('keydown', aoTecla);
  window.addEventListener('resize', aoRedimensionar);
  root.addEventListener('click', aoCliqueTela);

  function encerrar() {
    if (encerrado) return;
    encerrado = true;
    desligar();
    doc?.destroy();
    clearTimeout(redesenho);
    document.removeEventListener('fullscreenchange', aoMudarCheia);
    document.removeEventListener('keydown', aoTecla);
    window.removeEventListener('resize', aoRedimensionar);
    window.removeEventListener('hashchange', aoSair);
    root.removeEventListener('click', aoCliqueTela);
    document.body.classList.remove('sem-rolagem');
    if (document.fullscreenElement === tela) document.exitFullscreen().catch(() => {});
  }
  const aoSair = () => { if (!location.hash.startsWith('#infantil-')) encerrar(); };
  window.addEventListener('hashchange', aoSair);

  return {
    /** Abre o PDF do site; `chaveDoc` identifica o documento para lembrar a página. */
    async abrir(url, chaveDoc) {
      area.innerHTML = '<p class="meta">Abrindo…</p>';
      try {
        const lib = await carregarPdfjs();
        await doc?.destroy();
        doc = await lib.getDocument({ url: new URL(url, location.href).href }).promise;
        total = doc.numPages;
        chave = chaveDoc;
        pagina = Math.min(lerPagina(chave), total);
        await abrirModo();
      } catch {
        doc = null;
        area.innerHTML = '<p class="aviso">Não foi possível abrir este PDF aqui. Use o botão de baixar.</p>';
      }
    },
    trocarModo(m) { modo = m === 'folhear' ? 'folhear' : 'continuo'; gravarModo(modo); if (doc) abrirModo(); },
    modo: () => modo,
    encerrar,
  };
}
