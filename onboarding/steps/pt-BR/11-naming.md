Daqui a algumas etapas você cria seus primeiros arquivos. Três regras mordem
naquele momento; o resto está no manual.

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
