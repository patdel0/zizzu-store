Todo arquivo que você está prestes a escrever termina em `.ts` ou `.tsx`. Isso é
[TypeScript](https://www.typescriptlang.org/docs/), e é JavaScript com uma
adição: você pode dizer que tipo de coisa um valor é.

Esta etapa é curta. Você precisa de quatro ideias, e vai encontrar todas elas na
próxima hora.

===
## Dizendo o que uma coisa é

Dois pontos depois do nome, e então o tipo de coisa que ela é:

```typescript
const name: string = 'Mug';
const price: number = 899;
const inStock: boolean = true;
```

O mesmo para o que uma função recebe e devolve:

```typescript
function double(n: number): number {
  return n * 2;
}
```

Leia como: *`double` recebe um número e devolve um número.*

Você não vai escrever muitos desses. Na maior parte do tempo o TypeScript
deduz — `const name = 'Mug'` já é sabidamente uma string. Você escreve nos
lugares onde um valor chega de fora, que é exatamente o que um endpoint faz.

===
## Dois que você vai ver em todo lugar neste projeto

**`|` significa “um ou outro”.**

```typescript
content: string | null
```

O conteúdo de um post é ou algum texto ou nada. O TypeScript não vai deixar você
chamar `.length` nele até você ter verificado qual dos dois você tem — e essa
verificação é justamente o que ele está te obrigando a lembrar.

**`?` significa “pode ser omitido”.**

```typescript
function createPost(overrides?: { title?: string })
```

Tanto o argumento quanto o `title` dentro dele podem faltar. Isso é diferente de
`null`, que significa *presente, e deliberadamente vazio*.

:::why Existe um terceiro, e ele aparece daqui a duas etapas
`unknown` significa “um valor, mas eu me recuso a deixar você usá-lo até
verificar o que é”. É o que um corpo JSON vindo da internet é, e é assunto de um
card inteiro mais adiante.

O gêmeo do mal dele é o `any`, que significa “pare de verificar”. O `any` faz o
sublinhado vermelho sumir sem fazer o problema sumir, e é por isso que você quase
nunca vai vê-lo neste projeto.
:::

===
## Saindo do `unknown`

O `unknown` recusa tudo, então em algum momento você tem que convencer o
TypeScript de que verificou. Isso leva dois passos, e você vai escrever
exatamente esse par sempre que um corpo de requisição chegar.

Abra `parseCreatePost` em `app/api/posts/route.ts` e ache:

```typescript
if (typeof body !== 'object' || body === null || Array.isArray(body)) {
  return { ok: false, error: 'Request body must be a JSON object' };
}

const { title, content, authorId } = body as Record<string, unknown>;
```

**O `if` é a verificação de verdade.** Ele roda, e rejeita qualquer coisa que não
seja um objeto JSON — uma string, um número, `null`, um array.

**O `as` não é uma verificação.** `as` é uma *asserção de tipo*: você dizendo ao
compilador “eu sei mais que você sobre este valor, trate-o como este tipo”. Ele
não gera código nenhum e não testa nada em tempo de execução.

O que faz dele o único recurso aqui que você pode usar para mentir. Diga `body as
string` e o TypeScript vai acreditar, e seu código vai quebrar em execução com um
erro de tipo cuja máquina de detecção você desligou. O par acima só é seguro
porque o `if` acima dele fez o trabalho.

| | Verifica em execução? | Seguro? |
| --- | --- | --- |
| `typeof x === 'string'` | Sim | Sim |
| `x as string` | Não | Só se você já provou |
| `x as any` | Não | Nunca — isso desliga a verificação |

Repare no que a asserção diz: `Record<string, unknown>` — um objeto cujas chaves
são strings e cujos **valores continuam `unknown`**. Ela afirma só o que o `if`
provou. Cada campo é então verificado individualmente, que é exatamente o que a
etapa {{step:post-validation}} te faz fazer.

:::note Mais dois que você vai ver e deve deixar quietos
`Char<36>` em `route.ts` e `test/helpers.ts` é um *tipo marcado* — uma string que
a biblioteca marcou como UUID para que uma string qualquer não seja passada por
engano. Você não precisa escrever um. Quando uma função pedir, passe o id que
você recebeu e funciona.

E um `!` depois de um valor — `user!.name` — é outra asserção, significando “isto
não é nulo, confia em mim”. Mesmo aviso do `as`: silencia o compilador sem
verificar nada.
:::

=== attest=saw-editor-error
## Veja o TypeScript pegar algo

**1.** Abra `__tests__/api/posts.test.ts`. Ache uma linha como esta:

```typescript
await createPost({ title: 'Older' });
```

**2.** Troque o título por um número — apague as aspas:

```typescript
await createPost({ title: 42 });
```

**3.** Olhe aquela linha no seu editor. Está sublinhada, antes de você ter rodado
qualquer coisa. Passe o mouse:

> Type 'number' is not assignable to type 'string'.

**4.** Pergunte ao projeto inteiro de uma vez:

```bash
npx tsc --noEmit
```

O mesmo erro, com o arquivo e o número da linha. Nenhum servidor iniciado. Nenhum
banco tocado. Nenhum teste rodado.

**5.** Recoloque as aspas.

===
## Por que isso importa mais do que parece

`createPost` diz que o `title` dele é uma string. Passar um número contradiz algo
já escrito — e uma contradição pode ser encontrada *lendo* o código.

É essa a troca inteira. Você escreve algumas palavras a mais dizendo o que as
coisas são, e em troca uma família grande de erros deixa de ser algo que você
descobre em execução e passa a ser algo que seu editor aponta enquanto você
digita.

Os erros que ele pega são os chatos — um campo escrito errado, um número onde vai
texto, esquecer que algo pode ser `null`. Eles são também, na maioria das bases de
código, a maioria.

:::why Ele desaparece antes de o código rodar
O navegador e o Node não sabem ler TypeScript. Os tipos são removidos antes de
qualquer coisa rodar, e o que executa é JavaScript comum.

Então tipos não custam nada em execução, e também não conseguem te proteger em
execução. Um corpo JSON chegando de fora ainda pode ser qualquer coisa, digam o
que disserem os seus tipos — e é por isso que o endpoint que você vai escrever
verifica a entrada dele na mão.
:::

===
## Onde um tipo vai

Não existe pasta `types/` neste projeto, e isso é de propósito. **Um tipo mora no
arquivo dono dele**, e só é exportado se outra coisa precisar.

Todo tipo escrito à mão nesta base de código segue isso. São quatro:

| Tipo | Onde | Exportado? |
| --- | --- | --- |
| `Parsed<T>` | `app/api/posts/route.ts` | Não — só aquele arquivo faz parsing |
| `CreatePostInput` | `app/api/posts/route.ts` | Não |
| `SerializedPost` | `app/posts/posts-board.tsx` | Exportado — veja abaixo |
| `CreateState` | `app/posts/posts-board.tsx` | Não |

`SerializedPost` é a linha interessante: ele é exportado, e no momento nada fora
daquele arquivo o importa. Confira você mesmo — `grep -rn SerializedPost app`
acha duas ocorrências, as duas em `posts-board.tsx`.

Então ele é exportado por especulação, o que é uma pequena bagunça: um tipo
exportado faz parte da superfície pública de um arquivo, e quem lê tem que supor
que algo depende dele. Exporte quando algo precisar, não por precaução. (Você vai
reencontrar isso na etapa {{step:ui}}, onde a página de produtos realmente precisa
de um.)

Duas regras da casa vêm junto.

**Use `type`, não `interface`.** Os dois funcionam e as diferenças raramente
importam. Este projeto usa `type` nos quatro casos, então use `type` — a regra do
manual vale aqui como em qualquer lugar: consistência vence a sua ideia melhor.

**Só nomeie um tipo quando o nome se justificar.** `CreateState` tem nome porque
o `useActionState` se refere a ele três vezes. Um formato usado uma vez fica mais
claro escrito onde é usado:

```typescript
function badge(product: { name: string; priceCents: number }) { … }
```

Nomear isso acrescentaria uma linha e não diria nada a quem lê.

===
## O tipo que vale olhar duas vezes

`SerializedPost` descreve um post *como ele chega em JSON*, e é quase — mas não
exatamente — o modelo do banco:

```typescript
export type SerializedPost = {
  id: string;
  title: string;
  content: string | null;
  authorId: string;
  createdAt: string;   // um Date no banco de dados
  updatedAt: string;   // aqui também
};
```

JSON não tem tipo de data. O `createdAt` sai do servidor como um `Date` e chega
ao navegador como string, então um tipo descrevendo o que o navegador recebe tem
que dizer `string` — mesmo que o mesmo campo seja um `Date` dois arquivos
adiante.

É por isso que ele é escrito à mão em vez de tirado do contrato: ele descreve o
**fio**, não a tabela.

:::warn E essa é a fraqueza dele
Nada conecta os dois. Adicione um campo a `Post` no contrato, regenere, e o
`SerializedPost` não muda — ele só para silenciosamente de descrever o que o
endpoint envia.

Você vai encontrar a mesma divergência na etapa {{step:database}}, entre o
`contract.ts` e o arquivo gerado a partir dele — só que aquela tem uma
verificação de olho, e esta não. Quando você mudar um modelo, procure
o tipo escrito à mão que o espelha. Normalmente existe um.
:::

:::why E os arquivos `.d.ts`?
Você vai ver dois neste projeto — `next-env.d.ts` e `lib/prisma/contract.d.ts` —
e **os dois são gerados**. Não edite nenhum.

Um `.d.ts` guarda declarações de tipo e nenhum código. Eles são escritos por dois
motivos: descrever uma biblioteca JavaScript que não tem tipos próprios, e
declarar coisas que existem globalmente em execução. Nenhum dos dois aparece no
trabalho comum de aplicação, então dá para passar anos sem escrever um. Se algum
dia precisar, você vai saber por quê — e até lá, um `.d.ts` que você não gerou é
mau sinal.
:::

=== check=tsc-clean quiz=union-meaning ask=why-annotations
## Verifique e limpe

Confirme que as aspas voltaram, e então:

```bash
npx tsc --noEmit
```

Ele não imprime nada quando não há nada errado.

:::note Se você deixou o erro
```bash
git restore __tests__/api/posts.test.ts
```
:::
