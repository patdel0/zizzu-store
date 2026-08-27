Quase toda linha que você está prestes a escrever começa com `await`. Ele aparece
quarenta vezes nos blocos de código que este curso pede que você digite, e até
agora ninguém te disse o que significa.

É também a coisa mais fácil de errar de um jeito que não produz **erro nenhum**.

===
## Um comprovante, e a coisa em si

Ler um banco de dados leva tempo. Uma requisição de rede também. O JavaScript não
para e espera — ele te dá uma **promise**: um comprovante dizendo *a resposta vai
chegar depois*.

```typescript
const posts = db.orm.public.Post.all();   // um comprovante
const posts = await db.orm.public.Post.all();   // os posts
```

`await` é “espere o comprovante ser honrado e então me dê a coisa”.

Duas regras que decorrem disso:

- **`await` só funciona dentro de uma função marcada como `async`.** É por isso
  que você vê `export async function GET` — o `async` é o que te compra os
  `await`s de dentro.
- **Uma função `async` sempre devolve uma promise**, mesmo que o corpo dela
  retorne um número simples. Então quem chamar a sua função também vai dar
  `await` nela.

=== attest=saw-undefined
## Erre de propósito

**1.** Abra `__tests__/api/posts.test.ts` e ache, no teste do post mais recente
primeiro:

```typescript
const { data } = await response.json();
```

**2.** Apague a palavra `await`. Salve.

**3.** Rode:

```bash
npm test -- __tests__/api/posts.test.ts
```

Você recebe algo como:

```
TypeError: Cannot read properties of undefined (reading 'map')
```

Não “você esqueceu um await”. Um erro diferente, sobre uma linha diferente,
culpando `data` — porque `data` saiu `undefined`. Você desestruturou `data` de um
**comprovante**, e um comprovante não tem `data` nele.

**4.** Recoloque o `await`.

=== check=await-restored quiz=forgotten-await
## Por que este é perigoso

Três coisas que um `await` esquecido te dá, e nenhuma delas diz “await”:

| Você escreve | Você recebe |
|---|---|
| `String(promise)` | `[object Promise]` |
| `promise.data` | `undefined` |
| `JSON.stringify(promise)` | **`{}`** |

Esse último é o ruim. Esqueça um `await` num route handler e quem chamou recebe
`{}` — uma resposta válida, bem-sucedida e vazia. **Nada é lançado. Nada é
registrado. O código de status é 200.**

Esse é o formato de bug que custa uma tarde inteira a quem está começando: código
com cara de certo, resposta errada, e absolutamente nada para ler.

:::note Como identificar
Quando algo estiver `undefined` ou `{}` e você não conseguir ver por quê,
**procure um `await` faltando primeiro**, antes de qualquer outra coisa. Nesta
base de código, se uma linha chama o banco, um `fetch` ou `.json()`, ela precisa
de um.

O TypeScript pega muitos desses, que é mais um motivo para rodar
`npx tsc --noEmit` antes de dar push.
:::

=== ask=what-async-returns
## Onde você vai encontrar

Todos estes, de arquivos que você já abriu:

```typescript
const body = await request.json();                    // lendo uma requisição
const posts = await db.orm.public.Post.all();         // lendo o banco de dados
const response = await GET(getRequest('/api/posts')); // chamando um handler num teste
const { data } = await response.json();               // lendo uma resposta
await page.getByLabel('Title').fill('Hello');         // dirigindo um navegador
```

A mesma ideia toda vez.

:::why O jeito antigo, que você ainda vai ver
Antes do `await` havia o `.then()`:

```typescript
db.orm.public.Post.all().then((posts) => { ... });
```

Mesma promise, sintaxe diferente para esperar por ela. Você vai encontrar isso em
código mais antigo e em documentação. O `await` é a mesma engrenagem com o
aninhamento achatado, e é por isso que ele venceu.
:::
