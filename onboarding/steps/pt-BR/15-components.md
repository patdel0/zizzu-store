Você já editou três arquivos `.tsx`, e ninguém te disse como se chamam as coisas
dentro deles.

Isso acaba aqui. Tudo abaixo está em `app/posts/posts-board.tsx` e
`app/page.tsx` — os dois arquivos que você já tem abertos.

===
## Um componente é uma função que devolve marcação

Abra `app/posts/posts-board.tsx` e vá até o fim. O `Field` é a ideia inteira em
vinte linhas:

```tsx
function Field({ label, name, required, placeholder }: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span>{label}</span>
      <input name={name} required={required} placeholder={placeholder} />
    </label>
  );
}
```

É isso. Uma função. Ela devolve marcação em vez de um número.

**A letra maiúscula não é estilo.** O React a usa para distinguir os seus
componentes das tags do navegador: `<Field />` é seu, `<input />` é do navegador.
Escreva `<field />` e o React procura um elemento HTML chamado `field`, não acha
nada, e não renderiza nada — sem erro.

===
## Props são os argumentos dele

Suba no mesmo arquivo. O `Field` é chamado três vezes:

```tsx
<Field label="Title" name="title" required />
<Field label="Content" name="content" />
<Field label="Author ID" name="authorId" required placeholder="UUID of an existing user" />
```

Cada uma dessas é uma chamada de função. `label="Title"` define o parâmetro
`label`. `required` sozinho significa `required={true}`.

O bloco de tipo logo depois dos parâmetros lista quais props existem e quais são
opcionais — é o `?` da etapa {{step:typescript}}, fazendo o mesmo trabalho aqui.

Três chamadas, uma definição, três campos que não conseguem divergir. É por isso
que você escreve um componente em vez de copiar o bloco `<label>` três vezes.

:::note Você já viu um de uma biblioteca
O `app/page.tsx` tem isto perto do topo:

```tsx
<Image src="/next.svg" alt="Next.js logo" width={100} height={20} priority />
```

Maiúsculo, então é um componente. `src` e `alt` são props. `width={100}` é uma
prop cujo valor é um número em vez de texto — o que exige chaves, porque
`width="100"` seria a string.

É a mesma regra do `{ }` da etapa {{step:first-change}}, agora na posição de
atributo: **chaves significam que a próxima coisa é JavaScript**, onde quer que
apareçam.
:::

===
## Como os dois arquivos se encaixam

A etapa {{step:two-machines}} te fez colocar um log em cada um destes e ver os
dois imprimirem em lugares diferentes. Aqui está a parte que aquela etapa não
disse: um deles renderiza o outro.

```mermaid
flowchart TD
    P["app/posts/page.tsx<br/><i>Server Component</i>"] --> B["&lt;PostsBoard /&gt;<br/><i>posts-board.tsx</i>"]
    B --> F1["&lt;Field label='Title' /&gt;"]
    B --> F2["&lt;Field label='Content' /&gt;"]
    B --> F3["&lt;Field label='Author ID' /&gt;"]
    B --> L["um &lt;li&gt; por post"]
```

Uma página é uma árvore de componentes, cada um uma chamada de função cujo
resultado é colocado dentro do que está acima. O `page.tsx` é curto porque quase
tudo o que ele faz é dizer *coloque o board aqui*.

===
## Mais duas coisas que você vai ler o tempo todo

**Renderização condicional.** Não existe `if` dentro da marcação, então uma
condição é uma expressão que produz ou algo ou nada:

```tsx
{createState.error ? <p role="alert">{createState.error}</p> : null}
```

`null` não renderiza nada.

Mais abaixo no mesmo arquivo há uma versão mais longa —
`loadError ? … : posts === null ? … : posts.length === 0 ? … : …`.
São **quatro estados de uma lista**,
em ordem: falhou, ainda carregando, carregada e vazia, carregada com coisas.

Toda lista que você construir precisa das quatro, e a vazia é a que as pessoas
esquecem.

**Listas e `key`.** Para renderizar muitas coisas você mapeia sobre um array:

```tsx
{posts.map((post) => <li key={post.id}>{post.title}</li>)}
```

`key` é como o React distingue um item de outro entre renderizações. Dê algo
estável e único — um id do banco. **Não o índice do array**, que muda assim que
algo é inserido ou removido, fazendo o React casar as linhas erradas.

=== check=sandbox-branch,tagline-component,tagline-rendered,tagline-served
## Agora escreva um

Você leu quatro componentes. Escreva um.

Pegue o slogan que você acrescentou à página inicial na etapa
{{step:first-change}} e mova para um componente próprio.

**1.** Crie `app/tagline.tsx` — nome de arquivo em kebab-case, componente em
PascalCase, a regra da etapa {{step:naming}} finalmente com algo real a que se
prender:

```tsx
export function Tagline({ text }: { text: string }) {
  // devolva o <p> que você escreveu, com {text} onde estavam suas palavras
}
```

**2.** Em `app/page.tsx`, importe e renderize onde o parágrafo estava:

```tsx
import { Tagline } from './tagline';
```

```tsx
<Tagline text="Tudo o que você precisa, e algumas coisas que não." />
```

**3.** Recarregue. **A página deve estar exatamente como estava antes.**

É esse o teste inteiro. Você mudou como a página é construída e não o que ela
mostra — que é o que quase toda refatoração é, e por que os testes que você
escreve na semana dois valem a pena.

:::note Por que um export nomeado aqui, e um default no `page.tsx`
`page.tsx` e `route.ts` são encontrados pelo Next.js *pela posição nas pastas*,
então ele precisa de uma única coisa óbvia para pegar: o export default.

Todo o resto é export nomeado, para que o import tenha que dizer o que quer —
`import { Tagline }` — e seu editor consiga encontrar, renomear e avisar quando
sumir. Siga o arquivo ao lado e você acerta isso sem pensar.
:::

:::try
Commite sozinho. `Move the tagline into its own component` é um bom assunto: diz
o que mudou, e quem revisar sabe que precisa conferir que nada ficou diferente.
:::

===
## O que você já consegue ler

Volte ao `posts-board.tsx` e leia de cima a baixo. Você não vai acompanhar tudo —
o `useActionState` e o tratamento do formulário são um mecanismo de que você
ainda não precisa, e o `docs/` tem isso para quando precisar.

Mas você já consegue nomear a maior parte do que vê: um componente, suas props, a
marcação que ele devolve, as condições decidindo o que aparece, e a lista sendo
mapeada.

Uma coisa nele ainda não foi explicada, e é a linha que decide onde o arquivo
inteiro roda. Essa é a próxima etapa.
