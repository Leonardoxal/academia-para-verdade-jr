// Utilitários de interface compartilhados pelas views.
import { ETIQUETAS } from './data/fontes.js';

/** Escapa texto do usuário antes de inserir em HTML. */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const barra = (pct, rotulo = '') =>
  `<div class="barra" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(rotulo || 'Progresso')}"><span style="width:${Math.max(0, Math.min(100, pct))}%"></span></div>`;

export const fmtData = (t) => (t ? new Date(t).toLocaleDateString('pt-BR') : '—');
export const fmtMin = (m) => { const h = Math.floor(m / 60), r = Math.round(m % 60); return h ? `${h} h ${r ? `${r} min` : ''}`.trim() : `${r} min`; };
export const hojeISO = () => new Date().toISOString().slice(0, 10);
export const novoId = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const link = (href, texto, cls = '') => `<a href="#${href}" class="${cls}">${texto}</a>`;
export const linkExterno = (l) => (l ? `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" class="externo">${esc(l.rotulo || l.url)} ↗</a>` : '');

export const etiqueta = (tipo) => `<span class="etq etq-${tipo}">${ETIQUETAS[tipo].rotulo}</span>`;

export const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const ESTADOS_LIVRO = { nao: 'Não iniciado', lendo: 'Lendo', pausado: 'Pausado', concluido: 'Concluído' };
export const TIPOS_LIVRO = { primaria: 'Fonte primária', secundaria: 'Estudo secundário', referencia: 'Obra de referência' };

let toastTimer;
export function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

/** Copia texto para a área de transferência; se o navegador recusar, seleciona o texto no campo indicado. */
export async function copiar(texto, campo) {
  try { await navigator.clipboard.writeText(texto); toast('Copiado.'); return true; } catch {
    if (campo) { campo.hidden = false; campo.value = texto; campo.focus(); campo.select(); toast('Copie com Ctrl+C (ou toque e segure).'); }
    return false;
  }
}

/** Oferece um arquivo para salvar usando a capacidade "downloads" do claude.ai; devolve false se indisponível. */
export async function salvarArquivo(filename, data) {
  try {
    const d = await window.claude?.use?.('downloads');
    if (!d) return false;
    await d.save({ filename, data });
    return true;
  } catch { return false; }
}

export const favKey = (tipo, id) => `${tipo}:${id}`;
export const botaoFav = (estado, tipo, id) => {
  const on = estado.favoritos.includes(favKey(tipo, id));
  return `<button class="fav ${on ? 'on' : ''}" data-acao="fav" data-chave="${favKey(tipo, id)}" aria-pressed="${on}" title="${on ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">${on ? '★' : '☆'}<span class="sr">Favorito</span></button>`;
};
