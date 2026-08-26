Hora de mudar algo e ver aparecer no navegador.

Abra `app/page.tsx`. Essa é a página inicial — o que está em
[localhost:3000](http://localhost:3000).

===
## Por que *esse* arquivo é a página inicial

Antes de editar, uma regra que vai te poupar muita procura. No
[Next.js](https://nextjs.org/docs), **uma pasta é uma URL**. Não existe
configuração de rotas em lugar nenhum; as pastas dentro de `app/` são os
endereços do site.

```
app/
  page.tsx              →  /
  posts/
    page.tsx            →  /posts
  api/
    posts/
      route.ts          →  /api/posts
```

Dois nomes de arquivo carregam todo o significado:

- **[`page.tsx`](https://nextjs.org/docs/app/api-reference/file-conventions/page)**
  renderiza algo que uma pessoa olha.
- **[`route.ts`](https://nextjs.org/docs/app/api-reference/file-conventions/route)**
  responde a uma requisição feita por código.

Coloque um dos dois numa pasta, e o caminho daquela pasta vira a URL dele. Então
`app/page.tsx` é a página em `/`, e é por isso que é o arquivo que você vai
editar.

:::note De trás para a frente
Isso funciona ao contrário também, e é assim que você mais vai usar. Algo errado
em `/posts`? O arquivo é `app/posts/page.tsx`.
:::

===
## Isto não é bem HTML

O que você vê dentro do `return (...)` parece HTML e quase sempre se comporta
como tal. É **[JSX](https://react.dev/learn/writing-markup-with-jsx)**: sintaxe
em formato de [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML) dentro de
um arquivo JavaScript, que o React transforma em elementos de verdade. Três
diferenças vão te pegar:

- `class` se escreve **`className`**, porque `class` já é uma palavra reservada
  do JavaScript.
- Toda tag precisa fechar. `<br>` se escreve `<br />`.
- `{ }` volta para o JavaScript. `<p>{2 + 2}</p>` renderiza “4”.

Todo o resto — `<h1>`, `<p>`, `<a href>` — é exatamente o que você já conhece.

===
## E o estilo não é bem CSS

Não existe uma folha de estilo com regras dentro. Em vez disso, cada classe faz
uma coisinha, e você as combina no elemento:

```html
<p className="mt-2 text-lg font-medium text-zinc-600">Olá</p>
```

`mt-2` é margem no topo, `text-lg` uma fonte maior, `font-medium` um peso mais
forte, `text-zinc-600` um cinza. Isso é
**[Tailwind](https://tailwindcss.com/docs/styling-with-utility-classes)** — e é
[CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) por baixo, escrito de um
jeito específico.

Parece poluído no começo. A troca é que você nunca inventa um nome de classe,
nunca caça numa folha de estilo para descobrir o que um nome faz, e nunca quebra
outra página editando uma regra compartilhada. Como um elemento se parece está
escrito no próprio elemento.

Alguns padrões que vale reconhecer enquanto você lê:

| Classe | Significado |
|---|---|
| `text-3xl` | Tamanho da fonte. `xs` … `sm` `base` `lg` `xl` `2xl` `3xl` … |
| `text-emerald-600` | Cor do texto: um nome de paleta e um tom de 50 a 950. |
| `mt-4` / `px-6` | Margem no topo / preenchimento horizontal. O número é um passo de espaçamento. |
| `flex` `flex-col` `gap-4` | Dispor os filhos em coluna, com espaço entre eles. |
| `dark:text-zinc-50` | Só no modo escuro. |
| `sm:items-start` | Só em telas acima de um ponto de quebra. |

Esses dois últimos são o motivo de algumas listas de classe ficarem longas: um
elemento está descrevendo como ele fica em várias situações ao mesmo tempo.

=== check=sandbox-branch,heading,tagline,served
## Sua alteração

Em `app/page.tsx`:

1. Mude o `<h1>` para dizer **Zizzu Store**. Apague o que há dentro dele agora,
   incluindo o trecho `<code>` e o `{" "}` em volta, e ponha seu texto no lugar.
2. Abaixo do título, acrescente um slogan como parágrafo próprio, em verde:

```html
<p className="text-lg text-emerald-600">Tudo o que você precisa, e algumas coisas que não.</p>
```

Escreva seu próprio slogan. Mantenha a classe `text-emerald-600` — a verificação
abaixo procura por ela.

Salve. Olhe o navegador.

:::warn Se a página não mudou
O `docker compose watch` não está rodando. É o comando da etapa {{step:running}}
que sincroniza suas edições para dentro do contêiner — sem ele o app continua
servindo a cópia com que foi construído, e sua alteração fica invisível sem
nenhum erro para explicar por quê.

Inicie num segundo terminal e deixe lá pelo resto do tutorial.
:::

:::note Quando você quebrar a página
E você vai, logo — uma `}` faltando ou uma tag não fechada. O Next.js vai te
mostrar uma página de erro vermelha com o arquivo e o número da linha.
Leia a primeira linha, vá até aquela linha, e olhe uma linha acima também.
:::
