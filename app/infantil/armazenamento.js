// Armazenamento da aba Infantil: filhos, tarefas anexadas, "aula feita" e observações (por filho).
// Dois destinos com a mesma interface: este aparelho (IndexedDB) e a nuvem da família (tabelas aci_* do Supabase,
// protegidas por RLS: só contas que entraram na família com o código enxergam). A aba usa o mesmo login da Verdade.
// Nome e nascimento dos filhos ficam só aqui (aparelho ou banco privado), nunca no repositório público.

import { guardarPartida, interessesValidos, MAX_PARTIDAS } from './historico.js';
import { validarRegistro } from './registro.js';
import { validarSerie } from './series.js';

// ---------------------------------------------------------------- aparelho (IndexedDB)

const NOME_BD = 'aci-tarefas';
let abrindo;

const abrir = () => (abrindo ??= new Promise((ok, erro) => {
  if (typeof indexedDB === 'undefined') { erro(new Error('Este navegador não permite guardar tarefas no aparelho.')); return; }
  const req = indexedDB.open(NOME_BD, 2);
  req.onupgradeneeded = (ev) => {
    const db = req.result;
    if (ev.oldVersion < 1) {
      db.createObjectStore('anexos', { keyPath: 'id' }).createIndex('aula', 'aula');
      db.createObjectStore('aulas', { keyPath: ['aula', 'filho'] });
    } else if (ev.oldVersion < 2) {
      // v1 guardava "aula feita" só por aula; agora é por aula e filho (filho = '' quando não se indica quem fez)
      const leitura = req.transaction.objectStore('aulas').getAll();
      leitura.onsuccess = () => {
        db.deleteObjectStore('aulas');
        const novo = db.createObjectStore('aulas', { keyPath: ['aula', 'filho'] });
        for (const l of leitura.result) novo.put({ ...l, filho: l.filho ?? '' });
      };
    }
    if (ev.oldVersion < 2) db.createObjectStore('filhos', { keyPath: 'id' });
  };
  req.onsuccess = () => ok(req.result);
  req.onerror = () => erro(req.error);
  req.onblocked = () => erro(new Error('Feche as outras abas deste site e tente de novo.'));
}));

// Espera a transação terminar (e não só o pedido).
const tx = async (loja, modo, fn) => {
  const db = await abrir();
  return new Promise((ok, erro) => {
    const t = db.transaction(loja, modo);
    const req = fn(t.objectStore(loja));
    t.oncomplete = () => ok(req?.result);
    t.onerror = t.onabort = () => erro(t.error ?? new Error('Falha ao gravar no aparelho. O espaço pode ter acabado.'));
  });
};

const comFilho = (a) => ({ ...a, filho: a.filho ?? '' });

// "Já lemos" no aparelho: localStorage, uma lista de ids por filho (chave de antes, para não perder as marcações).
const PREFIXO_LIDOS = 'aci-livros-lidos-';
const lerLidosLocal = (filho) => { try { return JSON.parse(localStorage.getItem(PREFIXO_LIDOS + filho)) ?? []; } catch { return []; } };
const filhosComLidosLocal = () => { try { return Object.keys(localStorage).filter((k) => k.startsWith(PREFIXO_LIDOS)).map((k) => k.slice(PREFIXO_LIDOS.length)); } catch { return []; } };

// Partidas dos jogos no aparelho: localStorage, uma lista por filho (mais recente primeiro).
const PREFIXO_PARTIDAS = 'aci-jogos-hist-';
const lerPartidasLocal = (filho) => { try { return JSON.parse(localStorage.getItem(PREFIXO_PARTIDAS + filho)) ?? []; } catch { return []; } };
const filhosComPartidasLocal = () => { try { return Object.keys(localStorage).filter((k) => k.startsWith(PREFIXO_PARTIDAS)).map((k) => k.slice(PREFIXO_PARTIDAS.length)); } catch { return []; } };

// Registros de aprendizagem no aparelho: localStorage, uma lista por filho.
const PREFIXO_REGISTROS = 'aci-registros-';
const lerRegistrosLocal = (filho) => { try { return JSON.parse(localStorage.getItem(PREFIXO_REGISTROS + filho)) ?? []; } catch { return []; } };
const gravarRegistrosLocal = (filho, lista) => { try { localStorage.setItem(PREFIXO_REGISTROS + filho, JSON.stringify(lista)); } catch { throw new Error('Este navegador não deixou guardar o registro.'); } };
const filhosComRegistrosLocal = () => { try { return Object.keys(localStorage).filter((k) => k.startsWith(PREFIXO_REGISTROS)).map((k) => k.slice(PREFIXO_REGISTROS.length)); } catch { return []; } };

// Séries acompanhadas no aparelho: localStorage, uma lista por filho.
const PREFIXO_SERIES = 'aci-series-';
const lerSeriesLocal = (filho) => { try { return JSON.parse(localStorage.getItem(PREFIXO_SERIES + filho)) ?? []; } catch { return []; } };
const gravarSeriesLocal = (filho, lista) => { try { localStorage.setItem(PREFIXO_SERIES + filho, JSON.stringify(lista)); } catch { throw new Error('Este navegador não deixou guardar o acompanhamento.'); } };
const filhosComSeriesLocal = () => { try { return Object.keys(localStorage).filter((k) => k.startsWith(PREFIXO_SERIES)).map((k) => k.slice(PREFIXO_SERIES.length)); } catch { return []; } };

const comoFilho = (f) => ({ id: f.id, nome: f.nome, nascimento: f.nascimento || null, perfil: f.perfil || null, interesses: interessesValidos(f.interesses) });

export const aparelho = {
  listarFilhos: async () => (await tx('filhos', 'readonly', (s) => s.getAll())).map(comoFilho),
  salvarFilho: (f) => tx('filhos', 'readwrite', (s) => s.put(comoFilho(f))),
  apagarFilho: (id) => tx('filhos', 'readwrite', (s) => s.delete(id)),

  listarAnexos: async (aula) => (await tx('anexos', 'readonly', (s) => s.index('aula').getAll(aula))).map(comFilho),
  listarTodosAnexos: async () => (await tx('anexos', 'readonly', (s) => s.getAll())).map(comFilho),
  salvarAnexo: (a) => tx('anexos', 'readwrite', (s) => s.put(comFilho(a))),
  apagarAnexo: (id) => tx('anexos', 'readwrite', (s) => s.delete(id)),

  lerAula: async (aula, filho = '') => (await tx('aulas', 'readonly', (s) => s.get([aula, filho]))) ?? { aula, filho, feita: false, nota: '' },
  listarAulas: () => tx('aulas', 'readonly', (s) => s.getAll()),
  salvarAula: (r) => tx('aulas', 'readwrite', (s) => s.put({ aula: r.aula, filho: r.filho ?? '', feita: !!r.feita, nota: r.nota ?? '' })),

  listarLidos: async (filho) => lerLidosLocal(filho),
  async marcarLido(filho, livro, lido) {
    const s = new Set(lerLidosLocal(filho));
    lido ? s.add(livro) : s.delete(livro);
    try { localStorage.setItem(PREFIXO_LIDOS + filho, JSON.stringify([...s])); } catch { throw new Error('Este navegador não deixou guardar a marcação.'); }
  },

  listarPartidas: async (filho) => lerPartidasLocal(filho),
  async salvarPartida(p) {
    try { localStorage.setItem(PREFIXO_PARTIDAS + p.filho, JSON.stringify(guardarPartida(lerPartidasLocal(p.filho), p))); } catch { throw new Error('Este navegador não deixou guardar a partida.'); }
  },

  listarRegistros: async (filho) => lerRegistrosLocal(filho),
  async salvarRegistro(r) {
    const v = validarRegistro(r);
    gravarRegistrosLocal(v.filho, [v, ...lerRegistrosLocal(v.filho).filter((x) => x.id !== v.id)]);
  },
  async apagarRegistro(filho, id) { gravarRegistrosLocal(filho, lerRegistrosLocal(filho).filter((x) => x.id !== id)); },

  listarSeries: async (filho) => lerSeriesLocal(filho),
  async salvarSerie(s) {
    const v = validarSerie(s);
    gravarSeriesLocal(v.filho, [v, ...lerSeriesLocal(v.filho).filter((x) => x.id !== v.id)]);
  },
  async apagarSerie(filho, id) { gravarSeriesLocal(filho, lerSeriesLocal(filho).filter((x) => x.id !== id)); },
};

// ---------------------------------------------------------------- nuvem da família (Supabase)

const BUCKET = 'aci-tarefas';

/** @param {() => Promise<any>} obterCliente  devolve o cliente Supabase da Verdade (ou null se a nuvem não está configurada) */
export function criarNuvem(obterCliente) {
  const blobs = new Map(); // id do anexo → arquivo já baixado, para não baixar de novo a cada atualização
  const c = async () => {
    const cl = await obterCliente();
    if (!cl) throw new Error('A sincronização não está ativada neste site.');
    return cl;
  };
  const ok = ({ data, error }) => { if (error) throw error; return data; };
  const comoAnexo = (l, blob) => ({ id: l.id, aula: l.aula, filho: l.filho ?? '', nome: l.nome, tipo: l.tipo, tamanho: l.tamanho, data: Date.parse(l.criado_em), caminho: l.caminho, blob });

  const nuvem = {
    async naFamilia() { return ok(await (await c()).rpc('aci_na_familia')) === true; },
    /** Entra na família com o código; false se o código estiver errado. */
    async entrarNaFamilia(codigo) { return ok(await (await c()).rpc('aci_reivindicar', { codigo })) === true; },
    async sairDaFamilia() { ok(await (await c()).rpc('aci_sair_da_familia')); blobs.clear(); },
    limpar: () => blobs.clear(),

    async listarFilhos() { return ok(await (await c()).from('aci_filho').select('id, nome, nascimento, perfil, interesses')).map(comoFilho); },
    async salvarFilho(f) { ok(await (await c()).from('aci_filho').upsert({ ...comoFilho(f), atualizado: new Date().toISOString() }, { onConflict: 'id' })); },

    async listarPartidas(filho) {
      const linhas = ok(await (await c()).from('aci_jogo').select('*').eq('filho', filho).order('inicio', { ascending: false }).limit(MAX_PARTIDAS));
      return linhas.map((l) => ({ id: l.id, filho: l.filho, jogo: l.jogo, inicio: Date.parse(l.inicio), fim: Date.parse(l.fim), nivelInicial: l.nivel_inicial, nivelFinal: l.nivel_final, nivelMax: l.nivel_max, acertos: l.acertos, erros: l.erros, obs: l.obs ?? '' }));
    },
    async salvarPartida(p) {
      ok(await (await c()).from('aci_jogo').upsert({ id: p.id, filho: p.filho, jogo: p.jogo, inicio: new Date(p.inicio).toISOString(), fim: new Date(p.fim).toISOString(), nivel_inicial: p.nivelInicial, nivel_final: p.nivelFinal, nivel_max: p.nivelMax, acertos: p.acertos, erros: p.erros, obs: String(p.obs ?? '').slice(0, 1000), atualizado: new Date().toISOString() }, { onConflict: 'id' }));
    },
    async apagarFilho(id) { ok(await (await c()).from('aci_filho').delete().eq('id', id)); },

    async lerAula(aula, filho = '') { return ok(await (await c()).from('aci_aula').select('aula, filho, feita, nota').eq('aula', aula).eq('filho', filho).maybeSingle()) ?? { aula, filho, feita: false, nota: '' }; },
    async listarAulas() { return ok(await (await c()).from('aci_aula').select('aula, filho, feita, nota')); },
    async salvarAula(r) { ok(await (await c()).from('aci_aula').upsert({ aula: r.aula, filho: r.filho ?? '', feita: !!r.feita, nota: r.nota ?? '', atualizado: new Date().toISOString() }, { onConflict: 'aula,filho' })); },

    async listarRegistros(filho) {
      const linhas = ok(await (await c()).from('aci_registro').select('*').eq('filho', filho).order('criado_em', { ascending: false }));
      return linhas.map((l) => ({ id: l.id, filho: l.filho, aula: l.aula, area: l.area, habilidade: l.habilidade, situacao: l.situacao, origem: l.origem, dificuldade: l.dificuldade, intervencao: l.intervencao, reavaliar: l.reavaliar, criadoEm: Date.parse(l.criado_em) }));
    },
    async salvarRegistro(r) {
      const v = validarRegistro(r);
      ok(await (await c()).from('aci_registro').upsert({ id: v.id, filho: v.filho, aula: v.aula, area: v.area, habilidade: v.habilidade, situacao: v.situacao, origem: v.origem, dificuldade: v.dificuldade, intervencao: v.intervencao, reavaliar: v.reavaliar, criado_em: new Date(v.criadoEm).toISOString() }, { onConflict: 'id' }));
    },
    async apagarRegistro(filho, id) { ok(await (await c()).from('aci_registro').delete().eq('filho', filho).eq('id', id)); },

    async listarSeries(filho) {
      // linha que não passa na validação (editada fora do site) fica de fora em vez de quebrar a tela
      return ok(await (await c()).from('aci_serie').select('id, filho, obra, titulo, dados').eq('filho', filho))
        .flatMap((l) => { try { return [validarSerie(l)]; } catch { return []; } });
    },
    async salvarSerie(s) {
      const v = validarSerie(s);
      ok(await (await c()).from('aci_serie').upsert({ ...v, atualizado: new Date().toISOString() }, { onConflict: 'id' }));
    },
    async apagarSerie(filho, id) { ok(await (await c()).from('aci_serie').delete().eq('filho', filho).eq('id', id)); },

    async listarLidos(filho) { return ok(await (await c()).from('aci_livro').select('livro').eq('filho', filho)).map((l) => l.livro); },
    async marcarLido(filho, livro, lido) {
      const t = (await c()).from('aci_livro');
      ok(await (lido ? t.upsert({ filho, livro }, { onConflict: 'filho,livro' }) : t.delete().eq('filho', filho).eq('livro', livro)));
    },

    async baixar(anexo) {
      if (blobs.has(anexo.id)) return blobs.get(anexo.id);
      const blob = ok(await (await c()).storage.from(BUCKET).download(anexo.caminho));
      blobs.set(anexo.id, blob);
      return blob;
    },
    async listarAnexos(aula) {
      const linhas = ok(await (await c()).from('aci_anexo').select('*').eq('aula', aula).order('criado_em', { ascending: false }));
      return Promise.all(linhas.map(async (l) => comoAnexo(l, await nuvem.baixar(l))));
    },
    // Sem baixar os arquivos: só para contar e para o backup, que baixa um a um.
    async listarTodosAnexos() { return ok(await (await c()).from('aci_anexo').select('*')).map((l) => comoAnexo(l)); },

    async salvarAnexo(a) {
      const cl = await c();
      const seguro = a.nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').slice(-60) || 'arquivo';
      const caminho = `${a.aula}/${a.id}-${seguro}`;
      ok(await cl.storage.from(BUCKET).upload(caminho, a.blob, { contentType: a.tipo, upsert: false }));
      const { error } = await cl.from('aci_anexo').insert({ id: a.id, aula: a.aula, filho: a.filho ?? '', nome: a.nome, tipo: a.tipo, tamanho: a.tamanho, caminho, criado_em: new Date(a.data).toISOString() });
      if (error) {
        await cl.storage.from(BUCKET).remove([caminho]); // não deixa arquivo órfão
        throw error;
      }
      blobs.set(a.id, a.blob);
    },
    async apagarAnexo(id) {
      const cl = await c();
      const linha = ok(await cl.from('aci_anexo').select('caminho').eq('id', id).maybeSingle());
      if (linha) ok(await cl.storage.from(BUCKET).remove([linha.caminho]));
      ok(await cl.from('aci_anexo').delete().eq('id', id));
      blobs.delete(id);
    },
  };
  return nuvem;
}

// ---------------------------------------------------------------- escolha do destino

/**
 * modo 'nuvem': logado e na família; 'pendente': logado, mas ainda sem o código da família; 'aparelho': sem login.
 * Fora do modo nuvem, tudo fica neste aparelho.
 */
export function criarArmazenamento({ obterCliente, obterUsuario, familiaAtiva = true }) {
  const nuvem = criarNuvem(obterCliente);
  let modo = 'aparelho';
  let usuario = null;
  const alvo = () => (modo === 'nuvem' ? nuvem : aparelho);

  return {
    modo: () => modo,
    usuario: () => usuario,
    /** Com a família desativada (config.js), nem consulta a conta nem a nuvem: tudo fica no aparelho. */
    async iniciar() {
      modo = 'aparelho'; usuario = null; nuvem.limpar();
      if (!familiaAtiva) return { modo, usuario };
      try {
        usuario = await obterUsuario();
        if (usuario) modo = (await nuvem.naFamilia()) ? 'nuvem' : 'pendente';
      } catch { modo = 'aparelho'; }
      return { modo, usuario };
    },
    async entrarNaFamilia(codigo) { const entrou = await nuvem.entrarNaFamilia(codigo); modo = entrou ? 'nuvem' : 'pendente'; return entrou; },
    async sairDaFamilia() { await nuvem.sairDaFamilia(); modo = 'pendente'; },

    listarFilhos: () => alvo().listarFilhos(),
    salvarFilho: (f) => alvo().salvarFilho(f),
    apagarFilho: (id) => alvo().apagarFilho(id),
    lerAula: (a, filho) => alvo().lerAula(a, filho),
    listarAulas: () => alvo().listarAulas(),
    salvarAula: (r) => alvo().salvarAula(r),
    listarAnexos: (a) => alvo().listarAnexos(a),
    listarTodosAnexos: () => alvo().listarTodosAnexos(),
    salvarAnexo: (x) => alvo().salvarAnexo(x),
    apagarAnexo: (id) => alvo().apagarAnexo(id),
    listarLidos: (filho) => alvo().listarLidos(filho),
    marcarLido: (filho, livro, lido) => alvo().marcarLido(filho, livro, lido),
    listarPartidas: (filho) => alvo().listarPartidas(filho),
    salvarPartida: (p) => alvo().salvarPartida(p),
    listarRegistros: (filho) => alvo().listarRegistros(filho),
    salvarRegistro: (r) => alvo().salvarRegistro(r),
    apagarRegistro: (filho, id) => alvo().apagarRegistro(filho, id),
    listarSeries: (filho) => alvo().listarSeries(filho),
    salvarSerie: (s) => alvo().salvarSerie(s),
    apagarSerie: (filho, id) => alvo().apagarSerie(filho, id),
    /** Arquivo de um anexo: já vem no aparelho; na nuvem é baixado sob demanda. */
    arquivoDe: async (x) => x.blob ?? nuvem.baixar(x),

    /** Quantos itens deste aparelho podem subir: anexos, livros marcados e partidas dos jogos. */
    async contarLocais() {
      const livros = filhosComLidosLocal().reduce((n, f) => n + lerLidosLocal(f).length, 0)
        + filhosComPartidasLocal().reduce((n, f) => n + lerPartidasLocal(f).length, 0)
        + filhosComRegistrosLocal().reduce((n, f) => n + lerRegistrosLocal(f).length, 0)
        + filhosComSeriesLocal().reduce((n, f) => n + lerSeriesLocal(f).length, 0);
      try { return (await aparelho.listarTodosAnexos()).length + livros; } catch { return livros; }
    },
    /** Envia para a nuvem tudo o que está neste aparelho. Devolve quantos itens (anexos, livros e partidas) subiram. */
    async enviarAparelhoParaNuvem() {
      let livros = 0;
      for (const f of filhosComLidosLocal()) for (const l of lerLidosLocal(f)) { await nuvem.marcarLido(f, l, true); livros++; }
      // a partida tem id próprio: reenviar só atualiza a mesma linha
      for (const f of filhosComPartidasLocal()) for (const p of lerPartidasLocal(f)) { await nuvem.salvarPartida(p); livros++; }
      for (const f of filhosComRegistrosLocal()) for (const r of lerRegistrosLocal(f)) { await nuvem.salvarRegistro(r); livros++; }
      for (const f of filhosComSeriesLocal()) for (const s of lerSeriesLocal(f)) { await nuvem.salvarSerie(s); livros++; }
      const [filhos, aulas, anexos, naNuvem] = await Promise.all([aparelho.listarFilhos(), aparelho.listarAulas(), aparelho.listarTodosAnexos(), nuvem.listarTodosAnexos()]);
      const existentes = new Set(naNuvem.map((x) => x.id));
      for (const f of filhos) await nuvem.salvarFilho(f);
      for (const r of aulas) await nuvem.salvarAula(r);
      let n = 0;
      for (const a of anexos) {
        if (existentes.has(a.id)) continue;
        await nuvem.salvarAnexo(a);
        n++;
      }
      return n + livros;
    },
  };
}
