// Aba Jogos (#jogos, #jogo-<id>): três jogos educativos da Academia Infantil, com níveis sem fim.
// Cada filho tem o seu nível em cada jogo (guardado neste aparelho). O limite de tela por dia é opcional.
// Sem placar, sem tempo correndo, sem som de erro: errar mostra a resposta com calma e o jogo fica mais fácil.
import { esc, link } from '../ui.js';
import { JOGOS, ajustar, progressoInicial, LIMITES, hojeISO, usadoHoje, acabou, BRINCADEIRAS } from '../infantil/jogos.js';
import { criarArmazenamento } from '../infantil/armazenamento.js';
import { clienteNuvem, usuarioNuvem } from '../nuvem.js';
import { FAMILIA_ATIVA } from '../infantil/config.js';
import { anotarResposta, recorde, resumoJogo, recomendar, anosCompletos, nivelAtual, desafiosConcluidos } from '../infantil/historico.js';

// Armazenamento próprio (mesmo cadastro de filhos da aba Infantil). Não importa de views/infantil.js:
// se o navegador guardar uma versão antiga daquele arquivo, a aba não pode quebrar o site inteiro.
const arm = criarArmazenamento({ obterCliente: clienteNuvem, obterUsuario: usuarioNuvem, familiaAtiva: FAMILIA_ATIVA });

const LIBERAR_MS = 5 * 60000; // o adulto libera mais 5 minutos
const SEGURAR_MS = 3000; // segurar o botão do adulto por 3 segundos
const ESPERA_ACERTO = 1400;
const ESPERA_ERRO = 2200;
const ESPERA_EXPLICAR = 5000; // no jogo das virtudes, tempo de ouvir a explicação
const SALVAR_MS = 10000; // grava a partida em andamento a cada 10 s (e ao sair)

// ---------------------------------------------------------------- guardado no aparelho

const ler = (k, padrao) => { try { return JSON.parse(localStorage.getItem(k)) ?? padrao; } catch { return padrao; } };
const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento: vale só nesta visita */ } };
const quem = () => ler('aci-jogos-quem', 'familia');
const progressoDe = (filho) => ler(`aci-jogos-prog-${filho}`, {});
const nivelDe = (filho, jogo) => progressoDe(filho)[jogo]?.nivel ?? 1;
const limite = () => Number(ler('aci-jogos-limite', 0)) || 0;
const usado = () => usadoHoje(ler('aci-jogos-tempo', null));
const somarTempo = (ms) => gravar('aci-jogos-tempo', { dia: hojeISO(), ms: Math.max(0, usado() + ms) });

// ---------------------------------------------------------------- voz e som

function falar(texto, idioma = 'pt-BR', depois = null) {
  const s = globalThis.speechSynthesis;
  if (!s || !texto) { depois?.(); return; }
  s.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  if (depois) { u.onend = depois; u.onerror = depois; }
  u.lang = idioma;
  const vozes = s.getVoices();
  u.voice = vozes.find((v) => v.lang.replace('_', '-') === idioma) ?? vozes.find((v) => v.lang.startsWith(idioma.slice(0, 2))) ?? null;
  u.rate = 0.88;
  s.speak(u);
}

let audio;
/** Um acorde curto de sino no acerto (sem arquivo de som). */
function sino() {
  try {
    audio ??= new AudioContext();
    const t = audio.currentTime;
    [784, 988, 1175].forEach((f, i) => {
      const o = audio.createOscillator(); const g = audio.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.18, t + i * 0.07 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.9);
      o.connect(g).connect(audio.destination); o.start(t + i * 0.07); o.stop(t + i * 0.07 + 1);
    });
  } catch { /* sem áudio: o jogo segue só com a luz */ }
}

/** Toca as notas uma depois da outra (o jogo "Agudo ou grave?"), com o próprio navegador. */
function tocar(notas) {
  try {
    audio ??= new AudioContext();
    const t0 = audio.currentTime + 0.1;
    notas.forEach((f, i) => {
      const o = audio.createOscillator(); const g = audio.createGain();
      const t = t0 + i * 0.75;
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      o.connect(g).connect(audio.destination); o.start(t); o.stop(t + 0.65);
    });
  } catch { /* sem áudio: o adulto pode cantar as notas */ }
}

const ELOGIOS = ['Muito bem!', 'Isso!', 'Acertou!', 'Que bom!', 'Parabéns!'];
const elogio = () => ELOGIOS[Math.floor(Math.random() * ELOGIOS.length)];

// ---------------------------------------------------------------- desenhos

// Formas de vidro do jogo "O que vem depois?" (viewBox 0 0 100 100).
const FORMA = {
  circulo: '<circle cx="50" cy="50" r="38"/>',
  triangulo: '<polygon points="50,10 92,86 8,86"/>',
  quadrado: '<rect x="14" y="14" width="72" height="72" rx="8"/>',
  estrela: '<polygon points="50,6 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38"/>',
  cruz: '<path d="M38 8h24v26h26v24H62v34H38V58H12V34h26z"/>',
  coracao: '<path d="M50 88C18 66 6 50 6 32 6 18 17 8 30 8c9 0 16 5 20 12 4-7 11-12 20-12 13 0 24 10 24 24 0 18-12 34-44 56z"/>',
};
const TAM = { p: 0.55, m: 0.8, g: 1 };
const peca = (x) => {
  const s = TAM[x.tam] ?? 0.8;
  return `<svg class="jg-forma jg-${esc(x.cor)}" viewBox="0 0 100 100" aria-hidden="true"><g transform="translate(50 50) scale(${s}) translate(-50 -50)">${FORMA[x.forma]}</g></svg>`;
};
const NOME_FORMA = { circulo: 'círculo', triangulo: 'triângulo', quadrado: 'quadrado', estrela: 'estrela', cruz: 'cruz', coracao: 'coração' };
const NOME_COR = { rubi: 'vermelho', safira: 'azul', esmeralda: 'verde', ambar: 'amarelo' };
const NOME_TAM = { p: 'pequeno', m: '', g: 'grande' };
const rotuloPeca = (x) => [NOME_FORMA[x.forma], NOME_COR[x.cor], NOME_TAM[x.tam]].filter(Boolean).join(' ');

const grupo = (qtd, e, sai = 0) => `<span class="jg-grupo${qtd > 10 ? ' denso' : qtd <= 3 ? ' poucos' : ''}" aria-hidden="true">${Array.from({ length: qtd }, (_, i) => `<span${i >= qtd - sai ? ' class="sai"' : ''}>${e}</span>`).join('')}</span>`;
const pontos = (n) => `<span class="jg-pontos" aria-hidden="true">${'●'.repeat(n)}</span>`;

// Janela gótica de vidro (a capa de cada jogo): arco ogival, chumbo e vidros da cor do jogo.
const ARCO = 'M12 228V96C12 52 40 22 80 8c40 14 68 44 68 88v132z';
const DESENHO_CAPA = {
  quantos: '<text x="80" y="140" text-anchor="middle" font-size="38">🐑</text><text x="52" y="184" text-anchor="middle" font-size="32">🐑</text><text x="108" y="184" text-anchor="middle" font-size="32">🐑</text>',
  depois: `<g transform="translate(26 132) scale(.3)" class="a">${FORMA.estrela}</g><g transform="translate(65 132) scale(.3)" class="b">${FORMA.cruz}</g><g transform="translate(104 132) scale(.3)" class="a">${FORMA.estrela}</g><text x="80" y="196" text-anchor="middle" font-size="34" class="q">?</text>`,
  ouvir: '<text x="80" y="166" text-anchor="middle" font-size="50">🔔</text><path class="onda" d="M118 126q12 14 0 28M128 116q22 24 0 48M42 126q-12 14 0 28M32 116q-22 24 0 48"/>',
  numeros: '<text x="80" y="170" text-anchor="middle" class="q" style="font-size:52px">100</text>',
  palavras: '<text x="54" y="166" text-anchor="middle" font-size="40">🐝</text><text x="106" y="166" text-anchor="middle" font-size="40">🍯</text>',
  ciencias: '<text x="54" y="166" text-anchor="middle" font-size="40">🐧</text><text x="106" y="166" text-anchor="middle" font-size="40">🧊</text>',
  virtudes: '<text x="80" y="170" text-anchor="middle" font-size="52">🤝</text>',
  tempo: '<text x="54" y="166" text-anchor="middle" font-size="36">🌱</text><text x="106" y="166" text-anchor="middle" font-size="36">🌳</text>',
  calculo: '<text x="80" y="168" text-anchor="middle" class="q" style="font-size:44px">7×8</text>',
  espanhol: '<text x="80" y="168" text-anchor="middle" class="q" style="font-size:40px">¡Hola!</text>',
  musica: '<text x="80" y="170" text-anchor="middle" font-size="52">🎵</text>',
  geografia: '<text x="80" y="170" text-anchor="middle" font-size="52">🌎</text>',
  leitura: '<text x="80" y="170" text-anchor="middle" font-size="52">📖</text>',
  desenho: '<text x="80" y="170" text-anchor="middle" font-size="52">🎨</text>',
  silabas: '<text x="80" y="168" text-anchor="middle" class="q" style="font-size:40px">CA__</text>',
  estrategia: '<text x="80" y="166" text-anchor="middle" font-size="30">⚪⚪⚪</text><text x="80" y="196" text-anchor="middle" font-size="30">⚪⚪</text>',
};
const capa = (id) => `<svg class="jg-capa" viewBox="0 0 160 236" aria-hidden="true">
  <path class="vidro" d="${ARCO}"/>
  <g class="tons"><path class="claro" d="M80 8 80 88 30 52C40 30 58 16 80 8z"/><path class="escuro" d="M80 8 80 88 130 52C120 30 102 16 80 8z"/><path class="escuro" d="M12 96 30 52 80 88 12 96z"/><path class="claro" d="M148 96 130 52 80 88z"/><path class="claro" d="M12 200h28v28H12z"/><path class="escuro" d="M120 200h28v28h-28z"/><path class="escuro" d="M12 96h24v104H12z"/><path class="claro" d="M124 96h24v104h-24z"/></g>
  <g class="chumbo-fino"><path d="M12 96h136M80 8v80M30 52l50 36 50-36M12 200h136M40 200v28M120 200v28"/></g>
  <circle class="medalhao" cx="80" cy="152" r="56"/>
  <g class="figura">${DESENHO_CAPA[id]}</g>
  <path class="chumbo" d="${ARCO}"/>
</svg>`;

// ---------------------------------------------------------------- telas

export function jogos() {
  return `<section class="infantil jogos">
    <header class="cab jg-cab">
      <h1>Jogos da Academia</h1>
      <p class="sub">Janelas de vidro colorido, dos 2 aos 15 anos. Cada acerto acende a luz; três acertos seguidos sobem um nível, e os níveis não acabam. A idade de cada jogo é indicação; o nível acompanha o que a criança mostra.</p>
    </header>
    <div class="jg-janelas">${Object.values(JOGOS).map((j) => `<a class="jg-janela jg-tema-${j.id}" href="#jogo-${j.id}">
      ${capa(j.id)}
      <span class="jg-janela-txt"><strong>${esc(j.titulo)}</strong><span>${esc(j.area)} · ${j.idade[0]} a ${j.idade[1]} anos</span><span class="jg-nivel-capa" data-nivel="${j.id}">Nível 1</span><span class="meta" data-recorde="${j.id}"></span></span></a>`).join('')}
      <a class="jg-janela jg-tema-desenho" href="#desenhar">${capa('desenho')}<span class="jg-janela-txt"><strong>Desenho livre</strong><span>Artes · 2 a 15 anos</span><span class="meta">sem nível nem placar</span></span></a></div>
    <section class="inf-caixa jg-pais" aria-labelledby="jg-pais-titulo">
      <h2 id="jg-pais-titulo">Para os pais</h2>
      <fieldset class="jg-quem"><legend>Quem vai jogar?</legend><div id="jg-filhos" class="jg-chips"></div></fieldset>
      <div id="jg-recomendados" aria-live="polite"></div>
      <details class="jg-historico"><summary><strong>Histórico e recordes</strong></summary><div id="jg-hist"></div></details>
      <details class="jg-historico" open><summary><strong>Fora da tela</strong></summary>
        <p class="meta">Brincadeiras e jogos de mesa que trabalham o mesmo que as janelas, com o corpo, as mãos e a família. Valem mais que a tela.</p>
        <ul class="jg-fora" id="jg-fora">${BRINCADEIRAS.map((b) => `<li data-idade="${b.idade[0]}-${b.idade[1]}"><strong>${esc(b.nome)}</strong> <span class="meta">(${b.idade[0]} a ${b.idade[1]} anos; ${esc(b.habilidades.join(', '))})</span><br>${esc(b.como)}</li>`).join('')}</ul></details>
      <label class="campo jg-limite"><span>Limite de tela por dia</span><select id="jg-limite">${LIMITES.map((m) => `<option value="${m}">${m ? `${m} minutos` : 'Sem limite'}</option>`).join('')}</select></label>
      <p class="meta" id="jg-usado" aria-live="polite"></p>
      <p class="meta">Jogue junto com a criança: a voz faz a pergunta, e o adulto comenta e conversa. Para crianças de 2 a 5 anos, a Academia Americana de Pediatria recomenda no máximo cerca de 1 hora de tela por dia, com um adulto junto; bebês não usam tela. O nível atual de cada filho fica neste aparelho; o histórico e os recordes vão para a nuvem da família quando a conta está na família.</p>
    </section>
  </section>`;
}

export function jogo(ctx, id) {
  const j = JOGOS[id];
  if (!j) return `<p class="aviso">Jogo não encontrado. ${link('jogos', 'Voltar aos jogos')}</p>`;
  return `<section class="infantil jogos jg-jogo jg-tema-${j.id}">
    <div class="jg-barra">
      <a class="btn pequeno" href="#jogos">Voltar aos jogos</a>
      <span class="jg-titulo">${esc(j.titulo)}</span>
      <span class="jg-nivel" id="jg-nivel" aria-live="polite"></span>
      <span class="meta" id="jg-recorde" aria-live="polite"></span>
      <span class="meta" id="jg-resta"></span>
    </div>
    <div class="jg-painel" id="jg-painel">
      <div class="jg-inicio">
        ${capa(j.id)}
        <button class="btn primario jg-comecar" type="button" id="jg-comecar">Começar</button>
        <p class="jg-ajuda">${esc(j.ajuda)}</p>
      </div>
    </div>
    <p class="meta jg-legenda" id="jg-legenda" aria-live="polite"></p>
    <div class="jg-descanso" id="jg-descanso" hidden role="dialog" aria-modal="true" aria-labelledby="jg-descanso-titulo">
      <div class="jg-descanso-caixa">
        <h2 id="jg-descanso-titulo">Hora de descansar os olhos</h2>
        <p>Acabou o tempo de jogo de hoje. Que tal contar as coisas da casa, de verdade, com as mãos?</p>
        <button class="btn" type="button" id="jg-liberar">Adulto: segure 3 segundos para liberar mais 5 minutos</button>
        <a class="btn pequeno" href="#jogos">Voltar aos jogos</a>
      </div>
    </div>
  </section>`;
}

// ---------------------------------------------------------------- comportamento: página inicial

jogos.ligar = async (root) => {
  const caixa = root.querySelector('#jg-filhos');
  const seletor = root.querySelector('#jg-limite');
  seletor.value = String(limite());
  const mostrarUso = () => {
    const l = limite(); const min = Math.floor(usado() / 60000);
    root.querySelector('#jg-usado').textContent = l ? `Hoje: ${min} de ${l} minutos usados.` : `Hoje: ${min} minuto(s) de jogo.`;
  };
  seletor.addEventListener('change', () => { gravar('aci-jogos-limite', Number(seletor.value)); mostrarUso(); });
  mostrarUso();

  let filhos = [];
  // Nível atual, recorde, jogos sugeridos e histórico do filho escolhido (nunca de dois filhos lado a lado).
  let partidas = [];
  const mostrarFilho = async () => {
    root.querySelectorAll('[data-nivel]').forEach((el) => { el.textContent = `Nível ${nivelDe(quem(), el.dataset.nivel)}`; });
    partidas = [];
    try { partidas = await arm.listarPartidas(quem()); } catch { /* sem histórico: mostra só o nível */ }
    if (!root.isConnected) return;
    // o nível pode ter subido em outro aparelho da família: vale o mais recente
    root.querySelectorAll('[data-nivel]').forEach((el) => { el.textContent = `Nível ${nivelAtual(progressoDe(quem())[el.dataset.nivel], partidas, el.dataset.nivel)?.nivel ?? 1}`; });
    root.querySelectorAll('[data-recorde]').forEach((el) => { const r = recorde(partidas, el.dataset.recorde); el.textContent = r ? `Recorde: nível ${r}` : ''; });
    const anos = anosCompletos(filhos.find((f) => f.id === quem())?.nascimento);
    const sug = recomendar(Object.values(JOGOS), partidas, anos);
    root.querySelector('#jg-recomendados').innerHTML = sug.length ? `<p><strong>Sugeridos para hoje:</strong></p><ul>${sug.map((s) => `<li>${link(`jogo-${s.id}`, esc(JOGOS[s.id].titulo))}: ${esc(s.motivo)}</li>`).join('')}</ul>` : '';
    root.querySelector('#jg-hist').innerHTML = historicoHTML(partidas);
    // fora da tela: só as brincadeiras da idade do filho (todas, se o nascimento não foi informado)
    root.querySelectorAll('#jg-fora li').forEach((li) => { const [de, ate] = li.dataset.idade.split('-').map(Number); li.hidden = anos !== null && (anos < de || anos > ate); });
  };
  try { await arm.iniciar(); filhos = await arm.listarFilhos(); } catch { /* sem cadastro: joga como família */ }
  if (!root.isConnected) return;
  const opcoes = filhos.length ? filhos.map((f) => ({ id: f.id, nome: f.nome })) : [{ id: 'familia', nome: 'Família' }];
  if (!opcoes.some((o) => o.id === quem())) gravar('aci-jogos-quem', opcoes[0].id);
  caixa.innerHTML = opcoes.map((o) => `<label class="jg-chip"><input type="radio" name="jg-quem" value="${esc(o.id)}"${o.id === quem() ? ' checked' : ''}><span>${esc(o.nome)}</span></label>`).join('')
    + (filhos.length ? '' : `<span class="meta">Cadastre os filhos na aba ${link('infantil', 'Infantil')} para guardar o nível de cada um.</span>`);
  caixa.addEventListener('change', (ev) => { gravar('aci-jogos-quem', ev.target.value); mostrarFilho(); });
  // observação do adulto numa partida: grava ao sair do campo
  root.querySelector('#jg-hist').addEventListener('change', async (ev) => {
    const campo = ev.target.closest('[data-obs]');
    const p = campo && partidas.find((x) => x.id === campo.dataset.obs);
    if (!p) return;
    try { await arm.salvarPartida({ ...p, obs: campo.value.trim().slice(0, 1000) }); p.obs = campo.value.trim().slice(0, 1000); campo.classList.add('salvo'); } catch { campo.classList.remove('salvo'); alert('Não foi possível salvar a observação agora.'); }
  });
  mostrarFilho();
};

const dataCurta = (ms) => new Date(ms).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const pct = (x) => (x === null ? '—' : `${Math.round(x * 100)}%`);

/** Evolução por jogo e as últimas partidas. O tempo não aparece: aqui conta acertar, não ser rápido. */
function historicoHTML(partidas) {
  const jogadas = partidas.filter((x) => x.acertos + x.erros > 0);
  if (!jogadas.length) return '<p class="meta">Nenhuma partida registrada ainda para este filho.</p>';
  const resumos = Object.values(JOGOS).map((j) => ({ j, r: resumoJogo(partidas, j.id) })).filter((x) => x.r.partidas);
  return `<table class="inf-tabela"><caption class="meta">Por jogo (acertos das últimas 5 partidas; desafios são os níveis 5, 10, 15, 20 e 30)</caption><tr><th>Jogo</th><th>Partidas</th><th>Recorde</th><th>Acertos</th><th>Desafios</th><th>Última vez</th></tr>
    ${resumos.map(({ j, r }) => { const d = desafiosConcluidos(partidas, j.id); return `<tr><td>${esc(j.titulo)}</td><td>${r.partidas}</td><td>Nível ${r.recorde}</td><td>${pct(r.precisao)}</td><td>${d.length ? `nível ${d.join(', ')}` : '—'}</td><td>${dataCurta(r.ultima)}</td></tr>`; }).join('')}</table>
    <table class="inf-tabela"><caption class="meta">Últimas partidas. Anote o que viu: se jogou sozinha, se precisou de ajuda, o que achou difícil.</caption><tr><th>Quando</th><th>Jogo</th><th>Nível</th><th>Acertos</th><th>Erros</th><th>Observação do adulto</th></tr>
    ${jogadas.slice(0, 12).map((x) => `<tr><td>${dataCurta(x.inicio)}</td><td>${esc(JOGOS[x.jogo]?.titulo ?? x.jogo)}</td><td>${x.nivelInicial} → ${x.nivelFinal} (máx. ${x.nivelMax})</td><td>${x.acertos}</td><td>${x.erros}</td><td><input class="jg-obs" data-obs="${esc(x.id)}" maxlength="1000" value="${esc(x.obs ?? '')}" aria-label="Observação da partida de ${esc(dataCurta(x.inicio))}"></td></tr>`).join('')}</table>
    <p class="meta">Velocidade não é inteligência: o histórico mostra nível e acertos. Use-o para ver o que reforçar, não para comparar irmãos.</p>`;
}

// ---------------------------------------------------------------- comportamento: uma partida

function opcaoHTML(id, r, o) {
  let dentro; let rotulo;
  if (o.qtd !== undefined) { dentro = grupo(o.qtd, o.e); rotulo = String(o.qtd); }
  else if (o.num !== undefined) { dentro = `<span class="jg-num">${o.num}</span>${o.pontos ? pontos(o.num) : ''}`; rotulo = String(o.num); }
  else if (o.txt !== undefined) { dentro = `<span class="jg-txt">${esc(o.txt)}</span>`; rotulo = o.txt; }
  else if (o.e) { dentro = `<span class="jg-figura" aria-hidden="true">${o.e}</span>${o.pt && r.tipo !== 'palavra' && r.tipo !== 'ingles' && r.tipo !== 'som' && r.tipo !== 'combina' && r.tipo !== 'intruso' ? `<span class="jg-palavra">${esc(o.pt)}</span>` : ''}`; rotulo = o.pt; }
  else { dentro = peca(o); rotulo = rotuloPeca(o); }
  return `<button class="jg-vidro${r.tipo === 'mais' ? ' largo' : ''}" type="button" data-chave="${esc(o.chave)}" aria-label="${esc(rotulo)}">${dentro}</button>`;
}

function mostrarHTML(id, r) {
  const m = r.mostrar;
  if (!m) return '';
  if (id === 'quantos') {
    if (!m.grupos) return `<p class="jg-conta">${esc(m.conta)} = ?</p>`;
    return `<div class="jg-mostrar">${m.grupos.map((g) => grupo(g.qtd, g.e, g.sai ?? 0)).join('<span class="jg-mais" aria-hidden="true">+</span>')}</div>`;
  }
  if (m.cena) return `<p class="jg-cena">${esc(m.cena)}</p>`;
  if (m.pedras) return `<div class="jg-mostrar">${grupo(m.pedras, '⚪')}</div>`;
  if (m.notas) return `<div class="jg-mostrar"><button class="btn jg-tocar" type="button" id="jg-tocar">🎵 Ouvir os sons de novo</button></div>`;
  if (m.modelo) return `<div class="jg-mostrar"><span class="jg-vidro jg-modelo"><span class="jg-figura" aria-hidden="true">${m.modelo.e}</span><span class="jg-palavra">${esc(m.modelo.pt)}</span></span></div>`;
  return `<div class="jg-mostrar jg-seq">${m.seq.map((x) => `<span class="jg-elo">${x.num !== undefined ? `<span class="jg-num">${x.num}</span>` : peca(x)}</span>`).join('')}<span class="jg-elo jg-falta" aria-label="falta">?</span></div>`;
}

jogo.ligar = (root, ctx, id) => {
  const j = JOGOS[id];
  if (!j) return;
  const painel = root.querySelector('#jg-painel');
  const nivelEl = root.querySelector('#jg-nivel');
  const descanso = root.querySelector('#jg-descanso');
  const descansoAberto = () => !descanso.hidden;
  const filho = quem();
  let p = { ...progressoInicial(), ...progressoDe(filho)[id] };
  let rodada = null;
  let travado = false;
  // Interesses do filho (figuras dos jogos) e partidas anteriores (recorde): carregam enquanto a capa aparece.
  let interesses = [];
  let anteriores = [];
  let partida = null;
  let gravadaEm = 0;
  let avisouRecorde = false;
  const carregando = (async () => {
    try {
      await arm.iniciar();
      interesses = (await arm.listarFilhos()).find((f) => f.id === filho)?.interesses ?? [];
      anteriores = await arm.listarPartidas(filho);
    } catch { /* sem cadastro ou sem rede: joga com as figuras gerais */ }
  })();
  /** Grava a partida em andamento (no aparelho ou na nuvem da família); `ja` ignora o intervalo de 10 s. */
  const gravarPartida = (ja = false) => {
    if (!partida || partida.acertos + partida.erros === 0 || (!ja && Date.now() - gravadaEm < SALVAR_MS)) return;
    gravadaEm = Date.now();
    arm.salvarPartida(partida).catch(() => { gravadaEm = 0; }); // tenta de novo na próxima resposta
  };
  const aoEsconder = () => { if (document.hidden) gravarPartida(true); };
  document.addEventListener('visibilitychange', aoEsconder);

  // `em` carimba quando o nível mudou neste aparelho, para comparar com as partidas de outros aparelhos
  const salvar = () => gravar(`aci-jogos-prog-${filho}`, { ...progressoDe(filho), [id]: { ...p, em: Date.now() } });
  const mostrarNivel = () => { nivelEl.innerHTML = `Nível ${p.nivel}<span class="jg-luzes" aria-hidden="true">${[0, 1, 2].map((i) => `<i${i < p.seguidos ? ' class="acesa"' : ''}></i>`).join('')}</span>`; };

  const nova = () => {
    partida ??= { id: crypto.randomUUID(), filho, jogo: id, inicio: Date.now(), fim: Date.now(), nivelInicial: p.nivel, nivelFinal: p.nivel, nivelMax: p.nivel, acertos: 0, erros: 0 };
    rodada = j.rodada(p.nivel, Math.random, { interesses });
    painel.innerHTML = `<button class="jg-ouvir" type="button" id="jg-ouvir" aria-label="Ouvir a pergunta de novo"><svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      <p class="jg-pergunta">${esc(rodada.texto)}</p>
      ${mostrarHTML(id, rodada)}
      <div class="jg-opcoes n${rodada.opcoes.length}">${rodada.opcoes.map((o) => opcaoHTML(id, rodada, o)).join('')}</div>`;
    root.querySelector('#jg-legenda').textContent = rodada.idioma === 'en-US' ? 'Em inglês. O adulto pode repetir a palavra e apontar a figura.' : '';
    // no jogo dos sons, as notas tocam depois da pergunta falada
    const notas = rodada.mostrar?.notas;
    falar(rodada.fala, rodada.idioma, notas ? () => tocar(notas) : null);
    travado = false;
    mostrarNivel();
  };

  const responder = (botao) => {
    if (travado || !rodada) return;
    travado = true;
    const acertou = botao.dataset.chave === rodada.certa;
    const antes = p.nivel;
    p = ajustar(p, acertou);
    salvar();
    partida = anotarResposta(partida, acertou, p.nivel);
    gravarPartida();
    const anterior = recorde(anteriores, id, partida.id);
    if (!avisouRecorde && anterior > 0 && partida.nivelMax > anterior) {
      avisouRecorde = true; // um aviso discreto por partida, sem festa
      root.querySelector('#jg-recorde').textContent = `Novo recorde pessoal: nível ${partida.nivelMax}`;
    }
    painel.querySelectorAll('.jg-opcoes .jg-vidro').forEach((b) => { b.disabled = true; });
    if (acertou) {
      botao.classList.add('certa');
      painel.classList.add('aceso');
      sino();
      const virtude = rodada.mostrar?.virtude ? ` Isso é ${rodada.mostrar.virtude.toLocaleLowerCase('pt-BR')}.` : '';
      falar(p.nivel > antes ? `${elogio()}${virtude} Você subiu para o nível ${p.nivel}!` : `${elogio()}${virtude}`);
    } else {
      botao.classList.add('errada');
      painel.querySelector(`.jg-opcoes [data-chave="${CSS.escape(rodada.certa)}"]`)?.classList.add('mostrar');
      falar(rodada.mostrar?.virtude ? `O melhor é: ${rodada.certa}. Isso é ${rodada.mostrar.virtude.toLocaleLowerCase('pt-BR')}.` : rodada.mostrar?.dica ? `Olhe: ${rodada.mostrar.dica}` : 'Olhe, é esta aqui.');
      if (rodada.mostrar?.dica) root.querySelector('#jg-legenda').textContent = rodada.mostrar.dica;
    }
    mostrarNivel();
    nivelEl.classList.toggle('subiu', p.nivel > antes);
    setTimeout(() => {
      if (!root.isConnected) return;
      painel.classList.remove('aceso');
      nivelEl.classList.remove('subiu');
      if (!descansoAberto()) nova();
    }, acertou ? ESPERA_ACERTO : rodada.mostrar?.virtude || rodada.mostrar?.dica ? ESPERA_EXPLICAR * (rodada.mostrar?.dica ? 2 : 1) : ESPERA_ERRO);
  };
  painel.addEventListener('click', (ev) => {
    if (ev.target.closest('#jg-ouvir')) { if (rodada) falar(rodada.fala, rodada.idioma, rodada.mostrar?.notas ? () => tocar(rodada.mostrar.notas) : null); return; }
    if (ev.target.closest('#jg-tocar')) { if (rodada?.mostrar?.notas) tocar(rodada.mostrar.notas); return; }
    const b = ev.target.closest('.jg-opcoes .jg-vidro');
    if (b) responder(b);
  });
  root.querySelector('#jg-comecar').addEventListener('click', async () => {
    if (descansoAberto()) return;
    await carregando;
    if (!root.isConnected) return;
    if (!partida) p = { ...progressoInicial(), ...nivelAtual(progressoDe(filho)[id], anteriores, id) };
    nova();
    root.querySelector('.jg-barra').scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  mostrarNivel();

  // ---- limite de tela (opcional): conta o tempo com a partida aberta e visível
  const conferirTempo = () => {
    const l = limite();
    root.querySelector('#jg-resta').textContent = l ? `Faltam ${Math.ceil(Math.max(0, l * 60000 - usado()) / 60000)} min hoje` : '';
    if (acabou(l, usado()) && !descansoAberto()) {
      descanso.hidden = false;
      globalThis.speechSynthesis?.cancel();
      descanso.querySelector('#jg-liberar').focus();
    }
  };
  let ultimo = Date.now();
  const relogio = setInterval(() => {
    if (!root.isConnected) { clearInterval(relogio); globalThis.speechSynthesis?.cancel(); gravarPartida(true); document.removeEventListener('visibilitychange', aoEsconder); return; }
    const agora = Date.now();
    if (!document.hidden && !descansoAberto()) somarTempo(Math.min(agora - ultimo, 5000));
    ultimo = agora;
    conferirTempo();
  }, 1000);
  conferirTempo();

  // botão do adulto: segurar 3 segundos (dedo, mouse ou tecla) para liberar mais 5 minutos
  const liberar = descanso.querySelector('#jg-liberar');
  let segurando;
  const soltar = () => { clearTimeout(segurando); liberar.classList.remove('segurando'); };
  const segurar = () => {
    soltar();
    liberar.classList.add('segurando');
    segurando = setTimeout(() => { soltar(); somarTempo(-LIBERAR_MS); descanso.hidden = true; conferirTempo(); }, SEGURAR_MS);
  };
  liberar.addEventListener('pointerdown', segurar);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((e) => liberar.addEventListener(e, soltar));
  liberar.addEventListener('keydown', (ev) => { if ((ev.key === 'Enter' || ev.key === ' ') && !ev.repeat) { ev.preventDefault(); segurar(); } });
  liberar.addEventListener('keyup', soltar);
};
