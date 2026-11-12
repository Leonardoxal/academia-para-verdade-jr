// Jogos da Academia Infantil: geradores de rodadas com níveis sem fim e dificuldade adaptativa.
// Só lógica (sem tela): cada gerador recebe o nível e um sorteador e devolve uma rodada
// { tipo, fala, idioma, texto, mostrar, opcoes: [{ chave, ... }], certa }. A tela (views/jogos.js) desenha conforme o jogo.
// Progressão pedagógica: quantidade antes do número escrito; palavra ouvida antes do som inicial; padrão antes de número.

export const SUBIR = 3; // acertos seguidos para subir de nível
export const DESCER = 2; // erros seguidos para recomeçar do nível 1 (pedido da família)

/** Dificuldade adaptativa: sobe depois de SUBIR acertos seguidos; depois de DESCER erros seguidos volta ao nível 1. */
export function ajustar(p, acertou) {
  if (acertou) {
    const seguidos = p.seguidos + 1;
    return seguidos >= SUBIR ? { nivel: p.nivel + 1, seguidos: 0, erros: 0 } : { nivel: p.nivel, seguidos, erros: 0 };
  }
  const erros = p.erros + 1;
  return erros >= DESCER ? { nivel: 1, seguidos: 0, erros: 0 } : { nivel: p.nivel, seguidos: 0, erros };
}

export const progressoInicial = () => ({ nivel: 1, seguidos: 0, erros: 0 });

// ---------------------------------------------------------------- sorteio

const inteiro = (a, b, rnd) => a + Math.floor(rnd() * (b - a + 1));
const escolher = (lista, rnd) => lista[Math.floor(rnd() * lista.length)];
const embaralhar = (lista, rnd) => {
  const c = [...lista];
  for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; }
  return c;
};
/** n valores distintos de gerar(), sem repetir chave e sem os proibidos; para quando a fonte se esgota. */
function distintos(n, gerar, chave, proibidas = []) {
  const vistas = new Set(proibidas.map(chave));
  const saida = [];
  for (let tentativa = 0; saida.length < n && tentativa < 400; tentativa++) {
    const v = gerar();
    const k = chave(v);
    if (!vistas.has(k)) { vistas.add(k); saida.push(v); }
  }
  return saida;
}
const vizinhos = (n, certo, rnd) => distintos(n, () => Math.max(0, certo + inteiro(-4, 4, rnd)), (x) => x, [certo]);

// ---------------------------------------------------------------- 1. Quantos são? (matemática)

// Coisas para contar, com singular, plural e gênero (as frases saem certas para 1 e para muitos).
export const COISAS = [
  { e: '🐑', um: 'ovelha', muitos: 'ovelhas', g: 'a' },
  { e: '🐟', um: 'peixe', muitos: 'peixes', g: 'o' },
  { e: '⭐', um: 'estrela', muitos: 'estrelas', g: 'a' },
  { e: '🕯️', um: 'vela', muitos: 'velas', g: 'a' },
  { e: '🍞', um: 'pão', muitos: 'pães', g: 'o' },
  { e: '🕊️', um: 'pomba', muitos: 'pombas', g: 'a' },
  { e: '🍎', um: 'maçã', muitos: 'maçãs', g: 'a' },
  { e: '🌸', um: 'flor', muitos: 'flores', g: 'a' },
];
// Mesmo objetivo, outra apresentação: figuras conforme os interesses do filho (cadastro na aba Infantil).
export const TEMAS = {
  animais: [{ e: '🐑', um: 'ovelha', muitos: 'ovelhas', g: 'a' }, { e: '🐟', um: 'peixe', muitos: 'peixes', g: 'o' }, { e: '🐄', um: 'vaca', muitos: 'vacas', g: 'a' }, { e: '🐔', um: 'galinha', muitos: 'galinhas', g: 'a' }, { e: '🐇', um: 'coelho', muitos: 'coelhos', g: 'o' }],
  veiculos: [{ e: '🚗', um: 'carro', muitos: 'carros', g: 'o' }, { e: '✈️', um: 'avião', muitos: 'aviões', g: 'o' }, { e: '🚂', um: 'trem', muitos: 'trens', g: 'o' }, { e: '⛵', um: 'barco', muitos: 'barcos', g: 'o' }, { e: '🚲', um: 'bicicleta', muitos: 'bicicletas', g: 'a' }, { e: '🚜', um: 'trator', muitos: 'tratores', g: 'o' }],
  ceu: [{ e: '⭐', um: 'estrela', muitos: 'estrelas', g: 'a' }, { e: '☁️', um: 'nuvem', muitos: 'nuvens', g: 'a' }, { e: '🪐', um: 'planeta', muitos: 'planetas', g: 'o' }, { e: '🚀', um: 'foguete', muitos: 'foguetes', g: 'o' }, { e: '☄️', um: 'cometa', muitos: 'cometas', g: 'o' }],
  natureza: [{ e: '🌸', um: 'flor', muitos: 'flores', g: 'a' }, { e: '🌳', um: 'árvore', muitos: 'árvores', g: 'a' }, { e: '🍃', um: 'folha', muitos: 'folhas', g: 'a' }, { e: '🍄', um: 'cogumelo', muitos: 'cogumelos', g: 'o' }, { e: '🐚', um: 'concha', muitos: 'conchas', g: 'a' }],
};
const CHANCE_TEMA = 0.7; // o interesse é porta de entrada: 3 em 10 rodadas continuam com as figuras gerais
/** Coisa para contar: na maioria das vezes do tema do filho, às vezes das figuras gerais. */
export function coisaPara(interesses = [], rnd = Math.random) {
  const doTema = interesses.flatMap((i) => TEMAS[i] ?? []);
  return escolher(doTema.length && rnd() < CHANCE_TEMA ? doTema : COISAS, rnd);
}
const EXTENSO = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'];
const extenso = (n, g) => (n === 1 ? (g === 'a' ? 'uma' : 'um') : n === 2 ? (g === 'a' ? 'duas' : 'dois') : EXTENSO[n] ?? String(n));
const nomeQtd = (n, c) => `${extenso(n, c.g)} ${n === 1 ? c.um : c.muitos}`;
export const MAX_DESENHO = 20; // acima disso a conta aparece só com números

/** Níveis: 1-5 achar o grupo com N; 6-10 contar e escolher o número; 11-13 qual tem mais; 14+ juntar (e, do 18, tirar). */
export function rodadaQuantos(nivel, rnd = Math.random, { interesses = [] } = {}) {
  const c = coisaPara(interesses, rnd);
  if (nivel <= 5) {
    const max = [2, 3, 3, 4, 5][nivel - 1];
    const nOpcoes = [2, 2, 3, 3, 3][nivel - 1];
    const alvo = inteiro(1, max, rnd);
    const outros = distintos(nOpcoes - 1, () => inteiro(1, max, rnd), (x) => x, [alvo]);
    const opcoes = embaralhar([alvo, ...outros], rnd).map((n) => ({ chave: `g${n}`, qtd: n, e: c.e }));
    return { tipo: 'achar', fala: `Onde tem ${nomeQtd(alvo, c)}?`, idioma: 'pt-BR', texto: `Onde tem ${alvo}?`, mostrar: null, opcoes, certa: `g${alvo}` };
  }
  if (nivel <= 10) {
    const alvo = inteiro(Math.max(2, nivel - 4), nivel, rnd); // até 6, 7… 10
    const outros = distintos(2, () => inteiro(1, nivel + 1, rnd), (x) => x, [alvo]);
    const opcoes = embaralhar([alvo, ...outros], rnd).map((n) => ({ chave: `n${n}`, num: n, pontos: nivel <= 8 }));
    return { tipo: 'contar', fala: `Quant${c.g}s ${c.muitos} tem aqui?`, idioma: 'pt-BR', texto: 'Quantos tem?', mostrar: { grupos: [{ qtd: alvo, e: c.e }] }, opcoes, certa: `n${alvo}` };
  }
  if (nivel <= 13) {
    const dif = Math.max(1, 13 - nivel); // 2, 1, 1: a diferença diminui
    const menor = inteiro(1, 10 - dif, rnd);
    const maior = Math.min(10, menor + inteiro(dif, dif + 2, rnd));
    const opcoes = embaralhar([maior, menor], rnd).map((n) => ({ chave: `g${n}`, qtd: n, e: c.e }));
    return { tipo: 'mais', fala: `Onde tem mais ${c.muitos}?`, idioma: 'pt-BR', texto: 'Onde tem mais?', mostrar: null, opcoes, certa: `g${maior}` };
  }
  const limite = 5 + (nivel - 14) * 2;
  const tirar = nivel >= 18 && rnd() < 0.5;
  let a; let b; let r;
  if (tirar) { a = inteiro(2, limite, rnd); b = inteiro(1, a - 1, rnd); r = a - b; } else { a = inteiro(1, limite - 1, rnd); b = inteiro(1, limite - a, rnd); r = a + b; }
  const opcoes = embaralhar([r, ...vizinhos(nivel >= 20 ? 3 : 2, r, rnd)], rnd).map((n) => ({ chave: `n${n}`, num: n, pontos: false }));
  const conta = `${a} ${tirar ? '−' : '+'} ${b}`;
  const desenhar = (tirar ? a : a + b) <= MAX_DESENHO;
  const fala = tirar
    ? `Tinha ${nomeQtd(a, c)}. ${b === 1 ? 'Saiu' : 'Saíram'} ${nomeQtd(b, c)}. Quant${c.g}s ficaram?`
    : `Tem ${nomeQtd(a, c)}. ${b === 1 ? 'Chegou' : 'Chegaram'} mais ${nomeQtd(b, c)}. Quant${c.g}s tem agora?`;
  return { tipo: tirar ? 'tirar' : 'juntar', fala, idioma: 'pt-BR', texto: `${conta} = ?`, mostrar: desenhar ? { grupos: tirar ? [{ qtd: a, e: c.e, sai: b }] : [{ qtd: a, e: c.e }, { qtd: b, e: c.e }], conta } : { conta }, opcoes, certa: `n${r}` };
}

// ---------------------------------------------------------------- 2. Ouvir e achar (linguagem e inglês)

// som: o primeiro som da palavra falada (não a letra), para o jogo do som inicial. f: palavra feminina (o/a).
export const PALAVRAS = [
  { pt: 'ovelha', en: 'sheep', e: '🐑', som: 'o', f: 1 }, { pt: 'peixe', en: 'fish', e: '🐟', som: 'p' },
  { pt: 'gato', en: 'cat', e: '🐈', som: 'g' }, { pt: 'sol', en: 'sun', e: '☀️', som: 's' },
  { pt: 'lua', en: 'moon', e: '🌙', som: 'l', f: 1 }, { pt: 'estrela', en: 'star', e: '⭐', som: 'e', f: 1 },
  { pt: 'flor', en: 'flower', e: '🌸', som: 'f', f: 1 }, { pt: 'maçã', en: 'apple', e: '🍎', som: 'm', f: 1 },
  { pt: 'casa', en: 'house', e: '🏠', som: 'k', f: 1 }, { pt: 'bola', en: 'ball', e: '⚽', som: 'b', f: 1 },
  { pt: 'vaca', en: 'cow', e: '🐄', som: 'v', f: 1 }, { pt: 'uva', en: 'grapes', e: '🍇', som: 'u', f: 1 },
  // a partir daqui, palavras menos comuns (do nível 7)
  { pt: 'pássaro', en: 'bird', e: '🐦', som: 'p' }, { pt: 'árvore', en: 'tree', e: '🌳', som: 'a', f: 1 },
  { pt: 'pão', en: 'bread', e: '🍞', som: 'p' }, { pt: 'igreja', en: 'church', e: '⛪', som: 'i', f: 1 },
  { pt: 'vela', en: 'candle', e: '🕯️', som: 'v', f: 1 }, { pt: 'sino', en: 'bell', e: '🔔', som: 's' },
  { pt: 'pomba', en: 'dove', e: '🕊️', som: 'p', f: 1 }, { pt: 'leão', en: 'lion', e: '🦁', som: 'l' },
  { pt: 'barco', en: 'boat', e: '⛵', som: 'b' }, { pt: 'coração', en: 'heart', e: '❤️', som: 'k' },
  { pt: 'livro', en: 'book', e: '📖', som: 'l' }, { pt: 'chave', en: 'key', e: '🔑', som: 'x', f: 1 },
  { pt: 'coroa', en: 'crown', e: '👑', som: 'k', f: 1 }, { pt: 'abelha', en: 'bee', e: '🐝', som: 'a', f: 1 },
  { pt: 'rato', en: 'mouse', e: '🐭', som: 'r' }, { pt: 'sapo', en: 'frog', e: '🐸', som: 's' },
  { pt: 'mão', en: 'hand', e: '✋', som: 'm', f: 1 }, { pt: 'anjo', en: 'angel', e: '👼', som: 'ã' },
];
const FACEIS = 12;
const comoOpcao = (p) => ({ chave: p.pt, e: p.e, pt: p.pt, en: p.en });

/** Níveis: 1-3 palavra em português (2 a 4 figuras); 4-6 em inglês; 7-9 misturado com 5 figuras; 10+ som inicial nos níveis pares, até 6 figuras. */
export function rodadaOuvir(nivel, rnd = Math.random) {
  const base = nivel <= 6 ? PALAVRAS.slice(0, FACEIS) : PALAVRAS;
  const nOpcoes = nivel <= 6 ? 2 + ((nivel - 1) % 3) : Math.min(6, 5 + Math.floor((nivel - 7) / 4));
  if (nivel >= 10 && nivel % 2 === 0) {
    const modelo = escolher(base.filter((p) => base.some((q) => q !== p && q.som === p.som)), rnd);
    const alvo = escolher(base.filter((p) => p !== modelo && p.som === modelo.som), rnd);
    const outros = distintos(nOpcoes - 1, () => escolher(base, rnd), (p) => p.som, [modelo]);
    const opcoes = embaralhar([alvo, ...outros], rnd).map(comoOpcao);
    return { tipo: 'som', fala: `Qual começa com o mesmo som de ${modelo.pt}?`, idioma: 'pt-BR', texto: `Começa como ${modelo.pt}`, mostrar: { modelo: comoOpcao(modelo) }, opcoes, certa: alvo.pt };
  }
  const ingles = (nivel >= 4 && nivel <= 6) || (nivel >= 7 && rnd() < 0.5);
  const alvo = escolher(base, rnd);
  const outros = distintos(nOpcoes - 1, () => escolher(base, rnd), (p) => p.pt, [alvo]);
  const opcoes = embaralhar([alvo, ...outros], rnd).map(comoOpcao);
  const art = alvo.f ? 'a' : 'o';
  return ingles
    ? { tipo: 'ingles', fala: `Where is the ${alvo.en}?`, idioma: 'en-US', texto: `Where is the ${alvo.en}? (${art} ${alvo.pt})`, mostrar: null, opcoes, certa: alvo.pt }
    : { tipo: 'palavra', fala: `Onde está ${art} ${alvo.pt}?`, idioma: 'pt-BR', texto: `Onde está ${art} ${alvo.pt}?`, mostrar: null, opcoes, certa: alvo.pt };
}

// ---------------------------------------------------------------- 3. O que vem depois? (raciocínio)

export const FORMAS = ['circulo', 'triangulo', 'quadrado', 'estrela', 'cruz', 'coracao'];
export const CORES = ['rubi', 'safira', 'esmeralda', 'ambar'];
const TAMANHOS = ['p', 'm', 'g'];
const chavePeca = (x) => (x.num !== undefined ? `n${x.num}` : `${x.forma}-${x.cor}-${x.tam}`);
const peca = (forma, cor, tam = 'm') => ({ forma, cor, tam });
const pecaAleatoria = (rnd) => peca(escolher(FORMAS, rnd), escolher(CORES, rnd));
// unidades do padrão: índices das peças distintas (A = 0, B = 1, C = 2)
const UNIDADES = { AB: [0, 1], AAB: [0, 0, 1], ABB: [0, 1, 1], ABC: [0, 1, 2], AABB: [0, 0, 1, 1] };

function padraoDePecas(unidade, pecas, rnd, nOpcoes, mostrar = 6) {
  const total = Math.max(mostrar, unidade.length * 2) + 1;
  const seq = Array.from({ length: total }, (_, i) => pecas[unidade[i % unidade.length]]);
  const certa = seq[total - 1];
  const outros = distintos(nOpcoes - 1, () => (rnd() < 0.6 ? escolher(pecas, rnd) : pecaAleatoria(rnd)), chavePeca, [certa]);
  return { seq: seq.slice(0, -1), certa, opcoes: embaralhar([certa, ...outros], rnd) };
}

function padraoDeNumeros(nivel, rnd) {
  let seq; let certa;
  if (nivel <= 11) {
    const passo = nivel === 9 ? 1 : nivel === 10 ? 2 : -1;
    const inicio = passo > 0 ? inteiro(1, 5, rnd) : inteiro(6, 10, rnd);
    seq = [0, 1, 2, 3].map((i) => inicio + passo * i);
    certa = inicio + passo * 4;
  } else if (nivel >= 18 && rnd() < 0.4) {
    const inicio = inteiro(1, 3, rnd);
    seq = [0, 1, 2, 3].map((i) => inicio * 2 ** i); // dobra
    certa = inicio * 16;
  } else if (nivel >= 15 && rnd() < 0.5) {
    const a = inteiro(1, 3, rnd); const b = inteiro(4, 6, rnd); // soma a, soma b, soma a…
    seq = [inteiro(1, 9, rnd)];
    for (let i = 1; i < 5; i++) seq.push(seq[i - 1] + (i % 2 ? a : b));
    certa = seq.pop();
  } else {
    const tamanho = inteiro(1, Math.ceil((nivel - 8) / 2), rnd);
    const passo = rnd() < 0.25 ? -tamanho : tamanho;
    const inicio = passo > 0 ? inteiro(0, 10, rnd) : inteiro(tamanho * 4, tamanho * 4 + 10, rnd); // nunca negativo
    seq = [0, 1, 2, 3].map((i) => inicio + passo * i);
    certa = inicio + passo * 4;
  }
  const opcoes = embaralhar([certa, ...vizinhos(nivel >= 14 ? 3 : 2, certa, rnd)], rnd);
  return { seq: seq.map((num) => ({ num })), certa: { num: certa }, opcoes: opcoes.map((num) => ({ num })) };
}

/** Três peças com formas diferentes (para o padrão ficar visível). */
function tresPecas(rnd) {
  const formas = embaralhar(FORMAS, rnd).slice(0, 3);
  return formas.map((f) => peca(f, escolher(CORES, rnd)));
}

/** Níveis: 1-2 AB; 3 AAB/ABB; 4 ABC; 5 AABB; 6 ABC com 4 opções; 7 só a cor muda; 8 tamanhos; 9+ números (+1, +2, −1, passos maiores, alternados, dobro). */
export function rodadaDepois(nivel, rnd = Math.random) {
  let r;
  if (nivel <= 6) {
    const unidade = nivel <= 2 ? UNIDADES.AB : nivel === 3 ? (rnd() < 0.5 ? UNIDADES.AAB : UNIDADES.ABB) : nivel === 5 ? UNIDADES.AABB : UNIDADES.ABC;
    r = padraoDePecas(unidade, tresPecas(rnd), rnd, nivel === 1 ? 2 : nivel === 6 ? 4 : 3, nivel <= 2 ? 4 : 6);
  } else if (nivel === 7) {
    const forma = escolher(FORMAS, rnd);
    r = padraoDePecas(UNIDADES.ABC, embaralhar(CORES, rnd).slice(0, 3).map((c) => peca(forma, c)), rnd, 1);
    r.opcoes = embaralhar(CORES.map((c) => peca(forma, c)), rnd); // as 4 cores na mesma forma
  } else if (nivel === 8) {
    const forma = escolher(FORMAS, rnd); const cor = escolher(CORES, rnd);
    r = padraoDePecas(UNIDADES.ABC, TAMANHOS.map((t) => peca(forma, cor, t)), rnd, 1);
    r.opcoes = embaralhar(TAMANHOS.map((t) => peca(forma, cor, t)), rnd);
  } else {
    r = padraoDeNumeros(nivel, rnd);
  }
  const numeros = r.certa.num !== undefined;
  const pergunta = numeros ? 'Que número vem depois?' : 'O que vem depois?';
  return { tipo: numeros ? 'numeros' : 'pecas', fala: pergunta, idioma: 'pt-BR', texto: pergunta, mostrar: { seq: r.seq }, opcoes: r.opcoes.map((x) => ({ chave: chavePeca(x), ...x })), certa: chavePeca(r.certa) };
}

// ---------------------------------------------------------------- 4. Que número é? (números até 100)

// Faixas por nível: primeiro até 10, depois até 20, as dezenas redondas, até 50 e até 100.
const FAIXAS_NUM = [[0, 10], [0, 10], [0, 10], [11, 20], [11, 20], [0, 20], [10, 100, 10], [10, 100, 10], [21, 50], [21, 50], [21, 50], [0, 100]];
const invertido = (n) => (n >= 10 && n % 10 !== 0 ? (n % 10) * 10 + Math.floor(n / 10) : null);

/** Ouvir o número e tocar no numeral. Níveis: 1-3 até 10; 4-6 até 20; 7-8 dezenas; 9-11 até 50; 12+ até 100, com opções cada vez mais parecidas (37 e 73, 46 e 56). */
export function rodadaNumeros(nivel, rnd = Math.random) {
  const [a, b, passo = 1] = FAIXAS_NUM[Math.min(nivel, FAIXAS_NUM.length) - 1];
  const sortear = () => a + passo * inteiro(0, Math.floor((b - a) / passo), rnd);
  const alvo = sortear();
  const nOpcoes = nivel <= 3 ? nivel + 1 : Math.min(6, 3 + Math.floor((nivel - 4) / 3));
  const parecidos = nivel >= 12 ? [invertido(alvo), alvo + 10, alvo - 10, alvo + 1, alvo - 1].filter((x) => x !== null && x >= 0 && x <= 100) : [];
  const outros = distintos(nOpcoes - 1, () => (parecidos.length && rnd() < 0.7 ? escolher(parecidos, rnd) : sortear()), (x) => x, [alvo]);
  const opcoes = embaralhar([alvo, ...outros], rnd).map((n) => ({ chave: `n${n}`, num: n, pontos: nivel <= 3 && n > 0 }));
  return { tipo: 'numero', fala: `Onde está o número ${alvo}?`, idioma: 'pt-BR', texto: 'Onde está o número?', mostrar: null, opcoes, certa: `n${alvo}` };
}

// ---------------------------------------------------------------- 5. O que combina? (associar palavras)

// Pares que combinam; os primeiros são os mais fáceis (do dia a dia da criança).
export const PARES = [
  [{ pt: 'abelha', e: '🐝' }, { pt: 'mel', e: '🍯' }], [{ pt: 'vaca', e: '🐄' }, { pt: 'leite', e: '🥛' }],
  [{ pt: 'galinha', e: '🐔' }, { pt: 'ovo', e: '🥚' }], [{ pt: 'cachorro', e: '🐕' }, { pt: 'osso', e: '🦴' }],
  [{ pt: 'coelho', e: '🐇' }, { pt: 'cenoura', e: '🥕' }], [{ pt: 'macaco', e: '🐒' }, { pt: 'banana', e: '🍌' }],
  [{ pt: 'bebê', e: '👶' }, { pt: 'mamadeira', e: '🍼' }], [{ pt: 'chuva', e: '🌧️' }, { pt: 'guarda-chuva', e: '☂️' }],
  // a partir daqui, pares que pedem mais pensamento (do nível 4)
  [{ pt: 'rato', e: '🐭' }, { pt: 'queijo', e: '🧀' }], [{ pt: 'pé', e: '🦶' }, { pt: 'meia', e: '🧦' }],
  [{ pt: 'mão', e: '✋' }, { pt: 'luva', e: '🧤' }], [{ pt: 'frio', e: '❄️' }, { pt: 'casaco', e: '🧥' }],
  [{ pt: 'chave', e: '🔑' }, { pt: 'cadeado', e: '🔒' }], [{ pt: 'lápis', e: '✏️' }, { pt: 'papel', e: '📄' }],
  [{ pt: 'noite', e: '🌙' }, { pt: 'cama', e: '🛏️' }], [{ pt: 'pão', e: '🍞' }, { pt: 'manteiga', e: '🧈' }],
  [{ pt: 'sino', e: '🔔' }, { pt: 'igreja', e: '⛪' }], [{ pt: 'vela', e: '🕯️' }, { pt: 'fogo', e: '🔥' }],
  [{ pt: 'pássaro', e: '🐦' }, { pt: 'ninho', e: '🪺' }], [{ pt: 'aranha', e: '🕷️' }, { pt: 'teia', e: '🕸️' }],
  [{ pt: 'escova de dentes', e: '🪥' }, { pt: 'dente', e: '🦷' }], [{ pt: 'agulha', e: '🪡' }, { pt: 'linha', e: '🧵' }],
  [{ pt: 'bola', e: '⚽' }, { pt: 'gol', e: '🥅' }], [{ pt: 'pincel', e: '🖌️' }, { pt: 'tinta', e: '🎨' }],
];
const PARES_FACEIS = 8;
// Grupos para "qual não é do grupo?".
export const GRUPOS = {
  animais: [{ pt: 'ovelha', e: '🐑' }, { pt: 'peixe', e: '🐟' }, { pt: 'gato', e: '🐈' }, { pt: 'leão', e: '🦁' }, { pt: 'sapo', e: '🐸' }, { pt: 'pássaro', e: '🐦' }],
  frutas: [{ pt: 'maçã', e: '🍎' }, { pt: 'uva', e: '🍇' }, { pt: 'banana', e: '🍌' }, { pt: 'morango', e: '🍓' }, { pt: 'pera', e: '🍐' }, { pt: 'laranja', e: '🍊' }],
  roupas: [{ pt: 'sapato', e: '👟' }, { pt: 'meia', e: '🧦' }, { pt: 'luva', e: '🧤' }, { pt: 'casaco', e: '🧥' }, { pt: 'chapéu', e: '🎩' }, { pt: 'vestido', e: '👗' }],
  ceu: [{ pt: 'sol', e: '☀️' }, { pt: 'lua', e: '🌙' }, { pt: 'estrela', e: '⭐' }, { pt: 'nuvem', e: '☁️' }, { pt: 'arco-íris', e: '🌈' }],
  instrumentos: [{ pt: 'piano', e: '🎹' }, { pt: 'violão', e: '🎸' }, { pt: 'tambor', e: '🥁' }, { pt: 'trompete', e: '🎺' }, { pt: 'violino', e: '🎻' }],
};
const figura = (x) => ({ chave: x.pt, e: x.e, pt: x.pt });

/** Níveis: 1-3 o que combina (2 a 4 figuras, pares fáceis); 4-6 todos os pares, 4 figuras; 7+ nos ímpares "qual não é do grupo?", nos pares o que combina com até 6 figuras. */
export function rodadaPalavras(nivel, rnd = Math.random) {
  if (nivel >= 7 && nivel % 2 === 1) {
    const nomes = embaralhar(Object.keys(GRUPOS), rnd);
    const iguais = embaralhar(GRUPOS[nomes[0]], rnd).slice(0, nivel >= 11 ? 4 : 3);
    const intruso = escolher(GRUPOS[nomes[1]], rnd);
    const opcoes = embaralhar([...iguais, intruso], rnd).map(figura);
    return { tipo: 'intruso', fala: 'Qual não é do mesmo grupo?', idioma: 'pt-BR', texto: 'Qual não é do grupo?', mostrar: null, opcoes, certa: intruso.pt };
  }
  const base = nivel <= 3 ? PARES.slice(0, PARES_FACEIS) : PARES;
  const nOpcoes = nivel <= 3 ? nivel + 1 : nivel <= 6 ? 4 : Math.min(6, 4 + Math.floor((nivel - 6) / 4));
  const [modelo, certo] = escolher(base, rnd);
  const outros = distintos(nOpcoes - 1, () => escolher(base, rnd)[1], (x) => x.pt, [certo]);
  const opcoes = embaralhar([certo, ...outros], rnd).map(figura);
  return { tipo: 'combina', fala: `O que combina com ${modelo.pt}?`, idioma: 'pt-BR', texto: `O que combina com ${modelo.pt}?`, mostrar: { modelo: figura(modelo) }, opcoes, certa: certo.pt };
}

// ---------------------------------------------------------------- 6. Onde vive? (ciências)

const LUGARES = { agua: { e: '🌊', pt: 'água' }, deserto: { e: '🏜️', pt: 'deserto' }, gelo: { e: '🧊', pt: 'gelo' }, floresta: { e: '🌳', pt: 'floresta' }, fazenda: { e: '🏡', pt: 'fazenda' } };
const HABITATS = [
  { e: '🐟', pt: 'peixe', lugar: 'agua' }, { e: '🐬', pt: 'golfinho', lugar: 'agua' }, { e: '🐙', pt: 'polvo', lugar: 'agua' },
  { e: '🐫', pt: 'camelo', lugar: 'deserto' }, { e: '🦂', pt: 'escorpião', lugar: 'deserto' },
  { e: '🐻‍❄️', pt: 'urso-polar', lugar: 'gelo' }, { e: '🐧', pt: 'pinguim', lugar: 'gelo' },
  { e: '🐒', pt: 'macaco', lugar: 'floresta' }, { e: '🦜', pt: 'papagaio', lugar: 'floresta' },
  { e: '🐄', pt: 'vaca', lugar: 'fazenda', f: 1 }, { e: '🐔', pt: 'galinha', lugar: 'fazenda', f: 1 }, { e: '🐖', pt: 'porco', lugar: 'fazenda' },
];
const CLASSES = { mamifero: 'mamífero', ave: 'ave', peixe: 'peixe', reptil: 'réptil', anfibio: 'anfíbio', inseto: 'inseto' };
const ANIMAIS_CLASSE = [
  { e: '🐋', pt: 'baleia', c: 'mamifero', f: 1 }, { e: '🦇', pt: 'morcego', c: 'mamifero' }, { e: '🐬', pt: 'golfinho', c: 'mamifero' }, { e: '🐄', pt: 'vaca', c: 'mamifero', f: 1 },
  { e: '🐧', pt: 'pinguim', c: 'ave' }, { e: '🦉', pt: 'coruja', c: 'ave', f: 1 }, { e: '🐔', pt: 'galinha', c: 'ave', f: 1 },
  { e: '🦈', pt: 'tubarão', c: 'peixe' }, { e: '🐟', pt: 'peixe-palhaço', c: 'peixe' },
  { e: '🐊', pt: 'jacaré', c: 'reptil' }, { e: '🐍', pt: 'cobra', c: 'reptil', f: 1 }, { e: '🐢', pt: 'tartaruga', c: 'reptil', f: 1 },
  { e: '🐸', pt: 'sapo', c: 'anfibio' }, { e: '🦋', pt: 'borboleta', c: 'inseto', f: 1 }, { e: '🐜', pt: 'formiga', c: 'inseto', f: 1 }, { e: '🐝', pt: 'abelha', c: 'inseto', f: 1 },
];
// Perguntas de fenômenos (conteúdo de ciências consolidado; a resposta é a explicação científica corrente).
const FENOMENOS = [
  { p: 'O gelo derrete quando…', certa: 'esquenta', outras: ['esfria', 'escurece'] },
  { p: 'A planta precisa de quê para fazer o próprio alimento?', certa: 'luz do sol', outras: ['escuro', 'sal'] },
  { p: 'A Lua brilha à noite porque…', certa: 'reflete a luz do Sol', outras: ['tem fogo dentro', 'é uma estrela'] },
  { p: 'A Terra leva quanto tempo para dar uma volta em torno do Sol?', certa: 'cerca de um ano', outras: ['um dia', 'uma semana'] },
  { p: 'A Terra dá uma volta em torno de si mesma em…', certa: 'cerca de um dia', outras: ['um ano', 'uma hora'] },
  { p: 'Quando a água vira vapor, ela passou do estado…', certa: 'líquido para gasoso', outras: ['sólido para líquido', 'gasoso para sólido'] },
  { p: 'O que o nosso corpo usa do ar quando respiramos?', certa: 'oxigênio', outras: ['fumaça', 'sal'] },
  { p: 'Um objeto cai no chão por causa da…', certa: 'gravidade', outras: ['luz', 'cor dele'] },
  { p: 'Vemos o relâmpago antes de ouvir o trovão porque…', certa: 'a luz viaja mais rápido que o som', outras: ['o trovão acontece depois', 'o relâmpago está mais perto'] },
  { p: 'Nas folhas, com a luz do sol, as plantas soltam no ar…', certa: 'oxigênio', outras: ['fumaça', 'sal'] },
  { p: 'O ímã atrai…', certa: 'objetos de ferro', outras: ['madeira', 'papel'] },
  { p: 'A sombra fica mais comprida…', certa: 'quando o sol está baixo', outras: ['ao meio-dia', 'quando chove'] },
];
const opcaoTexto = (t) => ({ chave: t, txt: t });

/** Níveis: 1-5 onde o animal vive (2 a 5 lugares); 6-10 que tipo de animal é; 11+ fenômenos e classificação alternados. */
export function rodadaCiencias(nivel, rnd = Math.random) {
  if (nivel >= 11 && nivel % 2 === 1) {
    const f = escolher(FENOMENOS, rnd);
    return { tipo: 'fenomeno', fala: f.p, idioma: 'pt-BR', texto: f.p, mostrar: null, opcoes: embaralhar([f.certa, ...f.outras], rnd).map(opcaoTexto), certa: f.certa };
  }
  if (nivel >= 6) {
    const a = escolher(ANIMAIS_CLASSE, rnd);
    const n = Math.min(6, 3 + Math.floor((nivel - 6) / 2));
    const outras = embaralhar(Object.keys(CLASSES).filter((c) => c !== a.c), rnd).slice(0, n - 1);
    return { tipo: 'classe', fala: `Que tipo de animal é ${a.f ? 'a' : 'o'} ${a.pt}?`, idioma: 'pt-BR', texto: 'Que tipo de animal é?', mostrar: { modelo: { e: a.e, pt: a.pt } }, opcoes: embaralhar([a.c, ...outras], rnd).map((c) => ({ chave: c, txt: CLASSES[c] })), certa: a.c };
  }
  const a = escolher(HABITATS, rnd);
  const outros = embaralhar(Object.keys(LUGARES).filter((l) => l !== a.lugar), rnd).slice(0, Math.min(4, nivel));
  return { tipo: 'habitat', fala: `Onde vive ${a.f ? 'a' : 'o'} ${a.pt}?`, idioma: 'pt-BR', texto: 'Onde vive?', mostrar: { modelo: { e: a.e, pt: a.pt } }, opcoes: embaralhar([a.lugar, ...outros], rnd).map((l) => ({ chave: l, ...LUGARES[l] })), certa: a.lugar };
}

// ---------------------------------------------------------------- 7. O que você faria? (formação moral)

// Situações do dia a dia; a resposta certa é a ação virtuosa, e a explicação mostra a consequência, sem ameaça.
export const SITUACOES = [
  { n: 1, cena: 'Seu amigo quer brincar com o seu carrinho.', certa: 'Emprestar e brincar junto', outras: ['Esconder o carrinho', 'Dizer que é só seu'], virtude: 'Generosidade' },
  { n: 1, cena: 'Você derrubou o copo de suco no chão.', certa: 'Contar e ajudar a limpar', outras: ['Sair de perto', 'Dizer que foi o gato'], virtude: 'Sinceridade' },
  { n: 1, cena: 'A mamãe está carregando muitas sacolas.', certa: 'Ajudar a carregar uma', outras: ['Continuar brincando', 'Pedir um doce'], virtude: 'Caridade' },
  { n: 1, cena: 'É hora de guardar os brinquedos.', certa: 'Guardar, mesmo com preguiça', outras: ['Deixar tudo no chão', 'Chorar até alguém guardar'], virtude: 'Diligência' },
  { n: 2, cena: 'Um colega caiu e os outros riram dele.', certa: 'Ajudar o colega a levantar', outras: ['Rir junto', 'Fingir que não viu'], virtude: 'Misericórdia' },
  { n: 2, cena: 'Seu irmão pediu desculpas por ter estragado seu desenho.', certa: 'Perdoar e fazer outro desenho', outras: ['Estragar o dele também', 'Ficar sem falar com ele'], virtude: 'Perdão' },
  { n: 2, cena: 'Você ganhou o jogo e seu amigo perdeu.', certa: 'Dizer "bom jogo" e não zombar', outras: ['Zombar do amigo', 'Contar para todos que ele perdeu'], virtude: 'Humildade' },
  { n: 2, cena: 'Achou uma nota de dinheiro caída na sala de aula.', certa: 'Entregar à professora', outras: ['Guardar para você', 'Gastar na cantina'], virtude: 'Justiça' },
  { n: 3, cena: 'Na prova, um colega oferece a resposta escondido.', certa: 'Recusar e fazer com o que sabe', outras: ['Copiar a resposta', 'Pedir a resposta de outras questões'], virtude: 'Honestidade' },
  { n: 3, cena: 'Um grupo pede que você não fale com um colega novo.', certa: 'Falar com o colega novo mesmo assim', outras: ['Obedecer ao grupo', 'Zombar do colega novo'], virtude: 'Coragem' },
  { n: 3, cena: 'Você prometeu ajudar seu avô, mas apareceu um convite para brincar.', certa: 'Cumprir a promessa e brincar depois', outras: ['Ir brincar sem avisar', 'Dizer que está doente'], virtude: 'Fidelidade' },
  { n: 3, cena: 'Você quer muito um brinquedo caro, e seus pais disseram que agora não dá.', certa: 'Aceitar e esperar, sem birra', outras: ['Fazer birra até ganhar', 'Pegar dinheiro escondido'], virtude: 'Temperança' },
  { n: 4, cena: 'Você vê que um amigo está mentindo para os pais dele sobre algo perigoso.', certa: 'Conversar com ele e, se preciso, contar a um adulto', outras: ['Ficar quieto para não brigar', 'Espalhar para a turma'], virtude: 'Prudência' },
  { n: 4, cena: 'Alguém fez algo errado com você e depois se arrependeu de verdade.', certa: 'Perdoar e, com prudência, confiar de novo aos poucos', outras: ['Nunca mais olhar para ele', 'Vingar-se primeiro'], virtude: 'Perdão' },
  { n: 4, cena: 'Na internet, pedem seu nome completo e o endereço para ganhar um prêmio.', certa: 'Não dar e mostrar a um adulto', outras: ['Dar só o endereço', 'Dar tudo, é um prêmio'], virtude: 'Prudência' },
  { n: 1, cena: 'Sua irmã caiu e está chorando.', certa: 'Abraçar e chamar um adulto', outras: ['Rir dela', 'Continuar brincando'], virtude: 'Caridade' },
  { n: 1, cena: 'É hora de rezar antes de dormir, mas você quer brincar mais.', certa: 'Rezar com a família e depois dormir', outras: ['Fingir que já dormiu', 'Brincar escondido'], virtude: 'Piedade' },
  { n: 2, cena: 'Na padaria, você recebeu troco a mais.', certa: 'Devolver o dinheiro ao padeiro', outras: ['Ficar com o troco', 'Comprar um doce com ele'], virtude: 'Justiça' },
  { n: 2, cena: 'Um colega errou a resposta e a turma riu dele.', certa: 'Não rir e ajudá-lo depois', outras: ['Rir mais alto', 'Chamar o colega de burro'], virtude: 'Caridade' },
  { n: 2, cena: 'Seus pais pediram que você arrume a cama todos os dias.', certa: 'Arrumar mesmo quando ninguém confere', outras: ['Arrumar só quando eles olham', 'Esconder as cobertas embaixo da cama'], virtude: 'Responsabilidade' },
  { n: 3, cena: 'Você perdeu o jogo e ficou com muita raiva.', certa: 'Respirar, cumprimentar quem ganhou e treinar mais', outras: ['Jogar o tabuleiro no chão', 'Dizer que o outro roubou'], virtude: 'Temperança' },
  { n: 3, cena: 'Um amigo conta o segredo de outra pessoa só para fazer graça.', certa: 'Dizer que não quer ouvir fofoca', outras: ['Espalhar o segredo', 'Inventar mais coisas'], virtude: 'Justiça' },
  { n: 3, cena: 'Você esqueceu de fazer a lição e a professora pergunta por ela.', certa: 'Dizer a verdade e fazer a lição', outras: ['Dizer que o cachorro comeu o caderno', 'Copiar de um colega bem rápido'], virtude: 'Honestidade' },
  { n: 4, cena: 'Um adulto que você não conhece oferece carona na saída da escola.', certa: 'Recusar e procurar um adulto de confiança', outras: ['Aceitar, porque ele parece legal', 'Ir com ele só até a esquina'], virtude: 'Prudência' },
  { n: 4, cena: 'Num grupo de mensagens, um colega está sendo humilhado.', certa: 'Não participar, apoiar o colega e avisar um adulto', outras: ['Mandar mais piadas', 'Sair do grupo sem contar a ninguém'], virtude: 'Fortaleza' },
];

/** Níveis: 1-3 situações de casa (2 a 3 opções); 4-6 escola e amigos; 7-9 escolhas que custam; 10+ prudência e casos mais difíceis. */
export function rodadaVirtudes(nivel, rnd = Math.random) {
  const faixa = Math.min(4, Math.ceil(nivel / 3));
  const s = escolher(SITUACOES.filter((x) => x.n <= faixa && x.n >= faixa - 1), rnd);
  const outras = nivel <= 1 ? s.outras.slice(0, 1) : s.outras;
  return { tipo: 'virtude', fala: `${s.cena} O que você faria?`, idioma: 'pt-BR', texto: 'O que você faria?', mostrar: { cena: s.cena, virtude: s.virtude }, opcoes: embaralhar([s.certa, ...outras], rnd).map(opcaoTexto), certa: s.certa };
}

// ---------------------------------------------------------------- 8. O que veio primeiro? (história e tempo)

// Sequências em ordem; cada item com uma pista de data só quando a data é consolidada.
export const SEQUENCIAS = [
  { n: 1, nome: 'o dia', itens: [{ e: '🌅', pt: 'acordar' }, { e: '🥣', pt: 'café da manhã' }, { e: '🍽️', pt: 'almoço' }, { e: '🛁', pt: 'banho da noite' }, { e: '🛏️', pt: 'dormir' }] },
  { n: 1, nome: 'a vida', itens: [{ e: '👶', pt: 'bebê' }, { e: '🧒', pt: 'criança' }, { e: '🧑', pt: 'adulto' }, { e: '🧓', pt: 'idoso' }] },
  { n: 1, nome: 'a planta', itens: [{ e: '🌰', pt: 'semente' }, { e: '🌱', pt: 'broto' }, { e: '🌿', pt: 'planta' }, { e: '🌳', pt: 'árvore' }] },
  { n: 2, nome: 'a História Sagrada', itens: [{ e: '🌍', pt: 'a Criação' }, { e: '🚢', pt: 'a Arca de Noé' }, { e: '⭐', pt: 'a promessa a Abraão' }, { e: '🌊', pt: 'Moisés e o Mar Vermelho' }, { e: '👑', pt: 'o rei Davi' }, { e: '👶', pt: 'o nascimento de Jesus' }] },
  { n: 3, nome: 'a História do Brasil', itens: [{ e: '⛵', pt: 'chegada dos portugueses (1500)' }, { e: '⛪', pt: 'fundação de São Paulo pelos jesuítas (1554)' }, { e: '🗣️', pt: 'Independência (1822)' }, { e: '⛓️', pt: 'Lei Áurea, fim da escravidão (1888)' }, { e: '🏛️', pt: 'Proclamação da República (1889)' }, { e: '🏙️', pt: 'inauguração de Brasília (1960)' }] },
  { n: 2, nome: 'o ano litúrgico', itens: [{ e: '🕯️', pt: 'Advento' }, { e: '⭐', pt: 'Natal' }, { e: '✝️', pt: 'Quaresma' }, { e: '🌅', pt: 'Páscoa' }, { e: '🕊️', pt: 'Pentecostes' }] },
  { n: 2, nome: 'a vida de Jesus', itens: [{ e: '👼', pt: 'a Anunciação' }, { e: '👶', pt: 'o Nascimento em Belém' }, { e: '💧', pt: 'o Batismo no Jordão' }, { e: '🍞', pt: 'a Última Ceia' }, { e: '✝️', pt: 'a Crucificação' }, { e: '🌅', pt: 'a Ressurreição' }] },
  { n: 3, nome: 'a História do mundo', itens: [{ e: '🔺', pt: 'pirâmides do Egito' }, { e: '🏛️', pt: 'Império Romano' }, { e: '⛪', pt: 'catedrais góticas' }, { e: '🧭', pt: 'Colombo chega à América (1492)' }, { e: '🚀', pt: 'o homem na Lua (1969)' }] },
];

/** Níveis: 1-4 o dia, a vida e a planta (2 a 3 opções); 5-8 também a História Sagrada; 9+ também o Brasil e o mundo, até 4 opções. */
export function rodadaTempo(nivel, rnd = Math.random) {
  const faixa = nivel <= 4 ? 1 : nivel <= 8 ? 2 : 3;
  const seq = escolher(SEQUENCIAS.filter((s) => s.n <= faixa && (faixa === 1 || s.n >= faixa - 1)), rnd);
  const n = Math.min(seq.itens.length, nivel <= 2 ? 2 : nivel <= 6 ? 3 : 4);
  const posicoes = embaralhar(seq.itens.map((_, i) => i), rnd).slice(0, n);
  const primeiro = seq.itens[Math.min(...posicoes)];
  return { tipo: 'tempo', fala: `Em ${seq.nome}, o que vem primeiro?`, idioma: 'pt-BR', texto: `O que vem primeiro? (${seq.nome})`, mostrar: null, opcoes: embaralhar(posicoes.map((i) => seq.itens[i]), rnd).map((x) => ({ chave: x.pt, e: x.e, pt: x.pt })), certa: primeiro.pt };
}

// ---------------------------------------------------------------- 9. Cálculo de cabeça (6 a 15 anos)

const FALA_OP = { '+': 'mais', '−': 'menos', '×': 'vezes', '÷': 'dividido por' };
/** Uma conta por nível: soma, subtração, tabuada, divisão exata, frações de um número, porcentagem, potências e raízes, equação do 1º grau. */
function conta(nivel, rnd) {
  if (nivel <= 3) { const a = inteiro(2, 10 + nivel * 3, rnd); const b = inteiro(2, 10 + nivel * 3, rnd); return { t: `${a} + ${b}`, f: `${a} mais ${b}`, r: a + b }; }
  if (nivel <= 6) { const a = inteiro(10, 20 + nivel * 5, rnd); const b = inteiro(2, a - 1, rnd); return { t: `${a} − ${b}`, f: `${a} menos ${b}`, r: a - b }; }
  if (nivel <= 9) { const a = inteiro(2, 10, rnd); const b = inteiro(2, 10, rnd); return { t: `${a} × ${b}`, f: `${a} vezes ${b}`, r: a * b }; }
  if (nivel <= 12) { const b = inteiro(2, 10, rnd); const r = inteiro(2, 10, rnd); return { t: `${b * r} ÷ ${b}`, f: `${b * r} ${FALA_OP['÷']} ${b}`, r }; }
  if (nivel <= 15) { const d = escolher([2, 3, 4, 5, 10], rnd); const n = d * inteiro(2, 12, rnd); return { t: `1/${d} de ${n}`, f: `um ${({ 2: 'meio', 3: 'terço', 4: 'quarto', 5: 'quinto', 10: 'décimo' })[d]} de ${n}`, r: n / d }; }
  if (nivel <= 18) { const p = escolher([10, 20, 25, 50, 75], rnd); const n = inteiro(1, 20, rnd) * (p === 25 || p === 75 ? 4 : 10); return { t: `${p}% de ${n}`, f: `${p} por cento de ${n}`, r: (p * n) / 100 }; }
  if (nivel <= 21) {
    if (rnd() < 0.5) { const b = inteiro(2, 12, rnd); return { t: `${b}²`, f: `${b} ao quadrado`, r: b * b }; }
    const r = inteiro(2, 15, rnd); return { t: `√${r * r}`, f: `raiz quadrada de ${r * r}`, r };
  }
  const x = inteiro(-9, 15, rnd); const a = inteiro(2, 9, rnd); const b = inteiro(-20, 20, rnd);
  const sinal = b < 0 ? `− ${-b}` : `+ ${b}`;
  return { t: `${a}x ${sinal} = ${a * x + b}. x = ?`, f: `${a} x ${b < 0 ? 'menos' : 'mais'} ${Math.abs(b)} igual a ${a * x + b}. Quanto vale x?`, r: x };
}

/** Níveis: 1-3 soma; 4-6 subtração; 7-9 tabuada; 10-12 divisão; 13-15 frações; 16-18 porcentagem; 19-21 potências e raízes; 22+ equações. */
export function rodadaCalculo(nivel, rnd = Math.random) {
  const c = conta(nivel, rnd);
  // números negativos só nas equações (13 a 15 anos); antes disso, as opções erradas também são naturais
  const perto = distintos(3, () => { const v = c.r + inteiro(-5, 5, rnd); return nivel >= 22 ? v : Math.abs(v); }, (x) => x, [c.r]);
  const opcoes = embaralhar([c.r, ...perto], rnd).map((n) => ({ chave: `n${n}`, num: n }));
  return { tipo: 'calculo', fala: c.t.includes('x =') ? c.f : `Quanto é ${c.f}?`, idioma: 'pt-BR', texto: c.t.includes('x =') ? c.t : `${c.t} = ?`, mostrar: null, opcoes, certa: `n${c.r}` };
}

// ---------------------------------------------------------------- 10. Escuchar y encontrar (espanhol)

// A palavra espanhola já com o artigo; as figuras são as mesmas do "Ouvir e achar".
const ESPANHOL = {
  ovelha: 'la oveja', peixe: 'el pez', gato: 'el gato', sol: 'el sol', lua: 'la luna', estrela: 'la estrella', flor: 'la flor',
  'maçã': 'la manzana', casa: 'la casa', bola: 'la pelota', vaca: 'la vaca', uva: 'las uvas', 'pássaro': 'el pájaro',
  'árvore': 'el árbol', 'pão': 'el pan', igreja: 'la iglesia', vela: 'la vela', sino: 'la campana', pomba: 'la paloma',
  'leão': 'el león', barco: 'el barco', 'coração': 'el corazón', livro: 'el libro', chave: 'la llave', coroa: 'la corona',
  abelha: 'la abeja', rato: 'el ratón', sapo: 'la rana', 'mão': 'la mano', anjo: 'el ángel',
};
const semArtigo = (es) => es.replace(/^(el|la|los|las) /, '');

/** Níveis: 1-6 ouvir em espanhol e tocar na figura (2 a 5 figuras); 7+ ver a figura e escolher a palavra escrita em espanhol (nos ímpares). */
export function rodadaEspanhol(nivel, rnd = Math.random) {
  const base = (nivel <= 3 ? PALAVRAS.slice(0, FACEIS) : PALAVRAS).filter((p) => ESPANHOL[p.pt]);
  const n = Math.min(5, nivel <= 3 ? nivel + 1 : 4 + Math.floor((nivel - 4) / 4));
  const alvo = escolher(base, rnd);
  const outros = distintos(n - 1, () => escolher(base, rnd), (p) => p.pt, [alvo]);
  const es = ESPANHOL[alvo.pt];
  if (nivel >= 7 && nivel % 2 === 1) {
    const opcoes = embaralhar([alvo, ...outros], rnd).map((p) => ({ chave: p.pt, txt: semArtigo(ESPANHOL[p.pt]) }));
    return { tipo: 'escrita', fala: `Como se diz ${alvo.pt} em espanhol?`, idioma: 'pt-BR', texto: 'Como se diz em espanhol?', mostrar: { modelo: comoOpcao(alvo) }, opcoes, certa: alvo.pt };
  }
  const plural = /^(los|las) /.test(es);
  return { tipo: 'palavra', fala: `¿Dónde ${plural ? 'están' : 'está'} ${es}?`, idioma: 'es-ES', texto: `¿Dónde ${plural ? 'están' : 'está'} ${es}? (${alvo.f ? 'a' : 'o'} ${alvo.pt})`, mostrar: null, opcoes: embaralhar([alvo, ...outros], rnd).map(comoOpcao), certa: alvo.pt };
}

// ---------------------------------------------------------------- 11. Agudo ou grave? (música)

// Frequências em Hz da escala de dó maior a partir do dó central (C4 a C6), para tocar com o próprio navegador.
const ESCALA = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5];
const PRIMEIRA = { chave: '1', txt: 'O primeiro' };
const SEGUNDA = { chave: '2', txt: 'O segundo' };

/** Níveis: 1-10 qual som é mais agudo (o intervalo diminui da oitava até um tom); 11+ alternam com "quantas notas você ouviu?" (2 a 5). */
export function rodadaMusica(nivel, rnd = Math.random) {
  if (nivel >= 11 && nivel % 2 === 1) {
    const qtd = inteiro(2, Math.min(5, 2 + Math.floor((nivel - 11) / 2)), rnd);
    const notas = Array.from({ length: qtd }, () => escolher(ESCALA.slice(0, 8), rnd));
    const opcoes = embaralhar([qtd, ...distintos(2, () => inteiro(1, 6, rnd), (x) => x, [qtd])], rnd).map((n) => ({ chave: `n${n}`, num: n }));
    return { tipo: 'contar-notas', fala: 'Quantas notas você ouviu?', idioma: 'pt-BR', texto: 'Quantas notas?', mostrar: { notas }, opcoes, certa: `n${qtd}` };
  }
  const salto = Math.max(1, 7 - Math.floor((Math.min(nivel, 10) - 1) * 0.67)); // 7 graus (oitava) até 1 grau (um tom)
  const i = inteiro(0, ESCALA.length - 1 - salto, rnd);
  const subindo = rnd() < 0.5;
  const notas = subindo ? [ESCALA[i], ESCALA[i + salto]] : [ESCALA[i + salto], ESCALA[i]];
  return { tipo: 'agudo', fala: 'Qual som é mais agudo, mais fininho?', idioma: 'pt-BR', texto: 'Qual é mais agudo?', mostrar: { notas }, opcoes: [PRIMEIRA, SEGUNDA], certa: subindo ? '2' : '1' };
}

// ---------------------------------------------------------------- 12. A melhor jogada (estratégia)

/**
 * Jogo das pedras (da família do Nim): cada um tira de 1 a k pedras por vez; quem tira a última ganha.
 * Quem deixa para o outro um múltiplo de k+1 sempre pode vencer: a criança descobre a jogada que garante a vitória.
 * Níveis: 1-4 tirar 1 ou 2, até 8 pedras; 5-8 até 15; 9-12 tirar até 3, até 20; 13+ tirar até 4, até 30.
 */
export function rodadaEstrategia(nivel, rnd = Math.random) {
  const k = nivel <= 8 ? 2 : nivel <= 12 ? 3 : 4;
  const max = nivel <= 4 ? 8 : nivel <= 8 ? 15 : nivel <= 12 ? 20 : 30;
  let n;
  do { n = inteiro(k + 2, max, rnd); } while (n % (k + 1) === 0); // só posições em que existe a jogada vencedora
  const tirar = n % (k + 1);
  const opcoes = Array.from({ length: k }, (_, i) => ({ chave: `t${i + 1}`, txt: `Tirar ${i + 1}` }));
  return {
    tipo: 'estrategia', fala: `Há ${n} pedras. Cada um tira de 1 a ${k} por vez, e quem tirar a última ganha. É a sua vez: quantas você tira para garantir a vitória?`,
    idioma: 'pt-BR', texto: `${n} pedras: tire de 1 a ${k}. Quem tirar a última ganha.`,
    mostrar: { pedras: n, dica: `Tirando ${tirar}, sobram ${n - tirar}, que é múltiplo de ${k + 1}. Depois, sempre que o outro tirar, você completa ${k + 1}, e a última pedra fica para você.` },
    opcoes, certa: `t${tirar}`,
  };
}

// ---------------------------------------------------------------- 13. Onde fica? (geografia)

// [país com o artigo que a frase pede, continente]
const PAISES = [
  ['o Brasil', 'América'], ['a Argentina', 'América'], ['o México', 'América'], ['o Canadá', 'América'], ['Portugal', 'Europa'],
  ['a Itália', 'Europa'], ['a França', 'Europa'], ['a Polônia', 'Europa'], ['o Egito', 'África'], ['Angola', 'África'],
  ['a Nigéria', 'África'], ['o Japão', 'Ásia'], ['a China', 'Ásia'], ['a Índia', 'Ásia'], ['Israel', 'Ásia'], ['a Austrália', 'Oceania'],
  ['o Chile', 'América'], ['o Peru', 'América'], ['a Colômbia', 'América'], ['a Espanha', 'Europa'], ['a Alemanha', 'Europa'],
  ['a Irlanda', 'Europa'], ['o Quênia', 'África'], ['a África do Sul', 'África'], ['o Marrocos', 'África'], ['a Coreia do Sul', 'Ásia'],
  ['a Nova Zelândia', 'Oceania'],
];
const CONTINENTES = ['América', 'Europa', 'África', 'Ásia', 'Oceania'];
// [estado, capital, região] — as 26 unidades da federação e o Distrito Federal.
export const ESTADOS = [
  ['Acre', 'Rio Branco', 'Norte'], ['Amapá', 'Macapá', 'Norte'], ['Amazonas', 'Manaus', 'Norte'], ['Pará', 'Belém', 'Norte'],
  ['Rondônia', 'Porto Velho', 'Norte'], ['Roraima', 'Boa Vista', 'Norte'], ['Tocantins', 'Palmas', 'Norte'],
  ['Alagoas', 'Maceió', 'Nordeste'], ['Bahia', 'Salvador', 'Nordeste'], ['Ceará', 'Fortaleza', 'Nordeste'], ['Maranhão', 'São Luís', 'Nordeste'],
  ['Paraíba', 'João Pessoa', 'Nordeste'], ['Pernambuco', 'Recife', 'Nordeste'], ['Piauí', 'Teresina', 'Nordeste'],
  ['Rio Grande do Norte', 'Natal', 'Nordeste'], ['Sergipe', 'Aracaju', 'Nordeste'],
  ['Distrito Federal', 'Brasília', 'Centro-Oeste'], ['Goiás', 'Goiânia', 'Centro-Oeste'], ['Mato Grosso', 'Cuiabá', 'Centro-Oeste'], ['Mato Grosso do Sul', 'Campo Grande', 'Centro-Oeste'],
  ['Espírito Santo', 'Vitória', 'Sudeste'], ['Minas Gerais', 'Belo Horizonte', 'Sudeste'], ['Rio de Janeiro', 'Rio de Janeiro', 'Sudeste'], ['São Paulo', 'São Paulo', 'Sudeste'],
  ['Paraná', 'Curitiba', 'Sul'], ['Rio Grande do Sul', 'Porto Alegre', 'Sul'], ['Santa Catarina', 'Florianópolis', 'Sul'],
];
const REGIOES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
// Artigo de cada estado ('' quando o nome não leva artigo): "a capital da Bahia", "de Pernambuco", "do Acre".
const ARTIGO_UF = {
  Acre: 'o', 'Amapá': 'o', Amazonas: 'o', 'Pará': 'o', 'Rondônia': '', Roraima: '', Tocantins: 'o', Alagoas: '', Bahia: 'a',
  'Ceará': 'o', 'Maranhão': 'o', 'Paraíba': 'a', Pernambuco: '', 'Piauí': 'o', 'Rio Grande do Norte': 'o', Sergipe: '',
  'Distrito Federal': 'o', 'Goiás': '', 'Mato Grosso': '', 'Mato Grosso do Sul': '', 'Espírito Santo': 'o', 'Minas Gerais': '',
  'Rio de Janeiro': 'o', 'São Paulo': '', 'Paraná': 'o', 'Rio Grande do Sul': 'o', 'Santa Catarina': '',
};
const comArtigo = (uf) => (ARTIGO_UF[uf] ? `${ARTIGO_UF[uf]} ${uf}` : uf);
const deUF = (uf) => ({ o: `do ${uf}`, a: `da ${uf}` })[ARTIGO_UF[uf]] ?? `de ${uf}`;

/** Níveis: 1-4 em que continente fica o país (2 a 5 opções); 5-8 em que região fica o estado; 9+ qual é a capital do estado. */
export function rodadaGeografia(nivel, rnd = Math.random) {
  if (nivel <= 4) {
    const [pais, cont] = escolher(PAISES, rnd);
    const outras = embaralhar(CONTINENTES.filter((c) => c !== cont), rnd).slice(0, nivel);
    return { tipo: 'continente', fala: `Em que continente fica ${pais}?`, idioma: 'pt-BR', texto: `Em que continente fica ${pais}?`, mostrar: null, opcoes: embaralhar([cont, ...outras], rnd).map(opcaoTexto), certa: cont };
  }
  const [estado, capital, regiao] = escolher(ESTADOS, rnd);
  if (nivel <= 8) {
    const outras = embaralhar(REGIOES.filter((r) => r !== regiao), rnd).slice(0, Math.min(4, nivel - 3));
    return { tipo: 'regiao', fala: `Em que região do Brasil fica ${comArtigo(estado)}?`, idioma: 'pt-BR', texto: `Em que região fica ${comArtigo(estado)}?`, mostrar: null, opcoes: embaralhar([regiao, ...outras], rnd).map(opcaoTexto), certa: regiao };
  }
  // capitais erradas da mesma região a partir do nível 13: mais parecidas, mais difíceis
  const fonte = nivel >= 13 ? ESTADOS.filter((e) => e[2] === regiao) : ESTADOS;
  const outras = distintos(3, () => escolher(fonte.length > 3 ? fonte : ESTADOS, rnd)[1], (x) => x, [capital]);
  return { tipo: 'capital', fala: `Qual é a capital ${deUF(estado)}?`, idioma: 'pt-BR', texto: `Capital ${deUF(estado)}?`, mostrar: null, opcoes: embaralhar([capital, ...outras], rnd).map(opcaoTexto), certa: capital };
}

// ---------------------------------------------------------------- 14. Que sílaba falta? (leitura e escrita)

// Palavras com as sílabas separadas (separação silábica da escrita).
export const SILABAS = [
  { e: '🏠', s: ['CA', 'SA'] }, { e: '⚽', s: ['BO', 'LA'] }, { e: '🐈', s: ['GA', 'TO'] }, { e: '🦆', s: ['PA', 'TO'] },
  { e: '🐄', s: ['VA', 'CA'] }, { e: '🐸', s: ['SA', 'PO'] }, { e: '🍇', s: ['U', 'VA'] }, { e: '🔑', s: ['CHA', 'VE'] },
  { e: '🌙', s: ['LU', 'A'] }, { e: '🐭', s: ['RA', 'TO'] }, { e: '📖', s: ['LI', 'VRO'] }, { e: '🕯️', s: ['VE', 'LA'] },
  { e: '🔔', s: ['SI', 'NO'] }, { e: '⛵', s: ['BAR', 'CO'] }, { e: '🍎', s: ['MA', 'ÇÃ'] },
  // três sílabas (do nível 9)
  { e: '🐒', s: ['MA', 'CA', 'CO'] }, { e: '🍅', s: ['TO', 'MA', 'TE'] }, { e: '🍌', s: ['BA', 'NA', 'NA'] }, { e: '🐎', s: ['CA', 'VA', 'LO'] },
  { e: '🐔', s: ['GA', 'LI', 'NHA'] }, { e: '🐝', s: ['A', 'BE', 'LHA'] }, { e: '👞', s: ['SA', 'PA', 'TO'] },
];

/** Níveis: 1-4 falta a última sílaba (2 a 4 opções); 5-8 falta a primeira; 9+ palavras de três sílabas, falta qualquer uma. */
export function rodadaSilabas(nivel, rnd = Math.random) {
  const base = SILABAS.filter((p) => (nivel >= 9 ? p.s.length === 3 : p.s.length === 2));
  const p = escolher(base, rnd);
  const falta = nivel <= 4 ? p.s.length - 1 : nivel <= 8 ? 0 : inteiro(0, p.s.length - 1, rnd);
  const certa = p.s[falta];
  const todas = [...new Set(SILABAS.flatMap((x) => x.s))];
  const outras = distintos(Math.min(3, nivel <= 2 ? nivel : 3), () => escolher(todas, rnd), (x) => x, [certa]);
  const palavra = p.s.map((s, i) => (i === falta ? '__' : s)).join('');
  return { tipo: 'silaba', fala: 'Que pedacinho falta na palavra?', idioma: 'pt-BR', texto: palavra, mostrar: { modelo: { e: p.e, pt: palavra } }, opcoes: embaralhar([certa, ...outras], rnd).map(opcaoTexto), certa };
}

// idade: faixa indicativa em anos (referência, não barreira: o nível acompanha o que a criança demonstra).
// habilidades: o que o jogo trabalha, para os pais e para o texto de análise por IA.
export const JOGOS = {
  quantos: { id: 'quantos', titulo: 'Quantos são?', area: 'Matemática', idade: [2, 6], habilidades: ['contagem', 'quantidade', 'comparação', 'adição e subtração concretas'], ajuda: 'Achar o grupo, contar, comparar e, mais adiante, juntar e tirar. A quantidade vem antes do número escrito.', rodada: rodadaQuantos },
  depois: { id: 'depois', titulo: 'O que vem depois?', area: 'Raciocínio', idade: [2, 7], habilidades: ['padrões', 'atenção', 'sequências numéricas'], ajuda: 'Padrões de forma, cor e tamanho; depois, sequências de números cada vez mais difíceis.', rodada: rodadaDepois },
  ouvir: { id: 'ouvir', titulo: 'Ouvir e achar', area: 'Linguagem e inglês', idade: [2, 6], habilidades: ['vocabulário', 'compreensão oral', 'inglês', 'consciência fonológica'], ajuda: 'Ouvir a palavra e tocar na figura; depois em inglês; mais adiante, o som do começo da palavra.', rodada: rodadaOuvir },
  numeros: { id: 'numeros', titulo: 'Que número é?', area: 'Matemática', idade: [3, 7], habilidades: ['reconhecer numerais', 'sistema de numeração até 100'], ajuda: 'Ouvir o número e tocar no número escrito: até 10, até 20, as dezenas e, mais adiante, até 100.', rodada: rodadaNumeros },
  palavras: { id: 'palavras', titulo: 'O que combina?', area: 'Linguagem e raciocínio', idade: [2, 6], habilidades: ['vocabulário', 'associação', 'classificação'], ajuda: 'Juntar as coisas que andam juntas (abelha e mel); mais adiante, achar a que não é do grupo.', rodada: rodadaPalavras },
  ciencias: { id: 'ciencias', titulo: 'Onde vive?', area: 'Ciências', idade: [2, 10], habilidades: ['habitats', 'classificação dos animais', 'fenômenos da natureza'], ajuda: 'Onde cada animal vive; depois, que tipo de animal é (mamífero, ave, réptil…); mais adiante, por que o gelo derrete e a Lua brilha.', rodada: rodadaCiencias },
  virtudes: { id: 'virtudes', titulo: 'O que você faria?', area: 'Formação moral', idade: [4, 10], habilidades: ['discernimento moral', 'virtudes', 'consequências das ações'], ajuda: 'Situações do dia a dia para escolher o que é certo. Depois de cada resposta, converse: por que é melhor assim?', rodada: rodadaVirtudes },
  tempo: { id: 'tempo', titulo: 'O que veio primeiro?', area: 'História e tempo', idade: [3, 12], habilidades: ['sequência temporal', 'História Sagrada', 'História do Brasil e do mundo'], ajuda: 'Ordem das coisas: o dia, a vida, a planta; depois a História Sagrada; mais adiante, o Brasil e o mundo.', rodada: rodadaTempo },
  calculo: { id: 'calculo', titulo: 'Cálculo de cabeça', area: 'Matemática', idade: [6, 15], habilidades: ['cálculo mental', 'tabuada', 'frações', 'porcentagem', 'potências', 'equações'], ajuda: 'Contas de cabeça, da soma até a equação do 1º grau. Vale usar papel para pensar; o que conta é acertar com compreensão, não a pressa.', rodada: rodadaCalculo },
  espanhol: { id: 'espanhol', titulo: 'Escuchar y encontrar', area: 'Espanhol', idade: [4, 12], habilidades: ['vocabulário em espanhol', 'compreensão oral', 'leitura em espanhol'], ajuda: 'Ouvir a palavra em espanhol e tocar na figura; mais adiante, ler e escolher a palavra escrita. O adulto pode repetir e apontar.', rodada: rodadaEspanhol },
  musica: { id: 'musica', titulo: 'Agudo ou grave?', area: 'Música', idade: [3, 12], habilidades: ['percepção de altura', 'atenção auditiva', 'contagem de sons'], ajuda: 'Ouvir dois sons e dizer qual é mais agudo; os sons ficam cada vez mais próximos. Mais adiante, contar as notas. Use um lugar quieto.', rodada: rodadaMusica },
  geografia: { id: 'geografia', titulo: 'Onde fica?', area: 'Geografia', idade: [6, 15], habilidades: ['continentes', 'regiões do Brasil', 'capitais dos estados'], ajuda: 'Em que continente fica cada país; depois, as regiões do Brasil; mais adiante, as capitais. Tenha um mapa por perto e procure juntos.', rodada: rodadaGeografia },
  leitura: { id: 'leitura', titulo: 'Ler e entender', area: 'Leitura e interpretação', idade: [6, 10], habilidades: ['ordem das palavras na frase', 'compreensão de texto', 'causa e consequência'], ajuda: 'Achar a frase bem escrita; depois, ler um texto curto e responder. A criança lê; se ainda não lê, o adulto lê junto. Os textos são ficção educativa da Academia.', rodada: rodadaLeitura },
  silabas: { id: 'silabas', titulo: 'Que sílaba falta?', area: 'Leitura e escrita', idade: [4, 8], habilidades: ['consciência silábica', 'relação entre fala e escrita'], ajuda: 'Ver a figura e achar o pedaço que falta na palavra. Leia a palavra em voz alta, batendo palmas em cada sílaba.', rodada: rodadaSilabas },
  estrategia: { id: 'estrategia', titulo: 'A melhor jogada', area: 'Estratégia e lógica', idade: [7, 15], habilidades: ['planejamento', 'antecipar consequências', 'padrões e múltiplos'], ajuda: 'O jogo das pedras: descobrir a jogada que garante a vitória. Depois de acertar, jogue de verdade com pedrinhas ou feijões, em família.', rodada: rodadaEstrategia },
};

// ---------------------------------------------------------------- 15. Ler e entender (frases e interpretação)

// Todas começam com artigo: assim as duas versões erradas abaixo são sempre agramaticais (um embaralhamento ao acaso
// pode gerar outra frase correta, como "Brilha o sol no céu", e a criança teria duas respostas certas).
export const FRASES = [
  'O gato bebe leite.', 'A menina lê um livro.', 'O sol brilha no céu.', 'O pássaro canta na árvore.',
  'A família reza antes de dormir.', 'A vaca come capim.', 'O menino chuta a bola.', 'O padeiro faz o pão.',
  'A avó conta uma história.', 'O cachorro corre no quintal.', 'A professora abre a porta.', 'O peixe nada no rio.',
];
const frase = (palavras) => { const f = palavras.join(' ').toLowerCase(); return `${f.charAt(0).toUpperCase()}${f.slice(1)}.`; };
/** As duas versões erradas: de trás para a frente, e com o artigo levado para o fim. */
function erradasDe(original) {
  const p = original.replace(/\.$/, '').split(' ');
  return [frase([...p].reverse()), frase([...p.slice(1), p[0]])];
}

// Textos curtos (ficção educativa da Academia) com uma pergunta de compreensão cada.
export const TEXTOS = [
  { t: 'Ana plantou uma semente no jardim. Todo dia ela regava a terra. Depois de uma semana, nasceu um broto verde.', p: 'O que Ana fazia todo dia?', certa: 'Regava a terra', outras: ['Comia a semente', 'Dormia no jardim'] },
  { t: 'Pedro perdeu o lápis na escola. Lucas viu e emprestou o dele. No fim da aula, Pedro agradeceu.', p: 'Quem emprestou o lápis?', certa: 'Lucas', outras: ['Pedro', 'A professora'] },
  { t: 'Choveu a manhã toda. Por isso, as crianças brincaram dentro de casa, montando um castelo de almofadas.', p: 'Por que as crianças brincaram dentro de casa?', certa: 'Porque choveu', outras: ['Porque era noite', 'Porque estavam doentes'] },
  { t: 'Vovó fez um bolo de cenoura. Ela cortou oito pedaços e deu dois para cada neto. Não sobrou nenhum.', p: 'Quantos netos ganharam bolo?', certa: 'Quatro', outras: ['Oito', 'Dois'] },
  { t: 'Antes da Missa, Maria ajudou a arrumar as flores no altar. Depois, sentou-se com a família e rezou em silêncio.', p: 'O que Maria fez primeiro?', certa: 'Arrumou as flores', outras: ['Sentou-se com a família', 'Rezou em silêncio'] },
  { t: 'O cachorro latiu a noite inteira. De manhã, o pai descobriu que um gato estava preso no telhado.', p: 'Por que o cachorro latiu?', certa: 'Por causa do gato no telhado', outras: ['Porque estava com fome', 'Porque queria passear'] },
  { t: 'Tiago juntou moedas durante três meses para comprar uma bola. Quando conseguiu, deu metade para a campanha da paróquia e resolveu esperar mais um pouco pela bola.', p: 'Que virtude Tiago mostrou?', certa: 'Generosidade', outras: ['Preguiça', 'Inveja'] },
  { t: 'João tinha dez figurinhas. Deu três para o irmão e depois ganhou duas da avó.', p: 'Com quantas figurinhas João ficou?', certa: 'Nove', outras: ['Sete', 'Quinze'] },
  { t: 'Na feira, Lia escolheu as frutas mais bonitas para levar à vizinha doente, mesmo sem ninguém pedir.', p: 'Para quem eram as frutas?', certa: 'Para a vizinha doente', outras: ['Para vender na feira', 'Para a própria Lia'] },
  { t: 'O avô de Davi plantou uma mangueira quando era menino. Hoje a árvore é grande e dá sombra para toda a família.', p: 'Quem plantou a mangueira?', certa: 'O avô de Davi', outras: ['Davi', 'A vizinha'] },
  { t: 'Quando a água da panela ferveu, saiu muito vapor. A mãe explicou que o vapor é água que virou gás por causa do calor.', p: 'O que é o vapor?', certa: 'Água que virou gás', outras: ['Fumaça do fogo', 'Ar gelado'] },
  { t: 'Bia esqueceu o casaco na escola. No dia seguinte, foi à secretaria e encontrou o casaco na caixa de achados e perdidos.', p: 'Onde Bia encontrou o casaco?', certa: 'Na caixa de achados e perdidos', outras: ['Em casa', 'No ônibus'] },
  { t: 'Os pais de Tomás foram à missa das sete. Tomás ficou com a avó e foi com ela à missa das nove.', p: 'A que horas Tomás foi à missa?', certa: 'Às nove', outras: ['Às sete', 'Ao meio-dia'] },
  { t: 'Sofia quebrou o vaso da sala sem querer. Podia esconder os cacos, mas contou para a mãe e pediu desculpas.', p: 'Que virtude Sofia mostrou?', certa: 'Sinceridade', outras: ['Preguiça', 'Vaidade'] },
  { t: 'No inverno, os dias ficam mais curtos e as noites mais longas. Por isso, Ana precisa acender a luz mais cedo para ler.', p: 'Por que Ana acende a luz mais cedo no inverno?', certa: 'Porque escurece mais cedo', outras: ['Porque a lâmpada é nova', 'Porque ela acorda tarde'] },
  { t: 'Lucas queria brincar, mas tinha prometido terminar a lição antes. Fez as contas com calma e só depois foi jogar bola.', p: 'O que Lucas fez primeiro?', certa: 'Terminou a lição', outras: ['Jogou bola', 'Foi dormir'] },
  { t: 'Três amigos dividiram doze biscoitos em partes iguais, sem sobrar nenhum.', p: 'Quantos biscoitos cada um ganhou?', certa: 'Quatro', outras: ['Três', 'Seis'] },
  { t: 'As abelhas visitam as flores para buscar néctar. Voando de flor em flor, levam o pólen e ajudam as plantas a dar frutos.', p: 'Como as abelhas ajudam as plantas?', certa: 'Levando o pólen de flor em flor', outras: ['Comendo as folhas', 'Regando a terra'] },
  { t: 'Marta guardou a última fatia de bolo para o irmão, que chegaria tarde do treino. Quando ele chegou, ficou muito feliz.', p: 'Por que o irmão ficou feliz?', certa: 'Porque Marta guardou o bolo para ele', outras: ['Porque ganhou o jogo', 'Porque não havia bolo'] },
  { t: 'Clara achava que alguém cortava a Lua. O pai explicou que a Lua reflete a luz do Sol e que, durante o mês, vemos partes diferentes dela iluminadas.', p: 'Por que a Lua parece mudar de forma?', certa: 'Vemos partes diferentes iluminadas pelo Sol', outras: ['Alguém corta a Lua', 'A Lua encolhe'] },
];

/** Níveis: 1-5 qual frase está bem escrita (2 a 3 opções); 6+ ler um texto curto e responder (nos níveis pares, a frase volta como revisão). */
export function rodadaLeitura(nivel, rnd = Math.random) {
  if (nivel >= 6 && (nivel % 2 === 1 || nivel >= 12)) {
    const x = escolher(TEXTOS, rnd);
    return { tipo: 'texto', fala: `${x.t} ${x.p}`, idioma: 'pt-BR', texto: x.p, mostrar: { cena: x.t }, opcoes: embaralhar([x.certa, ...x.outras], rnd).map(opcaoTexto), certa: x.certa };
  }
  const certa = escolher(FRASES, rnd);
  const erradas = embaralhar(erradasDe(certa), rnd).slice(0, nivel <= 2 ? 1 : 2);
  return { tipo: 'frase', fala: 'Qual frase está escrita do jeito certo?', idioma: 'pt-BR', texto: 'Qual frase está certa?', mostrar: null, opcoes: embaralhar([certa, ...erradas], rnd).map(opcaoTexto), certa };
}

// ---------------------------------------------------------------- brincadeiras fora da tela

/** Brincadeiras e jogos de mesa tradicionais, sem tela, com o que desenvolvem. idade: faixa indicativa em anos. */
export const BRINCADEIRAS = [
  { id: 'massinha', nome: 'Massinha e blocos', idade: [2, 6], habilidades: ['coordenação fina', 'formas', 'criatividade'], como: 'Fazer bolinhas, cobrinhas e formas; contar as bolinhas; montar torres e comparar qual é mais alta.' },
  { id: 'roda-historias', nome: 'Roda de histórias', idade: [2, 15], habilidades: ['linguagem', 'imaginação', 'memória'], como: 'Cada um conta um pedaço da história; os pequenos recontam a história do dia com as próprias palavras.' },
  { id: 'palmas-silabas', nome: 'Palmas nas sílabas', idade: [3, 7], habilidades: ['consciência silábica', 'ritmo'], como: 'Falar nomes da casa batendo uma palma por sílaba (ca-sa, ja-ne-la) e contar as palmas.' },
  { id: 'esconde', nome: 'Esconde-esconde', idade: [3, 10], habilidades: ['contagem', 'orientação no espaço', 'autocontrole'], como: 'Quem procura conta até 20 (os maiores, de 2 em 2 ou de 5 em 5) e diz onde procurou: atrás, embaixo, ao lado.' },
  { id: 'memoria-caseira', nome: 'Jogo da memória feito em casa', idade: [3, 8], habilidades: ['memória', 'atenção', 'vocabulário'], como: 'Desenhar ou recortar pares de figuras em papel grosso; virar dois por vez e dizer o nome de cada figura.' },
  { id: 'amarelinha', nome: 'Amarelinha', idade: [4, 9], habilidades: ['equilíbrio', 'coordenação', 'números até 10'], como: 'Desenhar as casas de 1 a 10 no chão; dizer o número ao pular e jogar a pedrinha na casa certa.' },
  { id: 'domino', nome: 'Dominó', idade: [4, 10], habilidades: ['quantidades', 'correspondência', 'esperar a vez'], como: 'Começar contando os pontinhos de cada peça; depois somar as pontas.' },
  { id: 'cozinha', nome: 'Ajudar na cozinha medindo', idade: [4, 12], habilidades: ['medidas', 'frações', 'vida prática'], como: 'Medir meia xícara e um quarto de xícara, contar ovos, dividir a receita ao meio. Sempre com um adulto perto do fogão e das facas.' },
  { id: 'corda', nome: 'Pular corda cantando', idade: [5, 12], habilidades: ['ritmo', 'coordenação', 'contagem'], como: 'Contar os pulos, cantar parlendas, tentar bater o próprio recorde de pulos seguidos.' },
  { id: 'tesouro', nome: 'Caça ao tesouro com pistas', idade: [5, 12], habilidades: ['leitura', 'orientação', 'raciocínio'], como: 'Esconder pistas escritas (ou desenhadas, para os pequenos) que levam de um lugar a outro da casa.' },
  { id: 'damas', nome: 'Damas', idade: [6, 15], habilidades: ['estratégia', 'planejamento', 'perder e ganhar bem'], como: 'Jogar em família; depois de cada partida, perguntar: qual jogada decidiu o jogo?' },
  { id: 'xadrez', nome: 'Xadrez', idade: [6, 15], habilidades: ['estratégia', 'concentração', 'antecipar consequências'], como: 'Aprender uma peça por vez; jogar partidas curtas só com peões, depois com todas as peças.' },
  { id: 'pedras', nome: 'Jogo das pedras de verdade', idade: [7, 15], habilidades: ['estratégia', 'múltiplos'], como: 'Com feijões ou pedrinhas, jogar o mesmo jogo de "A melhor jogada": cada um tira de 1 a 3, quem tira a última ganha.' },
];

// ---------------------------------------------------------------- tempo de tela (opcional)

export const LIMITES = [0, 5, 10, 15, 20, 30]; // minutos por dia; 0 = sem limite
export const hojeISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** Tempo já usado hoje (ms); zera quando o dia muda. */
export const usadoHoje = (registro, hoje = hojeISO()) => (registro?.dia === hoje ? Math.max(0, Number(registro.ms) || 0) : 0);
export const acabou = (limiteMin, usadoMs) => limiteMin > 0 && usadoMs >= limiteMin * 60000;
