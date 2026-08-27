Seu endpoint funciona e confia em tudo o que lhe dizem. Agora torne-o correto.

Trabalhe em ciclos pequenos aqui: um teste, faça passar, commite, próximo teste.
Cinco ciclos curtos, não um longo.

===
## A regra

**Qualquer coisa que chega por HTTP não é confiável.** Não porque todo mundo é
mal-intencionado, mas porque um erro de digitação num formulário e um ataque
deliberado chegam pela mesma porta e parecem idênticos do lado do servidor.

Seu trabalho é decidir, para cada campo, o que conta como válido — e responder
com clareza quando não for.

===
## O que construir

| Situação | Status | Corpo |
|---|---|---|
| Criado | **201** | `{ data: product }` |
| O corpo não é JSON válido | **400** | `{ error: 'Request body must be valid JSON' }` |
| `name` ausente ou vazio | **400** | `{ error: '`name` is required' }` |
| `priceCents` não é inteiro positivo | **400** | `{ error: … }` |
| Já existe um produto com esse nome | **422** | `{ error: … }` |

Lembre da distinção da etapa {{step:requests}} — e [o MDN tem a lista completa](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Reference/Status):
**400** significa “não consigo entender isto”; **422** significa “entendi você
perfeitamente e mesmo assim não dá para fazer”.

===
## Como este projeto faz

Abra `parseCreatePost` em `app/api/posts/route.ts`. É uma função simples que
recebe algo desconhecido e devolve ou um valor ou um motivo:

```typescript
type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };
```

O handler então lê de forma simples — faz o parse e, se não estiver ok, responde
400:

```typescript
const input = parseCreateProduct(body);

if (!input.ok) {
  return Response.json({ error: input.error }, { status: 400 });
}
```

**Você vai escrever `parseCreateProduct`.** Os ciclos abaixo cada um acrescenta
uma regra a ela — não ao handler. Esse é o ponto do formato: o handler continua
com quatro linhas, e toda regra acaba numa função simples que você consegue
testar sem requisição e sem banco.

Comece agora, porque as duas primeiras linhas são as que as pessoas erram:

```typescript
type CreateProductInput = { name: string; description: string | null; priceCents: number };

function parseCreateProduct(body: unknown): Parsed<CreateProductInput> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const { name, description, priceCents } = body as Record<string, unknown>;

  // suas regras vão aqui

  return { ok: true, value: { name: '', description: null, priceCents: 0 } };
}
```

Aquelas duas linhas sustentam tudo, e `parseCreatePost` tem o mesmo par. O
`typeof body !== 'object'` é a verificação; o `as Record<string, unknown>` é você
dizendo ao TypeScript o que acabou de provar. Sem ele, `body.name` nem compila —
`body` é `unknown`, e `unknown` recusa tudo até você estreitá-lo. Veja a etapa
{{step:typescript}} para o que o `as` está fazendo ali.

:::note Por que o corpo é `unknown`
O [`request.json()`](https://nextjs.org/docs/app/api-reference/functions/next-request)
poderia devolver qualquer coisa, então o resultado dele é tipado `unknown` — o
mesmo motivo da etapa {{step:typescript}}, e a razão pela qual o parsing abaixo
tem que acontecer antes de qualquer outra coisa.
:::

=== check=sandbox-branch,bad-json
## Ciclo um: um corpo que não é JSON

`postRawRequest('/api/products', 'not json')` envia o texto sem tocar. O
`request.json()` lança erro nisso, então embrulhe:

```typescript
let body: unknown;

try {
  body = await request.json();
} catch {
  return Response.json({ error: 'Request body must be valid JSON' }, { status: 400 });
}
```

Escreva o teste, veja falhar, faça passar, commite. Depois volte.

=== check=missing-name
## Ciclo dois: um nome ausente

Dentro de `parseCreateProduct`, depois da desestruturação:

```typescript
if (typeof name !== 'string' || name.trim() === '') {
  return { ok: false, error: '`name` is required' };
}
```

Faça o trim antes de salvar, para que `"  Mug  "` e `"Mug"` não virem dois
produtos.

=== check=uses-parse
## Ciclo três: um preço inválido

Este você já escreveu. Na etapa {{step:prep}} você fez o PREP e testou
`parsePriceCents` — era para isso. Importe em vez de escrever as verificações uma
segunda vez:

```typescript
import { parsePriceCents } from '@/lib/products';

// dentro de parseCreateProduct, sobre o valor desestruturado — não sobre `body`
const price = parsePriceCents(priceCents);

if (!price.ok) {
  return { ok: false, error: price.error };
}
```

Repare no que você ganha de graça: ela já está testada contra todos os seus oito
exemplos. O teste do handler só precisa provar que o handler *a usa* — um caso
basta, porque os casos limite estão cobertos onde pertencem.

:::note É isto que “uma função simples” te compra
`parsePriceCents` não precisa de requisição, banco nem servidor. Isso a torna
trivial de testar exaustivamente, e é por isso que as decisões espinhosas moram
lá em vez de no meio do handler.

Quando você se pegar querendo simular um banco para alcançar algum ramo, isso
normalmente é sinal de que a lógica daquele ramo deveria ir para uma função como
esta.
:::

=== check=duplicate-name
## Ciclo quatro: um nome duplicado

Olhe antes de escrever:

```typescript
const existing = await db.orm.public.Product.where({ name: input.value.name }).first();

if (existing) {
  return Response.json(
    { error: `A product called "${input.value.name}" already exists` },
    { status: 422 },
  );
}
```

Prepare este teste criando o produto primeiro e depois postando o mesmo nome de
novo. Você vai querer um helper:

```typescript
let productCount = 0;

export async function createProduct(overrides: { name?: string; priceCents?: number } = {}) {
  productCount += 1;

  return db.orm.public.Product.create({
    name: overrides.name ?? `Product ${productCount}`,
    priceCents: overrides.priceCents ?? 999,
  });
}
```

Coloque em `test/helpers.ts` ao lado de `createPost`, em vez de repetir a
preparação em cada teste. Esse arquivo existe para que um teste se leia como o
que ele verifica, e não como encanamento de banco.

:::note Por que o contador
Duas fixtures ambas chamadas “Product” colidiriam no instante em que você
testasse unicidade. Fixtures devem diferir por padrão, e ser idênticas só quando
um teste pedir.
:::

=== check=cases
## Ciclo cinco: falhas inesperadas

Embrulhe o trabalho de banco num `try`/`catch`, registre o erro real e responda
um 500 genérico:

```typescript
} catch (error) {
  console.error('Failed to create product', error);

  return Response.json({ error: 'Failed to create product' }, { status: 500 });
}
```

:::warn Nunca envie o erro cru a quem chamou
Um erro de banco pode conter nomes de tabela, a consulta, às vezes a string de
conexão. Registre o detalhe onde seu time consegue ver; devolva o resumo.
:::

===
## Dois ataques em que você não precisou pensar, e um em que precisa

Você acabou de escrever validação de entrada, que é onde a maioria dos conselhos
de segurança começa. Dois dos ataques sobre os quais eles normalmente avisam nem
apareceram. Vale saber por quê — e há um terceiro do qual nada te protege.

**Você nunca montou uma consulta colando strings.**

```typescript
// Nunca. Nem uma vez, nem “só desta vez, para uma caixa de busca”.
`SELECT * FROM products WHERE name = '${name}'`
```

Um produto chamado `'; DROP TABLE products; --` encerra aquela consulta cedo e
começa uma nova. Isso é injeção de SQL, e continua perto do topo do
[OWASP Top Ten](https://owasp.org/www-project-top-ten/) depois de vinte e cinco
anos. `db.orm.public.Product.where({ name })` envia o nome como *parâmetro*,
separado da consulta — então não há frase da qual escapar. Você ganha isso de
graça usando o construtor de consultas, e perde no instante em que recorre a SQL
cru.

**Você nunca colocou texto de usuário direto numa página.** O React escapa
qualquer coisa dentro de `{...}` antes de renderizar, então um nome contendo
`<script>` aparece como esses caracteres em vez de executar. A saída dessa
proteção tem um nome deliberadamente alarmante — `dangerouslySetInnerHTML` — e se
você algum dia se pegar digitando isso, pare e ache outro jeito. Isso é
cross-site scripting, e é o mesmo erro da injeção de SQL com outra roupa: **dado
foi tratado como instrução.**

**E nada de secreto está no código que você vai dar push.** Strings de conexão,
chaves de API e tokens moram no `.env`, que está no `.gitignore`. Commitar um não
se resolve apagando no commit seguinte — está no histórico, e o histórico é o que
vai no push. A correção é rotacionar o segredo, o que significa contar a alguém.
Faça isso rápido em vez de caladamente.

:::warn O maior deles é o que este endpoint não tem
Qualquer pessoa que alcance `POST /api/products` consegue criar um produto. Não
há login, nem verificação de quem está pedindo, nem limite de frequência. Isso é
deliberado para um sandbox e não sobreviveria a uma revisão em nenhum outro
lugar.

Duas palavras que vale ter claras, porque são confundidas o tempo todo:
**autenticação** é *quem é você*, **autorização** é *você pode fazer isto*.
Validação — tudo o que você acabou de escrever — é uma terceira coisa, e tê-la
não te dá nenhuma das outras duas.

Numa tarefa de verdade, “quem tem permissão de chamar isto?” é a primeira
pergunta de quem revisa. Faça a si mesmo primeiro.
:::

:::note O padrão por trás dos três
Em algum lugar, uma string que te deram é lida como algo com poder — uma
consulta, marcação, um comando. Toda vez que você entrega entrada de usuário a
algo que a interpreta, pergunte o que acontece se aquela entrada for hostil em
vez de desajeitada. Frameworks resolvem os casos comuns, que é exatamente por que
os momentos perigosos são aqueles em que você sai deles.
:::

===
## Um `it` por caso

Cinco testes separados, não um teste com cinco asserções. Quando um teste falha,
o nome dele deve dizer o que quebrou sem você abrir:

```
✓ rejects a body that is not valid JSON
✓ rejects a missing name
✓ rejects a price that is not a whole number
✓ rejects a duplicate name
```

=== check=suite,live-400 quiz=validation
## Depois rode tudo

```bash
npm test
```

Não só o seu arquivo — a suíte inteira. Se um teste de `posts` ficou vermelho,
você quebrou algo que nem estava olhando. Rodar tudo antes de pedir revisão é o
mínimo.

:::try Bata no endpoint de verdade
```bash
curl -X POST http://localhost:3000/api/products \
  -H 'Content-Type: application/json' \
  -d '{"name":"Mug","priceCents":899}'
```

Depois mande algo quebrado e veja ele recusar educadamente em vez de cair:

```bash
curl -X POST http://localhost:3000/api/products \
  -H 'Content-Type: application/json' \
  -d '{"priceCents":-1}'
```
:::
