// Acompanhamento de séries, animes e filmes: só lógica, sem tela nem armazenamento.
// A estrutura vem da família (conferida na fonte oficial: plataforma, distribuidora, editora); o site não inventa
// episódios nem classifica fillers sozinho. Episódios são numerados em sequência (1..total) através das temporadas.
// Uma série: { id, filho, obra|null, titulo, dados: { temporadas: [{ nome, episodios }], arcos: [{ nome, de, ate, tipo }],
//   assistidos: number[], favoritos: number[], analisados: string[], observacoes } }.

export const TIPOS_EPISODIO = { principal: 'História principal', filler: 'Filler', misto: 'Misto', complementar: 'Complementar', especial: 'Especial' };
const LIM = { temporadas: 60, episodios: 2000, arcos: 300, texto: 5000 };
const UUID = /^[0-9a-f-]{36}$/i;
const FILHO = /^[a-z0-9-]{1,30}$/;
const OBRA = /^[a-z0-9-]{1,60}$/;
const inteiro = (v) => (Number.isInteger(Number(v)) ? Number(v) : NaN);
const texto = (v, max) => String(v ?? '').trim().slice(0, max);

export const totalEpisodios = (d) => (d.temporadas ?? []).reduce((n, t) => n + t.episodios, 0);

/** Confere e limpa uma série vinda da tela, da nuvem ou de um backup. Lança erro com mensagem para a tela. */
export function validarSerie(s) {
  const id = String(s?.id ?? '');
  if (!UUID.test(id)) throw new Error('Série sem identificador válido.');
  if (!FILHO.test(String(s.filho ?? ''))) throw new Error('Escolha o filho.');
  const titulo = texto(s.titulo, 120);
  if (!titulo) throw new Error('Escreva o título.');
  const obra = s.obra && OBRA.test(String(s.obra)) ? String(s.obra) : null;
  const d = s.dados ?? {};
  const temporadas = (Array.isArray(d.temporadas) ? d.temporadas : []).slice(0, LIM.temporadas).map((t, i) => {
    const episodios = inteiro(t?.episodios);
    if (!(episodios >= 1 && episodios <= LIM.episodios)) throw new Error(`Temporada ${i + 1}: informe de 1 a ${LIM.episodios} episódios.`);
    return { nome: texto(t.nome, 60) || `Temporada ${i + 1}`, episodios };
  });
  const total = totalEpisodios({ temporadas });
  const arcos = (Array.isArray(d.arcos) ? d.arcos : []).slice(0, LIM.arcos).map((a) => {
    const de = inteiro(a?.de); const ate = inteiro(a?.ate);
    if (!texto(a?.nome, 80)) throw new Error('Todo arco precisa de nome.');
    if (!(de >= 1 && ate >= de && ate <= total)) throw new Error(`Arco "${texto(a.nome, 80)}": episódios entre 1 e ${total}, com o início antes do fim.`);
    return { nome: texto(a.nome, 80), de, ate, tipo: a.tipo in TIPOS_EPISODIO ? a.tipo : 'principal' };
  });
  const episodiosValidos = (lista) => [...new Set((Array.isArray(lista) ? lista : []).map(inteiro).filter((n) => n >= 1 && n <= total))].sort((a, b) => a - b);
  return {
    id, filho: String(s.filho), obra, titulo,
    dados: {
      temporadas, arcos, assistidos: episodiosValidos(d.assistidos), favoritos: episodiosValidos(d.favoritos),
      analisados: (Array.isArray(d.analisados) ? d.analisados : []).map((n) => texto(n, 80)).filter((n) => arcos.some((a) => a.nome === n)),
      observacoes: texto(d.observacoes, LIM.texto),
    },
  };
}

/** Em que temporada está o episódio n (1..total): { temporada (índice), nome, numero (dentro da temporada) }. */
export function ondeEsta(d, n) {
  let antes = 0;
  for (const [i, t] of d.temporadas.entries()) {
    if (n <= antes + t.episodios) return { temporada: i, nome: t.nome, numero: n - antes };
    antes += t.episodios;
  }
  return null;
}

/** Próximo episódio a assistir: o primeiro não marcado (null se terminou ou se não há estrutura). */
export function proximo(d) {
  const vistos = new Set(d.assistidos);
  for (let n = 1; n <= totalEpisodios(d); n++) if (!vistos.has(n)) return n;
  return null;
}

/** Marca ou desmarca um episódio (devolve dados novos). */
export function alternar(d, n) {
  const s = new Set(d.assistidos);
  s.has(n) ? s.delete(n) : s.add(n);
  return { ...d, assistidos: [...s].sort((a, b) => a - b) };
}

/** Marca de uma vez todos os episódios até n: para quem assistiu vários e registra depois. */
export function marcarAte(d, n) {
  const fim = Math.min(n, totalEpisodios(d));
  return { ...d, assistidos: [...new Set([...d.assistidos, ...Array.from({ length: Math.max(0, fim) }, (_, i) => i + 1)])].sort((a, b) => a - b) };
}

export const progresso = (d) => { const total = totalEpisodios(d); return { vistos: d.assistidos.length, total, pct: total ? Math.round((d.assistidos.length / total) * 100) : 0 }; };

/** Arcos com todos os episódios assistidos e ainda sem análise feita: a hora de conversar sobre o arco. */
export function arcosParaAnalisar(d) {
  const vistos = new Set(d.assistidos);
  return d.arcos.filter((a) => !d.analisados.includes(a.nome) && Array.from({ length: a.ate - a.de + 1 }, (_, i) => a.de + i).every((n) => vistos.has(n)));
}

const TIPO_POR_NOME = Object.fromEntries(Object.entries(TIPOS_EPISODIO).flatMap(([k, r]) => [[k, k], [r.toLocaleLowerCase('pt-BR'), k]]));

/**
 * Lê a estrutura digitada pela família, uma linha por item.
 * Temporadas: "Nome | episódios" ou só o número. Arcos: "Nome | início-fim | tipo" (tipo opcional: principal, filler,
 * misto, complementar, especial). Linhas vazias são ignoradas; linha mal escrita gera erro com o número da linha.
 */
export function lerEstrutura(textoTemporadas, textoArcos) {
  const linhas = (t) => String(t ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  const temporadas = linhas(textoTemporadas).map((l, i) => {
    const [a, b] = l.split('|').map((x) => x.trim());
    const n = Number(b ?? a);
    if (!Number.isInteger(n) || n < 1) throw new Error(`Temporadas, linha ${i + 1}: escreva "Nome | número de episódios".`);
    return { nome: b === undefined ? `Temporada ${i + 1}` : a, episodios: n };
  });
  const arcos = linhas(textoArcos).map((l, i) => {
    const [nome, faixa = '', tipo = ''] = l.split('|').map((x) => x.trim());
    const m = /^(\d+)\s*-\s*(\d+)$/.exec(faixa);
    if (!nome || !m) throw new Error(`Arcos, linha ${i + 1}: escreva "Nome | início-fim | tipo".`);
    const t = TIPO_POR_NOME[tipo.toLocaleLowerCase('pt-BR')];
    if (tipo && !t) throw new Error(`Arcos, linha ${i + 1}: o tipo deve ser ${Object.keys(TIPOS_EPISODIO).join(', ')}.`);
    return { nome, de: Number(m[1]), ate: Number(m[2]), tipo: t ?? 'principal' };
  });
  return { temporadas, arcos };
}

/** O inverso de lerEstrutura, para preencher o formulário. */
export const escreverEstrutura = (d) => ({
  temporadas: d.temporadas.map((t) => `${t.nome} | ${t.episodios}`).join('\n'),
  arcos: d.arcos.map((a) => `${a.nome} | ${a.de}-${a.ate} | ${a.tipo}`).join('\n'),
});

/** Tipo do episódio pelo arco que a família informou (o primeiro arco que o contém); null se não houver. */
export const tipoDoEpisodio = (d, n) => d.arcos.find((a) => n >= a.de && n <= a.ate)?.tipo ?? null;
