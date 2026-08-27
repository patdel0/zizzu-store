Você já escreve algum JavaScript. Este projeto usa quatro pedacinhos dele o
tempo todo, em todo arquivo que você está prestes a ler, e cada um vale dez
minutos.

Nada para instalar. Abra `app/api/posts/route.ts` e acompanhe — todo exemplo
abaixo é uma linha de um arquivo deste repositório.

===
## Arquivos são caixas lacradas

Topo de `route.ts`:

```typescript
import { db } from '@/lib/prisma/db';
```

E em `lib/prisma/db.ts`:

```typescript
export const db = postgres<Contract>({ ... });
```

**Nada fora de um arquivo enxerga o que há dentro dele, a menos que o arquivo
ofereça.** O `export` é a oferta. O `import` é outro arquivo pedindo pelo nome.

Dois formatos que você vai ver:

```typescript
import { db } from '@/lib/prisma/db';        // um export nomeado
import type { NextRequest } from 'next/server';  // um tipo, apagado em tempo de execução
```

`import type` diz “só preciso disto para a checagem de tipos” — some quando o
código roda.

:::note O que `@/` significa
O topo do projeto, configurado em `tsconfig.json`. `@/lib/prisma/db` significa
`lib/prisma/db` a partir da raiz do projeto, para que um arquivo possa mudar de
lugar sem quebrar todos os imports dentro dele.
:::

=== quiz=what-import-does
## Funções escritas como expressões

```typescript
db.orm.public.Post.orderBy((post) => post.createdAt.desc())
```

Aquele `(post) => post.createdAt.desc()` é uma **função sendo passada como
argumento**. Por extenso seria:

```typescript
function (post) { return post.createdAt.desc(); }
```

A forma de seta dispensa a palavra `function`, e quando o corpo é uma única
expressão ela é retornada sem você escrever `return`.

Você vai ver isso em todo lugar: `.map()`, `.filter()`, `onClick={() => …}`, e em
toda consulta do Prisma nesta base de código. `()` sem nada dentro só significa
que ela não recebe argumentos.

===
## Tirando coisas pelo formato

```typescript
const { data } = await response.json();
```

Isso é atalho para `const data = body.data`. As chaves são um **padrão**
descrevendo o que você quer tirar do objeto.

Colchetes fazem o mesmo com arrays, por posição:

```typescript
const [posts, setPosts] = useState(null);
```

E é por isso que as duas coisas que o `useState` devolve podem ter qualquer
nome — elas são só o primeiro e o segundo item, e você as nomeia ao desempacotar.

Funciona em argumentos também. Em `posts-board.tsx`:

```typescript
function Field({ label, name, required }) {
```

Isso recebe **um** objeto e tira três propriedades dele na entrada.

=== quiz=destructure
## Dois operadores pequenos

```typescript
content: content ?? null
```

`a ?? b` significa *a, a menos que a esteja ausente, então b*. Só `null` e
`undefined` contam como ausente — `0` e `''` são valores e são mantidos, que é
justamente o motivo de usar isso em vez de `||`.

```typescript
body?.choices?.[0]
```

`?.` para em vez de lançar erro se o que está à esquerda estiver ausente. Sem
ele, tentar entrar num objeto que acabou sendo `undefined` quebra.

=== attest=ran-the-operators
## Experimente os dois operadores com valores de verdade

Trinta segundos cada, num terminal. Sem projeto, sem servidor — `node -e` roda
uma linha e imprime a resposta.

**1. `??` contra `||`:**

```bash
node -e "console.log(0 ?? 5, 0 || 5)"
```

```
0 5
```

Mesmas entradas, respostas diferentes. O `??` manteve o zero porque zero é um
valor; o `||` jogou fora porque zero é *falsy*, junto com `''`, `false` e `NaN`.

**2. Agora o que morde:**

```bash
node -e "console.log(JSON.stringify({ nullish: '' ?? 'fallback', or: '' || 'fallback' }))"
```

```
{"nullish":"","or":"fallback"}
```

Olhe a linha 156 do `route.ts` de novo — `content: content ?? null`. Se aquilo
fosse `||`, um post cujo conteúdo alguém apagou de propósito voltaria com o que
estivesse no fallback em vez da string vazia que a pessoa quis. **Isso é um bug
de dados, e nada seria lançado.**

**3. E o `?.`, dos dois jeitos:**

```bash
node -e "const o = {}; console.log(o.a?.b)"
```

```
undefined
```

```bash
node -e "const o = {}; console.log(o.a.b)"
```

```
TypeError: Cannot read properties of undefined (reading 'b')
```

O segundo é a quebra mais comum do JavaScript, e o `?.` é o único caractere que
a transforma num valor que você pode verificar.

:::note Por que rodar em vez de ler
Você acabou de ver `0 || 5` produzir `5`. Ler essa frase e ver o seu próprio
terminal imprimir são coisas diferentes, e a segunda é a versão de que você
lembra às quatro da tarde quando um preço zero sumiu.
:::

:::note Você já viu tudo o que existe num route handler, menos uma coisa
Abra `app/api/posts/route.ts` de novo e leia a função `GET`. Imports, funções de
seta, desestruturação, `??` — você já consegue nomear tudo isso.

Menos a palavra `await`, que está em quase toda linha. Essa vem duas etapas
adiante, e é a que mais dói quando você erra.
:::
