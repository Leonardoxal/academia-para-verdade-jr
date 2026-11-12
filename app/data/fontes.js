// Etiquetas epistêmicas e links verificados usados em todo o conteúdo.
// Regra editorial: só entram aqui URLs conferidas manualmente (verificadas em 26/10/2026).

export const ETIQUETAS = {
  doutrina: { rotulo: 'DOUTRINA CATÓLICA', desc: 'Ensinamento documentado da Igreja (Escritura, Catecismo, Concílios, Magistério).' },
  fato: { rotulo: 'FATO HISTÓRICO', desc: 'Informação histórica sustentada por fontes.' },
  argumento: { rotulo: 'ARGUMENTO FILOSÓFICO', desc: 'Raciocínio reconstruído e identificado como tal.' },
  interpretacao: { rotulo: 'INTERPRETAÇÃO DE AUTOR', desc: 'Leitura particular de uma obra ou acontecimento.' },
  hipotese: { rotulo: 'HIPÓTESE', desc: 'Proposta que necessita de confirmação.' },
  debate: { rotulo: 'DEBATE ABERTO', desc: 'Questão com divergências relevantes entre especialistas.' },
};

/** Marca uma afirmação com sua etiqueta epistêmica (usado dentro do HTML das aulas). */
export const tag = (tipo) => `<span class="etq etq-${tipo}" title="${ETIQUETAS[tipo].desc}">${ETIQUETAS[tipo].rotulo}</span>`;

const CIC = 'https://www.vatican.va/archive/cathechism_po/index_new/';

export const LINKS = {
  cicIndice: { url: CIC + 'prima-pagina-cic_po.html', rotulo: 'Catecismo da Igreja Católica — índice (vatican.va)' },
  cicPrologo: { url: CIC + 'prologo%201-25_po.html', rotulo: 'CIC, Prólogo, §1–25 (vatican.va)' },
  cicCapaz: { url: CIC + 'p1s1c1_26-49_po.html', rotulo: 'CIC, §26–49: o homem é capaz de Deus (vatican.va)' },
  cicRevelacao: { url: CIC + 'p1s1c2_50-141_po.html', rotulo: 'CIC, §50–141: Revelação, Transmissão, Escritura (vatican.va)' },
  cicFe: { url: CIC + 'p1s1c3_142-184_po.html', rotulo: 'CIC, §142–184: a resposta do homem a Deus (vatican.va)' },
  cicSimbolos: { url: CIC + 'p1s2_185-197_po.html', rotulo: 'CIC, §185–197: os símbolos da fé (vatican.va)' },
  cicPai: { url: CIC + 'p1s2c1_198-421_po.html', rotulo: 'CIC, §198–421: Creio em Deus Pai (vatican.va)' },
  cicCristo: { url: CIC + 'p1s2cap2_422-682_po.html', rotulo: 'CIC, §422–682: Creio em Jesus Cristo (vatican.va)' },
  cicEspirito: { url: CIC + 'p1s2cap3_683-1065_po.html', rotulo: 'CIC, §683–1065: Creio no Espírito Santo, Igreja, vida eterna (vatican.va)' },
  cicParte1: { url: CIC + 'index-prima-parte_po.html', rotulo: 'CIC, Primeira Parte — índice (vatican.va)' },
  compendio: { url: 'https://www.vatican.va/archive/compendium_ccc/documents/archive_2005_compendium-ccc_po.html', rotulo: 'Compêndio do Catecismo (vatican.va)' },
  deiVerbum: { url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19651118_dei-verbum_po.html', rotulo: 'Concílio Vaticano II, Dei Verbum (vatican.va)' },
  fidesRatio: { url: 'https://www.vatican.va/content/john-paul-ii/pt/encyclicals/documents/hf_jp-ii_enc_14091998_fides-et-ratio.html', rotulo: 'João Paulo II, Fides et Ratio (vatican.va)' },
  sumaQ1: { url: 'https://www.newadvent.org/summa/1001.htm', rotulo: 'Suma Teológica I, q. 1 — tradução inglesa (newadvent.org)' },
  sumaQ2: { url: 'https://www.newadvent.org/summa/1002.htm', rotulo: 'Suma Teológica I, q. 2 — tradução inglesa (newadvent.org)' },
};

/** Busca em catálogo bibliográfico: não é link para o livro, é uma pesquisa pública. */
export const buscaCatalogo = (titulo, autor) =>
  `https://search.worldcat.org/search?q=${encodeURIComponent(`${titulo} ${autor}`)}`;
