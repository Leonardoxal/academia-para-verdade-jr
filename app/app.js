import { cruz } from './ornamentos.js';
import { esc, toast } from './ui.js';
import { infantil, aulaInfantil } from './views/infantil.js';
import { jogos, jogo } from './views/jogos.js';
import { assistir, obraInfantil, acompanhamento } from './views/assistir.js';
import { desenhar } from './views/desenho.js';
import { entrar } from './views/entrar.js';
import { sair } from './nuvem.js';

const NAV = [['infantil', 'Infantil'], ['jogos', 'Jogos']];
const ROTAS = { infantil, jogos, assistir, desenhar, entrar };
const PREFIXOS = [
  ['acompanhar-', acompanhamento],
  ['assistir-', obraInfantil],
  ['infantil-', aulaInfantil],
  ['jogo-', jogo],
];
const conteudo = document.getElementById('conteudo');
const ctx = {
  nav: (rota) => { location.hash = rota; },
  render: () => render(),
  async aoEntrar() { location.hash = 'infantil'; render(); },
  async sair() { await sair(); location.hash = 'infantil'; render(); },
};

function resolver(token) {
  if (ROTAS[token]) return { view: ROTAS[token], id: null, secao: token === 'jogos' ? 'jogos' : 'infantil' };
  for (const [prefixo, view] of PREFIXOS) {
    if (token.startsWith(prefixo)) return { view, id: token.slice(prefixo.length), secao: prefixo === 'jogo-' ? 'jogos' : 'infantil' };
  }
  return { view: infantil, id: null, secao: 'infantil' };
}

function render() {
  const token = location.hash.slice(1) || 'infantil';
  const { view, id, secao } = resolver(token);
  const raiz = document.createElement('div');
  raiz.className = 'vista';
  try {
    raiz.innerHTML = view(ctx, id);
  } catch (error) {
    raiz.innerHTML = `<p class="aviso"><strong>Não foi possível abrir esta página.</strong> ${esc(error.message)} <a href="#infantil">Voltar ao início</a></p>`;
  }
  conteudo.replaceChildren(raiz);
  try {
    const resultado = view.ligar?.(raiz, ctx, id);
    resultado?.catch?.((error) => toast(error.message));
  } catch (error) {
    toast(`Erro ao abrir a página: ${error.message}`);
  }
  document.querySelectorAll('.nav a').forEach((link) => {
    link.setAttribute('aria-current', link.dataset.secao === secao ? 'page' : 'false');
  });
}

document.querySelector('.nav ul').innerHTML = NAV.map(([rota, nome]) => `<li><a href="#${rota}" data-secao="${rota === 'jogos' ? 'jogos' : 'infantil'}">${nome}</a></li>`).join('');
window.addEventListener('hashchange', () => {
  render();
  window.scrollTo(0, 0);
  conteudo.focus({ preventScroll: true });
});

document.getElementById('emblema').innerHTML = cruz(34);
const TEMAS = ['auto', 'light', 'dark'];
const NOMES_TEMA = { auto: 'automático', light: 'claro', dark: 'escuro' };
const botaoTema = document.getElementById('tema');
function aplicarTema(tema) {
  if (tema === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = tema;
  botaoTema.textContent = `Tema: ${NOMES_TEMA[tema]}`;
}
let tema = 'auto';
try {
  const salvo = localStorage.getItem('academia-verdade-tema');
  if (TEMAS.includes(salvo)) tema = salvo;
} catch { /* O tema automático continua disponível sem armazenamento. */ }
aplicarTema(tema);
botaoTema.addEventListener('click', () => {
  tema = TEMAS[(TEMAS.indexOf(tema) + 1) % TEMAS.length];
  aplicarTema(tema);
  try { localStorage.setItem('academia-verdade-tema', tema); } catch { /* A preferência vale até fechar esta aba. */ }
});

render();
