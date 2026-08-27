Tudo até agora te disse o que esperar. Trabalho de verdade não diz.

A habilidade que separa uma tarde travada de uma correção de dez minutos não é
saber mais — é saber **onde olhar**. Esta etapa quebra três coisas de propósito
para você descobrir onde cada tipo de falha se esconde.

===
## Quatro janelas

Um erro neste projeto se manifesta em exatamente um de quatro lugares, e qual
deles é te diz quase tudo.

```mermaid
flowchart TD
    B["Console do navegador<br/><i>código rodando no navegador</i>"]
    S["docker compose logs -f app<br/><i>código rodando no servidor</i>"]
    T["A saída dos testes<br/><i>Vitest ou Playwright</i>"]
    D["O banco de dados<br/><i>violações de restrição, tabelas ausentes</i>"]
```

Você já sabe por quê: **o navegador e o servidor são máquinas diferentes**, então
a saída deles vai para lugares diferentes. Uma mensagem que você não acha
normalmente é uma mensagem que você está procurando na janela errada.

Mantenha o log do servidor aberto na própria aba o dia inteiro:

```bash
docker compose logs -f app
```

=== check=posts-route-restored attest=found-in-logs
## Quebra um: um erro que o navegador esconde

**1.** Abra `app/api/posts/route.ts`. Dentro do `try` do `GET`, acima da
consulta, adicione:

```typescript
throw new Error('something specific I will recognise');
```

**2.** Recarregue [localhost:3000/api/posts](http://localhost:3000/api/posts):

```json
{"error":"Failed to list posts"}
```

É tudo o que o navegador vai te dizer. Ele não diz o que falhou, nem onde.

**3.** Agora olhe o log do servidor. Sua mensagem está lá, com o arquivo e a
linha.

Essa distância é deliberada. Olhe o `internalError` no fim do arquivo — ele
registra o erro real e depois responde com um genérico, porque um erro cru pode
carregar nomes de tabela, consultas, às vezes strings de conexão.

> **Um 500 no navegador não é o erro. É o comprovante de um erro que foi anotado
> em outro lugar.**

**4.** Restaure: `git restore app/api/posts/route.ts`

=== check=contract-restored
## Quebra dois: um erro sobre um arquivo que você não tocou

**1.** Abra `lib/prisma/contract.ts` e renomeie `title` para `heading` no modelo
`Post`. Salve e regenere:

```bash
npx prisma-cli contract emit
```

**2.** Agora pergunte ao projeto inteiro:

```bash
npx tsc --noEmit
```

```
app/api/posts/route.ts(101,50): error TS2769: No overload matches this call.
  Property 'heading' is missing in type 'CreatePostInput'
```

Os erros estão em `app/api/posts/route.ts` e `test/helpers.ts` — **nenhum dos
dois você editou.**

Esse é o formato a reconhecer: você mudou uma coisa, e outra começou a reclamar.
Os arquivos gerados ainda descrevem um `title`; seu código-fonte agora diz
`heading`; tudo rio abaixo acredita nos arquivos gerados.

Uma renomeação, dois arquivos quebrados, e o erro cita um tipo do qual você nunca
ouviu falar.

> **Quando algo que você não tocou começa a falhar, pergunte o que você *tocou*
> de que aquilo depende.**

**3.** Restaure — o contrato *e* os arquivos gerados a partir dele:

```bash
git restore lib/prisma
```

=== attest=read-the-diff
## Quebra três: a falha mais amigável que existe

**1.** Em `app/api/posts/route.ts`, troque `.desc()` por `.asc()`.

**2.** `npm test -- __tests__/api/posts.test.ts`

```
FAIL  returns the newest post first
  expected [ 'Older', 'Newer' ] to deeply equal [ 'Newer', 'Older' ]
```

Leia o que te entregaram: **qual comportamento** quebrou, **o que ele recebeu** e
**o que ele queria** — o bastante para achar o bug sem abrir o arquivo.

É isto que as pessoas querem dizer quando falam que testes se pagam. Compare com
a quebra um, em que o navegador te disse que algo falhou e mais nada.

**3.** Restaure.

=== quiz=where-does-it-surface ask=first-question
## Um método, para quando não há tutorial

Quatro perguntas, em ordem. A maioria dos bugs morre na segunda.

**1. O que eu mudei?**

```bash
git diff
```

Um segundo, e descarta um universo inteiro de teorias. Quase sempre a resposta é
você.

**2. O que eu esperava, e o que eu recebi?** Diga os dois em voz alta. “Eu
esperava o post mais recente primeiro; recebi o mais antigo.” Metade das vezes o
bug fica óbvio no dizer — que é por que o pato de borracha é uma técnica real e
não piada.

**3. Qual janela saberia?** Navegador, log do servidor, saída dos testes, banco
de dados. Olhe na certa antes de teorizar.

**4. Consigo cortar o problema ao meio?** Comente a segunda metade. Imprima um
valor no meio. Fixe uma entrada na mão. Você não está procurando o bug — está
procurando **a menor coisa que ainda se comporta mal**, e ele cai sozinho quando
isso fica pequeno o bastante.

:::note Duas horas
Então pergunte. Leve as quatro respostas acima e você recebe uma resposta útil em
uma mensagem em vez de cinco:

> **Esperava:** que `POST /api/products` respondesse 201.
> **Recebi:** 500, e o log diz `column "price_cents" does not exist`.
> **Tentei:** rodei `contract emit` de novo, reiniciei o contêiner do app.

Isso não é admitir derrota. É o formato que te destrava mais rápido, e é o que
toda pessoa sênior faz.
:::
