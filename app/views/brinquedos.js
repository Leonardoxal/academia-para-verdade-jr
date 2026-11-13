// Brinquedos do Mapa (#infantil), clima do lugar e a cidade da família (Sala do Guia).
// Regras (PROMPT_REDESIGN_JORNADA_JR.md, seção 5): cada brinquedo é um botão de 64 px ou mais, responde ao toque e ao teclado,
// roda uma vez e para sozinho, e só anima transform e opacity. Com prefers-reduced-motion não há movimento: o botão só
// muda de estado por um instante. Sem som, sem pontos, sem laço.
import { toast } from '../ui.js';
import { selo } from '../infantil/ilustracoes.js';
import { climaDeHoje, cidadeGuardada, escolherCidade, esquecerCidade } from '../infantil/clima.js';

const sem = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const TRACO = 'stroke="#5B3F2C" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"';
const svg = (corpo) => `<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true" focusable="false"><g ${TRACO}>${corpo}</g></svg>`;

const FIGURAS = {
  coruja: svg('<ellipse cx="24" cy="28" rx="13" ry="15" fill="#8A5A2B"/><path d="M13 18L11 6L21 13M35 18L37 6L27 13" fill="#8A5A2B"/><circle cx="18" cy="22" r="5" fill="#F4EFE4"/><circle cx="30" cy="22" r="5" fill="#F4EFE4"/><circle cx="18" cy="22" r="1.8" fill="#2b2118" stroke="none"/><circle cx="30" cy="22" r="1.8" fill="#2b2118" stroke="none"/><path d="M22 27L24 31L26 27Z" fill="#E6A32A"/>'),
  moinho: svg('<path d="M16 44L20 20H28L32 44Z" fill="#E9D9B4"/><g class="giro"><path d="M24 20L24 3M24 20L41 20M24 20L24 37M24 20L7 20" fill="none" stroke-width="3"/><path d="M24 3L31 3L24 11M41 20L41 27L33 20M24 37L17 37L24 29M7 20L7 13L15 20" fill="#F4EFE4"/></g><circle cx="24" cy="20" r="3" fill="#7A1F34"/>'),
  lanterna: svg('<path d="M24 4V9M18 44H30L32 38H16Z" fill="#8A5A2B"/><rect x="17" y="9" width="14" height="29" rx="3" fill="#E9D9B4"/><ellipse class="brilho" cx="24" cy="23" rx="5" ry="8" fill="#F2C14E" stroke="none"/>'),
};

const BRINQUEDOS = [
  { id: 'animal', dia: ['Ovelha', selo('ovelha')], noite: ['Coruja', FIGURAS.coruja] },
  { id: 'astro', dia: ['Sol', selo('sol')], noite: ['Estrela', selo('estrela')] },
  { id: 'luz', dia: ['Moinho', FIGURAS.moinho], noite: ['Lanterna', FIGURAS.lanterna] },
];

/** Três brinquedos do lugar onde o viajante está. Dia e noite saem do tema (claro ou escuro) só por CSS. */
export const brinquedosHTML = () => `<div class="jn-brinquedos" role="group" aria-label="Brinquedos do caminho">${BRINQUEDOS.map((b) => `<button type="button" class="toque jn-brinq" data-brinq="${b.id}">
    <span class="so-dia"><span class="jn-brinq-fig">${b.dia[1]}</span><span>${b.dia[0]}</span></span>
    <span class="so-noite"><span class="jn-brinq-fig">${b.noite[1]}</span><span>${b.noite[0]}</span></span></button>`).join('')}</div>`;

export const florHTML = () => `<svg class="jn-flor" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><g ${TRACO} stroke-width="1.5"><path d="M12 22V13" fill="none"/><g fill="#E8A0B4"><circle cx="12" cy="7" r="3.5"/><circle cx="7.5" cy="11" r="3.5"/><circle cx="16.5" cy="11" r="3.5"/></g><circle cx="12" cy="10" r="2.5" fill="#F2C14E"/></g></svg>`;

const noite = () => document.documentElement.dataset.theme === 'dark';

/** Roda uma animação finita e guarda a anterior para cancelar: tocar de novo recomeça, nunca acumula. */
function tocar(el, quadros, opcoes) {
  el.__anim?.cancel();
  if (sem() || !el.animate) return;
  el.__anim = el.animate(quadros, { fill: 'none', ...opcoes });
}

const MOVIMENTO = {
  animal: (fig) => tocar(fig, [{ transform: 'translateY(0)' }, { transform: 'translateY(-16px)' }, { transform: 'translateY(0)' }, { transform: 'translateY(-10px)' }, { transform: 'translateY(0)' }], { duration: 900, easing: 'ease-out' }),
  astro: (fig) => tocar(fig, noite() ? [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }] : [{ transform: 'rotate(0)' }, { transform: 'rotate(180deg)' }], { duration: 900, easing: 'ease-in-out' }),
  luz: (fig, botao) => {
    if (noite()) { botao.classList.add('acesa'); setTimeout(() => botao.classList.remove('acesa'), 4000); return; }
    const pas = fig.querySelector('.giro');
    if (pas) tocar(pas, [{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 1600, easing: 'ease-in-out' });
  },
};

/** Liga os brinquedos, a caminhada do viajante e as flores. Tudo acontece uma vez, quando o mapa abre. */
export function ligarBrinquedos(root) {
  root.querySelectorAll('.jn-brinq').forEach((botao) => {
    botao.addEventListener('click', () => {
      const fig = botao.querySelector(noite() ? '.so-noite .jn-brinq-fig' : '.so-dia .jn-brinq-fig');
      MOVIMENTO[botao.dataset.brinq](fig, botao);
      botao.classList.add('tocado'); // com movimento reduzido, é a única resposta visual
      setTimeout(() => botao.classList.remove('tocado'), 900);
    });
  });
  const viajante = root.querySelector('.jn-viajante-lugar');
  if (viajante) tocar(viajante, [{ transform: 'translateY(70px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 1100, easing: 'ease-out' });
  root.querySelectorAll('.jn-flor').forEach((f, i) => tocar(f, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 500, delay: 200 + i * 150, easing: 'ease-out', fill: 'backwards' }));
}

// ---------------------------------------------------------------- clima

const NOME_CLIMA = { limpo: 'céu limpo', nublado: 'nublado', chuva: 'chuva', vento: 'vento', neblina: 'neblina' };

/** Põe o clima real do lugar da família sobre o cenário. Sem cidade ou sem rede, o clima é "limpo" e nada muda. */
export async function aplicarClima(root) {
  const clima = await climaDeHoje();
  const regiao = root.querySelector('.jn-regiao[data-estado="atual"]');
  if (!root.isConnected || !regiao) return;
  root.dataset.clima = clima;
  regiao.insertAdjacentHTML('afterbegin', `<div class="jn-tempo" aria-hidden="true"></div><span class="sr" role="status">Clima de hoje: ${NOME_CLIMA[clima]}.</span>`);
  const tempo = regiao.querySelector('.jn-tempo');
  if (sem()) return;
  if (clima === 'chuva') {
    tempo.innerHTML = Array.from({ length: 8 }, (_, i) => `<i class="pingo" style="left:${8 + i * 12}%"></i>`).join('');
    tempo.querySelectorAll('.pingo').forEach((p, i) => p.animate([{ transform: 'translateY(-10px)', opacity: 0 }, { opacity: 1, offset: .2 }, { transform: 'translateY(100px)', opacity: 0 }], { duration: 1000, delay: i * 180 }));
  } else if (clima === 'vento') {
    tempo.innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="folha" style="top:${18 + i * 14}%"></i>`).join('');
    tempo.querySelectorAll('.folha').forEach((f, i) => f.animate([{ transform: 'translateX(-30px) rotate(0)', opacity: 0 }, { opacity: 1, offset: .2 }, { transform: 'translateX(420px) rotate(300deg)', opacity: 0 }], { duration: 2800, delay: i * 350 }));
  }
}

// ---------------------------------------------------------------- cidade, na Sala do Guia

export const cidadeHTML = () => `<section class="inf-caixa inf-cidade" aria-labelledby="inf-cidade-titulo">
    <h2 id="inf-cidade-titulo">Clima do mapa</h2>
    <p class="meta">Para a criança se sentir dentro do mundo, o mapa mostra o tempo real da sua cidade (céu limpo, nublado, chuva, vento ou neblina). Escolha a cidade uma vez. Ela fica só neste aparelho. Para buscar o tempo, o site envia ao serviço gratuito Open-Meteo o nome da cidade e depois as coordenadas arredondadas a cerca de 10 km. Nenhum dado da criança vai junto, e o site não pede a localização do aparelho. Sem cidade, o mapa fica com céu limpo.</p>
    <form id="inf-cidade-form" class="inf-filho-campos"><label class="campo"><span>Cidade</span><input name="cidade" maxlength="80" autocomplete="off"></label>
      <div class="inf-acoes"><button class="btn primario" type="submit">Guardar cidade</button><button class="btn" type="button" id="inf-cidade-esquecer">Esquecer a cidade</button></div></form>
    <p class="meta" id="inf-cidade-estado" aria-live="polite"></p>
  </section>`;

export function ligarCidade(root) {
  const estado = root.querySelector('#inf-cidade-estado');
  const campo = root.querySelector('#inf-cidade-form input');
  const mostrar = () => { const c = cidadeGuardada(); estado.textContent = c ? `Cidade guardada: ${c.nome}.` : 'Nenhuma cidade guardada.'; if (c) campo.value = c.nome; };
  mostrar();
  root.querySelector('#inf-cidade-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    try { const c = await escolherCidade(campo.value); toast(`Cidade guardada: ${c.nome}.`); mostrar(); } catch (e) { toast(e.message || 'Não foi possível guardar a cidade.'); }
  });
  root.querySelector('#inf-cidade-esquecer').addEventListener('click', () => { esquecerCidade(); campo.value = ''; mostrar(); });
}
