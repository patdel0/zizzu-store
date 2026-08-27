Você cria seu primeiro arquivo daqui a algumas etapas, e seus primeiros
arquivos de código na semana que vem. Três regras mordem nesses momentos; o
resto está no manual.

===
## O formato te diz o que a coisa é

| Formato | Parece com | Usado para |
|---|---|---|
| camelCase | `parseLimit` | funções, variáveis |
| PascalCase | `PostsBoard` | componentes, tipos |
| kebab-case | `posts-board.tsx` | **nomes de arquivo** |
| SCREAMING_SNAKE | `MAX_LIMIT` | valores fixos no topo de um arquivo |

Você ganha isso de graça, a partir das maiúsculas.

:::try Confira você mesmo
```bash
git ls-files '*.ts' '*.tsx' | grep -v node_modules
```

Todo arquivo: minúsculas, hifens. Nenhuma exceção no repositório inteiro.
:::

=== quiz=file-case,which-extension
## Os dois que vão realmente te morder

**Três nomes de arquivo não são sua escolha.** O Next.js reserva `page.tsx` (uma
página), `route.ts` (um endpoint) e `layout.tsx` (a casca). Exatamente em
minúsculas. Chame de `Page.tsx` e o Next.js não encontra — sem erro, só um 404 e
vinte minutos.

**`.tsx` se o arquivo contém JSX**, `.ts` caso contrário. Coloque JSX num `.ts` e
o erro que você recebe não vai mencionar JSX.

:::why Por que arquivos são minúsculos e o componente dentro não
`posts-board.tsx` exporta `PostsBoard`. macOS e Windows tratam `PostsBoard.tsx` e
`postsboard.tsx` como **o mesmo arquivo**; o Linux — que é o que roda em
produção — não. Um repositório relaxado com maiúsculas compila no notebook em que
foi escrito e falha no servidor, reclamando de um módulo que está claramente lá.
:::

=== attest=saw-the-404
## Cause o 404 silencioso

A afirmação acima é que uma letra maiúscula em `page.tsx` te dá um 404 e nenhum
erro. Não aceite na fé — custa noventa segundos e é o tipo de falha que só se
reconhece depois de tê-la causado.

**1.** Confira que a página funciona:
[localhost:3000/posts](http://localhost:3000/posts).

**2.** Renomeie o arquivo:

```bash
mv app/posts/page.tsx app/posts/Page.tsx
```

**3.** Espere alguns segundos para o contêiner sincronizar e recarregue
[/posts](http://localhost:3000/posts).

**404.** Agora olhe os dois lugares onde você normalmente olharia:

- o console do navegador — nada
- `docker compose logs -f app` — nada errado, o servidor está bem

O arquivo está bem ali. O código dentro dele está correto. O Next.js procura
`page.tsx` e não existe tal arquivo, então, para o roteamento, aquela pasta
simplesmente não é uma página.

**4.** Devolva:

```bash
mv app/posts/Page.tsx app/posts/page.tsx
```

:::warn Por que este vale noventa segundos
No macOS e no Windows este exercício não faz nada — aqueles sistemas de arquivos
tratam `Page.tsx` e `page.tsx` como o mesmo arquivo, então a página continua
funcionando. O Linux, que é o que roda em produção, não.

É essa a razão inteira de a convenção ser rígida: uma letra maiúscula inofensiva
no notebook em que foi escrita é um 404 no servidor, e quem está depurando está
olhando para um arquivo que está claramente lá.
:::

=== quiz=function-name
## Nomeando uma função

Comece com um verbo, e nomeie **o que ela faz, não como**.

```
parseLimit    parseCreatePost    createUser    resetDatabase
```

`parsePriceCents` sobrevive a uma reescrita. `checkPriceWithRegex` vira mentira
no dia em que você parar de usar regex — e um nome que mente é pior que um nome
vago.

Evite `handleX`, `doX`, `processX`: os verbos mais vazios que existem.

:::blank Nomeie estes como este projeto nomearia
Um arquivo com o componente do board de produtos
   app/products/{{kebab:products-board|product-board|products-list}}.tsx

O componente que ele exporta
   export function {{pascal:ProductsBoard|ProductBoard|ProductsList}}()

Uma função que transforma um valor desconhecido em um preço ou um motivo
   export function {{camel:parsePriceCents|parsePrice}}(raw: unknown)
:::

O que é corrigido é o **formato**, não a palavra exata — existe mais de um nome
sensato para quase tudo.

:::note Quando estiver em dúvida, vá olhar
Ache a coisa mais próxima que já faz o que você está fazendo, e siga o mesmo
padrão. `posts` é essa coisa para quase tudo que você está prestes a escrever.

Uma convenção que você segue sem entender vale mais que uma que você inventa.
:::
