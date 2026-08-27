Seu plano tem uma tarefa: *recusar entrada inválida com 400 (nome ausente, preço
inválido)*.

Isso ainda é grande demais para digitar direto no editor. O que conta como preço
inválido? `"899"` é um preço? E `9.99`? E `0`?

Essas não são perguntas de implementação — são perguntas sobre o que a função *é*.
**PREP** é um hábito de quatro passos para respondê-las antes de escrever
qualquer código, e leva uns dois minutos.

| | | |
|---|---|---|
| **P** | Parâmetros | O que entra, e o que isso poderia ser? |
| **R** | Retornos | O que sai, em todos os casos? |
| **E** | Exemplos | Pares concretos de entrada → saída. Estes viram seus testes. |
| **P** | Pseudocódigo | Os passos, em português claro. |

Você vai aplicar isso a uma função pequena e terminar com um pedaço de código
real e testado que o endpoint usa depois.

===
## A função

`parsePriceCents` recebe algo que chegou por HTTP — então pode ser literalmente
qualquer coisa — e decide se é um preço utilizável.

===
### P — Parâmetros

**O que entra:** um valor, de um corpo JSON. O tipo dele é `unknown`.

Essa palavra está trabalhando de verdade — é o `unknown` da etapa
{{step:typescript}}, então nada pode ser feito com este valor até ele ser
verificado.

Então: o que poderia de fato chegar?

```
899          um preço válido
"899"        um número como texto — erro muito comum em formulário
9.99         reais, não centavos
0            de graça?
-100         negativo
undefined    o campo foi omitido por completo
null         o campo foi enviado, deliberadamente vazio
"banana"     absurdo
1e400        maior do que um número consegue guardar; vira Infinity
```

Escrever essa lista é a maior parte do trabalho. Cada linha dela é uma decisão
esperando ser tomada, e agora você viu todas de uma vez em vez de descobri-las
uma quebra por vez.

===
### R — Retornos

Dois desfechos: um preço válido, ou um motivo de não ser. Este projeto já tem um
formato para isso — você viu em `app/api/posts/route.ts`:

```typescript
type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };
```

Então `parsePriceCents` devolve `Parsed<number>`. Nunca lança erro, nunca devolve
`null` — quem chama recebe ou um número ou uma frase explicando a recusa.

:::note Por que não simplesmente lançar um erro?
Porque esta não é uma situação excepcional. Uma pessoa digitando um preço
inválido é uma terça-feira normal. Devolver o motivo deixa o trabalho do handler
óbvio — se não for `ok`, responda 400 com a mensagem — e significa que o motivo é
uma frase que você pode colocar na frente de uma pessoa.
:::

===
### E — Exemplos

Agora as decisões. Escreva o que cada entrada produz:

| Entrada | Resultado | Porque |
|---|---|---|
| `899` | ok, `899` | Um preço comum. |
| `"899"` | erro | Texto, não número. Seja rígido na fronteira. |
| `9.99` | erro | Não é um número inteiro de centavos. |
| `0` | erro | Não está à venda por zero. |
| `-100` | erro | Alguém é pago para levar. |
| `undefined` | erro | Campo obrigatório, ausente. |
| `null` | erro | Idem. |
| `"banana"` | erro | Absurdo. |

Oito exemplos, oito decisões tomadas — no papel, antes de existir código para
discutir.

:::warn Estes *são* os seus testes
Esta é a parte que as pessoas pulam, e é a parte que compensa. Um exemplo é um
teste com a sintaxe ainda não escrita. Você não precisa inventar casos de teste
depois, porque já os tem.
:::

===
### P — Pseudocódigo

Agora, e só agora, os passos:

```
se não for número, recuse
se não for inteiro, recuse
se não for maior que zero, recuse
caso contrário está tudo bem
```

Quatro linhas, e cada uma remete a uma linha da tabela de exemplos.
=== check=sandbox-branch,prep-notes,exported,examples-are-tests,passes ask=why-examples-first
## Escreva

**1. Crie `lib/products.ts`** com o seu PREP como comentário, e depois a função:

```typescript
/**
 * Parses a price arriving from an untrusted JSON body.
 *
 * Parameters: `raw` — unknown, straight from `request.json()`.
 * Returns:    { ok: true, value } with a positive whole number of cents,
 *             or { ok: false, error } with a reason to show the caller.
 * Examples:   899 → ok. "899", 9.99, 0, -100, undefined, null → error.
 * Pseudocode: not a number → refuse; not whole → refuse; not > 0 → refuse.
 */
export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export function parsePriceCents(raw: unknown): Parsed<number> {
  // seu código
}
```

Mantenha o PREP como comentário. Daqui a seis meses ele diz à próxima pessoa *por
que* `"899"` é recusado, coisa que o código sozinho não diz.

**2. Transforme cada exemplo num teste**, em `__tests__/products.test.ts`:

```typescript
import { parsePriceCents } from '@/lib/products';

describe('parsePriceCents', () => {
  it('accepts a positive whole number of cents', () => {
    expect(parsePriceCents(899)).toEqual({ ok: true, value: 899 });
  });

  it('rejects a number sent as text', () => {
    expect(parsePriceCents('899').ok).toBe(false);
  });

  // ...um `it` por linha da sua tabela
});
```

Um `it` por exemplo. Quando um teste falha, o nome dele deve te dizer o que
quebrou sem você abrir o arquivo.

**3. Rode, e veja falhar:**

```bash
npm test -- __tests__/products.test.ts
```

:::note O Postgres precisa estar rodando, mesmo para isto
`parsePriceCents` nunca encosta no banco — mas o `npm test` prepara o banco de
testes uma vez antes de *qualquer* teste rodar, seja qual for o arquivo que você
pediu. Se você vir `ECONNREFUSED ... :5432`, é isso que significa:
`./script/server`, e tente de novo.
:::

Eles precisam falhar primeiro.

**4. Agora escreva a função** até eles passarem. Seu pseudocódigo é a
implementação; você está mais traduzindo do que criando.

:::note `Number.isInteger` faz mais do que você imagina
`Number.isInteger(raw)` é `false` para `"899"` (uma string), para `9.99` (não
inteiro), para `undefined`, para `null` e para `Infinity`. Uma verificação cobre
a maior parte da sua tabela — o que você só consegue enxergar *porque* escreveu a
tabela.
:::

===
## É este o hábito

Você acabou de fazer desenvolvimento guiado por testes, sem a expressão ser
usada. Exemplos antes do código, vê-los falhar, fazê-los passar.

As próximas etapas fazem a mesma coisa no endpoint em si, onde há um banco de
dados envolvido e é mais difícil de enxergar. São as mesmas quatro perguntas
sempre:

**O que entra? O que sai? Quais são os casos? Quais são os passos?**

:::try
Commite — o teste e a função, como dois commits separados, teste primeiro:

```bash
git add __tests__/products.test.ts
git commit -m "Add failing tests for parsePriceCents"
git add lib/products.ts
git commit -m "Add parsePriceCents"
```

Depois marque a linha no seu `PLAN.md`.
:::

===
## Agora escreva o que você decidiu

O PREP acabou. Você tem uma função testada e — esta é a parte que evapora — um
conjunto de decisões que ninguém mais enxerga. Por que `"899"` é recusado. Por
que zero não é preço. Você raciocinou tudo isso uma hora atrás e o código não diz
nada disso.

O resto desta etapa é sobre deixar aquilo onde a próxima pessoa encontra, o que
nesta base de código significa um **docblock**: o comentário `/** … */` acima de
uma função.

Comece vendo o que um deles te dá.

Abra `__tests__/api/posts.test.ts` e ache uma chamada a `createPost`. Passe o
mouse sobre a palavra `createPost`.

Seu editor te mostra isto, sem você abrir o arquivo de onde veio:

> Creates a post. Creates an author too unless you pass one.

Esse texto não é mágica. Ele está em `test/helpers.ts`, num comentário
imediatamente acima da função:

```typescript
/** Creates a post. Creates an author too unless you pass one. */
export async function createPost(
```

**Dois asteriscos.** `/**` é um **docblock**; `/*` e `//` são comentários comuns e
seu editor os ignora. Esse único caractere é toda a diferença entre uma anotação
que ninguém vê e documentação que acompanha a função por onde ela for.

===
## As duas marcações que valem a pena

Um docblock pode ter uma linha, como o de cima. Quando uma função recebe algo e
devolve algo, diga os dois:

```typescript
/**
 * Turns a price from an untrusted request body into a number of cents.
 *
 * Takes the value straight from `request.json()`, which could be anything at
 * all. Gives back the price in cents, or the reason it was refused — never
 * throws.
 */
```

Seu editor mostra isso a quem estiver chamando a função, *enquanto a pessoa
digita a chamada* — o momento em que ela precisa e o momento em que menos
provavelmente iria procurar.

:::note Existe uma sintaxe de tags, e este projeto não a usa
Você vai ver `@param` e `@returns` em outras bases de código, e seu editor os
entende. Todo docblock deste repositório é prosa simples.

Siga o repositório. Uma convenção só vale alguma coisa se for seguida em todo
lugar, e consistência vence a ideia melhor — que é o mesmo conselho com que a
etapa {{step:naming}} terminou.
:::

:::why Por que não descrever isso no próprio código
Nomes carregam muito, e bons nomes vencem um comentário sempre. Mas algumas
coisas um nome não segura.

`parsePriceCents` diz o que ela faz. Não diz que `"899"` é recusado de propósito,
que a resposta é em centavos e não em reais, ou que ela nunca lança erro. Essas
são decisões, e quem ler daqui a seis meses vê o que foi decidido, nunca que uma
decisão foi tomada.
:::

=== check=has-docblock,docblock-useful attest=saw-hover
## Escreva o docblock

Abra `lib/products.ts`. Substitua seu comentário PREP por um docblock, ou faça-o
crescer até virar um — ele já está quase lá.

Mire em quatro linhas:

- uma frase sobre para que a função serve
- o que entra, e que é dado não confiável
- o que volta, nos dois casos
- uma linha sobre uma decisão que o código não consegue explicar, como o motivo
  de o preço estar em centavos

Depois vá até algum lugar onde `parsePriceCents` é chamada — seu arquivo de
teste — e passe o mouse sobre o nome. Suas próprias palavras voltam para você.

:::note Guarde os exemplos do PREP se quiser
A tabela de entradas foi um raciocínio útil e é uma leitura útil. Não há nada de
errado com um docblock que termina com alguns valores de exemplo; várias funções
deste projeto fazem exatamente isso.
:::

===
## O hábito

Escreva o docblock quando escrever a função, não depois. O depois nunca chega, e
até lá você já esqueceu quais partes eram decisões.

O teste para saber se ele se justifica: **ele diz algo que o código não consegue
dizer sozinho?** Se ele repete o nome da função com mais palavras, apague.

```typescript
/** Parses the price cents. */          // não diz nada
/** Refuses anything that is not a
    positive whole number of cents. */  // diz o que conta como válido
```

Você vai reencontrar isto nas próximas etapas: o endpoint que você está prestes a
terminar também tem decisões dentro — qual código de status significa o quê, e
por que a verificação de duplicata acontece antes da escrita.
