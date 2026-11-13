// Mapa de habilidades: a sequência que diz o que vem depois, o que é pré-requisito e quando há domínio.
// Só lógica e dados; sem tela nem armazenamento.
//
// Primeira trilha (implementação vertical): número e quantidade, dos 2 aos 6 anos. As outras áreas só entram
// depois que esta for usada de verdade com as crianças e revista. Não acrescente trilhas só para fazer volume.
//
// Origem da sequência: princípios da contagem (Gelman e Gallistel, The Child's Understanding of Number, 1978)
// e trajetórias de aprendizagem da matemática inicial (Clements e Sarama, Learning and Teaching Early Math, 2009).
// A forma concreta (habilidades, verificações, critérios) é proposta da Academia e não foi validada por especialista.
// As idades são referência, não barreira: o que libera uma habilidade é o domínio das anteriores.
//
// O registro de aprendizagem (registro.js) guarda a habilidade como texto. A ligação com o mapa é pelo nome:
// um registro pertence a uma habilidade do mapa quando o texto é igual ao `nome` dela (sem diferenciar
// maiúsculas nem acentos). Assim o banco não muda e os registros antigos continuam valendo.

export const TRILHAS = {
  'mat-numero': {
    nome: 'Número e quantidade', area: 'Matemática', de: 2, ate: 6,
    finalidade: 'Contar com sentido: saber quantos há, comparar, ligar o número escrito à quantidade e juntar e tirar com objetos.',
    // Objetivos da BNCC (Educação Infantil, campo "Espaços, tempos, quantidades, relações e transformações") que a trilha cobre.
    bncc: [
      ['EI02ET07', 'Contar oralmente objetos, pessoas, livros etc., em contextos diversos.'],
      ['EI03ET07', 'Relacionar números às suas respectivas quantidades e identificar o antes, o depois e o entre em uma sequência.'],
    ],
    // Onde a trilha desemboca: o que ela prepara no ensino fundamental, sem antecipar esse conteúdo.
    prepara: 'Adição e subtração com compreensão e o sistema de numeração, no 1º ano.',
  },
};

export const HABILIDADES = [
  {
    id: 'mat-recitar-5', trilha: 'mat-numero', nome: 'Dizer os números até 5 na ordem', de: 2, ate: 3, prereq: [],
    objetivo: 'Saber de cor a sequência um, dois, três, quatro, cinco, sem pular nem trocar.',
    verificar: 'Peça: "conta até cinco para mim", sem objetos. Faça em dois momentos do dia.',
    dominio: 'Diz de um a cinco na ordem, sem ajuda, nas duas vezes.',
    excelencia: 'Continua a contagem a partir de um número dado ("três… e depois?").',
    intervencao: 'Cantigas e parlendas de contar, contar degraus e colheres todos os dias, sempre na mesma ordem. Sem corrigir com insistência: repita certo e siga.',
    jogo: null,
  },
  {
    id: 'mat-um-a-um-3', trilha: 'mat-numero', nome: 'Contar até 3 objetos, tocando um de cada vez', de: 2, ate: 3, prereq: ['mat-recitar-5'],
    objetivo: 'Dar um número para cada objeto, sem pular nenhum e sem contar o mesmo duas vezes.',
    verificar: 'Ponha 3 objetos iguais em fila e peça: "conta para mim". Depois repita com os 3 espalhados.',
    dominio: 'Toca cada objeto uma vez só e diz um número para cada um, em fila e espalhados.',
    excelencia: 'Conta certo também quando os objetos são diferentes entre si (colher, bola, carrinho).',
    intervencao: 'Conte junto, movendo cada objeto para um prato ao dizer o número. Comece com 2. Se a criança aponta rápido demais, segure a mão dela de leve e contem devagar.',
    jogo: 'quantos',
  },
  {
    id: 'mat-quantos-3', trilha: 'mat-numero', nome: 'Dizer quantos há, até 3', de: 2, ate: 4, prereq: ['mat-um-a-um-3'],
    objetivo: 'Entender que o último número contado diz quantos são (cardinalidade).',
    verificar: 'Depois que a criança contar 3 objetos, pergunte: "quantos são?". Em outro momento peça: "me dá dois".',
    dominio: 'Responde o último número sem contar de novo e entrega a quantidade pedida (1, 2 ou 3).',
    excelencia: 'Percebe sozinha quando falta ou sobra um ("aqui só tem dois").',
    intervencao: 'Se a criança conta tudo de novo quando você pergunta quantos, é esperado: diga você "um, dois, três: são três!" fechando a mão sobre o grupo. Peça quantidades na rotina ("pega duas colheres").',
    jogo: 'quantos',
  },
  {
    id: 'mat-comparar-5', trilha: 'mat-numero', nome: 'Comparar dois grupos: mais, menos e igual', de: 3, ate: 4, prereq: ['mat-quantos-3'],
    objetivo: 'Dizer qual grupo tem mais, qual tem menos e quando têm a mesma quantidade, até 5 objetos.',
    verificar: 'Faça dois montinhos (por exemplo 2 e 4) e pergunte "onde tem mais?". Depois 3 e 3: "e agora?". Varie o tamanho dos objetos.',
    dominio: 'Acerta mais, menos e igual, mesmo quando o grupo menor tem objetos maiores.',
    excelencia: 'Explica como sabe ("contei", "pus um do lado do outro") e iguala os grupos tirando ou pondo.',
    intervencao: 'Ponha os objetos em duas filas, um de frente para o outro, para ver quem sobra. Use diferenças grandes (1 e 5) antes das pequenas (3 e 4).',
    jogo: 'quantos',
  },
  {
    id: 'mat-ver-3', trilha: 'mat-numero', nome: 'Reconhecer 1, 2 e 3 sem contar', de: 3, ate: 4, prereq: ['mat-quantos-3'],
    objetivo: 'Ver de relance uma quantidade pequena e dizer quantos são, sem contar um por um.',
    verificar: 'Mostre por dois segundos 1, 2 ou 3 objetos na mão e esconda. Pergunte "quantos tinha?". Faça seis vezes, fora de ordem.',
    dominio: 'Acerta pelo menos cinco das seis vezes, sem contar com o dedo.',
    excelencia: 'Reconhece também 4 quando arrumado como no dado.',
    intervencao: 'Brinque com dado de pontos e com os dedos ("mostra dois"). Se a criança ainda precisa contar, deixe: volte às habilidades de contar e tente de novo em algumas semanas.',
    jogo: 'quantos',
  },
  {
    id: 'mat-recitar-10', trilha: 'mat-numero', nome: 'Dizer os números até 10 na ordem', de: 3, ate: 4, prereq: ['mat-recitar-5'],
    objetivo: 'Saber de cor a sequência de um a dez.',
    verificar: 'Peça: "conta até dez", sem objetos, em dois momentos do dia.',
    dominio: 'Diz de um a dez na ordem, sem ajuda, nas duas vezes.',
    excelencia: 'Conta de trás para a frente a partir do cinco.',
    intervencao: 'Mesmas cantigas e contagens da rotina, agora até dez. Se a criança trava sempre no mesmo número, diga só aquele e deixe que continue.',
    jogo: null,
  },
  {
    id: 'mat-contar-10', trilha: 'mat-numero', nome: 'Contar até 10 objetos e dizer quantos são', de: 4, ate: 5, prereq: ['mat-quantos-3', 'mat-recitar-10'],
    objetivo: 'Contar grupos de até 10 objetos com um número para cada um e dizer o total.',
    verificar: 'Espalhe 7 objetos e peça para contar e dizer quantos são. Depois peça: "me dá seis".',
    dominio: 'Conta certo, diz o total e separa a quantidade pedida, em duas quantidades diferentes entre 6 e 10.',
    excelencia: 'Organiza os objetos por conta própria (em fila, separando os já contados) para não se perder.',
    intervencao: 'Ensine a separar o que já contou. Volte a grupos de 5 e aumente um por vez. Erros acima de 6 costumam ser de organização, não de saber os números.',
    jogo: 'quantos',
  },
  {
    id: 'mat-numerais-5', trilha: 'mat-numero', nome: 'Ligar os números escritos de 1 a 5 à quantidade', de: 3, ate: 5, prereq: ['mat-quantos-3'],
    objetivo: 'Reconhecer os numerais de 1 a 5 e saber que quantidade cada um representa.',
    verificar: 'Mostre cartões de 1 a 5 fora de ordem: "que número é este?". Depois: "põe aqui tantas tampinhas quanto este número".',
    dominio: 'Nomeia os cinco numerais e monta a quantidade certa para cada um.',
    excelencia: 'Acha os numerais no dia a dia (relógio, placa, página do livro) e diz o que significam.',
    intervencao: 'Um numeral novo por vez, sempre ao lado da quantidade (cartão com o 3 e três pontos). Escrever o numeral não é exigido aqui.',
    jogo: 'numeros',
  },
  {
    id: 'mat-numerais-10', trilha: 'mat-numero', nome: 'Ligar os números escritos de 6 a 10 à quantidade', de: 4, ate: 6, prereq: ['mat-numerais-5', 'mat-contar-10'],
    objetivo: 'Reconhecer os numerais de 6 a 10 e montar a quantidade de cada um.',
    verificar: 'Cartões de 6 a 10 fora de ordem: nomear cada um e montar a quantidade de dois deles.',
    dominio: 'Nomeia os cinco numerais e monta as duas quantidades pedidas sem erro.',
    excelencia: 'Põe os cartões de 1 a 10 em ordem e diz qual vem antes e depois de um número.',
    intervencao: 'Atenção ao 6 e ao 9, que se confundem: trabalhe um de cada vez, em dias diferentes.',
    jogo: 'numeros',
  },
  {
    id: 'mat-juntar-tirar-5', trilha: 'mat-numero', nome: 'Juntar e tirar com objetos, até 5', de: 4, ate: 6, prereq: ['mat-contar-10', 'mat-comparar-5'],
    objetivo: 'Resolver com objetos pequenas histórias de juntar e de tirar, com total até 5.',
    verificar: 'Conte duas histórias com objetos à mão: "você tem 2 maçãs e ganha mais 1; com quantas fica?" e "tinha 4 e comeu 1; quantas sobraram?".',
    dominio: 'Resolve as duas com os objetos e diz o resultado.',
    excelencia: 'Resolve sem objetos, de cabeça ou com os dedos, e inventa uma história parecida.',
    intervencao: 'Deixe a criança agir a história com os objetos antes de perguntar o resultado. Sem sinais de + e − por enquanto: a conta escrita vem depois.',
    jogo: 'quantos',
  },
];

const porId = new Map(HABILIDADES.map((h) => [h.id, h]));
export const habilidadePorId = (id) => porId.get(id) ?? null;

const normal = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const porNome = new Map(HABILIDADES.map((h) => [normal(h.nome), h]));
/** Habilidade do mapa a que um texto de registro corresponde (null se for uma habilidade livre). */
export const habilidadeDoTexto = (texto) => porNome.get(normal(texto)) ?? null;

const dia = (ms) => new Date(ms).toLocaleDateString('sv'); // AAAA-MM-DD no fuso do aparelho

/**
 * Estado de uma habilidade do mapa a partir dos registros confirmados pelo responsável:
 *  'sem-registro'  nada registrado;
 *  'em-andamento'  o registro mais recente não é "dominado";
 *  'a-confirmar'   "dominado" observado num dia só: falta ver de novo em outro dia;
 *  'dominada'      "dominado" no registro mais recente e, além disso, ou a origem é "resultado confirmado em nova
 *                  verificação", ou há registros de "dominado" em pelo menos dois dias diferentes;
 *  'rever'         dominada, mas a última verificação tem mais de DIAS_RETENCAO dias: conferir se continua sabendo.
 * Uma observação isolada nunca basta para o domínio. Domínio é o que fica: por isso a retenção é conferida depois.
 * "rever" não tira o domínio nem bloqueia as habilidades seguintes; só pede uma nova verificação.
 */
export const DIAS_RETENCAO = 30;
export function estadoDaHabilidade(habilidade, registros, agora = Date.now()) {
  const seus = registros.filter((r) => habilidadeDoTexto(r.habilidade)?.id === habilidade.id).sort((a, b) => a.criadoEm - b.criadoEm);
  const ultimo = seus.at(-1) ?? null;
  if (!ultimo) return { estado: 'sem-registro', ultimo: null };
  if (ultimo.situacao !== 'dominado') return { estado: 'em-andamento', ultimo };
  const diasDominado = new Set(seus.filter((r) => r.situacao === 'dominado').map((r) => dia(r.criadoEm)));
  if (ultimo.origem !== 'confirmado' && diasDominado.size < 2) return { estado: 'a-confirmar', ultimo };
  return { estado: agora - ultimo.criadoEm > DIAS_RETENCAO * 86400000 ? 'rever' : 'dominada', ultimo };
}

export const ESTADOS = {
  'sem-registro': 'Ainda não observada', 'em-andamento': 'Em andamento', 'a-confirmar': 'Confirmar em outro dia', dominada: 'Dominada', rever: 'Dominada; rever se continua sabendo',
};

/** O mapa de uma trilha com o estado de cada habilidade e se ela está liberada (todos os pré-requisitos dominados). */
export const temDominio = (estado) => estado === 'dominada' || estado === 'rever';
export function mapaDaTrilha(trilha, registros, agora = Date.now()) {
  const linhas = HABILIDADES.filter((h) => h.trilha === trilha).map((h) => ({ habilidade: h, ...estadoDaHabilidade(h, registros, agora) }));
  const dominadas = new Set(linhas.filter((l) => temDominio(l.estado)).map((l) => l.habilidade.id));
  return linhas.map((l) => ({ ...l, liberada: l.habilidade.prereq.every((p) => dominadas.has(p)), faltam: l.habilidade.prereq.filter((p) => !dominadas.has(p)) }));
}

const ORDEM = { 'a-confirmar': 0, 'em-andamento': 1, 'sem-registro': 2, rever: 3 };

/**
 * O que fazer agora numa trilha, no máximo `max` itens: primeiro confirmar o que foi visto uma vez, depois o que
 * está em andamento, depois habilidades novas já liberadas e, por fim, as dominadas há mais de um mês, para conferir
 * a retenção. Habilidade bloqueada por pré-requisito não aparece, a não ser que já tenha registro (a criança pode
 * ter avançado por outro caminho: aí vale observar).
 */
export function proximasHabilidades(trilha, registros, max = 3, agora = Date.now()) {
  return mapaDaTrilha(trilha, registros, agora)
    .filter((l) => l.estado !== 'dominada' && (l.liberada || l.estado !== 'sem-registro'))
    .sort((a, b) => ORDEM[a.estado] - ORDEM[b.estado])
    .slice(0, max);
}

/** Trilhas que servem para uma idade em anos completos (com um ano de folga no fim); sem idade informada, todas. */
export const trilhasDaIdade = (anos) => Object.entries(TRILHAS).filter(([, t]) => anos === null || (anos >= t.de && anos <= t.ate + 1)).map(([id]) => id);
