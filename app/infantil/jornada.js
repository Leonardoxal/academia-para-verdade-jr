// Lógica da Jornada (Porta da Casa, Mapa e Estrada das Aulas). Sem DOM, para poder ser testada em Node.
// Cada filho tem a própria trilha: só as aulas dele, em ordem de caminhada. A região do mapa vem da idade, mas a idade
// só escolhe onde o viajante está desenhado: nada fica trancado e faltar um dia não muda nada.
import { anosCompletos } from './historico.js';

/** As quatro regiões, uma por etapa do ciclo. O Vale vale também para quem ainda não tem o nascimento cadastrado. */
export const REGIOES = [
  { id: 'vale', nome: 'O Vale', de: 3, ate: 5 },
  { id: 'floresta', nome: 'A Floresta', de: 6, ate: 9 },
  { id: 'montanhas', nome: 'As Montanhas', de: 10, ate: 12 },
  { id: 'estrada', nome: 'A Estrada da Cidade', de: 13, ate: 15 },
];

/** Abaixo desta idade (em anos completos) não há jornada interativa: a tela é a Estrada das Aulas, para os pais. */
export const IDADE_NO_COLO = 2;

export const CODIGO_FILHO = /^[a-z0-9-]{1,30}$/;

/** 'colo' (bebê) ou o id da região. Sem nascimento: o Vale. A partir dos 16 anos continua na Estrada da Cidade. */
export function regiaoDaIdade(anos) {
  if (anos == null) return 'vale';
  if (anos < IDADE_NO_COLO) return 'colo';
  return (REGIOES.find((r) => anos <= r.ate) ?? REGIOES[REGIOES.length - 1]).id;
}

/** As aulas de um filho, da primeira para a mais nova. */
export const trilhaDoFilho = (aulas, filho) => aulas.filter((a) => a.filho === filho).sort((x, y) => x.data.localeCompare(y.data));

/**
 * Um marco por aula do filho. Estado: 'feita'; 'proxima' (a primeira ainda não feita, uma só); 'futura' (as demais).
 * registros: [{ aula, filho, feita }] como devolve arm.listarAulas().
 */
export function marcosDaTrilha(aulas, registros, filho) {
  const feita = (a) => registros.some((r) => r.aula === a.data && r.filho === filho && r.feita);
  let achouProxima = false;
  return trilhaDoFilho(aulas, filho).map((aula, i) => {
    const concluida = feita(aula);
    const proxima = !concluida && !achouProxima;
    if (proxima) achouProxima = true;
    return { aula, numero: i + 1, estado: concluida ? 'feita' : proxima ? 'proxima' : 'futura' };
  });
}

/**
 * Quem pode viajar: todo código de filho que aparece nas aulas ou no cadastro. O nome vem do cadastro (só no aparelho ou
 * na família); sem cadastro, vale o rótulo da aula ("Filha 1"). A idade vem do nascimento cadastrado.
 */
export function viajantes(aulas, filhos, hoje = new Date()) {
  const rotulos = new Map();
  const perfis = new Map();
  for (const a of aulas) {
    if (!CODIGO_FILHO.test(a.filho ?? '')) continue;
    if (!rotulos.has(a.filho)) rotulos.set(a.filho, a.para || a.filho);
    if (!perfis.has(a.filho) && a.perfil) perfis.set(a.filho, a.perfil);
  }
  const porId = new Map(filhos.map((f) => [f.id, f]));
  const codigos = [...new Set([...rotulos.keys(), ...porId.keys()])].sort((x, y) => x.localeCompare(y, 'pt-BR', { numeric: true }));
  return codigos.map((id) => {
    const f = porId.get(id);
    const anos = f ? anosCompletos(f.nascimento, hoje) : null;
    return { id, nome: f?.nome || rotulos.get(id) || 'Viajante', perfil: f?.perfil || perfis.get(id) || '', anos, regiao: regiaoDaIdade(anos) };
  });
}

/** O código lembrado só vale se ainda existir entre os viajantes; senão, a tela é a Porta da Casa. */
export const viajanteEscolhido = (lista, quem) => lista.find((v) => v.id === quem) ?? null;
