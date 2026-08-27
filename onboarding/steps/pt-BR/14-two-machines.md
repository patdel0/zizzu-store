Dois arquivos ficam lado a lado em `app/posts/`. Um roda no servidor, outro roda
no seu navegador. Nada nos nomes nem na localização deles te diz qual é qual.

Em vez de aceitar isso na fé, prove. Esta etapa é um experimento.

=== check=server-log,browser-log
## Adicione duas linhas de log

`console.log(...)` imprime uma mensagem. Onde ela imprime é justamente o ponto.

**1.** Abra `app/posts/page.tsx`. Adicione uma linha como a primeira coisa dentro
da função:

```tsx
export default function PostsPage() {
  console.log('[server] posts page rendered');

  return (
```

**2.** Abra `app/posts/posts-board.tsx`. Adicione uma dentro do `useEffect`,
logo acima de `const controller = ...`:

```tsx
useEffect(() => {
  console.log('[browser] posts board mounted');

  const controller = new AbortController();
```

Não se preocupe ainda com o que é o `useEffect` — você só está colocando uma
linha dentro dele. Ele aparece direito na próxima etapa.

===
## Abra duas janelas

Você precisa conseguir ver as duas ao mesmo tempo:

**A saída do servidor.** Num terminal:

```bash
docker compose logs -f app
```

**A saída do navegador.** Nas ferramentas de desenvolvedor do seu navegador, a
aba **Console**.

=== attest=saw-split quiz=where-logged
## Agora recarregue

Recarregue [localhost:3000/posts](http://localhost:3000/posts) e observe as
duas.

- `[server]` aparece **no terminal**.
- `[browser]` aparece **no console do navegador**.
- Nenhuma das duas aparece na outra.

=== attest=found-source quiz=why-secret ask=why-two-places
## O que você acabou de provar

O `console.log` imprime onde ele roda. Essas duas linhas estão na mesma pasta, no
mesmo projeto, escritas na mesma linguagem — e imprimiram em dois lugares
diferentes.

Isso porque rodaram em **dois computadores diferentes**.

`page.tsx` rodou no servidor. A saída dele foi para o log do servidor, e o
código dele nunca foi enviado a lugar nenhum — seu navegador só recebeu o HTML
que ele produziu.

`posts-board.tsx` foi **enviado ao seu navegador como código**, e rodou lá.

:::try Veja o código que foi enviado
Nas ferramentas de desenvolvedor, abra a aba **Sources** — **Debugger** no
Firefox. Encontre `posts-board.tsx` na árvore de arquivos à esquerda.

Você está lendo um arquivo deste projeto dentro de um navegador que nunca teve o
projeto nele.
:::

Isso tem uma consequência:

:::warn Código no navegador não guarda segredo
Todo mundo que usa o seu app tem uma cópia de `posts-board.tsx`. Minificar não
ajuda; continua lá e continua legível.

Então senhas, chaves de API e strings de conexão de banco vivem no código do
servidor, e nunca num arquivo que chega ao navegador. Um componente rodando no
navegador que precisa de dados tem que *pedir* ao servidor — que é o que o
`fetch('/api/posts')` perto do topo do `useEffect` dele está fazendo.
:::

===
## Deixe os logs por enquanto

A próxima etapa usa os mesmos dois arquivos. Você limpa no final dela.
