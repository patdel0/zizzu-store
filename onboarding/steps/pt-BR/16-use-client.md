Você provou que os dois arquivos rodam em lugares diferentes. Agora descubra o
que decide isso, e o que custa.

Olhe a primeiríssima linha de `app/posts/posts-board.tsx`:

```tsx
'use client';
```

É esse o mecanismo inteiro. Uma linha, [com uma página de documentação só para
ela](https://react.dev/reference/rsc/use-client).

=== check=counter
## Experimento 1: construa algo que precise do navegador

O jeito mais claro de sentir a diferença é adicionar algo que só poderia
funcionar num navegador: um botão que conta os próprios cliques.

Em `posts-board.tsx`, ache a linha perto do topo:

```tsx
const [posts, setPosts] = useState<SerializedPost[] | null>(null);
```

Adicione a sua embaixo:

```tsx
const [clicks, setClicks] = useState(0);
```

Depois, logo acima do `</div>` que fecha no final do componente, adicione um
botão:

```tsx
<button onClick={() => setClicks(clicks + 1)}>
  Clicado {clicks} vezes
</button>
```

Duas coisas sobre aquela primeira linha. As duas são fáceis de errar e nenhuma
te dá um erro.

**`onClick` quer uma função, não o resultado de uma.** O `() =>` é o que a torna
uma função. Escreva `onClick={setClicks(clicks + 1)}` e ela roda na hora,
enquanto a página está sendo desenhada — o que muda o estado, o que redesenha, o
que roda de novo.

**As chaves são a mesma regra de sempre**: a próxima coisa é JavaScript.
`onClick="setClicks(clicks + 1)"` é uma string, e uma string não faz nada ao ser
clicada, silenciosamente.

Salve, recarregue a página e clique algumas vezes. O número sobe.

===
### O que aquela linha fez, de fato

```tsx
const [clicks, setClicks] = useState(0);
```

O [`useState`](https://react.dev/reference/react/useState) te dá duas coisas, e
os colchetes as separam:

- **`clicks`** — o valor atual. Começa em `0`, o argumento que você passou.
- **`setClicks`** — a única forma de mudá-lo.

Mudar não é como numa variável comum. `setClicks(3)` faz duas tarefas: guardar o
novo valor **e re-executar o componente para que a tela acompanhe**. Essa segunda
tarefa é o motivo pelo qual você nunca deve escrever `clicks = 3` direto — o
valor mudaria e nada na tela perceberia.

É esse o truque inteiro do React: você descreve como a página deve ficar para um
determinado estado, e o React re-executa isso sempre que o estado muda.

:::note Quando o novo valor depende do antigo
`setClicks(clicks + 1)` serve aqui. Quando várias atualizações podem acontecer
antes de um redesenho, passe uma função no lugar e o React te entrega o valor
atual:

```tsx
setClicks((current) => current + 1);
```

A mesma forma já está neste arquivo — `setPosts((current) => [body.data,
...(current ?? [])])`. Recorra a ela sempre que o novo valor for calculado a
partir do antigo.
:::

:::try Prove que a re-execução acontece
Você ainda tem o `console.log('[browser] posts board mounted')` no `useEffect`.
Adicione um segundo log bem no topo da função do componente, fora de tudo:

```tsx
export function PostsBoard() {
  console.log('[browser] component ran');
```

Agora clique no botão e observe o console. `component ran` aparece **toda vez que
você clica** — o React está re-executando a função inteira para descobrir o que
mudou.

`mounted` aparece só uma vez, porque é para isso que serve o
[`useEffect`](https://react.dev/reference/react/useEffect): trabalho que deve
acontecer quando o componente aparece pela primeira vez, não a cada
re-execução. Carregar os posts é exatamente esse tipo de trabalho.

**O que faz rodar uma vez é a última linha do efeito.** Vá até o fim dele:

```tsx
  return () => controller.abort();
}, []);
```

O `useEffect` recebe dois argumentos — uma função e uma lista de coisas que devem
fazê-la rodar de novo. Aquele `[]` é a lista, e uma lista vazia significa “nada
faz; rode só depois da primeira renderização”.

Deixe a lista de fora por completo e ele roda depois de *toda* renderização. Se o
efeito então muda estado, essa renderização causa outra, que roda o efeito de
novo. Não é um laço que dá para ver no código; é um que se vê na aba de rede.

Tire o log extra depois de ver.
:::

=== check=use-client-intact attest=removed-marker
## Experimento 2: tire o marcador

Agora apague a linha `'use client';` do topo de `posts-board.tsx`. Salve.
Recarregue.

A página quebra, e o erro vale a leitura antes de você consertar:

> You're importing a component that needs `useState`. This React hook only
> works in a Client Component.

O `useState` precisa de algum lugar para *guardar* o estado entre cliques, e de
algo para *perceber* o clique. Um servidor renderizou esta página e seguiu em
frente milissegundos atrás. Não sobrou nada lá para segurar um número ou ouvir um
botão.

**Recoloque a linha.**

=== check=page-clean attest=state-on-server
## Experimento 3: a mesma coisa, pelo outro lado

Agora tente ao contrário. Em `app/posts/page.tsx` — o Server Component, sem
`'use client'` — adicione um import no topo do arquivo:

```tsx
import { useState } from 'react';
```

e uma linha dentro da função:

```tsx
export default function PostsPage() {
  const [x, setX] = useState(0);
```

Recarregue. Mesma classe de erro.

**Tire de novo.** A verificação abaixo vai te avisar se você deixou.

=== quiz=what-marker-does ask=which-to-use
## Do que cada lado abre mão

| | Server Component | Client Component (`'use client'`) |
|---|---|---|
| Onde o código dele roda | No servidor | No navegador do usuário |
| O usuário consegue ler o código? | Não | **Sim** |
| Pode guardar senha ou chave de API? | Sim | **Nunca** |
| Pode consultar o banco diretamente? | Sim | Não — tem que pedir a uma API |
| Pode usar `useState`, `onClick`? | Não | Sim |
| Roda de novo quando o estado muda? | Não, uma vez | Sim, toda vez |

Leia a última coluna de cima a baixo e o desenho deste projeto sai dela.
`posts-board.tsx` tem um formulário, então precisa de estado, então precisa ser
um Client Component, então o código dele vai para o navegador, então ele não pode
encostar no banco, então ele tem que pedir a `/api/posts`.

**É por isso que o endpoint existe.** Não é organização, nem regra de framework.

:::note Qual escolher
O padrão é o Server Component: menos código, uma ida e volta em vez de duas, e os
dados nunca precisam viajar como JSON.

Vá para um Client Component quando a página tiver que **mudar depois de
carregada** — um formulário que adiciona a uma lista, um filtro, um botão que faz
alguma coisa.
:::

===
## Limpe

Rode a verificação enquanto seu contador ainda está lá. Depois jogue fora tudo
destas duas etapas:

```bash
git restore app/posts/page.tsx app/posts/posts-board.tsx
```

O [`git restore`](https://git-scm.com/docs/git-restore) descarta alterações não
commitadas de um arquivo e o devolve ao último estado commitado. É o botão de
desfazer para “eu só estava cutucando isto”, e você vai usar o tempo todo.

:::warn Ele realmente joga as alterações fora
Sem confirmação, sem desfazer. Aqui tudo bem — eram experimentos — mas rode
`git diff` antes quando estiver menos certo do que vai perder.
:::
