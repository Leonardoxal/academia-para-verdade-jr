// Filmes, séries e animações da formação infantil e juvenil (#assistir, #assistir-<obra>, #acompanhar-<filho>.<id>).
// Fichas pedagógicas (catálogo público, sem dado de criança) e o acompanhamento de episódios por filho, guardado no
// aparelho ou na nuvem da família. A tela de acompanhamento mostra só números e os nomes de arco que a família
// escreveu: nada de sinopse, para não dar spoiler.
import { esc, link, toast } from '../ui.js';
import { criarArmazenamento } from '../infantil/armazenamento.js';
import { clienteNuvem, usuarioNuvem } from '../nuvem.js';
import { FAMILIA_ATIVA } from '../infantil/config.js';
import { MIDIA_INFANTIL, midiaPorId, TIPOS_MIDIA, ASPECTOS, NIVEL_ASPECTO, PERCURSOS } from '../infantil/midia.js';
import { TIPOS_EPISODIO, validarSerie, ondeEsta, proximo, alternar, marcarAte, progresso, arcosParaAnalisar, lerEstrutura, escreverEstrutura, tipoDoEpisodio } from '../infantil/series.js';
import { anosCompletos } from '../infantil/historico.js';
import { idade } from '../infantil/idade.js';
import { textoArcoIA } from '../infantil/prompt.js';

const arm = criarArmazenamento({ obterCliente: clienteNuvem, obterUsuario: usuarioNuvem, familiaAtiva: FAMILIA_ATIVA });
const lembrarQuem = (v) => { try { if (v !== undefined) localStorage.setItem('aci-quem', v); return localStorage.getItem('aci-quem') || ''; } catch { return ''; } };
const erroTexto = (e) => e?.message || 'Não foi possível concluir.';
const novoId = () => crypto.randomUUID();

const fichaCurta = (m) => `<li class="inf-caixa as-obra" data-idade="${m.idade}">
  <h3>${link(`assistir-${m.id}`, esc(m.titulo))}</h3>
  <p><span class="chip">${esc(TIPOS_MIDIA[m.tipo])}</span><span class="chip">${esc(m.ano)}</span><span class="chip">A partir de ${m.idade} anos (Academia)</span><span class="as-aviso-idade"></span></p>
  <p class="meta">${esc(m.temas.join(', '))}.${Object.entries(m.adequacao).filter(([, n]) => n >= 2).map(([k, n]) => ` ${ASPECTOS[k]}: ${NIVEL_ASPECTO[n]}.`).join('')}</p></li>`;

export function assistir() {
  return `<section class="infantil assistir">
    <p class="migalha">${link('infantil', '← Academia para Verdade Jr.')}</p>
    <header class="cab"><h1>Filmes, séries, animações e quadrinhos</h1>
      <p class="sub">Obras escolhidas pelo que podem formar, com ficha para os pais: o que está na obra, a leitura da Academia, os cuidados e as perguntas para conversar. A idade indicada é avaliação da Academia; a classificação oficial deve ser conferida na ClassInd.</p></header>
    <label class="campo"><span>Para quem</span><select id="as-quem"><option value="">Escolha o filho</option></select></label>
    <p class="meta" id="as-idade" aria-live="polite"></p>
    <section aria-labelledby="as-acomp-titulo"><h2 id="as-acomp-titulo">Acompanhando</h2><div id="as-acompanhando"><p class="meta">Escolha o filho para ver o que ele está assistindo.</p></div>
      <form class="inf-acoes" id="as-outra"><label class="campo"><span>Acompanhar outra série ou anime</span><input name="titulo" maxlength="120" required placeholder="Título"></label><button class="btn" type="submit">Acompanhar</button></form></section>
    <h2>Obras com ficha</h2>
    <ul class="as-lista">${[...MIDIA_INFANTIL].sort((a, b) => a.idade - b.idade).map(fichaCurta).join('')}</ul>
    <p class="meta">Aqui ficam filmes, séries, animações, documentários e quadrinhos; livros e contos ficam na Biblioteca da família, na aba ${link('infantil', 'Infantil')}. Videogames não entram aqui; os jogos educativos têm a aba ${link('jogos', 'Jogos')}.</p>
  </section>`;
}

/** Cria o acompanhamento e abre a tela dele. */
async function acompanhar(filho, titulo, obra = null) {
  if (!filho) { toast('Escolha o filho primeiro.'); return; }
  const s = { id: novoId(), filho, obra, titulo, dados: {} };
  try { await arm.salvarSerie(s); location.hash = `#acompanhar-${filho}.${s.id}`; } catch (e) { toast(erroTexto(e)); }
}

/** Preenche o seletor de filho (lembrado entre as telas) e devolve os filhos cadastrados. */
async function seletorFilho(sel) {
  let filhos = [];
  try { await arm.iniciar(); filhos = await arm.listarFilhos(); } catch { /* sem cadastro */ }
  sel.append(...filhos.map((f) => Object.assign(document.createElement('option'), { value: f.id, textContent: f.nome })));
  if (filhos.some((f) => f.id === lembrarQuem())) sel.value = lembrarQuem();
  return filhos;
}

assistir.ligar = async (root) => {
  const sel = root.querySelector('#as-quem');
  const filhos = await seletorFilho(sel);
  const mostrar = async () => {
    const f = filhos.find((x) => x.id === sel.value);
    const anos = f ? anosCompletos(f.nascimento) : null;
    root.querySelector('#as-idade').textContent = f ? (anos === null ? `${f.nome}: cadastre o nascimento para comparar com a idade indicada.` : `${f.nome}: ${idade(f.nascimento)}.`) : '';
    root.querySelectorAll('.as-obra').forEach((li) => { li.querySelector('.as-aviso-idade').innerHTML = anos !== null && Number(li.dataset.idade) > anos ? '<span class="chip alerta">Acima da idade indicada</span>' : ''; });
    const caixa = root.querySelector('#as-acompanhando');
    if (!f) { caixa.innerHTML = '<p class="meta">Escolha o filho para ver o que ele está assistindo.</p>'; return; }
    let series = [];
    try { series = await arm.listarSeries(f.id); } catch (e) { toast(erroTexto(e)); }
    caixa.innerHTML = series.length ? `<ul>${series.map((s) => { const p = progresso(s.dados); const n = proximo(s.dados);
      return `<li>${link(`acompanhar-${f.id}.${s.id}`, esc(s.titulo))} <span class="meta">${p.total ? `${p.vistos} de ${p.total} episódios${n ? `, próximo: ${n}` : ', terminou'}` : 'estrutura ainda não informada'}</span></li>`; }).join('')}</ul>` : '<p class="meta">Nada sendo acompanhado. Abra uma ficha e toque em "Acompanhar os episódios", ou escreva o título abaixo.</p>';
  };
  sel.addEventListener('change', () => { lembrarQuem(sel.value); mostrar(); });
  root.querySelector('#as-outra').addEventListener('submit', (ev) => { ev.preventDefault(); acompanhar(sel.value, new FormData(ev.target).get('titulo')); });
  mostrar();
};

// ---------------------------------------------------------------- ficha da obra

export function obraInfantil(_ctx, id) {
  const m = midiaPorId[id];
  if (!m) return `<p class="aviso">Obra não encontrada. ${link('assistir', 'Voltar')}</p>`;
  return `<section class="infantil assistir">
    <p class="migalha">${link('assistir', '← Filmes, séries e animações')}</p>
    <header class="cab"><h1>${esc(m.titulo)}</h1>${m.original ? `<p class="meta"><em>${esc(m.original)}</em></p>` : ''}
      <p><span class="chip">${esc(TIPOS_MIDIA[m.tipo])}</span><span class="chip">${esc(m.ano)}</span><span class="chip">${m.publico === 'juvenil' ? 'Juvenil' : 'Infantil'}</span></p></header>
    <p class="aviso">Esta ficha é para os pais e conta a história, inclusive o final quando importa para a conversa.</p>
    <dl class="ficha">
      <dt>Criação</dt><dd>${esc(m.criador)}</dd>
      <dt>Idade indicada pela Academia</dt><dd>A partir de ${m.idade} anos. É avaliação pedagógica própria, feita pelos aspectos abaixo.</dd>
      <dt>Classificação oficial</dt><dd>${esc(m.oficial)}</dd>
    </dl>
    <h2>Na obra</h2><p>${esc(m.obra)}</p>
    ${m.personagens.length ? `<h2>Personagens</h2><ul>${m.personagens.map((p) => `<li><strong>${esc(p.nome)}</strong> <span class="chip">${esc(PERCURSOS[p.percurso])}</span><br>${esc(p.texto)}</li>`).join('')}</ul>
    <p class="meta">Compreender um personagem não significa aprovar o que ele faz.</p>` : ''}
    <h2>Leitura da Academia</h2><p class="meta">Interpretação pedagógica da Academia, não doutrina da Igreja nem declaração dos autores.</p><p>${esc(m.academia)}</p>
    <h2>Adequação</h2>
    <table class="inf-tabela"><tr><th>Aspecto</th><th>Nível</th></tr>${Object.entries(ASPECTOS).map(([k, r]) => `<tr><td>${esc(r)}</td><td>${NIVEL_ASPECTO[m.adequacao[k]]}</td></tr>`).join('')}</table>
    <p><strong>Cuidados:</strong> ${esc(m.cuidados)}</p>
    <h2>Para conversar depois</h2><ul>${m.perguntas.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>
    <p class="meta">Temas: ${esc(m.temas.join(', '))}. Liga-se a: ${esc(m.disciplinas.join(', '))}.</p>
    ${m.acompanhar ? `<div class="inf-acoes"><label class="campo"><span>Acompanhar com</span><select id="as-quem"><option value="">Escolha o filho</option></select></label><button class="btn primario" type="button" id="as-acompanhar">Acompanhar os episódios</button></div>` : ''}
    <p class="meta">${esc(m.fontes)}${m.conferido ? ` ${esc(m.conferido)}` : ''}</p>
  </section>`;
}

obraInfantil.ligar = async (root, _ctx, id) => {
  const sel = root.querySelector('#as-quem');
  if (!sel) return;
  await seletorFilho(sel);
  sel.addEventListener('change', () => lembrarQuem(sel.value));
  root.querySelector('#as-acompanhar').addEventListener('click', () => acompanhar(sel.value, midiaPorId[id].titulo, id));
};

// ---------------------------------------------------------------- acompanhamento de uma série

export function acompanhamento() {
  return `<section class="infantil assistir">
    <p class="migalha">${link('assistir', '← Filmes, séries e animações')}</p>
    <div id="as-serie"><p class="meta">Carregando…</p></div></section>`;
}

const gradeHTML = (d) => {
  const vistos = new Set(d.assistidos); const prox = proximo(d);
  let n = 0;
  return d.temporadas.map((t) => `<h3>${esc(t.nome)}</h3><div class="as-grade">${Array.from({ length: t.episodios }, (_, i) => { n++;
    const tipo = tipoDoEpisodio(d, n);
    return `<button type="button" class="as-ep${vistos.has(n) ? ' visto' : ''}${n === prox ? ' prox' : ''}${tipo && tipo !== 'principal' ? ' outro' : ''}" data-ep="${n}" aria-pressed="${vistos.has(n)}" aria-label="Episódio ${i + 1}${tipo ? `, ${TIPOS_EPISODIO[tipo]}` : ''}${d.favoritos.includes(n) ? ', favorito' : ''}">${i + 1}${d.favoritos.includes(n) ? '★' : ''}</button>`; }).join('')}</div>`).join('');
};

acompanhamento.ligar = async (root, _ctx, chave) => {
  const [filho, id] = String(chave).split('.');
  const caixa = root.querySelector('#as-serie');
  let s; let filhos = [];
  try { await arm.iniciar(); filhos = await arm.listarFilhos(); s = (await arm.listarSeries(filho)).find((x) => x.id === id); } catch (e) { caixa.innerHTML = `<p class="aviso">${esc(erroTexto(e))}</p>`; return; }
  if (!s) { caixa.innerHTML = `<p class="aviso">Acompanhamento não encontrado neste aparelho ou na família. ${link('assistir', 'Voltar')}</p>`; return; }
  const f = filhos.find((x) => x.id === filho);
  const ficha = s.obra ? midiaPorId[s.obra] : null;

  /** Valida, grava e redesenha; se a gravação falhar, volta ao que estava. Erro de validação sobe para quem chamou. */
  const salvar = async (dados) => {
    const antes = s;
    s = validarSerie({ ...s, dados });
    try { await arm.salvarSerie(s); } catch (e) { s = antes; toast(erroTexto(e)); }
    desenhar();
  };

  function desenhar() {
    const d = s.dados; const p = progresso(d); const prox = proximo(d); const onde = prox && ondeEsta(d, prox);
    const est = escreverEstrutura(d);
    caixa.innerHTML = `<header class="cab"><h1>${esc(s.titulo)}</h1><p class="meta">Acompanhamento de ${esc(f?.nome || filho)}${ficha ? ` · ${link(`assistir-${ficha.id}`, 'ver a ficha')}` : ''}</p></header>
      ${p.total ? `<p><strong>${p.vistos} de ${p.total} episódios</strong> (${p.pct}%). ${prox ? `Continuar: episódio ${onde.numero} de ${esc(onde.nome)} (nº ${prox} na sequência).` : 'Todos os episódios marcados.'}</p>
        ${prox ? `<div class="inf-acoes"><button class="btn primario" type="button" data-ep="${prox}">Assisti este episódio</button></div>` : ''}
        <form class="inf-acoes" id="as-ate"><label class="campo"><span>Assistiu vários? Marcar até o episódio nº</span><input name="n" type="number" min="1" max="${p.total}" required></label><button class="btn" type="submit">Marcar</button></form>
        ${arcosParaAnalisar(d).map((a) => `<div class="inf-caixa"><h2>Arco concluído: ${esc(a.nome)}</h2>
          <p>Hora de conversar sobre o arco inteiro, sem pressa.${ficha ? ' Use as perguntas da ficha e a leitura da Academia.' : ''} Se quiser, monte um texto para uma IA ajudar a preparar a conversa.</p>
          <div class="inf-acoes"><button class="btn" type="button" data-acao="ia-arco" data-arco="${esc(a.nome)}">Montar o texto</button><button class="btn" type="button" data-acao="conversado" data-arco="${esc(a.nome)}">Já conversamos</button></div></div>`).join('')}
        <textarea id="as-ia" class="as-ia" rows="10" hidden aria-label="Texto para a IA"></textarea>
        <p class="meta">Toque num número para marcar ou desmarcar. Episódios fora da história principal aparecem com borda tracejada, conforme os arcos que vocês informaram.</p>
        ${gradeHTML(d)}
        <form class="inf-acoes" id="as-fav"><label class="campo"><span>Episódio favorito nº</span><input name="n" type="number" min="1" max="${p.total}" required></label><button class="btn" type="submit">Marcar ou desmarcar favorito</button></form>`
        : '<p>Informe abaixo as temporadas e o número de episódios, conferidos na plataforma oficial.</p>'}
      <details class="inf-caixa"${p.total ? '' : ' open'}><summary><strong>Temporadas e arcos</strong></summary>
        <form id="as-estrutura">
          <p class="meta">Confira na fonte oficial (plataforma, distribuidora) e escreva aqui. O site não inventa episódios. Para saber o que é filler, use uma lista confiável e marque o tipo no arco. Se diminuir o número de episódios, as marcações além do novo total são descartadas.</p>
          <label class="campo largo"><span>Temporadas: uma por linha, "Nome | episódios"</span><textarea name="temporadas" rows="4" placeholder="Temporada 1 | 26">${esc(est.temporadas)}</textarea></label>
          <label class="campo largo"><span>Arcos (opcional): "Nome | início-fim | tipo", com tipo ${Object.keys(TIPOS_EPISODIO).join(', ')}</span><textarea name="arcos" rows="4" placeholder="Nome do arco | 1-19 | principal">${esc(est.arcos)}</textarea></label>
          <button class="btn primario" type="submit">Salvar estrutura</button></form></details>
      <label class="campo largo"><span>Observações da família (o que chamou atenção, o que conversar)</span><textarea id="as-obs" rows="3" maxlength="5000">${esc(d.observacoes)}</textarea></label>
      <div class="inf-acoes"><button class="btn perigo pequeno" type="button" data-acao="apagar">Parar de acompanhar</button></div>`;
  }

  caixa.addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-ep], [data-acao]');
    if (!b) return;
    const d = s.dados;
    if (b.dataset.acao === 'apagar') {
      if (!confirm(`Parar de acompanhar "${s.titulo}"? As marcações são apagadas e não dá para desfazer.`)) return;
      try { await arm.apagarSerie(filho, id); location.hash = '#assistir'; } catch (e) { toast(erroTexto(e)); }
    } else if (b.dataset.acao === 'conversado') {
      await salvar({ ...d, analisados: [...d.analisados, b.dataset.arco] });
    } else if (b.dataset.acao === 'ia-arco') {
      const area = caixa.querySelector('#as-ia');
      area.value = textoArcoIA({ titulo: s.titulo, arco: d.arcos.find((a) => a.nome === b.dataset.arco), ficha, idade: f ? idade(f.nascimento) : '', observacoes: d.observacoes });
      area.hidden = false; area.focus(); area.select();
    } else if (b.dataset.ep) {
      await salvar(alternar(d, Number(b.dataset.ep)));
    }
  });
  caixa.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const d = s.dados;
    if (ev.target.id === 'as-ate') await salvar(marcarAte(d, Number(fd.get('n'))));
    else if (ev.target.id === 'as-fav') { const n = Number(fd.get('n')); await salvar({ ...d, favoritos: d.favoritos.includes(n) ? d.favoritos.filter((x) => x !== n) : [...d.favoritos, n] }); }
    else if (ev.target.id === 'as-estrutura') {
      try { await salvar({ ...d, ...lerEstrutura(fd.get('temporadas'), fd.get('arcos')) }); toast('Estrutura salva.'); } catch (e) { s = validarSerie(s); toast(erroTexto(e)); }
    }
  });
  caixa.addEventListener('change', (ev) => { if (ev.target.id === 'as-obs') salvar({ ...s.dados, observacoes: ev.target.value }); });
  desenhar();
};
