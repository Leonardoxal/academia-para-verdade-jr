# Relatórios de entrega — Academia para Verdade Jr.

## RELATÓRIO JR — Etapa 1: estrutura e publicação

- **Feito:** projeto infantil separado, com identidade própria, repositório Git local na branch `main`, remoto `origin` configurado, servidor local e fluxo do GitHub Pages configurado para publicar a pasta `app/`. O repositório público vazio `Leonardoxal/academia-para-verdade-jr` foi criado, com `main` como branch padrão.
- **Arquivos:** `README.md`, `package.json`, `servir.mjs`, `.gitignore`, `.github/workflows/pages.yml`.
- **Testes:** as rotas principais do servidor local responderam HTTP 200.
- **Conferência no navegador:** não concluída.
- **Desvios:** nenhum arquivo foi enviado ao GitHub.
- **Dúvidas para superior:** nenhuma.
- **Riscos:** o endereço definitivo do site e a execução do Pages dependem de enviar e publicar os arquivos, ainda pendente.

## RELATÓRIO JR — Etapa 2: área infantil

- **Feito:** telas, aulas, jogos, vídeos, desenhos, arquivos e componentes infantis copiados para o projeto; criado roteador exclusivo para as telas infantis; o endereço inicial abre a área Infantil e rotas adultas não foram incluídas.
- **Arquivos:** `app/app.js`, `app/index.html`, `app/views/`, `app/infantil/`, `app/ui.js`, `app/nuvem.js`, `app/config.js` e componentes relacionados.
- **Testes:** suíte infantil executada; 40 testes passaram.
- **Conferência no navegador:** não concluída.
- **Desvios:** a revisão visual precisa ser feita com o usuário autenticado no navegador do app.
- **Dúvidas para superior:** nenhuma.
- **Riscos:** sem revisão visual ainda não há confirmação de layout em diferentes larguras.

## RELATÓRIO JR — Etapa 3: família, tarefas e sincronização

- **Feito:** fluxo de acesso familiar e sincronização existentes foram mantidos, usando as mesmas tabelas `aci_*` do Supabase; nenhuma tabela ou estrutura do banco foi alterada. O cadastro infantil permite criar, atualizar e remover filhos.
- **Arquivos:** `app/views/entrar.js`, `app/nuvem.js`, `app/config.js` e telas infantis.
- **Testes:** a suíte cobre cadastro/atualização de filhos, tarefas, dados por filho e sincronização simulada.
- **Conferência no navegador:** acesso real ao Supabase não foi exercitado.
- **Desvios:** validação real de conta e sincronização entre aparelhos depende de sessão familiar válida.
- **Dúvidas para superior:** nenhuma.
- **Riscos:** sincronização em produção ainda requer ensaio com dois aparelhos conectados à mesma família.

## RELATÓRIO JR — Etapa 4: validação automatizada

- **Feito:** suíte de testes infantis copiada e adaptada para o projeto separado.
- **Arquivos:** `app/tests/infantil.test.mjs`.
- **Testes:** `node --test app/tests/infantil.test.mjs` — 40 passaram, 0 falharam.
- **Conferência no navegador:** não concluída.
- **Desvios:** testes da área adulta não foram incluídos porque o projeto Jr. não contém as rotas nem o catálogo adulto.
- **Dúvidas para superior:** nenhuma.
- **Riscos:** testes automatizados não substituem ensaio real de login, sincronização ou interface.

## RELATÓRIO JR — Etapa 5: integração com o projeto privado

- **Feito:** o script de publicação agora indica o repositório Jr.; o `CLAUDE.md` privado foi atualizado apenas nas seções 3 e 8; execução do script gerou 17 aulas e PDFs no projeto Jr. sem enviar arquivos à internet.
- **Arquivos:** no projeto Jr., `app/infantil/aulas.js` e os PDFs em `app/infantil/aulas/`; no projeto privado, `ferramentas/publicar-site.mjs` e `CLAUDE.md`.
- **Testes:** `node --test app/tests/infantil.test.mjs` — 40 passaram, 0 falharam após a geração.
- **Conferência no navegador:** não concluída.
- **Desvios:** nenhum arquivo do projeto privado foi copiado além dos PDFs de aula e campos públicos do catálogo gerado.
- **Dúvidas para superior:** nenhuma.
- **Riscos:** conferir os PDFs visualmente antes de publicar.

## RELATÓRIO JR — Etapa 6: revisão de tela

- **Feito:** servidor local responde para a página inicial, telas, catálogo de aulas e PDF de exemplo.
- **Arquivos:** validação local do projeto em `http://127.0.0.1:5179/#infantil`.
- **Testes:** cinco rotas verificadas via HTTP; todas responderam 200.
- **Conferência no navegador:** pendente; não foi possível fazer inspeção visual, console ou largura de 375 px neste turno.
- **Desvios:** etapa incompleta até a inspeção visual.
- **Dúvidas para superior:** nenhuma.
- **Riscos:** não afirmar compatibilidade visual mobile antes dessa revisão.

### Adendo de revisão visual

- **Feito:** após o acabamento gótico, a tela Infantil e a aba Jogos foram conferidas visualmente no navegador local, nos temas claro e escuro; a preferência foi restaurada para automático.
- **Pendente:** não houve revisão específica em viewport de 375 px nem verificação completa de console.

## RELATÓRIO JR — Etapa 7: publicação

- **Feito:** repositório público vazio criado; fluxo de GitHub Pages preparado localmente.
- **Arquivos:** `.github/workflows/pages.yml`.
- **Testes:** nenhuma publicação executada.
- **Conferência no navegador:** endereço público ainda não existe.
- **Desvios:** etapa parada antes de enviar/publicar conteúdo. A publicação exige confirmação explícita posterior.
- **Dúvidas para superior:** aprovar a publicação quando a revisão visual estiver concluída.
- **Riscos:** nenhum conteúdo foi enviado, commitado ou publicado.

## RELATÓRIO JR — Etapa 8: remoção da aba antiga

- **Feito:** nada removido da Academia da Verdade.
- **Arquivos:** nenhum arquivo do site principal foi alterado.
- **Testes:** não aplicável.
- **Conferência no navegador:** não aplicável.
- **Desvios:** etapa não iniciada.
- **Dúvidas para superior:** qualquer remoção depende de aprovação separada.
- **Riscos:** a aba infantil existente permanece como está.

## Revisão do desenvolvedor superior (Claude, 12/11/2026)

- **Comparação com a Verdade:** os módulos de `app/infantil/` e as telas de `app/views/` são cópias da Verdade; ignorando quebras de linha, as diferenças são só de nome e de links (`painel` trocado por `infantil`, link externo para a Verdade). Nenhum arquivo infantil faltou.
- **Testes:** `node --test app/tests/infantil.test.mjs` — 40 passaram, 0 falharam, depois da mudança visual.
- **Privacidade:** nenhum nome, nascimento ou dado de criança no código; `aulas.js` só tem campos públicos; `.gitignore` exclui `previas/` e `respostas/`.
- **Links e caminhos:** nenhum link para rota adulta; nenhum caminho absoluto, então o site funciona em `/academia-para-verdade-jr/`.
- **Navegador, 375 px:** `#infantil`, `#jogos`, `#jogo-quantos`, `#desenhar`, `#assistir`, `#assistir-bluey`, `#entrar` e uma aula abriram sem rolagem horizontal, sem botão sem nome e sem mensagem no console.
- **Divergência:** o teste que impedia livros já pedidos pelo curso da Verdade foi retirado em vez de trocado por uma lista fixa. Baixo risco enquanto a biblioteca não mudar.
- **Não feito nesta revisão:** login real, código da família, anexo de tarefa e sincronização entre dois aparelhos (pedem a conta da família); leitura dos PDFs página a página.
- **Atenção na publicação:** o `pages.yml` publica a cada push na `main`, então o primeiro push já põe o site no ar. Os e-mails de confirmação e de nova senha do Supabase continuam levando à URL configurada no projeto (a da Verdade).

## RELATÓRIO JR — Mapa de habilidades (12/11/2026)

- **Feito:** mapa de habilidades com uma trilha (Número e quantidade, 2 a 6 anos, 10 habilidades), regra de domínio (dois dias diferentes ou nova verificação), bloco "O que fazer agora" no painel dos pais e sugestões do mapa no formulário de registro.
- **Arquivos:** `app/infantil/habilidades.js` (novo), `app/views/infantil.js`, `app/index.html` (duas regras de estilo), `app/tests/infantil.test.mjs`, `README.md`.
- **Testes:** `node --test app/tests/infantil.test.mjs` — 43 passaram, 0 falharam (3 novos).
- **Conferência no navegador:** servidor local, Chrome sem interface, largura de 390 px, com uma criança fictícia e quatro registros de exemplo num perfil descartável. O painel mostrou a trilha, os estados "Confirmar em outro dia" e "Em andamento" e o link do jogo; nenhum erro de JavaScript; sem rolagem lateral. Não conferido: tema escuro, largura de computador e uso com a nuvem.
- **Desvios:** nenhuma mudança no banco; a ligação entre registro e mapa é pelo nome da habilidade.
- **Riscos:** a sequência e os critérios são proposta da Academia, adaptada de Gelman e Gallistel (1978) e de Clements e Sarama (2009), sem revisão de especialista. Renomear uma habilidade do mapa desliga os registros antigos dela.
- **Publicação:** não publicado. Está no ramo `claude/mapa-de-habilidades`, à espera da aprovação do responsável.

