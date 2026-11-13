// Aba Infantil: lista de aulas, telas e a lógica da nuvem da família (contra um Supabase simulado em memória).
// Não testa as regras RLS do banco: essas foram testadas no próprio banco (ver PUBLICAR.md).
// Executar com: node --test app/tests/infantil.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AULAS_INFANTIL, aulaInfantilPorData } from '../infantil/aulas.js';
import { criarNuvem, criarArmazenamento } from '../infantil/armazenamento.js';
import { idade, proximoCodigo } from '../infantil/idade.js';
import { proximaPorFilho } from '../infantil/progresso.js';
import { FAIXAS, SECOES, FORMATOS, LIVROS_INFANTIL, CATEQUESE, PAIS, livrosDaFaixa, faixaPara } from '../infantil/livros.js';
import { infantil, aulaInfantil } from '../views/infantil.js';
import { JOGOS, PARES, GRUPOS, ajustar, progressoInicial, usadoHoje, acabou } from '../infantil/jogos.js';
import { jogos, jogo } from '../views/jogos.js';
import { rodadaQuantos, TEMAS, COISAS } from '../infantil/jogos.js';
import { guardarPartida, anotarResposta, recorde, resumoJogo, recomendar, anosCompletos, interessesValidos, MAX_PARTIDAS } from '../infantil/historico.js';
import { textoParaIA, OBSERVACOES } from '../infantil/prompt.js';
import { validarRegistro, situacaoAtual, proximosPassos, AREAS } from '../infantil/registro.js';
import { TRILHAS, HABILIDADES, DIAS_RETENCAO, habilidadePorId, habilidadeDoTexto, estadoDaHabilidade, mapaDaTrilha, proximasHabilidades, trilhasDaIdade } from '../infantil/habilidades.js';
import { validarSerie, ondeEsta, proximo, alternar, marcarAte, progresso, arcosParaAnalisar, lerEstrutura, escreverEstrutura, tipoDoEpisodio } from '../infantil/series.js';
import { MIDIA_INFANTIL, ASPECTOS, PERCURSOS, TIPOS_MIDIA } from '../infantil/midia.js';
import { assistir, obraInfantil } from '../views/assistir.js';
import { textoArcoIA } from '../infantil/prompt.js';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const ICONES = ['peixe', 'passaro', 'ovelha', 'gato', 'pato', 'sol', 'estrela', 'cruz'];
const CODIGO = 'codigo-certo';
const LIVROS_VERDADE_EXCLUIDOS = new Set([
  'compendio do catecismo da igreja catolica|igreja catolica',
  'catecismo da igreja catolica|igreja catolica',
  'como ler livros|mortimer j adler e charles van doren',
]);

function bancoSimulado({ membros = [] } = {}) {
  const tabelas = { aci_aula: [], aci_anexo: [], aci_filho: [], aci_livro: [], aci_jogo: [], aci_registro: [], aci_serie: [] };
  const objetos = new Map();
  const familia = new Set(membros);
  const estado = { usuario: null, falharInsert: false };

  const from = (nome) => {
    let op = 'select'; let corpo = null; let ordem = null; let unico = false;
    const filtros = [];
    const casa = (l) => filtros.every(([c, v]) => l[c] === v);
    const executar = () => {
      const t = tabelas[nome];
      if (op === 'insert') {
        if (estado.falharInsert) return { data: null, error: new Error('violação de regra') };
        t.push({ ...corpo });
        return { data: null, error: null };
      }
      if (op === 'upsert') {
        const chave = (l) => ({ aci_aula: `${l.aula}|${l.filho}`, aci_livro: `${l.filho}|${l.livro}` }[nome] ?? l.id);
        const i = t.findIndex((l) => chave(l) === chave(corpo));
        if (i >= 0) t[i] = { ...t[i], ...corpo }; else t.push({ ...corpo });
        return { data: null, error: null };
      }
      if (op === 'delete') { tabelas[nome] = t.filter((l) => !casa(l)); return { data: null, error: null }; }
      const r = t.filter(casa);
      if (ordem) r.sort((a, b) => (a[ordem[0]] < b[ordem[0]] ? -1 : 1) * (ordem[1] ? 1 : -1));
      return { data: unico ? (r[0] ?? null) : r, error: null };
    };
    const q = {
      select: () => q,
      insert: (c) => { op = 'insert'; corpo = c; return q; },
      upsert: (c) => { op = 'upsert'; corpo = c; return q; },
      delete: () => { op = 'delete'; return q; },
      eq: (c, v) => { filtros.push([c, v]); return q; },
      order: (c, { ascending }) => { ordem = [c, ascending]; return q; },
      maybeSingle: () => { unico = true; return q; },
      limit: () => q,
      then: (ok, erro) => Promise.resolve(executar()).then(ok, erro),
    };
    return q;
  };

  const cliente = {
    rpc: async (nome, args = {}) => {
      const uid = estado.usuario?.id;
      if (nome === 'aci_na_familia') return { data: Boolean(uid) && familia.has(uid), error: null };
      if (nome === 'aci_reivindicar') {
        if (!uid) return { data: false, error: null };
        if (!familia.has(uid) && args.codigo === CODIGO) familia.add(uid);
        return { data: familia.has(uid), error: null };
      }
      if (nome === 'aci_sair_da_familia') { familia.delete(uid); return { data: null, error: null }; }
      return { data: null, error: new Error('função desconhecida') };
    },
    from,
    storage: {
      from: () => ({
        upload: async (caminho, blob, opcoes) => {
          if (objetos.has(caminho) && !opcoes?.upsert) return { data: null, error: new Error('já existe') };
          objetos.set(caminho, blob);
          return { data: { path: caminho }, error: null };
        },
        download: async (caminho) => (objetos.has(caminho) ? { data: objetos.get(caminho), error: null } : { data: null, error: new Error('não encontrado') }),
        remove: async (caminhos) => { caminhos.forEach((c) => objetos.delete(c)); return { data: [], error: null }; },
      }),
    },
  };
  return { cliente, tabelas, objetos, familia, estado };
}

const pdf = (texto = 'x') => new Blob([texto], { type: 'application/pdf' });
const anexo = (id, aula = '2026-11-03', nome = 'Tarefa página 5.pdf') => ({ id, aula, nome, tipo: 'application/pdf', tamanho: 1, data: Date.now(), blob: pdf() });
const logado = (banco, id = 'u1') => { banco.estado.usuario = { id, email: `${id}@exemplo.com` }; };

test('infantil: cada aula publicada tem os campos, os dois PDFs e um ícone válido', () => {
  assert.ok(AULAS_INFANTIL.length >= 1);
  for (const a of AULAS_INFANTIL) {
    assert.match(a.data, /^\d{4}-\d{2}-\d{2}(-f\d{1,3})?$/, 'o id é a data, com o sufixo do filho quando há duas aulas no mesmo dia');
    assert.ok(a.titulo && a.resumo, `${a.data}: faltam título ou resumo`);
    assert.match(a.filho, /^f\d+$/, `${a.data}: falta o código do filho (f1, f2…)`);
    assert.ok(a.para, `${a.data}: falta o rótulo "Para"`);
    assert.ok(['menina', 'menino'].includes(a.perfil), `${a.data}: falta o perfil da versão (menina ou menino)`);
    assert.ok(ICONES.includes(a.icone), `${a.data}: ícone ${a.icone} desconhecido`);
    for (const tipo of ['aluna', 'responsavel']) {
      assert.ok(existsSync(join(app, a.arquivos[tipo])), `${a.data}: falta ${a.arquivos[tipo]}`);
      assert.ok(a.paginas[tipo] > 0, `${a.data}: páginas de ${tipo}`);
    }
    assert.equal(aulaInfantilPorData(a.data), a);
  }
  assert.equal(new Set(AULAS_INFANTIL.map((a) => a.data)).size, AULAS_INFANTIL.length, 'datas repetidas');
  assert.equal(aulaInfantilPorData('1999-01-01'), undefined);
});

test('infantil: as telas mostram as aulas, os PDFs e os campos de anexar', () => {
  const lista = infantil();
  const a = AULAS_INFANTIL[0];
  assert.ok(lista.includes(a.titulo) && lista.includes(`href="#infantil-${a.data}"`));
  assert.ok(lista.includes(`href="${a.arquivos.aluna}" download`) && lista.includes(`href="${a.arquivos.responsavel}" download`));
  assert.ok(lista.indexOf('</header>') > 0, 'o roteador insere o resto depois do primeiro </header>');
  const tela = aulaInfantil(null, a.data);
  for (const trecho of ['id="inf-arquivos"', 'id="inf-camera"', 'capture="environment"', 'id="inf-soltar"', 'id="inf-feita"', 'id="inf-nota"', 'id="inf-quem"', 'multiple', `Para: ${a.para}`]) assert.ok(tela.includes(trecho), `falta ${trecho}`);
  assert.ok(lista.includes('id="inf-filhos-lista"') && lista.includes('id="inf-filho-novo"') && lista.includes(`Para: ${a.para}`));
  assert.match(aulaInfantil(null, '1999-01-01'), /Aula não encontrada/);
});

test('infantil: leitor de PDF e recomendações aparecem nas telas', () => {
  const tela = aulaInfantil(null, AULAS_INFANTIL[0].data);
  for (const trecho of ['id="inf-ler"', 'id="inf-leitor-area"', 'id="inf-leitor-tela"', 'name="inf-doc"', 'name="inf-modo"', 'data-acao="tela-cheia"']) assert.ok(tela.includes(trecho), `falta ${trecho}`);
  const lista = infantil();
  for (const trecho of ['id="inf-proximas"', 'Como usar a Academia para Verdade Jr.', 'A revisão da semana']) assert.ok(lista.includes(trecho), `falta ${trecho}`);
});

test('livros: catálogo com campos, ids únicos (para o "Já lemos"), faixa e seção válidas; a aba mostra tudo', () => {
  const faixas = new Set(FAIXAS.map((f) => f.id));
  const todos = [...LIVROS_INFANTIL, ...CATEQUESE, ...PAIS];
  assert.equal(new Set(todos.map((l) => l.id)).size, todos.length, 'ids repetidos');
  for (const l of LIVROS_INFANTIL) {
    assert.ok(faixas.has(l.faixa), `faixa inválida em ${l.id}`);
    assert.ok(l.secao in SECOES, `seção inválida em ${l.id}`);
    assert.ok(!l.formato || l.formato in FORMATOS, `formato inválido em ${l.id}`);
  }
  for (const l of todos) for (const campo of ['titulo', 'autor']) assert.ok(String(l[campo] ?? '').trim(), `${l.id} sem ${campo}`);
  for (const f of FAIXAS) assert.ok(livrosDaFaixa(f.id).length > 0, `faixa vazia: ${f.id}`);
  const lista = infantil();
  for (const trecho of ['Biblioteca da família', 'id="inf-livros-filho"', 'data-livro="boa-noite-lua"', 'Sagrada Escritura', 'Catequese e formação religiosa', 'não verificados']) assert.ok(lista.includes(trecho), `falta ${trecho}`);
});

test('livros: o catálogo infantil vai até os 15 e não repete livro que o curso da Verdade já pede', () => {
  const norm = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  for (const l of LIVROS_INFANTIL.filter((x) => !x.noCurso)) assert.ok(!LIVROS_VERDADE_EXCLUIDOS.has(`${norm(l.titulo)}|${norm(l.autor)}`), `${l.titulo} está na lista fixa de exclusão do curso da Verdade`);
});

test('livros: a faixa sai da idade completa, com o aniversário contado no dia', () => {
  const hoje = new Date(2026, 10, 3); // 03/11/2026
  assert.equal(faixaPara('2026-09-04', hoje), '0-1');
  assert.equal(faixaPara('2024-01-03', hoje), '1-3', '2 anos e 10 meses');
  assert.equal(faixaPara('2023-11-03', hoje), '3-5', 'faz 3 anos hoje');
  assert.equal(faixaPara('2023-11-04', hoje), '1-3', 'faz 3 anos amanhã');
  assert.equal(faixaPara('2011-11-03', hoje), '14-15');
  assert.equal(faixaPara('2010-11-03', hoje), null, '16 anos: Academia da Verdade');
  assert.equal(faixaPara(null, hoje), null);
});

test('progresso: a próxima aula é a primeira não feita de cada filho, em ordem de data', () => {
  const aulas = [
    { data: '2026-11-05', filho: 'f1', para: 'Filha 1' }, { data: '2026-11-03', filho: 'f1', para: 'Filha 1' },
    { data: '2026-11-04-f2', filho: 'f2', para: 'Filho 2' }, { data: '2026-11-05-f2', filho: 'f2', para: 'Filho 2' },
  ];
  const regs = [{ aula: '2026-11-03', filho: 'f1', feita: true }, { aula: '2026-11-04-f2', filho: 'f1', feita: true }, { aula: '2026-11-04-f2', filho: 'f2', feita: false }];
  const [f1, f2] = proximaPorFilho(aulas, regs);
  assert.deepEqual([f1.filho, f1.feitas, f1.total, f1.proxima.data], ['f1', 1, 2, '2026-11-05']);
  assert.deepEqual([f2.filho, f2.feitas, f2.total, f2.proxima.data], ['f2', 0, 2, '2026-11-04-f2'], 'o registro de outro filho não conta');
  const todas = proximaPorFilho(aulas.slice(0, 2), [{ aula: '2026-11-03', filho: 'f1', feita: true }, { aula: '2026-11-05', filho: 'f1', feita: true }]);
  assert.equal(todas[0].proxima, null);
  assert.deepEqual(proximaPorFilho([], []), []);
});

test('nuvem: anexo é enviado, listado, baixado e apagado (arquivo e linha)', async () => {
  const banco = bancoSimulado({ membros: ['u1'] }); logado(banco);
  const nuvem = criarNuvem(async () => banco.cliente);
  await nuvem.salvarAnexo(anexo('a1'));
  await nuvem.salvarAnexo(anexo('a2', '2026-11-03', 'foto ção.jpg'));
  const caminhos = [...banco.objetos.keys()];
  assert.ok(caminhos.every((c) => /^2026-11-03\/a\d-[\w.-]+$/.test(c)), `caminho inseguro: ${caminhos}`);
  const lista = await nuvem.listarAnexos('2026-11-03');
  assert.equal(lista.length, 2);
  assert.ok(lista.every((x) => x.blob instanceof Blob));
  assert.equal((await nuvem.listarAnexos('2026-11-04')).length, 0);
  const todos = await nuvem.listarTodosAnexos();
  assert.equal(todos[0].blob, undefined, 'a lista geral não baixa os arquivos');
  assert.equal(await (await nuvem.baixar(todos[0])).text(), 'x');
  await nuvem.apagarAnexo('a1');
  assert.equal(banco.objetos.size, 1);
  assert.equal(banco.tabelas.aci_anexo.length, 1);
});

test('nuvem: se a linha não grava, o arquivo enviado é removido (sem órfão)', async () => {
  const banco = bancoSimulado({ membros: ['u1'] }); logado(banco);
  banco.estado.falharInsert = true;
  await assert.rejects(() => criarNuvem(async () => banco.cliente).salvarAnexo(anexo('x1')), /violação/);
  assert.equal(banco.objetos.size, 0);
});

test('nuvem: aula lê o padrão, grava e atualiza a observação', async () => {
  const banco = bancoSimulado({ membros: ['u1'] }); logado(banco);
  const nuvem = criarNuvem(async () => banco.cliente);
  assert.deepEqual(await nuvem.lerAula('2026-11-03', 'f1'), { aula: '2026-11-03', filho: 'f1', feita: false, nota: '' });
  await nuvem.salvarAula({ aula: '2026-11-03', filho: 'f1', feita: true, nota: 'Gostou do gato.' });
  await nuvem.salvarAula({ aula: '2026-11-03', filho: 'f1', feita: true, nota: 'Gostou do gato e do peixe.' });
  const r = await nuvem.lerAula('2026-11-03', 'f1');
  assert.deepEqual([r.feita, r.nota], [true, 'Gostou do gato e do peixe.']);
  assert.equal((await nuvem.listarAulas()).length, 1, 'a mesma aula e o mesmo filho atualizam a mesma linha');
});

test('nuvem: o mesmo dia tem marcação e observações separadas por filho', async () => {
  const banco = bancoSimulado({ membros: ['u1'] }); logado(banco);
  const nuvem = criarNuvem(async () => banco.cliente);
  await nuvem.salvarAula({ aula: '2026-11-03', filho: 'f1', feita: true, nota: 'da primeira' });
  await nuvem.salvarAula({ aula: '2026-11-03', filho: 'f2', feita: false, nota: 'do segundo' });
  await nuvem.salvarAula({ aula: '2026-11-03', feita: true, nota: 'sem indicar' });
  assert.equal((await nuvem.listarAulas()).length, 3);
  assert.equal((await nuvem.lerAula('2026-11-03', 'f1')).nota, 'da primeira');
  assert.deepEqual([(await nuvem.lerAula('2026-11-03', 'f2')).feita, (await nuvem.lerAula('2026-11-03', 'f2')).nota], [false, 'do segundo']);
  assert.equal((await nuvem.lerAula('2026-11-03')).nota, 'sem indicar', 'sem filho usa o código vazio');
});

test('nuvem: cadastro de filhos (criar, atualizar, remover) e anexo com quem fez', async () => {
  const banco = bancoSimulado({ membros: ['u1'] }); logado(banco);
  const nuvem = criarNuvem(async () => banco.cliente);
  await nuvem.salvarFilho({ id: 'f1', nome: 'Aluno A', nascimento: '2024-01-03', perfil: 'menina' });
  await nuvem.salvarFilho({ id: 'f2', nome: 'Aluno B', nascimento: '', perfil: '' });
  await nuvem.salvarFilho({ id: 'f1', nome: 'Aluna A', nascimento: '2024-01-03', perfil: 'menina' });
  const filhos = await nuvem.listarFilhos();
  assert.equal(filhos.length, 2, 'salvar de novo atualiza em vez de duplicar');
  assert.equal(filhos.find((f) => f.id === 'f1').nome, 'Aluna A');
  assert.deepEqual([filhos.find((f) => f.id === 'f2').nascimento, filhos.find((f) => f.id === 'f2').perfil], [null, null]);
  await nuvem.salvarAnexo({ ...anexo('t1'), filho: 'f1' });
  await nuvem.salvarAnexo(anexo('t2'));
  const lista = await nuvem.listarAnexos('2026-11-03');
  assert.deepEqual(lista.map((x) => [x.id, x.filho]).sort(), [['t1', 'f1'], ['t2', '']]);
  await nuvem.apagarFilho('f2');
  assert.deepEqual((await nuvem.listarFilhos()).map((f) => f.id), ['f1']);
  assert.equal((await nuvem.listarAnexos('2026-11-03')).length, 2, 'remover um filho não apaga as tarefas');
});

test('livros lidos: marcados por filho na nuvem, sem duplicar, e sobem do aparelho ao entrar na família', async () => {
  const banco = bancoSimulado({ membros: ['u1'] }); logado(banco);
  const nuvem = criarNuvem(async () => banco.cliente);
  await nuvem.marcarLido('f1', 'boa-noite-lua', true);
  await nuvem.marcarLido('f1', 'boa-noite-lua', true);
  await nuvem.marcarLido('f2', 'black-on-white', true);
  assert.deepEqual(await nuvem.listarLidos('f1'), ['boa-noite-lua'], 'marcar de novo não duplica');
  await nuvem.marcarLido('f1', 'boa-noite-lua', false);
  assert.deepEqual(await nuvem.listarLidos('f1'), []);
  assert.deepEqual(await nuvem.listarLidos('f2'), ['black-on-white'], 'cada filho tem a sua lista');

  // o que foi marcado no aparelho (localStorage) sobe junto com as tarefas
  // como no navegador, Object.keys(localStorage) devolve as chaves guardadas
  const guardado = { 'aci-livros-lidos-f1': '["a","b"]', 'aci-livros-lidos-familia': '["c"]', 'outra-chave': 'x' };
  Object.defineProperties(guardado, { getItem: { value: (k) => guardado[k] ?? null }, setItem: { value: (k, v) => { guardado[k] = v; } } });
  globalThis.localStorage = guardado;
  try {
    const arm = criarArmazenamento({ obterCliente: async () => banco.cliente, obterUsuario: async () => ({ id: 'u1', email: 'a@exemplo.com' }) });
    assert.equal((await arm.iniciar()).modo, 'nuvem');
    assert.equal(await arm.contarLocais(), 3, 'conta os livros mesmo sem IndexedDB');
    await assert.rejects(() => arm.enviarAparelhoParaNuvem(), /não permite guardar/, 'sem IndexedDB no Node, as tarefas falham depois dos livros');
    assert.deepEqual((await nuvem.listarLidos('f1')).sort(), ['a', 'b']);
    assert.deepEqual(await nuvem.listarLidos('familia'), ['c']);
  } finally { delete globalThis.localStorage; }
});

test('jogos: sobe com 3 acertos seguidos, desce com 2 erros seguidos e nunca fica abaixo de 1', () => {
  let p = progressoInicial();
  p = ajustar(ajustar(p, true), true);
  assert.equal(p.nivel, 1);
  p = ajustar(p, true);
  assert.deepEqual(p, { nivel: 2, seguidos: 0, erros: 0 });
  p = ajustar(ajustar(p, true), false);
  assert.deepEqual([p.nivel, p.seguidos], [2, 0], 'um erro zera a sequência de acertos');
  p = ajustar(p, false);
  assert.equal(p.nivel, 1);
  assert.equal(ajustar(ajustar(p, false), false).nivel, 1);
  assert.equal(ajustar(ajustar({ nivel: 9, seguidos: 0, erros: 0 }, false), false).nivel, 1, 'dois erros seguidos voltam ao nível 1');
  assert.equal(ajustar({ nivel: 9, seguidos: 0, erros: 0 }, false).nivel, 9, 'um erro só não muda o nível');
});

test('jogos: toda rodada de todo nível (1 a 60) tem a resposta certa entre as opções, sem repetir nem negativo', () => {
  for (const j of Object.values(JOGOS)) {
    for (let n = 1; n <= 60; n++) {
      for (let k = 0; k < 40; k++) {
        const r = j.rodada(n);
        const chaves = r.opcoes.map((o) => o.chave);
        assert.ok(chaves.includes(r.certa), `${j.id} nível ${n}: falta a resposta certa`);
        assert.equal(new Set(chaves).size, chaves.length, `${j.id} nível ${n}: opção repetida`);
        assert.ok(chaves.length >= 2 && r.fala && r.texto, `${j.id} nível ${n}: rodada incompleta`);
        const equacao = j.id === 'calculo' && n >= 22; // inteiros negativos fazem parte das equações (13 a 15 anos)
        assert.ok(equacao || r.opcoes.every((o) => o.num === undefined || o.num >= 0), `${j.id} nível ${n}: número negativo`);
      }
    }
  }
});

test('jogos: as contas e as sequências estão certas', () => {
  for (let k = 0; k < 200; k++) {
    const q = JOGOS.quantos.rodada(16 + (k % 10));
    const [a, op, b] = q.texto.split(' ');
    assert.equal(q.certa, `n${op === '+' ? Number(a) + Number(b) : Number(a) - Number(b)}`, q.texto);
    const d = JOGOS.depois.rodada(9);
    const s = d.mostrar.seq.map((x) => x.num);
    assert.equal(d.certa, `n${s[3] + 1}`, 'nível 9: soma 1');
  }
  const contar = JOGOS.quantos.rodada(7);
  assert.equal(contar.certa, `n${contar.mostrar.grupos[0].qtd}`);
});

test('jogos: números até 100 e palavras que combinam', () => {
  for (let n = 1; n <= 60; n++) {
    for (let k = 0; k < 40; k++) {
      const r = JOGOS.numeros.rodada(n);
      assert.ok(r.opcoes.every((o) => o.num >= 0 && o.num <= 100), `nível ${n}: número fora de 0 a 100`);
      if (n <= 3) assert.ok(r.opcoes.every((o) => o.num <= 10), `nível ${n}: passou de 10`);
      const p = JOGOS.palavras.rodada(n);
      if (p.tipo === 'combina') {
        const par = PARES.find(([m]) => m.pt === p.mostrar.modelo.pt);
        assert.equal(p.certa, par[1].pt, `nível ${n}: par errado`);
      } else {
        const grupoDe = (pt) => Object.keys(GRUPOS).find((g) => GRUPOS[g].some((x) => x.pt === pt));
        const outros = p.opcoes.filter((o) => o.chave !== p.certa).map((o) => grupoDe(o.chave));
        assert.equal(new Set(outros).size, 1, `nível ${n}: as outras figuras não são do mesmo grupo`);
        assert.notEqual(grupoDe(p.certa), outros[0], `nível ${n}: o intruso é do mesmo grupo`);
      }
    }
  }
});

test('jogos: tempo de tela por dia e telas', () => {
  assert.equal(usadoHoje({ dia: '2026-11-05', ms: 90000 }, '2026-11-05'), 90000);
  assert.equal(usadoHoje({ dia: '2026-11-04', ms: 90000 }, '2026-11-05'), 0, 'zera no dia seguinte');
  assert.equal(acabou(0, 9e9), false, 'sem limite nunca acaba');
  assert.equal(acabou(5, 5 * 60000), true);
  const lista = jogos();
  for (const id of Object.keys(JOGOS)) assert.ok(lista.includes(`href="#jogo-${id}"`));
  assert.ok(lista.indexOf('</header>') > 0 && lista.includes('id="jg-limite"'));
  assert.ok(jogo(null, 'quantos').includes('id="jg-comecar"'));
  assert.ok(jogo(null, 'nada').includes('não encontrado'));
});

test('armazenamento: com a família desativada, nem consulta a conta nem a nuvem', async () => {
  const banco = bancoSimulado({ membros: ['u1'] }); logado(banco);
  let consultas = 0;
  const arm = criarArmazenamento({
    obterCliente: async () => { consultas++; return banco.cliente; },
    obterUsuario: async () => { consultas++; return { id: 'u1', email: 'a@exemplo.com' }; },
    familiaAtiva: false,
  });
  assert.deepEqual(await arm.iniciar(), { modo: 'aparelho', usuario: null });
  assert.equal(consultas, 0, 'não deve tocar na conta nem no banco');
  await assert.rejects(() => arm.listarAnexos('2026-11-03'), /não permite guardar tarefas no aparelho/, 'tudo vai para o aparelho (sem IndexedDB no Node)');
  assert.equal(banco.objetos.size + banco.tabelas.aci_anexo.length, 0);
});

test('config: a família está ativa', async () => {
  const { FAMILIA_ATIVA } = await import('../infantil/config.js');
  assert.equal(FAMILIA_ATIVA, true);
});

test('idade e códigos de filho', () => {
  const hoje = new Date(2026, 10, 3); // 03/11/2026
  assert.equal(idade('2024-01-03', hoje), '2 anos e 10 meses');
  assert.equal(idade('2023-11-03', hoje), '3 anos');
  assert.equal(idade('2023-11-04', hoje), '2 anos e 11 meses');
  assert.equal(idade('2026-10-03', hoje), '1 mês');
  assert.equal(idade('2026-11-03', hoje), '0 meses');
  assert.equal(idade('2027-01-01', hoje), '', 'nascimento futuro');
  assert.equal(idade('', hoje), '');
  assert.equal(idade('03/01/2024', hoje), '', 'formato errado');
  assert.equal(proximoCodigo([]), 'f1');
  assert.equal(proximoCodigo(['f1', 'f3']), 'f4');
  assert.equal(proximoCodigo(['f1', 'abc']), 'f2');
});

test('jogos: interesses mudam as figuras sem prender a criança ao tema', () => {
  let x = 0;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  const veiculos = new Set(TEMAS.veiculos.map((c) => c.e));
  const gerais = new Set(COISAS.map((c) => c.e));
  const vistas = Array.from({ length: 200 }, () => rodadaQuantos(2, rnd, { interesses: ['veiculos'] }).opcoes[0].e);
  assert.ok(vistas.some((e) => veiculos.has(e)), 'aparecem veículos');
  assert.ok(vistas.some((e) => gerais.has(e)), 'as figuras gerais continuam aparecendo');
  assert.ok(Array.from({ length: 50 }, () => rodadaQuantos(2, rnd).opcoes[0].e).every((e) => gerais.has(e)), 'sem interesse, só as gerais');
  assert.deepEqual(interessesValidos(['ceu', 'xyz', 'ceu']), ['ceu']);
});

test('histórico dos jogos: partida, recorde, resumo e recomendação', () => {
  const p0 = { id: 'p1', filho: 'f1', jogo: 'quantos', inicio: 1000, fim: 1000, nivelInicial: 3, nivelFinal: 3, nivelMax: 3, acertos: 0, erros: 0 };
  const p1 = anotarResposta(anotarResposta(p0, true, 4, 2000), false, 1, 3000);
  assert.deepEqual([p1.acertos, p1.erros, p1.nivelMax, p1.nivelFinal, p1.fim], [1, 1, 4, 1, 3000]);
  assert.equal(p0.acertos, 0, 'não altera a partida anterior');
  let lista = guardarPartida([], p1);
  lista = guardarPartida(lista, { ...p1, acertos: 5 }); // mesma partida atualizada
  assert.equal(lista.length, 1);
  lista = guardarPartida(lista, { ...p0, id: 'p2', inicio: 5000, nivelMax: 7, acertos: 2 });
  assert.equal(lista[0].id, 'p2', 'mais recente primeiro');
  assert.equal(recorde(lista, 'quantos'), 7);
  assert.equal(recorde(lista, 'quantos', 'p2'), 4, 'sem a partida em andamento');
  assert.equal(recorde(lista, 'ouvir'), 0);
  assert.equal(resumoJogo(lista, 'quantos').partidas, 2);
  const cheia = Array.from({ length: MAX_PARTIDAS + 5 }, (_, i) => ({ ...p1, id: `x${i}`, inicio: i })).reduce(guardarPartida, []);
  assert.equal(cheia.length, MAX_PARTIDAS);

  const jogosLista = [{ id: 'a', idade: [2, 6] }, { id: 'b', idade: [2, 6] }, { id: 'c', idade: [10, 12] }];
  const fraca = { id: 'q', jogo: 'b', inicio: 10, acertos: 1, erros: 5, nivelMax: 1 };
  const sug = recomendar(jogosLista, [fraca], 3, 3, 10 + 86400000 * 2);
  assert.deepEqual(sug.map((s) => s.id), ['b', 'a'], 'reforço primeiro, depois o não jogado; o de 10 anos fica de fora');
  assert.match(sug[0].motivo, /Reforço/);
  assert.equal(anosCompletos('2024-01-03', new Date(2026, 10, 11)), 2);
  assert.equal(anosCompletos('', new Date()), null);
});

test('nível entre aparelhos e desafios concluídos', async () => {
  const { nivelAtual, desafiosConcluidos } = await import('../infantil/historico.js');
  const lista = [{ id: 'a', jogo: 'quantos', inicio: 100, fim: 200, nivelFinal: 7, nivelMax: 12, acertos: 3, erros: 1 }];
  assert.equal(nivelAtual({ nivel: 3, em: 150 }, lista, 'quantos').nivel, 7, 'partida mais nova em outro aparelho vence');
  assert.equal(nivelAtual({ nivel: 3, em: 250 }, lista, 'quantos').nivel, 3, 'nível local mais novo vence');
  assert.equal(nivelAtual({ nivel: 3 }, lista, 'quantos').nivel, 7, 'nível antigo sem carimbo dá lugar à partida');
  assert.equal(nivelAtual(undefined, [], 'quantos'), undefined);
  assert.deepEqual(desafiosConcluidos(lista, 'quantos'), [5, 10]);
});

test('texto para IA: anônimo, com observações, histórico, critérios e sem diagnóstico', () => {
  const t = textoParaIA({
    aula: { data: '2026-11-11', titulo: 'São Martinho e a capa', tema: 'Mateus 25,35-40', virtude: 'Caridade', resumo: 'Contar até 3.' },
    idade: '2 anos e 10 meses', marcadas: [OBSERVACOES[1]], nota: 'Contou com os dedos.', interesses: ['Animais'],
    anteriores: [{ titulo: 'O anjo da guarda', nota: 'Gostou da oração.' }],
    jogos: [{ titulo: 'Quantos são?', habilidades: ['contagem'], partidas: 3, recorde: 6, precisao: 0.8 }],
  });
  for (const trecho of ['Aluno A', '2 anos e 10 meses', 'Precisou de ajuda.', 'Contou com os dedos.', 'O anjo da guarda', 'recorde nível 6', '80% de acertos', 'Matemática', 'grau de confiança', 'Não faça diagnóstico', 'avançar ou reforçar']) {
    assert.ok(t.includes(trecho), `falta: ${trecho}`);
  }
  assert.doesNotMatch(t, /null|undefined|\n\n\n/);
  assert.doesNotMatch(textoParaIA({ aula: { titulo: 'X' } }), /null|undefined|Interesses/);
});

test('nuvem: interesses do filho e partidas dos jogos sincronizam na família', async () => {
  const banco = bancoSimulado({ membros: ['u1'] });
  logado(banco, 'u1');
  const arm = criarArmazenamento({ obterCliente: async () => banco.cliente, obterUsuario: async () => ({ id: 'u1', email: 'a@exemplo.com' }) });
  assert.equal((await arm.iniciar()).modo, 'nuvem');
  await arm.salvarFilho({ id: 'f1', nome: 'Aluno A', nascimento: '2024-01-03', interesses: ['animais', 'invalido'] });
  assert.deepEqual((await arm.listarFilhos())[0].interesses, ['animais']);
  const p = { id: '00000000-0000-4000-8000-000000000001', filho: 'f1', jogo: 'quantos', inicio: 1000, fim: 2000, nivelInicial: 1, nivelFinal: 2, nivelMax: 2, acertos: 3, erros: 0 };
  await arm.salvarPartida(p);
  await arm.salvarPartida({ ...p, acertos: 4, fim: 3000 });
  const lidas = await arm.listarPartidas('f1');
  assert.equal(lidas.length, 1, 'mesmo id atualiza a mesma linha');
  assert.deepEqual(lidas[0], { ...p, acertos: 4, fim: 3000, obs: '' });
  await arm.salvarPartida({ ...p, acertos: 4, fim: 3000, obs: 'Jogou sozinha.' });
  assert.equal((await arm.listarPartidas('f1'))[0].obs, 'Jogou sozinha.', 'observação do adulto na partida');
  assert.equal((await arm.listarPartidas('f2')).length, 0);
});

const ID = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const reg = (n, extra) => ({ id: ID(n), filho: 'f1', aula: '2026-11-11', area: 'Matemática', habilidade: 'Contar até 3', situacao: 'em-desenvolvimento', origem: 'observacao', criadoEm: n, ...extra });

test('registro de habilidade: validação, situação atual e próximos passos', () => {
  assert.equal(validarRegistro(reg(1)).habilidade, 'Contar até 3');
  for (const [campo, valor, msg] of [['filho', '', /filho/], ['area', ' ', /área/], ['habilidade', '', /habilidade/], ['situacao', 'otimo', /situação/], ['origem', 'ia', /onde vem/], ['reavaliar', '11/12/2026', /reavaliação/], ['id', 'x', /identificador/], ['aula', 'ontem', /Aula/]]) {
    assert.throws(() => validarRegistro(reg(1, { [campo]: valor })), msg, campo);
  }
  const regs = [
    reg(1),
    reg(2, { habilidade: 'contar até 3', situacao: 'dominado', origem: 'confirmado' }), // mesma habilidade, mais recente
    reg(3, { area: 'Inglês', habilidade: 'cloak', situacao: 'parcial', reavaliar: '2026-11-20' }),
    reg(4, { area: 'Formação católica', habilidade: 'Sinal da Cruz', situacao: 'dominado', reavaliar: '2026-11-10' }),
  ];
  const atual = situacaoAtual(regs);
  assert.equal(atual.length, 3, 'uma linha por habilidade, sem diferenciar maiúscula');
  assert.equal(atual.find((r) => r.area === 'Matemática').situacao, 'dominado');
  assert.deepEqual(proximosPassos(regs, '2026-11-11').map((r) => r.habilidade), ['Sinal da Cruz', 'cloak'], 'vencido primeiro; dominado sem data vencida fica de fora');
});

test('nuvem e backup: registros de habilidade por filho', async () => {
  const banco = bancoSimulado({ membros: ['u1'] });
  logado(banco, 'u1');
  const arm = criarArmazenamento({ obterCliente: async () => banco.cliente, obterUsuario: async () => ({ id: 'u1', email: 'a@exemplo.com' }) });
  await arm.iniciar();
  await arm.salvarRegistro(reg(1000, { reavaliar: '2026-11-20' }));
  await assert.rejects(() => arm.salvarRegistro(reg(1001, { situacao: 'x' })), /situação/, 'não grava registro inválido');
  const lidos = await arm.listarRegistros('f1');
  assert.equal(lidos.length, 1);
  assert.deepEqual(lidos[0], { ...reg(1000, { reavaliar: '2026-11-20' }), dificuldade: '', intervencao: '' });
  await arm.apagarRegistro('f1', ID(1000));
  assert.equal((await arm.listarRegistros('f1')).length, 0);
  const tela = aulaInfantil({}, '2026-11-11');
  assert.match(tela, /Registrar o que foi confirmado/);
  assert.match(tela, /Parcialmente dominado/);
});

test('jogos novos: contas certas, ordem do tempo, virtudes e ciências', async () => {
  const { rodadaCalculo, rodadaTempo, SEQUENCIAS, rodadaVirtudes, SITUACOES, rodadaCiencias } = await import('../infantil/jogos.js');
  const resolver = (t) => {
    let m;
    if ((m = /^(\d+) \+ (\d+) = \?$/.exec(t))) return +m[1] + +m[2];
    if ((m = /^(\d+) − (\d+) = \?$/.exec(t))) return m[1] - m[2];
    if ((m = /^(\d+) × (\d+) = \?$/.exec(t))) return m[1] * m[2];
    if ((m = /^(\d+) ÷ (\d+) = \?$/.exec(t))) return m[1] / m[2];
    if ((m = /^1\/(\d+) de (\d+) = \?$/.exec(t))) return m[2] / m[1];
    if ((m = /^(\d+)% de (\d+) = \?$/.exec(t))) return (m[1] * m[2]) / 100;
    if ((m = /^(\d+)² = \?$/.exec(t))) return m[1] ** 2;
    if ((m = /^√(\d+) = \?$/.exec(t))) return Math.sqrt(m[1]);
    if ((m = /^(\d+)x ([+−]) (\d+) = (-?\d+)\. x = \?$/.exec(t))) return (m[4] - (m[2] === '+' ? +m[3] : -m[3])) / m[1];
    throw new Error(`conta desconhecida: ${t}`);
  };
  for (let n = 1; n <= 30; n++) for (let k = 0; k < 30; k++) {
    const r = rodadaCalculo(n);
    const v = resolver(r.texto);
    assert.ok(Number.isInteger(v), `nível ${n}: ${r.texto} não dá inteiro`);
    assert.equal(r.certa, `n${v}`, `nível ${n}: ${r.texto}`);
  }
  for (let n = 1; n <= 20; n++) {
    const r = rodadaTempo(n);
    const seq = SEQUENCIAS.find((s) => s.itens.some((i) => i.pt === r.certa));
    const pos = r.opcoes.map((o) => seq.itens.findIndex((i) => i.pt === o.chave));
    assert.ok(pos.every((p) => p >= 0), 'todas as opções da mesma sequência');
    assert.equal(seq.itens[Math.min(...pos)].pt, r.certa, 'a certa é a que vem primeiro');
  }
  for (let n = 1; n <= 15; n++) {
    const r = rodadaVirtudes(n);
    assert.ok(SITUACOES.some((s) => s.certa === r.certa && s.cena === r.mostrar.cena), 'a resposta é a ação virtuosa da própria situação');
  }
  assert.equal(rodadaCiencias(1).opcoes.length, 2);
  assert.match(rodadaCiencias(3).fala, /^Onde vive (o|a) /);
});

test('jogos de espanhol, música e estratégia: respostas certas', async () => {
  const { rodadaEspanhol, rodadaMusica, rodadaEstrategia } = await import('../infantil/jogos.js');
  for (let n = 1; n <= 30; n++) for (let k = 0; k < 20; k++) {
    const e = rodadaEstrategia(n);
    const [, pedras, max] = /(\d+) pedras: tire de 1 a (\d+)/.exec(e.texto).map(Number);
    const tira = Number(e.certa.slice(1));
    assert.ok(tira >= 1 && tira <= max, `nível ${n}: jogada possível`);
    assert.equal((pedras - tira) % (max + 1), 0, `nível ${n}: ${pedras} pedras, tirar ${tira} deixa um múltiplo de ${max + 1}`);
    const m = rodadaMusica(n);
    if (m.tipo === 'agudo') assert.equal(m.certa, m.mostrar.notas[0] > m.mostrar.notas[1] ? '1' : '2', 'o mais agudo é a frequência maior');
    else assert.equal(m.certa, `n${m.mostrar.notas.length}`, 'conta as notas tocadas');
    const s = rodadaEspanhol(n);
    if (s.idioma === 'es-ES') assert.match(s.fala, /^¿Dónde (está|están) (el|la|los|las) /);
    else assert.ok(s.opcoes.every((o) => o.txt && !/^(el|la|los|las) /.test(o.txt)), 'palavra escrita sem artigo');
  }
});

test('jogos de geografia e sílabas: respostas certas e frases corretas', async () => {
  const { rodadaGeografia, ESTADOS, rodadaSilabas, SILABAS } = await import('../infantil/jogos.js');
  assert.equal(ESTADOS.length, 27, '26 estados e o Distrito Federal');
  assert.equal(new Set(ESTADOS.map((e) => e[1])).size, 27, 'capitais distintas');
  for (let n = 1; n <= 20; n++) for (let k = 0; k < 20; k++) {
    const g = rodadaGeografia(n);
    if (g.tipo === 'capital') {
      const est = ESTADOS.find((e) => e[1] === g.certa);
      assert.ok(g.fala.endsWith(`${est[0]}?`) && /capital (do|da|de) /.test(g.fala), g.fala);
    }
    if (g.tipo === 'regiao') assert.equal(ESTADOS.find((e) => g.fala.endsWith(`${e[0]}?`))[2], g.certa, g.fala);
    const s = rodadaSilabas(n);
    const p = SILABAS.find((x) => x.s.join('') === s.texto.replace('__', s.certa));
    assert.ok(p, `${s.texto} + ${s.certa} forma uma palavra da lista`);
  }
  assert.match(rodadaGeografia(10, () => 0.99).fala, /capital/);
});

test('ler e entender: a frase certa é a da lista; a resposta é a do texto', async () => {
  const { rodadaLeitura, FRASES, TEXTOS } = await import('../infantil/jogos.js');
  for (let n = 1; n <= 20; n++) for (let k = 0; k < 20; k++) {
    const r = rodadaLeitura(n);
    if (r.tipo === 'frase') {
      assert.ok(FRASES.includes(r.certa));
      const ordenar = (f) => f.toLowerCase().replace(/\.$/, '').split(' ').sort().join(' ');
      for (const o of r.opcoes) assert.equal(ordenar(o.chave), ordenar(r.certa), 'as erradas usam as mesmas palavras');
      assert.equal(r.opcoes.filter((o) => FRASES.includes(o.chave)).length, 1, 'só uma frase da lista entre as opções');
    } else {
      const x = TEXTOS.find((t) => t.t === r.mostrar.cena);
      assert.equal(r.certa, x.certa);
    }
  }
});

test('guia por etapa: as seis faixas do projeto, sem buracos, e na tela', async () => {
  const { ETAPAS_INFANTIS, etapaDaIdade } = await import('../infantil/etapas.js');
  assert.deepEqual(ETAPAS_INFANTIS.map((e) => e.id), ['2-3', '4-5', '6-8', '9-11', '12-13', '14-15']);
  for (let anos = 2; anos <= 15; anos++) assert.ok(etapaDaIdade(anos), `${anos} anos tem etapa`);
  assert.equal(etapaDaIdade(1), null);
  assert.equal(etapaDaIdade(null), null);
  assert.ok(ETAPAS_INFANTIS.filter((e) => e.de < 9).every((e) => !e.academico), 'sem preparação para prova antes dos 9');
  assert.match(infantil(), /Guia por etapa/);
});

test('desenho livre: janela na aba Jogos e tela com cores e ideias', async () => {
  const { desenhar, IDEIAS } = await import('../views/desenho.js');
  assert.match(jogos(), /href="#desenhar"/);
  const html = desenhar();
  assert.match(html, /<canvas id="dz-tela"/);
  assert.ok(IDEIAS.length >= 5 && html.includes(IDEIAS[0]));
});

test('fora da tela e reforço por habilidade', async () => {
  const { BRINCADEIRAS } = await import('../infantil/jogos.js');
  const { textoReforcoIA } = await import('../infantil/prompt.js');
  assert.ok(BRINCADEIRAS.length >= 10 && BRINCADEIRAS.every((b) => b.nome && b.como && b.habilidades.length && b.idade[0] <= b.idade[1]));
  assert.equal(new Set(BRINCADEIRAS.map((b) => b.id)).size, BRINCADEIRAS.length);
  assert.match(jogos(), /Fora da tela/);
  const t = textoReforcoIA({ area: 'Matemática', habilidade: 'Contar até 3', situacao: 'Em desenvolvimento', dificuldade: 'Pula números', idade: '2 anos', interesses: ['Animais'] });
  for (const trecho of ['Aluno A', 'Contar até 3', 'Pula números', 'Animais', 'pré-requisito', 'verificação final', 'não faça diagnóstico']) assert.ok(t.includes(trecho), trecho);
  assert.doesNotMatch(textoReforcoIA({ area: 'A', habilidade: 'H', situacao: 'S' }), /null|undefined|já tentamos/);
});

test('séries: estrutura, episódio atual, marcação em lote, arcos e validação', () => {
  const est = lerEstrutura('Livro 1 | 3\n\n5', 'Começo | 1-3\nPausa | 4-5 | filler');
  assert.deepEqual(est.temporadas, [{ nome: 'Livro 1', episodios: 3 }, { nome: 'Temporada 2', episodios: 5 }]);
  assert.equal(est.arcos[1].tipo, 'filler');
  assert.throws(() => lerEstrutura('abc', ''), /linha 1/);
  assert.throws(() => lerEstrutura('3', 'Sem faixa'), /Arcos, linha 1/);
  assert.throws(() => lerEstrutura('3', 'X | 1-2 | inventado'), /tipo/);
  const s = validarSerie({ id: ID(7), filho: 'f1', titulo: ' Série ', dados: { ...est, assistidos: [2, 2, 99, 'x'] } });
  assert.equal(s.titulo, 'Série');
  assert.deepEqual(s.dados.assistidos, [2], 'sem repetidos e só dentro do total');
  let d = s.dados;
  assert.equal(proximo(d), 1);
  assert.deepEqual(ondeEsta(d, 4), { temporada: 1, nome: 'Temporada 2', numero: 1 });
  d = marcarAte(d, 3);
  assert.deepEqual(arcosParaAnalisar(d).map((a) => a.nome), ['Começo']);
  assert.equal(arcosParaAnalisar({ ...d, analisados: ['Começo'] }).length, 0);
  d = alternar(d, 2);
  assert.equal(proximo(d), 2);
  assert.deepEqual(progresso(marcarAte(d, 99)), { vistos: 8, total: 8, pct: 100 });
  assert.equal(proximo(marcarAte(d, 99)), null);
  assert.equal(tipoDoEpisodio(d, 5), 'filler');
  assert.deepEqual(lerEstrutura(escreverEstrutura(d).temporadas, escreverEstrutura(d).arcos), est, 'escrever e ler devolvem o mesmo');
  assert.throws(() => validarSerie({ id: ID(7), filho: 'f1', titulo: 'X', dados: { temporadas: [{ episodios: 2 }], arcos: [{ nome: 'A', de: 1, ate: 5 }] } }), /entre 1 e 2/);
  assert.throws(() => validarSerie({ id: ID(7), filho: '', titulo: 'X' }), /filho/);
});

test('fichas de filmes e séries: campos, escalas, sem videogame e telas', () => {
  const ids = new Set();
  for (const m of MIDIA_INFANTIL) {
    assert.ok(!ids.has(m.id) && /^[a-z0-9-]+$/.test(m.id), m.id); ids.add(m.id);
    assert.ok(m.tipo in TIPOS_MIDIA, `${m.id}: tipo`);
    for (const k of Object.keys(ASPECTOS)) assert.ok([0, 1, 2, 3].includes(m.adequacao[k]), `${m.id}: ${k}`);
    for (const p of m.personagens) assert.ok(p.percurso in PERCURSOS, `${m.id}: ${p.nome}`);
    for (const c of ['titulo', 'criador', 'ano', 'obra', 'academia', 'cuidados', 'oficial', 'fontes']) assert.ok(m[c], `${m.id}: ${c}`);
    assert.ok(m.perguntas.length && m.temas.length && Number.isInteger(m.idade));
    assert.match(m.oficial, /conferir/, 'classificação oficial nunca inventada');
  }
  assert.match(assistir(), /Obras com ficha/);
  const naruto = obraInfantil({}, 'naruto');
  for (const t of ['Gaara', 'Orochimaru', 'sem arrependimento', 'Interpretação pedagógica', 'Acompanhar os episódios']) assert.ok(naruto.includes(t), t);
  assert.match(obraInfantil({}, 'nao-existe'), /não encontrada/);
  const t = textoArcoIA({ titulo: 'Naruto', arco: { nome: 'Exame', de: 1, ate: 3 }, ficha: MIDIA_INFANTIL.find((m) => m.id === 'naruto') });
  assert.match(t, /Aluno A/);
  assert.match(t, /sem inventar/);
});

test('nuvem: séries acompanhadas por filho, com validação', async () => {
  const banco = bancoSimulado({ membros: ['u1'] });
  logado(banco, 'u1');
  const arm = criarArmazenamento({ obterCliente: async () => banco.cliente, obterUsuario: async () => ({ id: 'u1', email: 'a@exemplo.com' }) });
  await arm.iniciar();
  await arm.salvarSerie({ id: ID(8), filho: 'f1', obra: 'avatar', titulo: 'Avatar', dados: { temporadas: [{ nome: 'Livro 1', episodios: 20 }], assistidos: [1, 2] } });
  await assert.rejects(() => arm.salvarSerie({ id: ID(9), filho: 'f1', titulo: '' }), /título/);
  banco.tabelas.aci_serie.push({ id: 'ruim', filho: 'f1', titulo: 'x', dados: {} }); // linha inválida não derruba a lista
  const lidas = await arm.listarSeries('f1');
  assert.equal(lidas.length, 1);
  assert.deepEqual(lidas[0].dados.assistidos, [1, 2]);
  await arm.apagarSerie('f1', ID(8));
  assert.equal((await arm.listarSeries('f1')).length, 0);
});

test('nuvem: sem cliente configurado, avisa em vez de quebrar', async () => {
  await assert.rejects(() => criarNuvem(async () => null).listarAulas(), /não está ativada/);
});

test('armazenamento: modos aparelho, pendente e nuvem; o código e a saída da família', async () => {
  const banco = bancoSimulado();
  let usuario = null;
  const arm = criarArmazenamento({ obterCliente: async () => banco.cliente, obterUsuario: async () => usuario });

  assert.equal((await arm.iniciar()).modo, 'aparelho', 'sem login');
  usuario = { id: 'u1', email: 'a@exemplo.com' }; logado(banco, 'u1');
  assert.equal((await arm.iniciar()).modo, 'pendente', 'logado, ainda sem o código');
  assert.equal(await arm.entrarNaFamilia('errado'), false);
  assert.equal(arm.modo(), 'pendente');
  assert.equal(await arm.entrarNaFamilia(CODIGO), true);
  assert.equal(arm.modo(), 'nuvem');

  await arm.salvarAnexo(anexo('a1'));
  await arm.salvarAula({ aula: '2026-11-03', feita: true, nota: 'ok' });

  // outra pessoa da família, com outro login, entra com o código e vê o que a primeira gravou
  usuario = { id: 'u2', email: 'b@exemplo.com' }; logado(banco, 'u2');
  assert.equal((await arm.iniciar()).modo, 'pendente');
  assert.equal(await arm.entrarNaFamilia(CODIGO), true);
  assert.equal((await arm.listarAnexos('2026-11-03')).length, 1);
  assert.equal((await arm.lerAula('2026-11-03')).nota, 'ok');
  assert.equal(await (await arm.arquivoDe((await arm.listarTodosAnexos())[0])).text(), 'x');

  // quem não é da família não vê nada e não grava na nuvem
  usuario = { id: 'u3', email: 'c@exemplo.com' }; logado(banco, 'u3');
  assert.equal((await arm.iniciar()).modo, 'pendente');
  await assert.rejects(() => arm.listarAnexos('2026-11-03'), /não permite guardar tarefas no aparelho/, 'fora da família, o destino é o aparelho (sem IndexedDB no Node)');

  // sair da família
  usuario = { id: 'u2', email: 'b@exemplo.com' }; logado(banco, 'u2');
  await arm.iniciar();
  await arm.sairDaFamilia();
  assert.equal(arm.modo(), 'pendente');
  assert.equal(banco.familia.has('u2'), false);
});

test('mapa de habilidades: campos, pré-requisitos sem ciclo e em ordem, jogos e áreas que existem', () => {
  const ids = HABILIDADES.map((h) => h.id);
  assert.equal(new Set(ids).size, ids.length, 'ids únicos');
  assert.equal(new Set(HABILIDADES.map((h) => h.nome.toLowerCase())).size, ids.length, 'nomes únicos (a ligação com o registro é pelo nome)');
  for (const [i, h] of HABILIDADES.entries()) {
    assert.ok(TRILHAS[h.trilha], `${h.id}: trilha`);
    assert.ok(AREAS.includes(TRILHAS[h.trilha].area), `${h.id}: a área da trilha existe no registro`);
    for (const campo of ['nome', 'objetivo', 'verificar', 'dominio', 'excelencia', 'intervencao']) assert.ok(h[campo]?.length >= 15, `${h.id}: ${campo}`);
    assert.ok(h.nome.length <= 160, `${h.id}: o nome cabe no campo do registro`);
    assert.ok(h.de <= h.ate && h.de >= TRILHAS[h.trilha].de && h.ate <= TRILHAS[h.trilha].ate, `${h.id}: idades dentro da trilha`);
    for (const p of h.prereq) assert.ok(ids.indexOf(p) >= 0 && ids.indexOf(p) < i, `${h.id}: pré-requisito ${p} existe e vem antes (sem ciclo)`);
    if (h.jogo) assert.ok(JOGOS[h.jogo], `${h.id}: jogo ${h.jogo}`);
    assert.equal(habilidadeDoTexto(`  ${h.nome.toUpperCase()} `)?.id, h.id, 'acha pelo nome, sem diferenciar maiúsculas');
  }
  assert.equal(habilidadeDoTexto('Dizer os numeros ate 5 na ordem')?.id, 'mat-recitar-5', 'sem diferenciar acentos');
  assert.equal(habilidadeDoTexto('cloak'), null, 'habilidade livre não entra no mapa');
  assert.deepEqual(trilhasDaIdade(0), [], 'bebê: nenhuma trilha');
  assert.deepEqual(trilhasDaIdade(2), ['mat-numero']);
  assert.deepEqual(trilhasDaIdade(null), ['mat-numero'], 'sem nascimento informado, mostra');
  assert.deepEqual(trilhasDaIdade(9), []);
});

test('mapa de habilidades: uma observação não basta; domínio libera a seguinte; ordem do que fazer agora', () => {
  const DIA = 86400000;
  // datas relativas a hoje (meio-dia de nove dias atrás): o domínio recente não cai na revisão de retenção
  const t0 = new Date().setHours(12, 0, 0, 0) - 9 * DIA;
  const r = (n, nome, situacao, extra = {}) => reg(n, { habilidade: nome, situacao, criadoEm: t0 + n * DIA, ...extra });
  const nome = (id) => habilidadePorId(id).nome;
  const recitar = habilidadePorId('mat-recitar-5');

  assert.deepEqual(proximasHabilidades('mat-numero', []).map((l) => l.habilidade.id), ['mat-recitar-5'], 'sem registros, começa pela primeira; o resto está bloqueado');
  let regs = [r(1, nome('mat-recitar-5'), 'dominado')];
  assert.equal(estadoDaHabilidade(recitar, regs).estado, 'a-confirmar', 'visto num dia só');
  assert.equal(mapaDaTrilha('mat-numero', regs).find((l) => l.habilidade.id === 'mat-um-a-um-3').liberada, false, 'a seguinte não libera antes da confirmação');
  regs.push(reg(50, { habilidade: nome('mat-recitar-5'), situacao: 'dominado', criadoEm: t0 + DIA + 3600000 })); // de novo, no mesmo dia
  assert.equal(estadoDaHabilidade(recitar, regs).estado, 'a-confirmar', 'duas vezes no mesmo dia continuam sendo um dia');
  regs.push(r(3, nome('mat-recitar-5'), 'dominado'));
  assert.equal(estadoDaHabilidade(recitar, regs).estado, 'dominada', 'dois dias diferentes');
  assert.equal(estadoDaHabilidade(recitar, [r(1, nome('mat-recitar-5'), 'dominado', { origem: 'confirmado' })]).estado, 'dominada', 'nova verificação confirmada');
  assert.equal(estadoDaHabilidade(recitar, [...regs, r(9, nome('mat-recitar-5'), 'revisar')]).estado, 'em-andamento', 'o registro mais recente manda: domínio pode ser perdido');

  assert.deepEqual(proximasHabilidades('mat-numero', regs).map((l) => l.habilidade.id), ['mat-um-a-um-3', 'mat-recitar-10'], 'liberadas pelo domínio da primeira');
  regs.push(r(4, nome('mat-recitar-10'), 'em-desenvolvimento'), r(5, nome('mat-um-a-um-3'), 'dominado'));
  assert.deepEqual(proximasHabilidades('mat-numero', regs).map((l) => [l.habilidade.id, l.estado]), [['mat-um-a-um-3', 'a-confirmar'], ['mat-recitar-10', 'em-andamento']], 'confirmar vem antes de continuar');
  regs.push(r(6, nome('mat-juntar-tirar-5'), 'parcial'));
  const adiantada = proximasHabilidades('mat-numero', regs, 9).find((l) => l.habilidade.id === 'mat-juntar-tirar-5');
  assert.ok(adiantada && !adiantada.liberada && adiantada.faltam.length, 'habilidade adiantada com registro aparece, com o que falta');
  assert.ok(proximasHabilidades('mat-numero', regs).length <= 3, 'no máximo três de cada vez');

  const todas = HABILIDADES.map((h, i) => r(20 + i, h.nome, 'dominado', { origem: 'confirmado' }));
  assert.deepEqual(proximasHabilidades('mat-numero', todas), [], 'trilha concluída');
});

test('mapa de habilidades: o formulário sugere as habilidades do mapa e o painel tem onde mostrá-lo', () => {
  const tela = aulaInfantil(null, AULAS_INFANTIL[0].data);
  assert.match(tela, /list="inf-hab-lista"/);
  for (const h of HABILIDADES) assert.ok(tela.includes(`value="${h.nome}"`), h.id);
  assert.match(infantil(), /id="inf-habilidades"/);
});

test('mapa de habilidades: retenção — dominada há mais de um mês pede nova verificação, sem perder o domínio', () => {
  const DIA = 86400000;
  const t0 = new Date('2026-09-01T12:00:00').getTime();
  const h = habilidadePorId('mat-recitar-5');
  const regs = [reg(1, { habilidade: h.nome, situacao: 'dominado', criadoEm: t0 }), reg(2, { habilidade: h.nome, situacao: 'dominado', criadoEm: t0 + 2 * DIA })];
  assert.equal(estadoDaHabilidade(h, regs, t0 + 10 * DIA).estado, 'dominada');
  const depois = t0 + (DIAS_RETENCAO + 5) * DIA;
  assert.equal(estadoDaHabilidade(h, regs, depois).estado, 'rever', 'passado o prazo, pede para rever');
  const mapa = mapaDaTrilha('mat-numero', regs, depois);
  assert.equal(mapa.find((l) => l.habilidade.id === 'mat-um-a-um-3').liberada, true, 'rever não bloqueia a habilidade seguinte');
  const agora = proximasHabilidades('mat-numero', regs, 3, depois).map((l) => [l.habilidade.id, l.estado]);
  assert.deepEqual(agora, [['mat-um-a-um-3', 'sem-registro'], ['mat-recitar-10', 'sem-registro'], ['mat-recitar-5', 'rever']], 'a revisão vem depois do que é novo');
  const revisto = [...regs, reg(3, { habilidade: h.nome, situacao: 'dominado', criadoEm: depois })];
  assert.equal(estadoDaHabilidade(h, revisto, depois + DIA).estado, 'dominada', 'verificada de novo, volta a dominada');
  assert.equal(estadoDaHabilidade(h, [...regs, reg(3, { habilidade: h.nome, situacao: 'revisar', criadoEm: depois })], depois + DIA).estado, 'em-andamento', 'se esqueceu, volta a ser trabalhada');
  for (const t of Object.values(TRILHAS)) { assert.ok(t.bncc.length && t.bncc.every(([c, texto]) => /^EI0[123][A-Z]{2}\d{2}$/.test(c) && texto.length > 20)); assert.ok(t.prepara.length > 20); }
});
