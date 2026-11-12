// Histórico dos jogos e interesses de cada filho: só lógica, sem tela nem armazenamento.
// Uma partida: { id, filho, jogo, inicio, fim (ms), nivelInicial, nivelFinal, nivelMax, acertos, erros }.
// O recorde pessoal é o maior nível alcançado. Não há comparação entre filhos, só de cada um consigo mesmo.

export const MAX_PARTIDAS = 300; // por filho, no aparelho
const PRECISAO_REFORCO = 0.7; // abaixo disso o jogo volta como reforço
const DIA_MS = 86400000;

/** Interesses que a família pode marcar no cadastro do filho. Os quatro primeiros mudam as figuras dos jogos. */
export const INTERESSES = {
  animais: 'Animais', veiculos: 'Veículos', ceu: 'Céu e estrelas', natureza: 'Plantas e natureza',
  musica: 'Música', historias: 'Histórias',
};
export const interessesValidos = (lista) => [...new Set((Array.isArray(lista) ? lista : []).filter((i) => i in INTERESSES))];

/** Grava a partida (nova ou atualizada) na lista, mais recente primeiro, sem passar de MAX_PARTIDAS. */
export function guardarPartida(lista, partida) {
  return [partida, ...lista.filter((x) => x.id !== partida.id)].sort((a, b) => b.inicio - a.inicio).slice(0, MAX_PARTIDAS);
}

/** Acerto ou erro numa partida em andamento: devolve uma partida nova (não altera a anterior). */
export const anotarResposta = (partida, acertou, nivelDepois, agora = Date.now()) => ({
  ...partida,
  fim: agora,
  nivelFinal: nivelDepois,
  nivelMax: Math.max(partida.nivelMax, nivelDepois),
  acertos: partida.acertos + (acertou ? 1 : 0),
  erros: partida.erros + (acertou ? 0 : 1),
});

const doJogo = (lista, jogo) => lista.filter((x) => x.jogo === jogo && x.acertos + x.erros > 0);
/** Maior nível alcançado no jogo (0 se nunca jogou); `exceto` deixa de fora a partida em andamento. */
export const recorde = (lista, jogo, exceto = null) => Math.max(0, ...doJogo(lista, jogo).filter((x) => x.id !== exceto).map((x) => x.nivelMax));

/** Resumo de um jogo para os pais: partidas, recorde, precisão das últimas 5 partidas e a data da última. */
export function resumoJogo(lista, jogo) {
  const ps = doJogo(lista, jogo);
  const recentes = ps.slice(0, 5);
  const respostas = recentes.reduce((n, x) => n + x.acertos + x.erros, 0);
  const acertos = recentes.reduce((n, x) => n + x.acertos, 0);
  return { jogo, partidas: ps.length, recorde: recorde(lista, jogo), precisao: respostas ? acertos / respostas : null, ultima: ps[0]?.inicio ?? null };
}

/** Marcos de nível de cada jogo ("desafios"): concluídos quando o recorde chega lá. */
export const DESAFIOS = [5, 10, 15, 20, 30];
export const desafiosConcluidos = (lista, jogo) => DESAFIOS.filter((n) => recorde(lista, jogo) >= n);

/**
 * Nível atual de um jogo: o do aparelho (com o carimbo `em`) ou o fim da partida mais recente da família,
 * o que for mais novo. Assim o nível acompanha a criança de um aparelho para outro.
 */
export function nivelAtual(local, lista, jogo) {
  const ultima = lista.find((x) => x.jogo === jogo && x.acertos + x.erros > 0);
  if (ultima && !(local?.em >= ultima.fim)) return { nivel: ultima.nivelFinal, seguidos: 0, erros: 0, em: ultima.fim };
  return local;
}

/** Idade em anos completos (null se o nascimento não for informado). */
export function anosCompletos(nascimento, hoje = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nascimento ?? '');
  if (!m) return null;
  const [, a, mes, dia] = m.map(Number);
  let anos = hoje.getFullYear() - a;
  if (hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)) anos--;
  return anos >= 0 ? anos : null;
}

/**
 * Até `quantos` jogos recomendados, com o motivo. Ordem: reforço (precisão baixa), ainda não jogado, e o que está
 * há mais tempo sem jogar (prática espaçada). A idade só filtra quando informada, com folga de um ano para cada lado.
 */
export function recomendar(jogos, lista, anos = null, quantos = 2, agora = Date.now()) {
  const cabem = jogos.filter((j) => anos === null || !j.idade || (anos >= j.idade[0] - 1 && anos <= j.idade[1] + 1));
  const itens = cabem.map((j) => {
    const r = resumoJogo(lista, j.id);
    if (r.precisao !== null && r.precisao < PRECISAO_REFORCO) return { id: j.id, peso: 0, ultima: r.ultima, motivo: 'Reforço: muitos erros nas últimas partidas. Jogue junto e vá devagar.' };
    if (!r.partidas) return { id: j.id, peso: 1, ultima: 0, motivo: 'Ainda não jogado.' };
    const dias = Math.floor((agora - r.ultima) / DIA_MS);
    return { id: j.id, peso: 2, ultima: r.ultima, motivo: dias >= 1 ? `Revisão: ${dias} dia(s) sem jogar.` : 'Jogado hoje: bom para continuar outro dia.' };
  });
  return itens.sort((a, b) => a.peso - b.peso || a.ultima - b.ultima).slice(0, quantos).map(({ id, motivo }) => ({ id, motivo }));
}
