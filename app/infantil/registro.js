// Registro de aprendizagem por habilidade: o que o responsável confirmou, com a origem da informação.
// Só lógica. Um registro: { id, filho, aula|null, area, habilidade, situacao, origem, dificuldade, intervencao,
// reavaliar ('AAAA-MM-DD'|null), criadoEm (ms) }. A situação atual de uma habilidade é o registro mais recente dela.
import { CRITERIOS } from './prompt.js';

export const AREAS = Object.keys(CRITERIOS);
export const SITUACOES = {
  'nao-iniciado': 'Não iniciado', 'em-desenvolvimento': 'Em desenvolvimento', parcial: 'Parcialmente dominado',
  dominado: 'Dominado', revisar: 'Precisa de revisão',
};
// Separa observação do adulto, sugestão da IA conferida e resultado confirmado (seção 11.5 do projeto).
export const ORIGENS = {
  observacao: 'Observação do responsável', 'ia-conferida': 'Sugestão da IA, conferida pelo responsável', confirmado: 'Resultado confirmado em nova verificação',
};
const PEDEM_REFORCO = ['em-desenvolvimento', 'parcial', 'revisar'];

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const AULA = /^\d{4}-\d{2}-\d{2}(-f\d{1,3})?$/;
const FILHO = /^[a-z0-9-]{1,30}$/;
const texto = (v, max) => String(v ?? '').trim().slice(0, max);

/** Confere e limpa um registro vindo do formulário ou de um backup. Lança erro com mensagem para a tela. */
export function validarRegistro(r) {
  const limpo = {
    id: String(r.id ?? ''), filho: String(r.filho ?? ''), aula: r.aula ? String(r.aula) : null,
    area: texto(r.area, 60), habilidade: texto(r.habilidade, 160), situacao: String(r.situacao ?? ''), origem: String(r.origem ?? ''),
    dificuldade: texto(r.dificuldade, 1000), intervencao: texto(r.intervencao, 2000),
    reavaliar: r.reavaliar ? String(r.reavaliar) : null, criadoEm: Number(r.criadoEm) || Date.now(),
  };
  if (!/^[0-9a-f-]{36}$/i.test(limpo.id)) throw new Error('Registro sem identificador válido.');
  if (!FILHO.test(limpo.filho)) throw new Error('Escolha o filho antes de registrar.');
  if (limpo.aula && !AULA.test(limpo.aula)) throw new Error('Aula inválida.');
  if (!limpo.area) throw new Error('Escolha a área.');
  if (!limpo.habilidade) throw new Error('Escreva a habilidade (por exemplo: contar até 3 objetos).');
  if (!(limpo.situacao in SITUACOES)) throw new Error('Escolha a situação.');
  if (!(limpo.origem in ORIGENS)) throw new Error('Escolha de onde vem a informação.');
  if (limpo.reavaliar && !DATA.test(limpo.reavaliar)) throw new Error('Data de reavaliação inválida.');
  return limpo;
}

const chave = (r) => `${r.area}|${r.habilidade.toLocaleLowerCase('pt-BR')}`;

/** Situação atual de cada habilidade (o registro mais recente), em ordem de área e habilidade. */
export function situacaoAtual(registros) {
  const atual = new Map();
  for (const r of [...registros].sort((a, b) => a.criadoEm - b.criadoEm)) atual.set(chave(r), r);
  return [...atual.values()].sort((a, b) => a.area.localeCompare(b.area, 'pt-BR') || a.habilidade.localeCompare(b.habilidade, 'pt-BR'));
}

/** Próximos passos: habilidades com reavaliação vencida ou que pedem reforço; data mais antiga primeiro, sem data por último. */
export function proximosPassos(registros, hoje) {
  return situacaoAtual(registros)
    .filter((r) => (r.reavaliar && r.reavaliar <= hoje) || PEDEM_REFORCO.includes(r.situacao))
    .sort((a, b) => (a.reavaliar ?? '9999').localeCompare(b.reavaliar ?? '9999'));
}
