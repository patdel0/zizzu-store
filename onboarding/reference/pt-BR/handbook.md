# Manual

Tudo o que você teria que decorar. Nada aqui está no caminho crítico do curso.

---

## Do que este projeto é feito

Você não precisa saber essas coisas. Precisa saber que elas existem, para que,
quando uma aparecer numa mensagem de erro, você saiba qual parte do sistema está
reclamando. Cada uma tem link para a documentação — é para lá que se vai quando
o tutorial acaba e uma pergunta de verdade começa.

| | |
|---|---|
| [Next.js](https://nextjs.org/docs) | O framework web. Serve páginas *e* responde requisições de API. |
| [React](https://react.dev) | Como as páginas são descritas, em componentes. |
| [TypeScript](https://www.typescriptlang.org/docs/) | JavaScript com tipos, para que erros sejam pegos antes de você rodar qualquer coisa. |
| [Tailwind CSS](https://tailwindcss.com/docs/styling-with-utility-classes) | Estilo, escrito como classes pequenas na marcação. |
| [PostgreSQL](https://www.postgresql.org/docs/) | O banco de dados. |
| [Prisma](https://www.prisma.io/docs) | Como o código consulta o banco, em TypeScript tipado. |
| [Vitest](https://vitest.dev/) | Testes para funções e endpoints de API. |
| [Playwright](https://playwright.dev/) | Testes que dirigem um navegador de verdade. |
| [Docker](https://docs.docker.com/) | Roda o app e o banco, para que a máquina de todo mundo seja igual. |
| [git](https://git-scm.com/docs) | Guarda o histórico do projeto. |

---

## Nomes

| Formato | Parece com | Usado para |
|---|---|---|
| camelCase | `parseLimit` | funções, variáveis |
| PascalCase | `PostsBoard` | componentes, tipos |
| kebab-case | `posts-board.tsx` | nomes de arquivo |
| SCREAMING_SNAKE | `MAX_LIMIT` | valores fixos no topo de um arquivo |

**Arquivos** são kebab-case. Três nomes são reservados pelo Next.js e têm que
estar exatamente em minúsculas: `page.tsx` (uma página), `route.ts` (um endpoint),
`layout.tsx` (a casca em volta das páginas abaixo dele). Uma letra maiúscula te dá
um 404 silencioso.

**`.tsx` se o arquivo contém JSX**, `.ts` caso contrário.

**Funções começam com um verbo**, e nomeiam *o que* fazem em vez de *como*:
`parsePriceCents` sobrevive a uma reescrita, `checkPriceWithRegex` vira mentira.
Evite `handleX`, `doX`, `processX`, `dataX` — não dizem nada.

**Booleanos** começam com `is` ou `has`. **Pares do `useState`** são sempre `x` e
`setX`.

> Na dúvida: ache a coisa mais próxima que já faz o que você está fazendo, e siga
> o mesmo padrão. Consistência vence a sua ideia melhor.

---

## Nomes de branch

```
tipo/numero-da-issue-descricao-curta
```

| Prefixo | Para |
|---|---|
| `feature/` | algo que o app não fazia antes |
| `fix/` | algo está quebrado |
| `refactor/` | arrumação — **o comportamento não pode mudar** |
| `docs/` | só documentação |
| `test/` | só testes |
| `chore/` | dependências, configuração, ferramentas |

Minúsculas, hifens, poucas palavras. Inclua o número da issue. O prefixo diz a
quem revisa o que procurar — `refactor/` significa “confira que nada mudou”.

---

## Mensagens de commit

Escreva o assunto como uma ordem: *aplicar este commit vai…*

- Menos de 50 caracteres, letra maiúscula, sem ponto final
- Diga o que mudou, não que algo mudou
- Corpo quebrado em 72, para o **porquê** — o diff já mostra o quê

```
Reject a post title longer than 200 characters

The column is text, so a long title was accepted and then broke the
list page's layout. 200 matches the limit the design uses.
```

Um commit é uma ideia — descritível numa frase sem “e”.

---

## Códigos de status

| Código | Significa |
|---|---|
| **200** | Aqui está |
| **201** | Criei a coisa (responde a um `POST` bem-sucedido) |
| **400** | Não consigo entender o que você mandou |
| **404** | Não existe nada nesse caminho |
| **422** | Eu te entendi, e mesmo assim não dá para fazer |
| **500** | Eu quebrei. Não é culpa sua |

**4xx culpa a requisição, 5xx culpa o servidor.** Todo endpoint aqui responde
`{ data }` ou `{ error }` — nunca um array solto, nunca um nome de campo
diferente.

---

## Comandos

**Todo dia**

```bash
./script/server                  # sobe os contêineres
docker compose watch             # sincroniza suas edições para o contêiner do app
docker compose logs -f app       # o que o servidor está realmente dizendo?
npm test                         # a suíte inteira do Vitest
npm test -- caminho/para/um.test.ts  # um arquivo
npm run test:e2e                 # Playwright (pare o contêiner do app antes)
```

**Antes de dar push**

```bash
npm test
npx tsc --noEmit                 # erros de tipo, sem rodar nada
npm run lint                     # estilo e erros comuns
```

**Git**

```bash
git status                       # na dúvida, rode isto
git diff                         # o que eu mudei?
git switch -c feature/12-coisa   # branch nova
git add <arquivo>                # coloca uma alteração no staging
git commit                       # registra
git commit --amend               # corrige o último commit (antes do push)
git log --oneline --graph        # histórico recente
git push -u origin <branch>      # primeiro push de uma branch
```

**Banco de dados**

```bash
npx prisma-cli contract emit                                    # depois de editar contract.ts
docker compose exec app npx prisma-cli db init --no-interactive --yes
docker compose exec app npx prisma-cli db update                # quando a tabela já existe
docker compose restart app                                      # recarrega o contrato
```

---

## Quando o git diz algo alarmante

| Mensagem | O que significa | O que fazer |
|---|---|---|
| `CONFLICT (content)` | duas branches mudaram as mesmas linhas | edite o arquivo, apague os marcadores, `git add` e `git commit` — ou `git merge --abort` |
| `Your branch is behind 'origin/main'` | outra pessoa deu push | `git pull` |
| `Updates were rejected` | o remoto tem commits que você não tem | `git pull`, resolva, push de novo |
| `detached HEAD` | você está num commit, não numa branch | `git switch -` para voltar |
| `Please commit your changes or stash them` | trabalho não commitado bloqueia a troca | `git stash`, troque, `git stash pop` |
| `Permission denied (publickey)` / `403` | autenticação ou acesso | veja *Enviando para o GitHub* abaixo |
| deu push de algo errado | — | `git revert <sha>` cria um commit novo desfazendo. Nunca reescreva histórico já enviado |

`git merge --abort` e `git stash` são as duas saídas de emergência. Nada se perde
de verdade — trabalho commitado no git é muito difícil de destruir.

---

## Enviando para o GitHub

Identidade (`git config user.name`) não é permissão. Você também precisa de
autenticação:

- **`gh auth login`** — a mais fácil, cuida de tudo
- **Chaves SSH** — [o guia do GitHub](https://docs.github.com/pt/authentication/connecting-to-github-with-ssh)
- **Um token de acesso pessoal** por HTTPS — sua *senha* do GitHub não funciona

`Permission denied (publickey)` significa que a autenticação não está
configurada. Um **403** normalmente significa que você não recebeu acesso de
escrita — isso é problema de acesso, não algo que você fez.

---

## Usando IA

Enquanto você está no onboarding, duas regras, sem exceção:

- **O [cs50.ai](https://cs50.ai/) é o único assistente.** Não ChatGPT, não
  Claude, não Copilot, e não o do seu editor — desligue esse, ele sugere
  enquanto você digita. O pato é configurado para te conduzir a uma resposta em
  vez de te entregar uma, e recusa quando pedem que ele escreva seu código.
- **Nenhum código entra no repositório que você não tenha escrito.** Nem colado,
  nem transcrito com o exemplo aberto. Leia, desvie o olhar, escreva.

E três que valem depois também:

- **Nunca commite nada que você não conseguiria explicar numa revisão.** Vão te
  perguntar.
- **Nunca confie nele sobre esta base de código.** Ele não leu nosso contrato nem
  nossas convenções, e vai inventar com confiança um método do Prisma que não
  existe.
- **Peça que ele leia, não que escreva.** “Explique isto linha por linha” e “onde
  eu deveria olhar? não conserte” mantêm o trabalho com você.

A evidência das duas primeiras está na etapa {{step:using-ai}}: produzir vence ler
([d = 0,40, subindo para 0,64 depois de um dia](https://link.springer.com/article/10.3758/BF03193441)),
e estudantes com um assistente sem proteções tiraram
[17% pior que estudantes que nunca tiveram um](https://www.pnas.org/doi/10.1073/pnas.2422633122)
depois que ele foi retirado.

---

## Onde procurar as coisas

| Pergunta | Onde |
|---|---|
| Como eu adiciono um endpoint? | `docs/api-routes.md`, e `app/api/posts/route.ts` |
| Como eu escrevo um teste? | `docs/testing.md`, e `__tests__/api/posts.test.ts` |
| Como eu consulto o banco? | `docs/prisma-next.md`, e `lib/prisma/contract.d.ts` — gerado, e legível |
| Como funciona uma página? | `app/posts/page.tsx` e `app/posts/posts-board.tsx` |
| O que o `expect` consegue fazer? | [Vitest](https://vitest.dev/api/expect.html) · [Playwright](https://playwright.dev/docs/locators) |
| O que este comando do git faz? | [git-scm.com/docs](https://git-scm.com/docs) |
| O que este código de status significa? | [MDN](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Reference/Status) |

## Achando coisas que ninguém te mostrou

```bash
grep -rn "orderBy" app lib test        # quem mais faz isto?
git log -S "parseLimit" --oneline      # quando isto apareceu, e por quê?
git blame app/api/posts/route.ts       # quem escreveu esta linha?
```

No seu editor: **ir para a definição** de qualquer símbolo, **encontrar todas as
referências**, e busca no projeto inteiro. O `lib/prisma/contract.d.ts` é gerado e
lista todo modelo, campo e método de consulta que você tem.
