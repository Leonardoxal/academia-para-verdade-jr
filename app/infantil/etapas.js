// Guia dos pais por etapa (2 a 15 anos): foco, o que fazer em casa e, a partir dos 9 anos, o caminho acadêmico.
// As idades são referência, não barreira: a criança pode estar adiantada numa área e precisar de reforço em outra.
// Orientação da Academia; nomes de exames e olimpíadas são reais, mas regras de inscrição mudam: confira sempre.

export const ETAPAS_INFANTIS = [
  {
    id: '2-3', nome: 'Primeira infância', de: 2, ate: 3,
    foco: 'Linguagem oral, vocabulário, movimento e a vida da família. Nada de alfabetização formal.',
    casa: ['Ler em voz alta todo dia, repetindo os livros preferidos e apontando as figuras.', 'Conversar muito: nomear objetos, ações e sentimentos.', 'Contar coisas reais (degraus, colheres) e brincar de maior e menor.', 'Rezar curto e junto: Sinal da Cruz, Santo Anjo, Ave-Maria.'],
    autonomia: 'Tudo com o adulto; a criança escolhe entre duas opções e ajuda nas tarefas da casa.',
  },
  {
    id: '4-5', nome: 'Educação infantil', de: 4, ate: 5,
    foco: 'Consciência fonológica, contagem com sentido, histórias recontadas e vida prática.',
    casa: ['Brincar com rimas e sílabas (palmas); reconhecer o som inicial das palavras.', 'Contar, comparar e juntar quantidades com objetos antes do número escrito.', 'Pedir que a criança reconte a história do dia com começo, meio e fim.', 'Aprender orações e histórias da Bíblia e dos santos, com conversa sobre as virtudes.'],
    autonomia: 'Pequenas responsabilidades diárias (arrumar os brinquedos, pôr a mesa) e tarefas curtas sozinha, com o adulto perto.',
  },
  {
    id: '6-8', nome: 'Alfabetização e fundamentos', de: 6, ate: 8,
    foco: 'Ler e escrever com relação letra-som e fluência; matemática com compreensão; primeiros hábitos de estudo.',
    casa: ['Leitura diária em voz alta pela criança, e leitura do adulto de livros mais difíceis.', 'Escrita de frases e pequenos textos, revistos e reescritos juntos.', 'Cálculo mental, problemas do dia a dia, medidas na cozinha.', 'Catecismo para a idade e preparação para os sacramentos, conforme a paróquia.'],
    autonomia: 'Rotina de estudo curta e fixa; a criança começa a corrigir o próprio trabalho com ajuda.',
  },
  {
    id: '9-11', nome: 'Formação cultural e acadêmica', de: 9, ate: 11,
    foco: 'Leitura de fôlego, escrita de parágrafos e narrativas, frações e geometria, ciências por observação, história e geografia.',
    casa: ['Clássicos por capítulos, com conversa sobre personagens e escolhas.', 'Redação semanal com revisão.', 'Projetos de ciência com hipótese, observação e registro.', 'Linha do tempo da história e mapas na parede.'],
    autonomia: 'Planejar a semana de estudo com o adulto e cumprir sozinha a maior parte das tarefas.',
    academico: ['Olimpíadas escolares (como a OBA, de astronomia, e o Canguru de Matemática) podem ser um desafio saudável, sem preparação intensiva. Confira se aceitam inscrição fora da escola.'],
  },
  {
    id: '12-13', nome: 'Pré-adolescência', de: 12, ate: 13,
    foco: 'Álgebra e demonstração, textos argumentativos, ciências com experimento, história das ideias e virtudes na vida real.',
    casa: ['Ler e discutir uma obra por mês, com ficha escrita.', 'Argumentar por escrito e ouvir objeções.', 'Estudar com recuperação ativa e revisão espaçada (cartões).', 'Direção espiritual e participação na vida da paróquia.'],
    autonomia: 'O adolescente organiza o próprio plano; o adulto confere e conversa uma vez por semana.',
    academico: ['OBMEP (matemática) e outras olimpíadas por área, conforme o interesse; confira as regras de inscrição.', 'Inglês com meta de nível do Quadro Europeu (por exemplo, A2 a B1); exames de proficiência são opcionais.'],
  },
  {
    id: '14-15', nome: 'Adolescência', de: 14, ate: 15,
    foco: 'Base sólida para o ensino médio e para a Academia da Verdade aos 16: redação, matemática, física, química, biologia, história, filosofia introdutória e fé estudada.',
    casa: ['Redação no formato dissertativo-argumentativo, corrigida com critérios.', 'Resolver provas anteriores como treino de leitura de enunciados, sem transformar o estudo em treino de prova.', 'Projeto de pesquisa pessoal com fontes e citações.', 'Leitura dos clássicos que preparam o curso da Academia da Verdade.'],
    autonomia: 'Estudo independente, com o adulto como orientador e avaliador.',
    academico: ['ENEM e vestibulares: conhecer o formato e resolver questões antigas aos poucos; a preparação intensa fica para depois.', 'Para quem pensa em estudar fora: SAT e exames de proficiência em inglês, só como informação por enquanto.', 'Olimpíadas de matemática, física, química, história e outras, conforme o interesse.'],
  },
];

/** Etapa de uma idade em anos completos (null fora de 2 a 15). */
export const etapaDaIdade = (anos) => ETAPAS_INFANTIS.find((e) => anos !== null && anos >= e.de && anos <= e.ate) ?? null;
