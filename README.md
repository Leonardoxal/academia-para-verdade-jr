# Academia para Verdade Jr.

Site infantil e juvenil independente, transportado da aba Infantil da Academia da Verdade. Mantém os mesmos módulos, arquivos, estética, login familiar e tabelas `aci_*`; a implantação no subcaminho do domínio preserva a origem do navegador e os dados locais existentes.

## Executar localmente

Requer Node.js 22 ou superior. Na pasta do projeto:

```powershell
node servir.mjs
```

Abra <http://127.0.0.1:5179/#infantil>.

## Publicação

O GitHub Pages publica a pasta `app/` em `https://leonardoxal.github.io/academia-para-verdade-jr/`. O workflow executa os testes antes da publicação. Não publique sem a confirmação do responsável.

O site usa a mesma origem `https://leonardoxal.github.io` e o mesmo Supabase da Academia da Verdade. Assim, `localStorage`, IndexedDB, sessão de login e tabelas `aci_*` continuam no mesmo lugar. Não há migração nem alteração de esquema. A família mantém o mesmo login e código de família.

## Privacidade

- O repositório contém somente o código e os PDFs públicos já publicados, com rótulos como “Filha 1”. Não acrescente nomes reais, nascimento, fotos, tarefas preenchidas, observações ou backups.
- Os textos para IA externa usam “Aluno A”. Confira as observações antes de copiar; envie imagens apenas da tarefa, sem o rosto da criança.
- A pasta Supabase `aci-tarefas` é privada por família. As regras e tabelas `aci_*` existentes não foram alteradas.
- A chave `anon`/publishable em `app/config.js` é pública. Nenhuma chave secreta deve ser incluída no projeto.

## Estrutura

- `app/index.html`: casca e identidade visual transportadas do site atual.
- `app/app.js`: roteador limitado às rotas infantis e juvenis.
- `app/views/` e `app/infantil/`: telas e lógica copiadas da Academia da Verdade.
- `app/tests/infantil.test.mjs`: testes da experiência infantil, armazenamento e conteúdo.
- `.github/workflows/pages.yml`: publicação estática com testes prévios.

## Relatórios de etapas

Os relatórios de implementação ficam em [`RELATORIOS_ETAPAS.md`](RELATORIOS_ETAPAS.md). A remoção da seção infantil da Academia da Verdade não faz parte deste repositório e só poderá ocorrer depois da aprovação do responsável e do desenvolvedor superior.
