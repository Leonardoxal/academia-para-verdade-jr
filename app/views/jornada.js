// A Jornada (#infantil): a Porta da Casa ("Quem vai viajar hoje?") e o Mapa do filho escolhido, com a Estrada das Aulas.
// Cada filho vê só a própria trilha. A escolha fica em localStorage "aci-quem" (a mesma chave de sempre).
// O bebê não tem mapa interativo: a tela dele é a Estrada das Aulas para os pais. Tudo o que é do responsável
// (cadastro, biblioteca, backup, como usar) está na Sala do Guia (#guia), atrás do botão "Sou o responsável".
import { esc } from '../ui.js';
import { AULAS_INFANTIL } from '../infantil/aulas.js';
import { arm } from './infantil.js';
import { REGIOES, marcosDaTrilha, viajantes, viajanteEscolhido } from '../infantil/jornada.js';
import { selo } from '../infantil/ilustracoes.js';
import { brinquedosHTML, florHTML, ligarBrinquedos, aplicarClima } from './brinquedos.js';

const QUEM = 'aci-quem';
const SEGURAR_MS = 2000;
const CIDADE_URL = 'https://leonardoxal.github.io/#painel';

const lerQuem = () => { try { return localStorage.getItem(QUEM); } catch { return null; } };
const gravarQuem = (v) => { try { localStorage.setItem(QUEM, v); } catch { /* sem armazenamento: a Porta volta a perguntar */ } };

const MANTO = { menina: '#7A1F34', menino: '#1B3459', '': '#4D6B4A' };
const viajanteSvg = (perfil = '') => `<svg class="viajante" viewBox="0 0 48 72" width="48" height="72" aria-hidden="true" focusable="false"><g stroke="#5B3F2C" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M38 14V66" fill="none" stroke-width="3"/><circle cx="38" cy="12" r="3" fill="#B8862B"/><path d="M14 34Q24 24 34 34L38 62H10Z" fill="${MANTO[perfil] ?? MANTO['']}"/><circle cx="24" cy="22" r="9" fill="#F2D7B6"/><path d="M14 22Q24 6 34 22Q24 16 14 22Z" fill="${MANTO[perfil] ?? MANTO['']}"/><rect x="9" y="38" width="11" height="14" rx="3" fill="#8A5A2B"/></g></svg>`;
const casaSvg = '<svg viewBox="0 0 64 56" width="44" height="38" aria-hidden="true" focusable="false"><g stroke="#5B3F2C" stroke-width="2.5" stroke-linejoin="round"><path d="M8 28L32 8L56 28V50H8Z" fill="#E9D9B4"/><path d="M4 30L32 6L60 30" fill="none" stroke="#7A1F34" stroke-width="5" stroke-linecap="round"/><circle cx="32" cy="38" r="9" fill="#8A5A2B"/><circle cx="35" cy="38" r="1.5" fill="#B8862B" stroke="none"/></g></svg>';

// Faixas de cenário das regiões (decorativas). As cores vêm de variáveis em mapa.css, que mudam de dia para noite.
const ASTRO = '<circle class="sv-sol" cx="300" cy="26" r="13"/><g class="sv-lua"><circle cx="300" cy="26" r="12"/><circle class="sv-recorte" cx="306" cy="22" r="11"/></g>';
const CENARIO = {
  vale: `<rect class="sv-ceu" width="400" height="90"/>${ASTRO}<path class="sv-colina" d="M0 62Q70 36 150 58T300 52T400 60V90H0Z"/><g stroke="#5B3F2C" stroke-width="2" stroke-linejoin="round"><path d="M60 60L84 42L108 60V76H60Z" fill="#E9D9B4"/><path d="M56 62L84 38L112 62" fill="none" stroke="#7A1F34" stroke-width="5" stroke-linecap="round"/><circle cx="84" cy="68" r="6" fill="#8A5A2B"/></g>`,
  floresta: `<rect class="sv-ceu" width="400" height="90"/>${ASTRO}<path class="sv-colina" d="M0 66Q100 46 200 62T400 56V90H0Z"/><g class="sv-arvore">${[50, 120, 210, 290].map((x, i) => `<path d="M${x} ${70 - i % 2 * 4}L${x + 18} ${30 + i % 2 * 6}L${x + 36} ${70 - i % 2 * 4}Z"/>`).join('')}</g>`,
  montanhas: `<rect class="sv-ceu" width="400" height="90"/>${ASTRO}<path class="sv-pedra" d="M0 80L70 30L120 62L190 18L260 70L320 36L400 76V90H0Z"/><path class="sv-neve" d="M190 18L170 36L186 32L198 40L212 30Z"/>`,
  estrada: `<rect class="sv-ceu" width="400" height="90"/>${ASTRO}<path class="sv-colina" d="M0 64Q120 50 400 62V90H0Z"/><path class="sv-estrada" d="M150 90Q190 70 230 60T280 40L296 40Q250 66 210 74T196 90Z"/>`,
};
const strip = (id) => `<svg class="jn-cenario" viewBox="0 0 400 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${CENARIO[id]}</svg>`;
const cidadeSvg = '<svg class="jn-cidade-img" viewBox="0 0 200 70" aria-hidden="true" focusable="false"><g stroke="#5B3F2C" stroke-width="2" stroke-linejoin="round"><rect x="20" y="30" width="160" height="38" fill="#D9CDB0"/><rect x="34" y="14" width="22" height="54" fill="#E9D9B4"/><rect x="144" y="14" width="22" height="54" fill="#E9D9B4"/><rect x="84" y="4" width="32" height="64" fill="#E9D9B4"/><path d="M30 14L45 2L60 14M140 14L155 2L170 14M80 4L100 -8L120 4" fill="#7A1F34"/><path d="M92 68V50Q100 40 108 50V68" fill="#8A5A2B"/></g></svg>';

// ---------------------------------------------------------------- telas

const botaoGuia = '<button type="button" class="jn-guia" data-acao="guia" aria-label="Sou o responsável. Segure por dois segundos para abrir a Sala do Guia"><span class="jn-guia-barra" aria-hidden="true"></span><span class="jn-guia-texto">Sou o responsável</span></button>';

function porta(lista) {
  if (!lista.length) return `<section class="jn-porta"><h1>Casa do Vale</h1><p class="vazio">Ainda não há aulas publicadas.</p><div class="jn-rodape">${botaoGuia}</div></section>`;
  return `<section class="jn-porta" aria-labelledby="jn-titulo">
    <div class="jn-casa-grande" aria-hidden="true">${casaSvg}</div>
    <h1 id="jn-titulo">Quem vai viajar hoje?</h1>
    <ul class="jn-viajantes">${lista.map((v) => `<li><button type="button" class="toque jn-viajante" data-quem="${esc(v.id)}">${viajanteSvg(v.perfil)}<span>${esc(v.nome)}</span></button></li>`).join('')}</ul>
    <div class="jn-rodape">${botaoGuia}</div>
  </section>`;
}

const ROTULO_ESTADO = { feita: 'feita', proxima: 'próxima aula', futura: 'ainda não feita' };

function estrada(v, marcos) {
  if (!marcos.length) return '<p class="vazio">Ainda não há aulas para este caminho.</p>';
  return `<ol class="jn-estrada">${marcos.map((m) => `<li class="jn-marco-item" data-estado="${m.estado}">
      <a class="marco ${m.estado === 'proxima' ? 'atual' : m.estado === 'futura' ? 'futuro' : ''}" href="#infantil-${esc(m.aula.data)}"${m.estado === 'proxima' ? ' aria-current="step"' : ''} aria-label="Aula ${m.numero}: ${esc(m.aula.titulo)}, ${ROTULO_ESTADO[m.estado]}">
        <span class="jn-marco-fig" aria-hidden="true">${selo(m.aula.icone)}</span>
        <span class="jn-marco-num" aria-hidden="true">${m.numero}</span>
        ${m.estado === 'feita' ? '<span class="selo jn-selo" aria-hidden="true">✓</span>' : ''}
        ${m.estado === 'feita' ? florHTML() : ''}
      </a>
      <span class="jn-marco-titulo" aria-hidden="true">${esc(m.aula.titulo)}</span>
      ${m.estado === 'proxima' ? `<span class="jn-viajante-lugar">${viajanteSvg(v.perfil)}</span>` : ''}
    </li>`).join('')}</ol>`;
}

const continuar = (marcos) => {
  const prox = marcos.find((m) => m.estado === 'proxima');
  return prox
    ? `<a class="btn primario grande jn-continuar" href="#infantil-${esc(prox.aula.data)}"><span class="jn-cont-fig" aria-hidden="true">${selo(prox.aula.icone)}</span>Continuar:${esc(prox.aula.titulo)}</a>`
    : '<p class="aviso jn-fim">Todas as aulas publicadas deste caminho já foram feitas. Novas aulas chegam em breve; não há pressa.</p>';
};

/** Os quatro lugares fora da estrada. O bebê só tem a biblioteca: não há jogos, desenho nem filmes para ele. */
const LUGARES = [
  ['mosteiro', 'Mosteiro dos Livros', 'cruz'],
  ['jogos', 'Campo dos Jogos', 'ovelha'],
  ['desenhar', 'Oficina do Iluminador', 'estrela'],
  ['assistir', 'Estalagem das Histórias', 'passaro'],
];
const lugares = (soBiblioteca = false) => `<nav class="jn-lugares" aria-label="Outros lugares da casa"><ul>${LUGARES.slice(0, soBiblioteca ? 1 : 4).map(([rota, nome, fig]) => `<li><a class="toque jn-lugar" href="#${rota}"><span class="jn-lugar-fig" aria-hidden="true">${selo(fig)}</span><span>${nome}</span></a></li>`).join('')}</ul></nav>`;

const barra = (v, subtitulo) => `<header class="jn-barra">
    <button type="button" class="toque jn-casa" data-acao="trocar" aria-label="Voltar à Porta da Casa para escolher quem viaja">${casaSvg}<span>Casa</span></button>
    <div class="jn-quem"><h1>${esc(v.nome)}</h1><p class="meta">${esc(subtitulo)}</p></div>
    ${botaoGuia}
  </header>`;

function colo(v, marcos) {
  return `<section class="jn-mapa jn-colo" aria-labelledby="jn-titulo-colo">
    ${barra(v, 'No colo')}
    <h2 id="jn-titulo-colo" class="sr">Estrada das Aulas, para os pais</h2>
    <p class="meta">Para o bebê não há jogos nem toques na tela: as aulas são feitas pelos pais, nos momentos do dia. A Estrada mostra o que já foi feito.</p>
    ${continuar(marcos)}
    ${lugares(true)}
    ${estrada(v, marcos)}
  </section>`;
}

function mapa(v, marcos) {
  if (v.regiao === 'colo') return colo(v, marcos);
  const nomeAtual = REGIOES.find((r) => r.id === v.regiao).nome;
  const ordem = [...REGIOES].reverse();
  const atual = REGIOES.findIndex((r) => r.id === v.regiao);
  return `<section class="jn-mapa" data-regiao="${v.regiao}" aria-labelledby="jn-titulo-mapa">
    ${barra(v, nomeAtual)}
    <h2 id="jn-titulo-mapa" class="sr">Mapa da jornada de ${esc(v.nome)}</h2>
    ${continuar(marcos)}
    ${lugares()}
    <a class="jn-cidade" href="${CIDADE_URL}" target="_blank" rel="noopener noreferrer" aria-label="A Cidade da Verdade, ao longe: a Academia da Verdade (abre em outra aba)">${cidadeSvg}<span>A Cidade da Verdade</span></a>
    ${ordem.map((r) => {
      const idx = REGIOES.indexOf(r);
      const estado = idx === atual ? 'atual' : idx < atual ? 'passada' : 'futura';
      return `<section class="jn-regiao ${estado === 'futura' ? 'terra-futura' : ''}" data-estado="${estado}" aria-label="${esc(r.nome)}">
        ${strip(r.id)}
        <h3 class="jn-regiao-nome">${esc(r.nome)}${estado === 'futura' ? ' <span class="meta">terra ainda não visitada</span>' : ''}</h3>
        ${estado === 'atual' ? brinquedosHTML() + estrada(v, marcos) : ''}
      </section>`;
    }).join('')}
  </section>`;
}

// ---------------------------------------------------------------- comportamento

/** O botão do responsável só abre a Sala do Guia depois de segurado por dois segundos (por toque, mouse ou Enter/Espaço). */
function ligarGuia(raiz) {
  for (const botao of raiz.querySelectorAll('[data-acao="guia"]')) {
    let timer = null;
    const parar = () => { clearTimeout(timer); timer = null; botao.classList.remove('segurando'); };
    const comecar = () => {
      if (timer) return;
      botao.classList.add('segurando');
      timer = setTimeout(() => { parar(); location.hash = 'guia'; }, SEGURAR_MS);
    };
    botao.addEventListener('pointerdown', comecar);
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel', 'blur']) botao.addEventListener(ev, parar);
    botao.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); comecar(); } });
    botao.addEventListener('keyup', parar);
    botao.addEventListener('contextmenu', (e) => e.preventDefault());
    botao.addEventListener('click', (e) => e.preventDefault());
  }
}

export function jornada() {
  return '<div class="jornada" id="jn-tela" aria-busy="true"><p class="meta">Abrindo o mapa…</p></div>';
}

jornada.ligar = async (root, ctx) => {
  const tela = root.querySelector('#jn-tela');
  let filhos = [];
  let registros = [];
  try { await arm.iniciar(); [filhos, registros] = await Promise.all([arm.listarFilhos(), arm.listarAulas()]); } catch { /* sem armazenamento: o mapa mostra tudo como ainda não feito */ }
  if (!root.isConnected) return;
  const lista = viajantes(AULAS_INFANTIL, filhos);
  const v = viajanteEscolhido(lista, lerQuem());
  tela.innerHTML = v ? mapa(v, marcosDaTrilha(AULAS_INFANTIL, registros, v.id)) : porta(lista);
  tela.removeAttribute('aria-busy');
  ligarGuia(tela);
  for (const b of tela.querySelectorAll('[data-quem]')) b.addEventListener('click', () => { gravarQuem(b.dataset.quem); ctx.render(); });
  tela.querySelector('[data-acao="trocar"]')?.addEventListener('click', () => { gravarQuem(''); ctx.render(); });
  tela.querySelector('.jn-marco-item[data-estado="proxima"] .marco')?.scrollIntoView({ block: 'center' });
  if (v && v.regiao !== 'colo') { ligarBrinquedos(tela); aplicarClima(tela); } // o bebê não tem brinquedos nem animações
};
