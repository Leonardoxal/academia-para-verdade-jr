// Aba Infantil (#infantil, #infantil-AAAA-MM-DD): a Academia para Verdade Jr., introdução à Academia da Verdade.
// Baixar as aulas em PDF (cada uma é para um filho) e guardar as tarefas já feitas, dizendo qual filho fez.
// Sem conta, tudo fica neste aparelho; com a conta da Verdade e o código da família, sincroniza entre todos que
// entraram na família. Nome e nascimento dos filhos ficam só no aparelho ou no banco privado, nunca no repositório.
import { esc, link, toast } from '../ui.js';
import { AULAS_INFANTIL, aulaInfantilPorData } from '../infantil/aulas.js';
import { criarArmazenamento } from '../infantil/armazenamento.js';
import { idade, proximoCodigo } from '../infantil/idade.js';
import { clienteNuvem, usuarioNuvem, nuvemConfigurada } from '../nuvem.js';
import { FAMILIA_ATIVA } from '../infantil/config.js';
import { proximaPorFilho } from '../infantil/progresso.js';
import { criarLeitor } from '../infantil/leitor.js';
import { FAIXAS, SECOES, FORMATOS, SANTOS, livrosDaFaixa, faixaPara, HISTORIAS_BIBLICAS, PERSONAGENS_BIBLICOS, BIBLIA, CATEQUESE, PAIS, NAO_VERIFICADOS } from '../infantil/livros.js';
import { cenaVitral, selo, estrelas, icone } from '../infantil/ilustracoes.js';
import { INTERESSES, resumoJogo, recomendar, anosCompletos } from '../infantil/historico.js';
import { proximo as proximoEpisodio } from '../infantil/series.js';
import { ETAPAS_INFANTIS, etapaDaIdade } from '../infantil/etapas.js';
import { OBSERVACOES, textoParaIA, textoReforcoIA } from '../infantil/prompt.js';
import { JOGOS } from '../infantil/jogos.js';
import { AREAS, SITUACOES, ORIGENS, situacaoAtual, proximosPassos } from '../infantil/registro.js';
import { TRILHAS, HABILIDADES, ESTADOS, habilidadeDoTexto, habilidadePorId, mapaDaTrilha, proximasHabilidades, trilhasDaIdade } from '../infantil/habilidades.js';

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_LADO = 1800;
const SINCRONIA_MS = 30000;
const CODIGO_OK = /^[a-z0-9-]{1,30}$/;
// Exportado só por compatibilidade: a versão anterior de views/jogos.js importava daqui e pode estar no cache.
export const arm = criarArmazenamento({ obterCliente: clienteNuvem, obterUsuario: usuarioNuvem, familiaAtiva: FAMILIA_ATIVA });

const tamanho = (b) => (b < 1048576 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1)} MB`);
const dataBR = (iso) => iso.slice(0, 10).split('-').reverse().join('/'); // o id pode levar o sufixo do filho (AAAA-MM-DD-f2)
const quando = (ms) => new Date(ms).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const novoId = () => crypto.randomUUID?.() ?? ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
// Mesma lista do banco da nuvem. SVG fica de fora: aberto numa aba, executaria script.
const tipoPermitido = (t) => t === 'application/pdf' || /^image\/(jpeg|png|webp|gif|heic|heif)$/.test(t);
const erroTexto = (e) => e?.message || 'Não foi possível concluir.';
const codigoValido = (c) => c === '' || CODIGO_OK.test(c);
const nomeDe = (filhos, codigo, padrao = '') => filhos.find((f) => f.id === codigo)?.nome || padrao;
const lembrarQuem = (v) => { try { v === undefined ? null : localStorage.setItem('aci-quem', v); return localStorage.getItem('aci-quem'); } catch { return null; } };

// ---------------------------------------------------------------- HTML

const caderno = (a) => (a.perfil === 'menino' ? 'caderno do aluno' : 'caderno da aluna');
const Caderno = (a) => caderno(a).replace('c', 'C');

const botoesPdf = (a) => `
  <a class="btn primario" href="${esc(a.arquivos.aluna)}" download>${icone('baixar')} ${Caderno(a)} (${a.paginas.aluna} págs.)</a>
  <a class="btn" href="${esc(a.arquivos.responsavel)}" download>${icone('baixar')} Manual do responsável (${a.paginas.responsavel} págs.)</a>`;

const cartao = (a) => `
  <article class="inf-cartao">
    <div class="inf-selo">${selo(a.icone)}</div>
    <div class="inf-conteudo">
      <h2><a href="#infantil-${esc(a.data)}">${esc(a.titulo)}</a></h2>
      <p><span class="chip">${dataBR(a.data)}</span><span class="chip inf-para" data-para="${esc(a.data)}">${a.para ? `Para: ${esc(a.para)}` : ''}</span>${a.perfil ? `<span class="chip">Versão ${esc(a.perfil)}</span>` : ''}${a.virtude ? `<span class="chip inf-virtude">Virtude: ${esc(a.virtude)}</span>` : ''}<span data-chips="${esc(a.data)}"></span></p>
      <p>${esc(a.resumo)}</p>
      <div class="inf-acoes">${botoesPdf(a)}<a class="btn" href="#infantil-${esc(a.data)}">${icone('clipe')} Anexar tarefas</a></div>
    </div>
  </article>`;

const itemLivro = (l, marcar = true) => `<li>${marcar ? `<label class="inf-linha"><input type="checkbox" data-livro="${esc(l.id)}" aria-label="Já lemos: ${esc(l.titulo)}"> ` : ''}<span><strong>${esc(l.titulo)}</strong>${l.original ? ` <em>(${esc(l.original)})</em>` : ''} — ${esc(l.autor)}${l.formato ? ` <span class="chip">${FORMATOS[l.formato]}</span>` : ''}${l.nota ? `<br><span class="meta">${esc(l.nota)}</span>` : ''}${l.alerta ? `<br><span class="inf-alerta">Atenção: ${esc(l.alerta)}</span>` : ''}</span>${marcar ? '</label>' : ''}</li>`;
const listaLivros = (itens, marcar) => `<ul class="inf-livros-lista">${itens.map((l) => itemLivro(l, marcar)).join('')}</ul>`;

const livrosHTML = () => `<section class="inf-livros" aria-labelledby="inf-livros-titulo">
    <h2 id="inf-livros-titulo">Biblioteca da família</h2>
    <p class="meta">Um catálogo comum, por idade, com a trilha de cada filho. Só título e autor: confira se a edição em português existe, se a tradução é boa e se serve à criança, e leia antes de oferecer. A idade é referência, não obrigação. O "Já lemos" é marcado por filho: na família, sincroniza entre os aparelhos; fora dela, fica só neste aparelho.</p>
    <label class="campo"><span>Trilha de</span><select id="inf-livros-filho"><option value="">Escolha o filho</option></select></label>
    <p class="meta" id="inf-livros-idade" aria-live="polite"></p>
    ${FAIXAS.map((f) => {
      const itens = livrosDaFaixa(f.id);
      const santos = SANTOS[f.id];
      return `<details class="inf-caixa inf-faixa" data-faixa="${esc(f.id)}"><summary><strong>${esc(f.titulo)}</strong> <span class="meta">(${itens.length} livros)</span></summary>
      <p class="meta">${esc(f.ajuda)}</p>
      ${Object.entries(SECOES).map(([s, nome]) => { const da = itens.filter((l) => l.secao === s); return da.length ? `<h3 class="inf-secao-${s}">${esc(nome)}</h3>${listaLivros(da, true)}` : ''; }).join('')}
      ${santos ? `<p class="inf-santos"><strong>Santos para procurar em livros ilustrados ou biografias:</strong> <span class="inf-secao-feminina">${esc(santos.feminina.join(', '))}</span>; <span class="inf-secao-masculina">${esc(santos.masculina.join(', '))}</span>.</p>` : ''}
    </details>`;
    }).join('')}
    <details class="inf-caixa inf-faixa"><summary><strong>Sagrada Escritura</strong></summary>
      <h3>Uma Bíblia infantil para a família</h3>
      <p><strong>${esc(BIBLIA.titulo)}</strong> — ${esc(BIBLIA.autor)}<br><span class="meta">Original: ${esc(BIBLIA.original)}. Edição brasileira: ${esc(BIBLIA.editora)}.</span></p>
      <ul>${BIBLIA.notas.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
      <h3>Histórias bíblicas por idade</h3>
      <p class="meta">Para os pais lerem e explicarem, sempre com a passagem na Bíblia. Não entram na contagem da biblioteca.</p>
      <table class="inf-tabela"><tr><th>Idade</th><th>Histórias</th></tr>${HISTORIAS_BIBLICAS.map(([i, h]) => `<tr><td>${esc(i)}</td><td>${esc(h)}</td></tr>`).join('')}</table>
      <p><strong>Personagens para aprofundar.</strong> <span class="inf-secao-feminina">${esc(PERSONAGENS_BIBLICOS.feminina.join(', '))}</span>. <span class="inf-secao-masculina">${esc(PERSONAGENS_BIBLICOS.masculina.join(', '))}</span>.</p>
    </details>
    <details class="inf-caixa inf-faixa"><summary><strong>Catequese e formação religiosa</strong> <span class="meta">(${CATEQUESE.length} livros)</span></summary>
      <p class="meta">Doutrina, sacramentos e orações. Não se confundem com a Bíblia infantil nem com a literatura.</p>${listaLivros(CATEQUESE, true)}</details>
    <details class="inf-caixa inf-faixa"><summary><strong>Para os pais</strong> <span class="meta">(${PAIS.length} livros)</span></summary>${listaLivros(PAIS, false)}</details>
    <details class="inf-caixa inf-faixa"><summary><strong>Fora da lista: não verificados</strong></summary>
      <p class="meta">Indicados na pesquisa, mas sem autor e título confirmados. Só entram depois de conferidos.</p><ul>${NAO_VERIFICADOS.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></details>
  </section>`;

export function infantil() {
  return `<section class="infantil">
    <header class="cab inf-hero">
      <div>
        <span class="inf-etq">Educação católica infantil</span>
        <h1>Academia para Verdade Jr.</h1>
        <p class="sub">A introdução à Academia da Verdade. Aulas curtas, cheias de histórias, para aprender em família: baixe os dois PDFs, imprima o caderno, faça com a criança e anexe aqui a foto da tarefa pronta.</p>
        <div class="inf-estrelas" id="inf-estrelas"></div>
      </div>
      ${cenaVitral()}
    </header>
    <div class="inf-conta" id="inf-conta" aria-live="polite"></div>
    <section class="inf-proximas" id="inf-proximas" aria-label="Próxima aula de cada filho"></section>
    <section id="inf-habilidades" aria-label="Acompanhamento por habilidade"></section>
    <details class="inf-caixa inf-recom" open>
      <summary><strong>Como usar a Academia para Verdade Jr.</strong></summary>
      <p>Funciona como o curso da Academia da Verdade: uma trilha de aulas em ordem, e cada aula tem material para ler, tarefa, acompanhamento e revisão. O progresso aparece em estrelas, e o "Continuar" mostra a próxima aula de cada filho.</p>
      <h3>A rotina de cada aula</h3>
      <ol>
        <li><strong>Leia o manual do responsável</strong> no leitor da própria aula (cerca de 10 minutos). Ele diz o que fazer, o que dizer e como ajudar sem dar a resposta.</li>
        <li><strong>Imprima o caderno da criança</strong> em A4, colorido. Reúna os materiais da lista do manual.</li>
        <li><strong>Faça a aula em uma ou duas sessões.</strong> Cada atividade dura de 3 a 5 minutos. Comece pelo Sinal da Cruz e pela oração "Vinde, Espírito Santo"; termine com o "Glória ao Pai".</li>
        <li><strong>Anexe a tarefa pronta</strong> (foto ou PDF) e escolha em "Quem fez esta aula?" o filho certo.</li>
        <li><strong>Marque "Aula feita"</strong> e anote o que ela disse, o que mais gostou e o que cansou. Essas observações guiam as próximas aulas.</li>
      </ol>
      <h3>O ritmo</h3>
      <ul>
        <li>Uma aula por dia é o ritmo previsto. Se faltar um dia, siga para a aula seguinte: não é preciso compensar, e a criança não deve sentir pressão.</li>
        <li>Se a criança estiver cansada ou irritada, pare. Aula curta e boa vale mais que aula longa e ruim.</li>
        <li>Para o bebê, o livrinho e o manual são feitos pelos pais, sem tarefa: marque "Aula feita" quando fizerem os momentos do dia.</li>
      </ul>
      <h3>A revisão da semana</h3>
      <p>Como nas revisões do curso adulto, uma vez por semana olhe as estrelas e as observações de cada filho: o que ainda está em desenvolvimento entra de novo na semana seguinte, como reforço. Leve as observações ao Claude, no projeto privado da Academia Infantil, para receber o relatório de evolução e as aulas da próxima semana.</p>
      <h3>O caminho</h3>
      <p>O ciclo vai dos 3 aos 15 anos, em etapas. Aos 16, o estudante segue para a Academia da Verdade, que já tem o mesmo desenho: leitura, tarefa, acompanhamento e revisão. As aulas daqui preparam essa entrada.</p>
    </details>
    ${AULAS_INFANTIL.length ? AULAS_INFANTIL.map(cartao).join('') : '<p class="vazio">Ainda não há aulas publicadas.</p>'}
    ${livrosHTML()}
    <section class="inf-etapas" aria-labelledby="inf-etapas-titulo"><h2 id="inf-etapas-titulo">Guia por etapa, dos 2 aos 15 anos</h2>
      <p class="meta">O foco de cada etapa e o que fazer em casa. As idades são referência: a criança pode estar adiantada numa área e precisar de reforço em outra, e a independência cresce aos poucos. A etapa de cada filho cadastrado fica aberta. Orientação da Academia.</p>
      ${ETAPAS_INFANTIS.map((e) => `<details class="inf-caixa inf-etapa" data-etapa="${e.id}"><summary><strong>${e.de} a ${e.ate} anos: ${esc(e.nome)}</strong> <span class="meta" data-etapa-filhos="${e.id}"></span></summary>
        <p><strong>Foco:</strong> ${esc(e.foco)}</p>
        <h3>Em casa</h3><ul>${e.casa.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
        <p><strong>Autonomia:</strong> ${esc(e.autonomia)}</p>
        ${e.academico ? `<h3>Caminho acadêmico</h3><ul>${e.academico.map((c) => `<li>${esc(c)}</li>`).join('')}</ul><p class="meta">Construir capacidade real vem antes de treinar para prova.</p>` : ''}
      </details>`).join('')}</section>
    <p class="inf-caixa">${link('assistir', 'Filmes, séries e animações')}: fichas para os pais (o que está na obra, a leitura da Academia, os cuidados e as perguntas) e o acompanhamento de episódios de cada filho.</p>
    <section class="inf-filhos" aria-labelledby="inf-filhos-titulo">
      <h2 id="inf-filhos-titulo">Filhos</h2>
      <p class="meta">Cada aula é para um filho. Cadastre aqui o nome e o nascimento de cada um e atualize quando quiser: assim as aulas mostram para quem são e as tarefas dizem quem fez. Esses dados ficam só neste aparelho ou na sua família, nunca no site público.</p>
      <div id="inf-filhos-lista"></div>
      <div class="inf-acoes"><button class="btn" type="button" id="inf-filho-novo">Adicionar outro filho</button></div>
    </section>
    <aside class="inf-caixa inf-caminho"><p>Aos 16 anos, o estudante segue para a Academia da Verdade. Tudo o que se aprende aqui prepara essa entrada: ler com fôlego, contar com compreensão e conhecer a fé. <a href="https://leonardoxal.github.io/#painel" target="_blank" rel="noopener noreferrer">Ir para a Academia da Verdade</a></p></aside>
    <details class="inf-backup">
      <summary>Backup das tarefas</summary>
      <p class="meta">Um arquivo só, com os filhos, as observações, as fotos, as partidas dos jogos e os registros de habilidade dentro. Guarde-o fora do aparelho. Serve para trocar de aparelho ou para o caso de o navegador limpar os dados.</p>
      <div class="inf-acoes">
        <button class="btn" type="button" id="inf-exportar">Exportar backup (.json)</button>
        <label class="btn">Restaurar backup<input type="file" id="inf-importar" accept="application/json,.json" class="sr"></label>
      </div>
    </details>
  </section>`;
}

export function aulaInfantil(ctx, id) {
  const a = aulaInfantilPorData(id);
  if (!a) return `<p class="aviso">Aula não encontrada. ${link('infantil', 'Voltar às aulas infantis')}</p>`;
  return `<section class="infantil">
    <p class="migalha">${link('infantil', '← Academia para Verdade Jr.')}</p>
    <header class="cab">
      <span class="inf-etq">Aula infantil</span>
      <h1>${esc(a.titulo)}</h1>
      <p><span class="chip">${dataBR(a.data)}</span>${a.para ? `<span class="chip inf-para" id="inf-para">Para: ${esc(a.para)}</span>` : ''}${a.perfil ? `<span class="chip">Versão ${esc(a.perfil)}</span>` : ''}${a.tema ? `<span class="chip">${esc(a.tema)}</span>` : ''}${a.virtude ? `<span class="chip inf-virtude">Virtude: ${esc(a.virtude)}</span>` : ''}</p>
    </header>
    <p class="sub inf-capitular">${esc(a.resumo)}</p>
    <div class="inf-conta" id="inf-conta" aria-live="polite"></div>
    <h2>Ler a aula</h2>
    <p class="meta">Leia aqui mesmo, sem baixar. Comece pelo manual do responsável; o ${caderno(a)} é para imprimir e fazer com a criança. O app só lembra em que página você parou.</p>
    <div class="leitor-barra">
      <button class="btn primario" type="button" id="inf-ler">Ler agora</button>
      <fieldset class="leitor-modos"><legend class="sr">Documento</legend>
        <label class="opcao"><input type="radio" name="inf-doc" value="responsavel" checked> <span>Manual do responsável</span></label>
        <label class="opcao"><input type="radio" name="inf-doc" value="aluna"> <span>${Caderno(a)}</span></label></fieldset>
      <fieldset class="leitor-modos"><legend class="sr">Modo de leitura</legend>
        <label class="opcao"><input type="radio" name="inf-modo" value="continuo" checked> <span>Contínuo</span></label>
        <label class="opcao"><input type="radio" name="inf-modo" value="folhear"> <span>Folhear</span></label></fieldset>
      <span class="meta" id="inf-leitor-pos" aria-live="polite"></span>
      <button class="btn" type="button" data-acao="tela-cheia">Tela cheia</button>
    </div>
    <div id="inf-leitor-tela" class="leitor-tela">
      <div class="leitor-tela-barra"><span id="inf-leitor-pos-cheia" class="meta"></span><button class="btn pequeno" type="button" data-acao="tela-cheia">Sair da tela cheia</button></div>
      <div id="inf-leitor-area" class="leitor-area" tabindex="-1"><p class="meta">Toque em "Ler agora" para abrir o documento escolhido.</p></div>
    </div>
    <h2>Baixar a aula</h2>
    <p>Imprima o ${caderno(a)} em A4, colorido. O manual do responsável traz o passo a passo; leia antes de começar.</p>
    <div class="inf-acoes">${botoesPdf(a)}</div>
    <h2>Quem fez esta aula?</h2>
    <label class="campo"><span>Filho</span><select id="inf-quem"></select></label>
    <p class="meta" id="inf-quem-ajuda">A marcação "aula feita", as observações e as tarefas anexadas ficam ligadas ao filho escolhido.</p>
    <h2>Anexar as tarefas já feitas</h2>
    <p id="inf-ajuda">Tire foto das páginas preenchidas ou escolha o PDF digitalizado.</p>
    <div id="inf-envio">
      <div class="inf-acoes">
        <label class="btn primario">${icone('clipe')} Escolher fotos ou PDFs<input type="file" id="inf-arquivos" accept="image/*,application/pdf" multiple class="sr"></label>
        <label class="btn">${icone('camera')} Tirar foto agora<input type="file" id="inf-camera" accept="image/*" capture="environment" class="sr"></label>
      </div>
      <div class="inf-soltar" id="inf-soltar">Ou arraste os arquivos para cá.</div>
    </div>
    <h2>Tarefas desta aula</h2>
    <p class="meta" id="inf-resumo"></p>
    <ul class="inf-anexos" id="inf-anexos"></ul>
    <h2>Acompanhamento</h2>
    <label class="inf-linha"><input type="checkbox" id="inf-feita"> Aula feita</label>
    <label class="campo largo"><span>Observações: o que ela disse, o que mais gostou, o que cansou</span><textarea id="inf-nota" rows="4"></textarea></label>
    <p class="inf-salvo" id="inf-salvo" aria-live="polite"></p>
    <h2>Analisar a tarefa com uma IA</h2>
    <p>Monte aqui um texto com os dados desta aula, as suas observações e o histórico do filho escolhido. Cole-o no ChatGPT, no Claude ou em outra IA, junto com as fotos da tarefa. O site não se conecta a nenhuma IA: ele só prepara o texto.</p>
    <details class="inf-caixa"><summary><strong>Antes de enviar: privacidade</strong></summary>
      <ul>
        <li>O texto chama a criança de "Aluno A" e leva só a idade em anos e meses. Não acrescente nome completo, endereço nem documentos.</li>
        <li>Releia as observações antes de colar: se escreveu o nome da criança nelas, troque por "Aluno A".</li>
        <li>Prefira fotos só da folha, sem o rosto da criança.</li>
        <li>O que você envia passa a seguir as regras do serviço escolhido.</li>
        <li>A resposta da IA é uma sugestão. Leia, confira com o que você viu e só então anote nas observações o que confirmar.</li>
      </ul></details>
    <fieldset class="inf-obs-ia"><legend>Como foi a atividade</legend>
      ${OBSERVACOES.map((o) => `<label class="inf-linha"><input type="checkbox" name="inf-obs" value="${esc(o)}"> ${esc(o)}</label>`).join('')}</fieldset>
    <div class="inf-acoes"><button class="btn primario" type="button" id="inf-ia-gerar">Montar o texto</button><button class="btn" type="button" id="inf-ia-copiar" hidden>Copiar o texto</button></div>
    <label class="campo largo" id="inf-ia-caixa" hidden><span>Texto para a IA (pode editar antes de copiar)</span><textarea id="inf-ia-texto" rows="14"></textarea></label>
    <h2>Registrar o que foi confirmado</h2>
    <p class="meta">Só depois de conferir. Registre uma habilidade por vez, para o filho escolhido em "Quem fez esta aula?". A situação de cada habilidade é sempre o registro mais recente dela; uma atividade isolada não prova domínio. As habilidades do mapa (as sugestões do campo) entram no acompanhamento da trilha; no mapa, "dominado" só vale depois de visto em dois dias diferentes ou numa nova verificação.</p>
    <form class="inf-caixa inf-registro" id="inf-registro">
      <div class="inf-filho-campos">
        <label class="campo"><span>Área</span><select name="area" required><option value="">Escolha</option>${opcoes(Object.fromEntries(AREAS.map((a) => [a, a])))}</select></label>
        <label class="campo"><span>Habilidade</span><input name="habilidade" maxlength="160" required list="inf-hab-lista" placeholder="Escolha do mapa ou escreva outra">
          <datalist id="inf-hab-lista">${HABILIDADES.map((h) => `<option value="${esc(h.nome)}">${esc(TRILHAS[h.trilha].nome)}</option>`).join('')}</datalist></label>
        <label class="campo"><span>Situação</span><select name="situacao" required><option value="">Escolha</option>${opcoes(SITUACOES)}</select></label>
        <label class="campo"><span>De onde vem</span><select name="origem" required>${opcoes(ORIGENS)}</select></label>
        <label class="campo"><span>Reavaliar em</span><input name="reavaliar" type="date"></label>
      </div>
      <label class="campo largo"><span>Dificuldade observada</span><textarea name="dificuldade" rows="2" maxlength="1000"></textarea></label>
      <label class="campo largo"><span>Intervenção: o que fazer agora</span><textarea name="intervencao" rows="2" maxlength="2000"></textarea></label>
      <div class="inf-acoes"><button class="btn primario" type="submit">Registrar</button></div>
    </form>
    <ul class="inf-registros" id="inf-registros"></ul>
  </section>`;
}

const opcoes = (mapa) => Object.entries(mapa).map(([v, r]) => `<option value="${esc(v)}">${esc(r)}</option>`).join('');
const registroLinha = (r) => `<strong>${esc(r.habilidade)}</strong> (${esc(r.area)}): ${esc(SITUACOES[r.situacao])}${r.reavaliar ? `, reavaliar em ${dataBR(r.reavaliar)}` : ''}<br><span class="meta">${esc(ORIGENS[r.origem])} · ${quando(r.criadoEm)}${r.dificuldade ? ` · Dificuldade: ${esc(r.dificuldade)}` : ''}${r.intervencao ? ` · Intervenção: ${esc(r.intervencao)}` : ''}</span>`;

// ---------------------------------------------------------------- comportamento

/** Atualiza de tempos em tempos enquanto a página estiver aberta e visível; para sozinho quando a página sai da tela. */
function sincronizar(root, fn) {
  const rodar = () => {
    if (!root.isConnected) { clearInterval(t); document.removeEventListener('visibilitychange', rodar); return; }
    if (!document.hidden && arm.modo() === 'nuvem') fn().catch(() => {});
  };
  const t = setInterval(rodar, SINCRONIA_MS);
  document.addEventListener('visibilitychange', rodar);
}

/** Caixa de conta no alto da aba: diz onde as tarefas ficam e deixa entrar na família. */
async function desenharConta(root, depois) {
  const caixa = root.querySelector('#inf-conta');
  if (!caixa) return;
  const { modo, usuario } = await arm.iniciar();
  const locais = await arm.contarLocais();
  if (!nuvemConfigurada()) {
    caixa.innerHTML = '<p class="inf-caixa">As tarefas ficam só neste aparelho.</p>';
  } else if (!FAMILIA_ATIVA) {
    caixa.innerHTML = '<p class="inf-caixa">As tarefas ficam só neste aparelho. A sincronização com a família será ativada quando tudo estiver pronto; até lá, use o backup para guardar uma cópia.</p>';
  } else if (modo === 'aparelho') {
    caixa.innerHTML = `<p class="inf-caixa">As tarefas ficam só neste aparelho. Para sincronizar com a família, ${link('entrar', 'entre na sua conta')} (a mesma da Academia da Verdade) e digite o código da família.</p>`;
  } else if (modo === 'pendente') {
    caixa.innerHTML = `<form class="inf-caixa" id="inf-codigo">
      <p>Conectado como <strong>${esc(usuario.email)}</strong>. Digite o código da família para ver e guardar as tarefas junto com os outros. Pergunte o código a quem criou a Academia Infantil.</p>
      <label class="campo"><span>Código da família</span><input id="inf-codigo-campo" autocomplete="off" autocapitalize="characters" spellcheck="false" required></label>
      <button class="btn primario" type="submit">Entrar na família</button>
      <p class="meta" id="inf-codigo-msg" aria-live="polite">Sem o código, as tarefas continuam só neste aparelho.</p></form>`;
    caixa.querySelector('#inf-codigo').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const msg = caixa.querySelector('#inf-codigo-msg');
      msg.textContent = 'Aguarde…';
      try {
        const entrou = await arm.entrarNaFamilia(caixa.querySelector('#inf-codigo-campo').value.trim().toUpperCase());
        if (!entrou) { msg.textContent = 'Código incorreto.'; return; }
        toast('Você entrou na família.');
        await depois();
      } catch (e) { msg.textContent = erroTexto(e); }
    });
  } else {
    caixa.innerHTML = `<div class="inf-caixa"><p>Sincronizado com a família, como <strong>${esc(usuario.email)}</strong>. Todos que entraram na família veem os mesmos filhos, aulas e tarefas, em qualquer aparelho.</p>
      <div class="inf-acoes">${locais > 0 ? `<button class="btn primario" type="button" id="inf-subir">Enviar os ${locais} item(ns) deste aparelho (tarefas e livros lidos)</button>` : ''}<button class="btn" type="button" id="inf-sair">Sair da família</button></div></div>`;
    caixa.querySelector('#inf-subir')?.addEventListener('click', async () => {
      try { toast(`${await arm.enviarAparelhoParaNuvem()} item(ns) enviado(s) para a nuvem.`); await depois(); } catch (e) { toast(erroTexto(e)); }
    });
    caixa.querySelector('#inf-sair').addEventListener('click', async () => {
      if (!confirm('Sair da família? Você deixa de ver as tarefas, mas elas continuam na nuvem para os outros.')) return;
      try { await arm.sairDaFamilia(); toast('Você saiu da família.'); await depois(); } catch (e) { toast(erroTexto(e)); }
    });
  }
}

// Reduz fotos grandes de celular antes de guardar; PDFs e imagens que já são pequenas ficam como estão.
async function reduzir(f) {
  if (!f.type.startsWith('image/') || f.type === 'image/gif') return f;
  try {
    const img = await createImageBitmap(f);
    const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height));
    if (escala === 1 && f.size < 1.5 * 1048576) { img.close?.(); return f; }
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * escala);
    c.height = Math.round(img.height * escala);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    img.close?.();
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85));
    return blob && blob.size < f.size ? blob : f;
  } catch { return f; }
}

const paraDataUrl = (blob) => new Promise((ok, erro) => {
  const r = new FileReader();
  r.onload = () => ok(r.result);
  r.onerror = () => erro(r.error);
  r.readAsDataURL(blob);
});

async function exportar() {
  const [filhos, anexos, registros] = await Promise.all([arm.listarFilhos(), arm.listarTodosAnexos(), arm.listarAulas()]);
  const itens = [];
  for (const a of anexos) itens.push({ id: a.id, aula: a.aula, filho: a.filho, nome: a.nome, tipo: a.tipo, tamanho: a.tamanho, data: a.data, dados: await paraDataUrl(await arm.arquivoDe(a)) });
  const partidas = []; const habilidades = []; const series = [];
  for (const quem of [...filhos.map((f) => f.id), 'familia']) {
    partidas.push(...await arm.listarPartidas(quem));
    habilidades.push(...await arm.listarRegistros(quem));
    series.push(...await arm.listarSeries(quem));
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify({ versao: 3, criadoEm: new Date().toISOString(), filhos, aulas: registros, anexos: itens, partidas, habilidades, series })], { type: 'application/json' }));
  Object.assign(document.createElement('a'), { href: url, download: `academia-infantil-backup-${new Date().toISOString().slice(0, 10)}.json` }).click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return anexos.length;
}

const PARTIDA_OK = (p) => /^[0-9a-f-]{36}$/i.test(String(p?.id)) && CODIGO_OK.test(String(p.filho)) && CODIGO_OK.test(String(p.jogo))
  && ['inicio', 'fim', 'nivelInicial', 'nivelFinal', 'nivelMax', 'acertos', 'erros'].every((k) => Number.isFinite(p[k]) && p[k] >= 0);

/** Aceita backups da versão 1 (sem filhos), da 2 e da 3 (com partidas dos jogos e registros de habilidade). */
async function importar(arquivo) {
  const dados = JSON.parse(await arquivo.text());
  if (![1, 2, 3].includes(dados?.versao) || !Array.isArray(dados.anexos) || !Array.isArray(dados.aulas)) throw new Error('Este arquivo não é um backup da Academia Infantil.');
  let n = 0;
  for (const f of dados.filhos ?? []) if (CODIGO_OK.test(String(f.id)) && f.nome) await arm.salvarFilho({ id: String(f.id), nome: String(f.nome).slice(0, 60), nascimento: f.nascimento || null, perfil: ['menina', 'menino'].includes(f.perfil) ? f.perfil : null, interesses: f.interesses });
  for (const r of dados.aulas) if (codigoValido(String(r.filho ?? ''))) await arm.salvarAula({ aula: String(r.aula), filho: String(r.filho ?? ''), feita: !!r.feita, nota: String(r.nota ?? '') });
  for (const a of dados.anexos) {
    if (typeof a.dados !== 'string' || !a.dados.startsWith('data:') || !tipoPermitido(String(a.tipo)) || !codigoValido(String(a.filho ?? ''))) continue;
    const blob = await (await fetch(a.dados)).blob();
    await arm.salvarAnexo({ id: String(a.id), aula: String(a.aula), filho: String(a.filho ?? ''), nome: String(a.nome), tipo: String(a.tipo), tamanho: blob.size, data: Number(a.data) || Date.now(), blob });
    n++;
  }
  for (const p of dados.partidas ?? []) if (PARTIDA_OK(p)) await arm.salvarPartida({ id: p.id, filho: p.filho, jogo: p.jogo, inicio: p.inicio, fim: p.fim, nivelInicial: Math.max(1, p.nivelInicial), nivelFinal: Math.max(1, p.nivelFinal), nivelMax: Math.max(1, p.nivelMax), acertos: p.acertos, erros: p.erros });
  for (const r of dados.habilidades ?? []) { try { await arm.salvarRegistro(r); } catch { /* registro inválido no arquivo: pula */ } }
  for (const s of dados.series ?? []) { try { await arm.salvarSerie(s); } catch { /* acompanhamento inválido no arquivo: pula */ } }
  return n;
}

// ---- cadastro de filhos (lista) ----

/** Um formulário por código de filho: os usados nas aulas, os já cadastrados e os adicionados agora. */
function filhosHTML(filhos, extras) {
  const porId = new Map(filhos.map((f) => [f.id, f]));
  const rotulos = new Map();
  for (const a of AULAS_INFANTIL) if (CODIGO_OK.test(a.filho ?? '') && !rotulos.has(a.filho)) rotulos.set(a.filho, a.para || a.filho);
  const codigos = [...new Set([...rotulos.keys(), ...filhos.map((f) => f.id), ...extras])].sort((x, y) => x.localeCompare(y, 'pt-BR', { numeric: true }));
  if (!codigos.length) return '<p class="vazio">Nenhum filho cadastrado. Use "Adicionar outro filho".</p>';
  return codigos.map((cod) => {
    const f = porId.get(cod);
    const titulo = f?.nome || rotulos.get(cod) || 'Novo filho';
    const anos = f ? idade(f.nascimento) : '';
    return `<form class="inf-filho inf-caixa" data-codigo="${esc(cod)}">
      <h3>${esc(titulo)} <span class="meta">(código ${esc(cod)}${rotulos.has(cod) ? ', usado nas aulas' : ''})</span></h3>
      <div class="inf-filho-campos">
        <label class="campo"><span>Nome</span><input name="nome" value="${esc(f?.nome ?? '')}" maxlength="60" required autocomplete="off"></label>
        <label class="campo"><span>Nascimento</span><input name="nascimento" type="date" value="${esc(f?.nascimento ?? '')}"></label>
        <label class="campo"><span>Perfil</span><select name="perfil"><option value="">Não indicar</option><option value="menina"${f?.perfil === 'menina' ? ' selected' : ''}>Menina</option><option value="menino"${f?.perfil === 'menino' ? ' selected' : ''}>Menino</option></select></label>
      </div>
      <fieldset class="inf-interesses"><legend>Interesses observados <span class="meta">(mudam as figuras dos jogos; gosto é porta de entrada, não limite)</span></legend>
        ${Object.entries(INTERESSES).map(([k, r]) => `<label class="opcao"><input type="checkbox" name="interesses" value="${k}"${f?.interesses?.includes(k) ? ' checked' : ''}> <span>${esc(r)}</span></label>`).join('')}</fieldset>
      <div class="inf-acoes"><button class="btn primario pequeno" type="submit">Salvar</button>${f ? '<button class="btn perigo pequeno" type="button" data-acao="remover">Remover</button>' : ''}</div>
      <p class="meta">${f ? (anos ? `Idade hoje: ${esc(anos)}.` : 'Informe o nascimento para ver a idade.') : 'Ainda não salvo.'}</p>
    </form>`;
  }).join('');
}

/** No cartão "Continuar" de cada filho: jogos sugeridos (pela idade e pelo histórico) e séries em andamento. */
async function completarProximas(root, filhos) {
  for (const alvo of root.querySelectorAll('[data-mais]')) {
    const f = filhos.find((x) => x.id === alvo.dataset.mais);
    if (!f) continue;
    let partidas = []; let series = []; let lidos = [];
    try { [partidas, series, lidos] = await Promise.all([arm.listarPartidas(f.id), arm.listarSeries(f.id), arm.listarLidos(f.id)]); } catch { /* sem histórico: só a aula */ }
    const jogos = recomendar(Object.values(JOGOS), partidas, anosCompletos(f.nascimento));
    const andamento = series.filter((s) => proximoEpisodio(s.dados));
    // próximo livro da faixa de idade que ainda não foi marcado como lido
    const livro = livrosDaFaixa(faixaPara(f.nascimento)).find((l) => !lidos.includes(l.id));
    alvo.innerHTML = `${livro ? `<p>Para ler juntos: <strong>${esc(livro.titulo)}</strong>, ${esc(livro.autor)} <span class="meta">(da Biblioteca da família, abaixo)</span>.</p>` : ''}${jogos.length ? `<p>Jogos sugeridos: ${jogos.map((j) => link(`jogo-${j.id}`, esc(JOGOS[j.id].titulo))).join(', ')}.</p>` : ''}${andamento.length ? `<p>Assistindo: ${andamento.map((s) => `${link(`acompanhar-${f.id}.${s.id}`, esc(s.titulo))} (episódio ${proximoEpisodio(s.dados)})`).join(', ')}.</p>` : ''}`;
  }
}

/** Uma habilidade do mapa, com o que fazer: verificar em casa, critério de domínio, o que tentar e o jogo ligado. */
const passoDoMapa = (l) => {
  const h = l.habilidade;
  const j = h.jogo && JOGOS[h.jogo];
  return `<li class="inf-passo"><strong>${esc(h.nome)}</strong> <span class="meta">(${esc(ESTADOS[l.estado])}${l.liberada ? '' : `; ainda falta: ${l.faltam.map((p) => esc(habilidadePorId(p).nome)).join('; ')}`})</span>
    <br><span class="meta">Objetivo:</span> ${esc(h.objetivo)}
    <br><span class="meta">Como verificar em 2 minutos:</span> ${esc(h.verificar)}
    <br><span class="meta">Há domínio quando:</span> ${esc(h.dominio)}
    ${l.estado === 'a-confirmar' ? '<br><span class="meta">Já foi vista uma vez. Repita a verificação em outro dia e registre de novo antes de avançar.</span>' : `<br><span class="meta">Se ainda não consegue:</span> ${esc(h.intervencao)}`}
    ${j ? `<br>${link(`jogo-${h.jogo}`, `Jogo que treina isto: ${j.titulo}`)}` : ''}</li>`;
};

/** Trilhas do mapa para um filho: o que fazer agora (no máximo 3) e o mapa inteiro com o estado de cada habilidade. */
function blocoDoMapa(f, regs) {
  return trilhasDaIdade(anosCompletos(f.nascimento)).map((id) => {
    const t = TRILHAS[id];
    const mapa = mapaDaTrilha(id, regs);
    const agora = proximasHabilidades(id, regs);
    const dominadas = mapa.filter((l) => l.estado === 'dominada').length;
    return `<details class="inf-caixa" open><summary><strong>${esc(t.nome)}: ${esc(f.nome)}</strong> <span class="meta">(${dominadas} de ${mapa.length} dominadas)</span></summary>
      <p class="meta">${esc(t.finalidade)} As idades são referência: o que libera uma habilidade é o domínio das anteriores. Observe na brincadeira, sem clima de prova, e registre na página da aula.</p>
      ${agora.length ? `<h3>O que fazer agora</h3><ul class="inf-passos">${agora.map(passoDoMapa).join('')}</ul>` : '<p>Trilha concluída. Mantenha as habilidades vivas na rotina.</p>'}
      <details><summary>Ver o mapa inteiro</summary><table class="inf-tabela"><tr><th>Habilidade</th><th>Idade de referência</th><th>Depende de</th><th>Situação</th></tr>
      ${mapa.map((l) => `<tr><td>${esc(l.habilidade.nome)}</td><td>${l.habilidade.de} a ${l.habilidade.ate} anos</td><td>${l.habilidade.prereq.map((p) => esc(habilidadePorId(p).nome)).join('; ') || '—'}</td><td>${esc(ESTADOS[l.estado])}</td></tr>`).join('')}</table>
      <p class="meta">Sequência adaptada de Gelman e Gallistel (1978) e de Clements e Sarama (2009). A forma usada aqui é proposta da Academia e ainda não foi revista por especialista.</p></details></details>`;
  }).join('');
}

/** Por filho: o mapa da trilha, os próximos passos (reavaliar ou reforçar) e a situação atual de cada habilidade registrada. */
async function desenharHabilidades(root, filhos) {
  const alvo = root.querySelector('#inf-habilidades');
  const hoje = new Date().toLocaleDateString('sv'); // AAAA-MM-DD no fuso do aparelho
  const blocos = [];
  for (const f of filhos) {
    let regs = [];
    try { regs = await arm.listarRegistros(f.id); } catch { continue; }
    blocos.push(blocoDoMapa(f, regs));
    if (!regs.length) continue;
    const passos = proximosPassos(regs, hoje);
    blocos.push(`<details class="inf-caixa"${passos.length ? ' open' : ''}><summary><strong>Habilidades: ${esc(f.nome)}</strong> <span class="meta">(${situacaoAtual(regs).length} habilidade(s) registrada(s))</span></summary>
      ${passos.length ? `<h3>Próximos passos</h3><ul>${passos.map((r) => `<li>${registroLinha(r)} <button class="btn pequeno" type="button" data-reforco="${esc(f.id)}|${esc(r.id)}">Texto para IA: reforço</button></li>`).join('')}</ul>
        <textarea class="as-ia" rows="10" hidden data-reforco-texto="${esc(f.id)}" aria-label="Texto de reforço para a IA"></textarea>` : '<p class="meta">Nada para reforçar nem reavaliar agora.</p>'}
      <table class="inf-tabela"><tr><th>Área</th><th>Habilidade</th><th>Situação</th><th>Reavaliar</th></tr>
      ${situacaoAtual(regs).map((r) => `<tr><td>${esc(r.area)}</td><td>${esc(r.habilidade)}</td><td>${esc(SITUACOES[r.situacao])}</td><td>${r.reavaliar ? dataBR(r.reavaliar) : '—'}</td></tr>`).join('')}</table></details>`);
  }
  if (!root.isConnected) return;
  alvo.innerHTML = blocos.join('');
  alvo.onclick = async (ev) => {
    const b = ev.target.closest('[data-reforco]');
    if (!b) return;
    const [filho, id] = b.dataset.reforco.split('|');
    const f = filhos.find((x) => x.id === filho);
    const r = (await arm.listarRegistros(filho)).find((x) => x.id === id);
    const area = alvo.querySelector(`[data-reforco-texto="${CSS.escape(filho)}"]`);
    if (!r || !area) return;
    area.value = textoReforcoIA({ ...r, situacao: SITUACOES[r.situacao], idade: idade(f?.nascimento), interesses: (f?.interesses ?? []).map((i) => INTERESSES[i]) });
    area.hidden = false; area.focus(); area.select();
  };
}

infantil.ligar = (root) => {
  const extras = [];
  const lista = root.querySelector('#inf-filhos-lista');

  const hidratar = async () => {
    await desenharConta(root, hidratar);
    let filhos = [];
    let registros = [];
    let anexos = [];
    try { [filhos, registros, anexos] = await Promise.all([arm.listarFilhos(), arm.listarAulas(), arm.listarTodosAnexos()]); } catch { /* sem armazenamento: a lista continua com os PDFs */ }
    if (!root.isConnected) return;
    const feitas = AULAS_INFANTIL.filter((a) => registros.some((r) => r.aula === a.data && r.feita)).length;
    root.querySelector('#inf-estrelas').innerHTML = `${estrelas(feitas, Math.max(AULAS_INFANTIL.length, 1))}<span class="meta">${feitas} de ${AULAS_INFANTIL.length} aulas feitas</span>`;
    root.querySelector('#inf-proximas').innerHTML = proximaPorFilho(AULAS_INFANTIL, registros).map((p) => `<div class="inf-caixa inf-proxima">
      <h2>Continuar: ${esc(nomeDe(filhos, p.filho, p.para))}</h2>
      <p class="meta">${p.feitas} de ${p.total} aulas feitas</p>
      ${p.proxima ? `<p>Próxima aula: <strong>${link(`infantil-${p.proxima.data}`, esc(p.proxima.titulo))}</strong> <span class="chip">${dataBR(p.proxima.data)}</span></p>` : '<p>Todas as aulas publicadas já foram feitas. A próxima semana de aulas chega em breve.</p>'}
      <div data-mais="${esc(p.filho)}"></div>
    </div>`).join('');
    await completarProximas(root, filhos);
    for (const a of AULAS_INFANTIL) {
      const para = root.querySelector(`[data-para="${a.data}"]`);
      if (para && a.filho) para.textContent = `Para: ${nomeDe(filhos, a.filho, a.para || a.filho)}`;
      const alvo = root.querySelector(`[data-chips="${a.data}"]`);
      if (!alvo) continue;
      const n = anexos.filter((x) => x.aula === a.data).length;
      const quem = registros.filter((r) => r.aula === a.data && r.feita).map((r) => (r.filho ? `Feita por ${nomeDe(filhos, r.filho, r.filho)}` : 'Feita'));
      alvo.replaceChildren(...quem.map((t) => Object.assign(document.createElement('span'), { className: 'chip ok', textContent: t })), ...(n ? [Object.assign(document.createElement('span'), { className: 'chip', textContent: `${n} tarefa(s) anexada(s)` })] : []));
    }
    lista.innerHTML = filhosHTML(filhos, extras);
    await desenharHabilidades(root, filhos);
    // guia por etapa: abre a etapa de cada filho e diz de quem é
    const porEtapa = {};
    for (const f of filhos) { const e = etapaDaIdade(anosCompletos(f.nascimento)); if (e) (porEtapa[e.id] ??= []).push(f.nome); }
    root.querySelectorAll('[data-etapa]').forEach((d) => { const nomes = porEtapa[d.dataset.etapa]; if (nomes && !d.dataset.aberta) { d.open = true; d.dataset.aberta = '1'; } d.querySelector('[data-etapa-filhos]').textContent = nomes ? `(${nomes.join(', ')})` : ''; });
    await carregarLivros();
  };
  let carregarLivros = async () => {};
  let livrosCarregados = false;
  hidratar();
  sincronizar(root, hidratar);

  // Biblioteca: a trilha de cada filho. "Já lemos" vai para a nuvem da família, ou fica neste aparelho fora dela.
  const seletorLivros = root.querySelector('#inf-livros-filho');
  // Sem filho escolhido (ou sem filho cadastrado), marca na lista da família.
  const quemLe = () => seletorLivros.value || 'familia';
  const caixasLivro = [...root.querySelectorAll('[data-livro]')];
  let filhosLivros = [];
  let lidos = new Set();
  // abrirFaixa só quando o filho muda: marcar um livro não pode fechar as faixas abertas.
  const mostrarTrilha = async (abrirFaixa = true) => {
    const f = filhosLivros.find((x) => x.id === seletorLivros.value);
    try { lidos = new Set(await arm.listarLidos(quemLe())); } catch { /* mantém o que já estava na tela */ }
    if (!root.isConnected) return;
    caixasLivro.forEach((c) => { c.checked = lidos.has(c.dataset.livro); });
    const faixa = f ? faixaPara(f.nascimento) : null;
    if (abrirFaixa) root.querySelectorAll('.inf-faixa[data-faixa]').forEach((d) => { d.open = d.dataset.faixa === faixa; d.classList.toggle('atual', d.dataset.faixa === faixa); });
    const titulo = FAIXAS.find((x) => x.id === faixa)?.titulo;
    root.querySelector('#inf-livros-idade').textContent = !f ? `Marcando na lista da família (${lidos.size} lido(s)). Escolha um filho para abrir a faixa da idade dele e marcar só para ele.`
      : titulo ? `${f.nome}: ${idade(f.nascimento)}. Faixa aberta: ${titulo}. ${lidos.size} livro(s) marcados como lidos.` : `${f.nome}: cadastre o nascimento em "Filhos" para abrir a faixa da idade.`;
  };
  caixasLivro.forEach((c) => c.addEventListener('change', async () => {
    try { await arm.marcarLido(quemLe(), c.dataset.livro, c.checked); } catch (e) { c.checked = !c.checked; toast(erroTexto(e)); return; }
    mostrarTrilha(false);
  }));
  seletorLivros.addEventListener('change', () => { lembrarQuem(seletorLivros.value); mostrarTrilha(); });
  // Depois de saber se está na família (hidratar), a lista de filhos e as marcações vêm do lugar certo.
  carregarLivros = () => arm.listarFilhos().then((fs) => {
    filhosLivros = fs;
    const atual = seletorLivros.value || lembrarQuem();
    seletorLivros.replaceChildren(Object.assign(document.createElement('option'), { value: '', textContent: fs.length ? 'Escolha o filho' : 'Cadastre os filhos abaixo' }), ...fs.map((f) => Object.assign(document.createElement('option'), { value: f.id, textContent: f.nome })));
    if (fs.some((f) => f.id === atual)) seletorLivros.value = atual;
    return mostrarTrilha(!livrosCarregados && (livrosCarregados = true));
  }).catch(() => mostrarTrilha(false));

  root.querySelector('#inf-filho-novo').addEventListener('click', async () => {
    const usados = [...root.querySelectorAll('.inf-filho')].map((f) => f.dataset.codigo);
    extras.push(proximoCodigo(usados));
    await hidratar();
    lista.querySelector('.inf-filho:last-of-type input')?.focus();
  });
  lista.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const form = ev.target.closest('form[data-codigo]');
    const dados = new FormData(form);
    const nome = String(dados.get('nome')).trim();
    if (!nome) return;
    try {
      await arm.salvarFilho({ id: form.dataset.codigo, nome, nascimento: String(dados.get('nascimento') || '') || null, perfil: String(dados.get('perfil') || '') || null, interesses: dados.getAll('interesses').map(String) });
      toast('Filho salvo.');
      await hidratar();
    } catch (e) { toast(erroTexto(e)); }
  });
  lista.addEventListener('click', async (ev) => {
    const botao = ev.target.closest('[data-acao="remover"]');
    if (!botao) return;
    const form = botao.closest('form[data-codigo]');
    if (!confirm(`Remover o cadastro de ${form.querySelector('[name="nome"]').value}? As aulas e as tarefas continuam, só deixam de mostrar o nome.`)) return;
    try { await arm.apagarFilho(form.dataset.codigo); toast('Cadastro removido.'); await hidratar(); } catch (e) { toast(erroTexto(e)); }
  });

  root.querySelector('#inf-exportar')?.addEventListener('click', async () => { try { toast(`Backup criado com ${await exportar()} arquivo(s).`); } catch (e) { toast(erroTexto(e)); } });
  const campo = root.querySelector('#inf-importar');
  campo?.addEventListener('change', async () => {
    try { toast(`${await importar(campo.files[0])} arquivo(s) restaurado(s).`); await hidratar(); } catch (e) { toast(erroTexto(e)); }
    campo.value = '';
  });
};

aulaInfantil.ligar = (root, ctx, id) => {
  const aula = aulaInfantilPorData(id);
  if (!aula) return;
  const lista = root.querySelector('#inf-anexos');
  const resumo = root.querySelector('#inf-resumo');
  const feita = root.querySelector('#inf-feita');
  const nota = root.querySelector('#inf-nota');
  const salvo = root.querySelector('#inf-salvo');
  const envio = root.querySelector('#inf-envio');
  const seletor = root.querySelector('#inf-quem');
  const urls = [];
  let registro = { aula: id, filho: '', feita: false, nota: '' };
  let filhos = [];
  let quem = '';
  let chaveAtual = null;
  let semArmazenamento = false;
  let pendente = null;

  const liberar = () => { while (urls.length) URL.revokeObjectURL(urls.pop()); };
  const naNuvem = () => arm.modo() === 'nuvem';

  const itemAnexo = (a) => {
    const url = URL.createObjectURL(a.blob);
    urls.push(url);
    const li = document.createElement('li');
    li.className = 'inf-anexo';
    const mini = document.createElement('div');
    mini.className = 'inf-miniatura';
    if (a.tipo.startsWith('image/')) { const img = new Image(); img.src = url; img.alt = `Tarefa: ${a.nome}`; img.loading = 'lazy'; mini.append(img); } else mini.textContent = 'PDF';
    const info = document.createElement('div');
    info.className = 'inf-info';
    const nome = document.createElement('strong');
    nome.textContent = a.nome;
    info.append(nome, document.createElement('br'), `${tamanho(a.tamanho)} · ${quando(a.data)}`);
    if (a.filho) info.append(document.createElement('br'), Object.assign(document.createElement('span'), { className: 'chip', textContent: `Feito por ${nomeDe(filhos, a.filho, a.filho)}` }));
    const acoes = document.createElement('div');
    acoes.className = 'inf-acoes';
    const abrirLink = Object.assign(document.createElement('a'), { className: 'btn pequeno', href: url, target: '_blank', rel: 'noopener', textContent: 'Abrir' });
    const baixarLink = Object.assign(document.createElement('a'), { className: 'btn pequeno', href: url, download: a.nome, textContent: 'Baixar' });
    const excluir = Object.assign(document.createElement('button'), { className: 'btn pequeno perigo', type: 'button', textContent: 'Excluir' });
    excluir.addEventListener('click', async () => {
      if (!confirm(`Excluir “${a.nome}”? ${naNuvem() ? 'Ele some para toda a família.' : ''}`)) return;
      try { await arm.apagarAnexo(a.id); chaveAtual = null; await atualizarLista(); toast('Arquivo excluído.'); } catch (e) { toast(erroTexto(e)); }
    });
    acoes.append(abrirLink, baixarLink, excluir);
    li.append(mini, info, acoes);
    return li;
  };

  const atualizarLista = async () => {
    const itens = semArmazenamento ? [] : (await arm.listarAnexos(id)).sort((x, y) => y.data - x.data);
    if (!root.isConnected) return;
    const chave = `${itens.map((i) => `${i.id}:${i.filho}`).join()}|${filhos.map((f) => `${f.id}:${f.nome}`).join()}`;
    if (chave === chaveAtual) return; // nada novo: evita piscar a tela a cada sincronização
    chaveAtual = chave;
    liberar();
    resumo.textContent = itens.length ? `${itens.length} arquivo(s) guardado(s)${naNuvem() ? ' na nuvem da família' : ' neste aparelho'}.` : 'Ainda não tem nenhuma tarefa. Que tal fotografar a primeira?';
    lista.replaceChildren(...itens.map(itemAnexo));
  };

  const receber = async (arquivos) => {
    let guardados = 0;
    for (const f of arquivos) {
      if (!tipoPermitido(f.type)) { toast(`“${f.name}” não é foto (JPG, PNG, WebP, GIF, HEIC) nem PDF.`); continue; }
      if (f.size > MAX_BYTES) { toast(`“${f.name}” passa de 25 MB.`); continue; }
      try {
        const blob = await reduzir(f);
        const nome = blob === f ? f.name : `${f.name.replace(/\.\w+$/, '')}.jpg`;
        await arm.salvarAnexo({ id: novoId(), aula: id, filho: quem, nome: nome || 'tarefa', tipo: blob.type || f.type, tamanho: blob.size, data: Date.now(), blob });
        guardados++;
      } catch (e) { toast(erroTexto(e)); }
    }
    if (guardados) toast(`${guardados} arquivo(s) guardado(s)${naNuvem() ? ' na nuvem da família' : ' neste aparelho'}.`);
    chaveAtual = null;
    await atualizarLista();
  };

  for (const sel of ['#inf-arquivos', '#inf-camera']) {
    const c = root.querySelector(sel);
    c.addEventListener('change', async () => { await receber([...c.files]); c.value = ''; });
  }
  const soltar = root.querySelector('#inf-soltar');
  soltar.addEventListener('dragover', (e) => { e.preventDefault(); soltar.classList.add('sobre'); });
  soltar.addEventListener('dragleave', () => soltar.classList.remove('sobre'));
  soltar.addEventListener('drop', async (e) => { e.preventDefault(); soltar.classList.remove('sobre'); await receber([...e.dataTransfer.files]); });

  feita.addEventListener('change', async () => { registro.feita = feita.checked; try { await arm.salvarAula(registro); } catch (e) { toast(erroTexto(e)); } });
  nota.addEventListener('input', () => {
    clearTimeout(pendente);
    pendente = setTimeout(salvarNota, 600);
  });
  async function salvarNota() {
    pendente = null;
    registro.nota = nota.value;
    try { await arm.salvarAula(registro); salvo.textContent = 'Salvo.'; } catch (e) { toast(erroTexto(e)); }
  }

  /** Mostra a marcação e as observações do filho escolhido. */
  const carregarFilho = async () => {
    registro = await arm.lerAula(id, quem);
    nota.value = registro.nota; feita.checked = registro.feita;
  };

  const preencherSeletor = () => {
    seletor.replaceChildren(
      Object.assign(document.createElement('option'), { value: '', textContent: filhos.length ? 'Não indicar' : 'Nenhum filho cadastrado' }),
      ...filhos.map((f) => Object.assign(document.createElement('option'), { value: f.id, textContent: f.nome })),
    );
    const lembrado = lembrarQuem();
    const candidatos = [quem, lembrado, aula.filho].filter((c) => c && filhos.some((f) => f.id === c));
    quem = candidatos[0] ?? '';
    seletor.value = quem;
    const para = root.querySelector('#inf-para');
    if (para && aula.filho) para.textContent = `Para: ${nomeDe(filhos, aula.filho, aula.para || aula.filho)}`;
  };
  seletor.addEventListener('change', async () => {
    if (pendente) { clearTimeout(pendente); await salvarNota(); }
    quem = seletor.value;
    lembrarQuem(quem);
    try { await carregarFilho(); } catch (e) { toast(erroTexto(e)); }
  });

  // Traz o que outra pessoa da família anexou, escreveu ou cadastrou, sem pisar no que está sendo digitado.
  const atualizar = async () => {
    filhos = await arm.listarFilhos();
    if (document.activeElement !== seletor) preencherSeletor();
    await atualizarLista();
    if (document.activeElement === nota || pendente) return;
    await carregarFilho();
  };

  const iniciar = async () => {
    await desenharConta(root, iniciar);
    root.querySelector('#inf-ajuda').textContent = `Tire foto das páginas preenchidas ou escolha o PDF digitalizado. ${naNuvem() ? 'Toda a família vê os arquivos.' : 'Os arquivos ficam só neste aparelho.'}`;
    try {
      filhos = await arm.listarFilhos();
      preencherSeletor();
      await carregarFilho();
      semArmazenamento = false;
    } catch (e) { semArmazenamento = true; envio.hidden = true; feita.disabled = true; nota.disabled = true; seletor.disabled = true; toast(erroTexto(e)); }
    chaveAtual = null;
    await atualizarLista().catch((e) => toast(erroTexto(e)));
  };
  const iniciando = iniciar();
  sincronizar(root, atualizar);

  // Leitor de PDF: abre o manual ou o caderno desta aula, sem baixar.
  const leitor = criarLeitor(root, toast);
  const documento = () => root.querySelector('input[name="inf-doc"]:checked').value;
  const lerAgora = () => leitor.abrir(aula.arquivos[documento()], `${id}-${documento()}`);
  root.querySelector('#inf-ler').addEventListener('click', lerAgora);
  root.querySelectorAll('input[name="inf-doc"]').forEach((r) => r.addEventListener('change', () => { if (root.querySelector('#inf-leitor-area .pg, #inf-leitor-area .folhas')) lerAgora(); }));
  root.querySelectorAll('input[name="inf-modo"]').forEach((r) => { r.checked = r.value === leitor.modo(); r.addEventListener('change', () => leitor.trocarModo(r.value)); });

  // Texto para a IA externa: dados públicos da aula + observações + histórico do filho escolhido, sem o nome.
  const textoIA = root.querySelector('#inf-ia-texto');
  const copiar = root.querySelector('#inf-ia-copiar');
  root.querySelector('#inf-ia-gerar').addEventListener('click', async () => {
    const f = filhos.find((x) => x.id === quem);
    let anteriores = []; let partidas = []; let habilidades = [];
    try {
      anteriores = (await arm.listarAulas())
        .filter((r) => r.feita && r.aula !== id && (!quem || r.filho === quem))
        .map((r) => ({ ...aulaInfantilPorData(r.aula), nota: r.nota })).filter((a) => a.titulo)
        .sort((x, y) => y.data.localeCompare(x.data)).slice(0, 10);
      partidas = await arm.listarPartidas(quem || 'familia');
      if (quem) habilidades = situacaoAtual(await arm.listarRegistros(quem)).map((r) => ({ ...r, situacao: SITUACOES[r.situacao] }));
    } catch { /* sem histórico: o texto sai só com esta aula */ }
    const jogos = Object.values(JOGOS).map((j) => ({ ...resumoJogo(partidas, j.id), titulo: j.titulo, habilidades: j.habilidades })).filter((j) => j.partidas);
    textoIA.value = textoParaIA({
      aula, idade: f ? idade(f.nascimento) : '', interesses: (f?.interesses ?? []).map((i) => INTERESSES[i]),
      marcadas: [...root.querySelectorAll('input[name="inf-obs"]:checked')].map((c) => c.value), nota: nota.value, anteriores, jogos, habilidades,
    });
    root.querySelector('#inf-ia-caixa').hidden = false;
    copiar.hidden = false;
    textoIA.focus();
  });
  // Registro confirmado: um por habilidade, do filho escolhido nesta aula.
  const formReg = root.querySelector('#inf-registro');
  const listaReg = root.querySelector('#inf-registros');
  const filhoReg = () => seletor.value; // lê o seletor: o "quem" só muda depois de salvar a nota pendente
  const mostrarRegistros = async () => {
    const quem = filhoReg();
    if (!quem) { listaReg.innerHTML = '<li class="meta">Escolha o filho em "Quem fez esta aula?" para ver e fazer registros.</li>'; return; }
    let regs = [];
    try { regs = (await arm.listarRegistros(quem)).filter((r) => r.aula === id); } catch (e) { toast(erroTexto(e)); }
    listaReg.innerHTML = regs.length ? regs.map((r) => `<li>${registroLinha(r)} <button class="btn pequeno perigo" type="button" data-apagar="${esc(r.id)}">Apagar</button></li>`).join('') : '<li class="meta">Nenhum registro desta aula para este filho.</li>';
  };
  formReg.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const d = Object.fromEntries(new FormData(formReg));
    try {
      await arm.salvarRegistro({ ...d, id: novoId(), filho: filhoReg(), aula: id, criadoEm: Date.now() });
      formReg.reset();
      toast('Registro guardado.');
      await mostrarRegistros();
    } catch (e) { toast(erroTexto(e)); }
  });
  listaReg.addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-apagar]');
    if (!b || !confirm('Apagar este registro? Não dá para desfazer.')) return;
    try { await arm.apagarRegistro(filhoReg(), b.dataset.apagar); await mostrarRegistros(); } catch (e) { toast(erroTexto(e)); }
  });
  formReg.elements.habilidade.addEventListener('change', (ev) => {
    const h = habilidadeDoTexto(ev.target.value);
    if (h) formReg.elements.area.value = TRILHAS[h.trilha].area; // habilidade do mapa: a área é a da trilha
  });
  seletor.addEventListener('change', mostrarRegistros);
  iniciando.then(mostrarRegistros);

  copiar.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(textoIA.value); toast('Texto copiado. Cole na IA junto com as fotos.'); } catch { textoIA.select(); toast('Selecione o texto e copie com Ctrl+C.'); }
  });
};
