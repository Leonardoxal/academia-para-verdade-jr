// Texto para o responsável levar a uma IA externa (ChatGPT, Claude ou outra) junto com as fotos da tarefa.
// O site não se conecta a nenhuma IA: só monta o texto. A criança aparece como "Aluno A", sem nome nem nascimento.
// A análise da IA é sugestão; o registro oficial depende da revisão e da confirmação do responsável.

/** Observações rápidas sobre como a criança fez a atividade (seção 11.1 do projeto). */
export const OBSERVACOES = [
  'Fez sozinha.', 'Precisou de ajuda.', 'Precisou de explicação de novo.', 'Mostrou cansaço.', 'Perdeu a atenção.',
  'Demorou mais que o esperado.', 'Entendeu falando, mas teve dificuldade para fazer no papel.', 'Acertou depois de uma dica.',
];

/** Níveis de observação da Academia Infantil (sem prova formal). */
export const NIVEIS = ['ainda não observado', 'em desenvolvimento', 'realiza com ajuda', 'realiza com autonomia', 'generaliza em outras situações'];

/** Critérios por área (seção 10.1); a IA usa só os que a atividade realmente trabalha. */
export const CRITERIOS = {
  'Matemática': 'compreensão conceitual, procedimento, cálculo, raciocínio, resolução de problemas, justificativa',
  'Português e linguagem': 'fala, compreensão, vocabulário, narrativa; mais adiante leitura, gramática, estrutura, clareza, argumentação',
  'Inglês': 'vocabulário, compreensão oral, leitura, gramática, escrita, comunicação',
  'Ciências': 'conceitos, observação, hipóteses, experimentos, fenômenos, raciocínio científico',
  'História': 'cronologia, causas e consequências, contexto, personagens, fato e interpretação',
  'Geografia': 'localização, orientação, mapas, natureza e sociedade',
  'Formação católica': 'conhecimento bíblico, conceitos da doutrina, história da Igreja, virtudes, capacidade de explicar com as próprias palavras',
  'Arte e motricidade': 'coordenação, uso do material, criatividade, cuidado com o trabalho',
};

/** Texto para pedir a uma IA um ciclo de reforço de uma habilidade ainda não dominada (seção 11.3 do projeto). */
export function textoReforcoIA({ area, habilidade, situacao, dificuldade = '', intervencao = '', idade = '', interesses = [] }) {
  return [
    `Preciso de um ciclo de reforço para uma criança ("Aluno A"${idade ? `, ${idade}` : ''}) que aprende em casa, numa formação católica integral.`,
    `Área: ${area}. Habilidade: ${habilidade}. Situação atual, confirmada pelo responsável: ${situacao}.`,
    dificuldade.trim() ? `Dificuldade observada: ${dificuldade.trim()}` : null,
    intervencao.trim() ? `O que já tentamos: ${intervencao.trim()}` : null,
    interesses.length ? `Interesses da criança, para usar como exemplo: ${interesses.join(', ')}.` : null,
    '',
    'Monte, em linguagem simples para o adulto:',
    '1. Qual pode ser o pré-requisito que falta, e como verificar isso em 2 minutos.',
    '2. Uma explicação diferente da habitual, com material concreto da casa.',
    '3. Três exemplos resolvidos juntos.',
    '4. De 4 a 6 exercícios graduais, curtos (3 a 5 minutos cada), sem repetir a mesma questão.',
    '5. Uma aplicação numa situação diferente do dia a dia.',
    '6. Uma verificação final de 3 itens e o critério para avançar ou retomar.',
    '',
    'Regras: respeite a idade, nada de pressão nem comparação; não faça diagnóstico psicológico ou clínico; se a dificuldade persistir, sugira conversar com um profissional; diga com clareza quando algo for opinião sua.',
  ].filter((p) => p !== null).join('\n');
}

/** Texto para conversar sobre um arco concluído de uma série, com a ficha da obra quando houver. */
export function textoArcoIA({ titulo, arco, ficha = null, idade = '', observacoes = '' }) {
  return [
    `Quero conversar com uma criança ("Aluno A"${idade ? `, ${idade}` : ''}) sobre o arco "${arco.nome}" (episódios ${arco.de} a ${arco.ate}) de "${titulo}", que ela acabou de assistir. A formação é católica.`,
    ficha ? `Leitura da Academia sobre a obra: ${ficha.academia}` : null,
    ficha?.personagens?.length ? `Personagens a observar: ${ficha.personagens.map((p) => `${p.nome} (${p.texto})`).join(' ')}` : null,
    observacoes.trim() ? `Observações da família: ${observacoes.trim()}` : null,
    '',
    'Faça, sem inventar fatos da obra (se não tiver certeza de um acontecimento, diga que não sabe):',
    '1. Um resumo curto do arco, só do que você tem certeza.',
    '2. Para os personagens principais do arco: motivações, escolhas, virtudes, vícios e consequências.',
    '3. Diga se houve arrependimento e reparação verdadeiros, só mudança de lado ou nenhuma mudança, com o que a história mostra.',
    '4. Separe o que está na obra do que é interpretação sua.',
    '5. Cinco perguntas de conversa adequadas à idade, do concreto ao moral, sem moralismo e sem forçar lição onde a obra não tem.',
    '6. Uma ligação com a fé católica, só se for natural (uma virtude, um vício, uma passagem bíblica com livro, capítulo e versículo).',
    '7. Cuidados: cenas que pedem conversa por violência, medo ou outros motivos.',
  ].filter((p) => p !== null).join('\n');
}

const linha = (rotulo, valor) => (valor ? `- ${rotulo}: ${valor}` : null); // null some do texto; '' é linha em branco
const pct = (x) => (x === null || x === undefined ? 'sem dados' : `${Math.round(x * 100)}% de acertos`);

/**
 * @param {object} d
 * @param {object} d.aula        meta pública da aula (titulo, tema, virtude, resumo, data)
 * @param {string} [d.idade]     idade em anos e meses (ex.: "2 anos e 10 meses"); nunca a data de nascimento
 * @param {string[]} [d.marcadas]  observações marcadas pelo responsável
 * @param {string} [d.nota]      observações escritas do responsável sobre esta aula
 * @param {{titulo:string, nota:string}[]} [d.anteriores]  aulas anteriores feitas, com as observações
 * @param {{titulo:string, habilidades:string[], partidas:number, recorde:number, precisao:number|null}[]} [d.jogos]
 * @param {string[]} [d.interesses]
 * @param {{area:string, habilidade:string, situacao:string}[]} [d.habilidades]  situação atual confirmada pelo responsável
 */
export function textoParaIA({ aula, idade = '', marcadas = [], nota = '', anteriores = [], jogos = [], interesses = [], habilidades = [] }) {
  const partes = [
    'Você vai me ajudar a avaliar uma atividade de educação infantil feita em casa, numa formação católica integral. Vou enviar fotos ou o PDF da tarefa feita pela criança. Chame a criança de "Aluno A".',
    '',
    '## A criança',
    linha('Idade', idade || 'não informada'),
    linha('Interesses observados', interesses.join(', ')),
    '- Aprende em casa, com um adulto conduzindo. Reconhecer letras não é prontidão para alfabetização formal.',
    '',
    '## A atividade',
    linha('Aula', aula.titulo),
    linha('Data', aula.data?.slice(0, 10)),
    linha('Tema bíblico', aula.tema),
    linha('Virtude', aula.virtude),
    linha('Conteúdo', aula.resumo),
    '',
    '## Como foi, segundo o responsável',
    marcadas.length ? marcadas.map((m) => `- ${m}`).join('\n') : '- Nada marcado.',
    nota.trim() ? `- Observações: ${nota.trim()}` : null,
    '',
    '## Histórico',
    anteriores.length ? anteriores.map((a) => `- ${a.titulo}${a.nota?.trim() ? `: ${a.nota.trim()}` : ''}`).join('\n') : '- Sem aulas anteriores registradas.',
    jogos.length ? `Jogos da Academia (nível mais alto alcançado e acertos nas últimas partidas):\n${jogos.map((j) => `- ${j.titulo} (${j.habilidades.join(', ')}): ${j.partidas} partida(s), recorde nível ${j.recorde}, ${pct(j.precisao)}`).join('\n')}` : null,
    habilidades.length ? `Situação atual das habilidades, confirmada pelo responsável:\n${habilidades.map((h) => `- ${h.habilidade} (${h.area}): ${h.situacao}`).join('\n')}` : null,
    '',
    '## Critérios de avaliação (use só os das áreas que a atividade trabalha)',
    Object.entries(CRITERIOS).map(([area, c]) => `- ${area}: ${c}`).join('\n'),
    `Níveis de observação: ${NIVEIS.join('; ')}. Uma atividade isolada não prova domínio.`,
    '',
    '## O que eu preciso',
    '1. Analise cada questão ou exercício da foto e diga se está certo, parcialmente certo ou errado, e por quê.',
    '2. Separe, quando houver evidência suficiente: erro de conceito, erro de execução, desatenção, dificuldade motora ou de comunicação. Não atribua todo erro à falta de conhecimento.',
    '3. Liste as habilidades demonstradas, as parcialmente demonstradas e as ainda não observadas, com o nível de observação de cada uma.',
    '4. Aponte possíveis lacunas de pré-requisito e compare com o histórico acima, se ele permitir.',
    '5. Para cada habilidade não dominada: diga qual é o pré-requisito, explique o conteúdo de outro jeito, dê exemplos, proponha 3 a 5 exercícios graduais e curtos (3 a 5 minutos cada, com material concreto), uma aplicação numa situação diferente e uma verificação final. Não repita a mesma questão.',
    '6. Recomende avançar, consolidar ou reforçar, com o motivo.',
    '7. Dê, para cada conclusão, o seu grau de confiança (alto, médio ou baixo) e diga com clareza quando a foto não mostra o suficiente.',
    '',
    '## Regras',
    '- Uma foto não mostra todo o processo: considere as observações do responsável.',
    '- Não faça diagnóstico psicológico, clínico ou neuropsicológico. Se notar algo que mereça atenção, sugira conversar com um profissional.',
    '- Respeite a idade: nada de pressão, nada de comparar com outras crianças.',
    '- Na parte religiosa, siga a doutrina católica e diga quando algo for tradição devocional, e não doutrina.',
    '',
    '## Formato da resposta',
    'Um relatório curto e claro para o responsável, nesta ordem: resultado geral; análise por questão; habilidades dominadas; parcialmente dominadas; dificuldades e evidências; pontos a investigar; atividades de reforço; nova verificação; orientações para o adulto; recomendação final (avançar ou reforçar).',
  ];
  return partes.filter((p) => p !== null).join('\n').trim();
}
