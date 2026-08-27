=== check=app-up
Você mudou uma página e commitou. Agora descubra o que está de fato acontecendo
quando essa página aparece — observando, não sendo informado.

Tudo nesta etapa é um comando que você roda. Tenha um terminal aberto e o app
rodando.

===
## 1. O que o seu navegador está realmente fazendo

Abra [localhost:3000/posts](http://localhost:3000/posts). Agora abra as
[ferramentas de desenvolvedor](https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Howto/Tools_and_setup/What_are_browser_developer_tools)
do seu navegador — **F12**, ou botão direito e “Inspecionar” — e clique na aba
**Network** (Rede). Recarregue a página.

Cada linha que aparece é uma **requisição**: seu navegador pedindo algo a um
servidor e recebendo uma resposta. Cada linha mostra três coisas que vale
observar:

- o **método** — `GET` em quase todas
- o **caminho** — `/posts`, `/api/posts`, alguns arquivos `.js` e `.css`
- o **status** — `200` num dia bom

É essa a conversa inteira. Seu navegador não recebeu “uma página”. Ele fez uma
requisição pela página e depois mais um punhado pelas coisas de que a página
precisava.

:::try Ache uma linha específica
Procure a linha cujo caminho é `/api/posts`. Clique nela e depois em
**Response**. Isso são dados, não uma página — guarde essa ideia por trinta
segundos.
:::

===
## 2. A mesma conversa, sem navegador

O [`curl`](https://curl.se/docs/manpage.html) é um programa que faz uma
requisição e imprime a resposta. Nada mais. É o menor navegador possível, o que o
torna perfeito para ver o que está acontecendo.

```bash
curl -s http://localhost:3000/posts | head -20
```

Uma parede de HTML. **É exatamente isso que o seu navegador recebeu** — ele só
desenha em vez de imprimir.

Agora o outro:

```bash
curl -s http://localhost:3000/api/posts
```

```json
{"data":[]}
```

=== quiz=html-vs-json
## 3. Páginas são para pessoas, APIs são para programas

Você acabou de pedir a mesma informação ao mesmo servidor duas vezes e recebeu
duas respostas completamente diferentes.

`/posts` te deu HTML: títulos, layout, estilo. Arrumado para um ser humano.

`/api/posts` te deu **[JSON](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/JSON)**:
os valores em si, sem decoração, porque quem quer que esteja lendo é um programa
que vai decidir o que fazer com eles.

Essa segunda coisa é uma **API** — *Application Programming Interface*, que não
te diz nada de útil. Leia como: **o jeito que outro código conversa com o seu
código.**

Se o seu código quer um preço, ele quer `899`, não `<p class="price">R$
8,99</p>` para desmontar. JSON é um formato de texto para valores simples:

```json
{
  "name": "Mug",
  "priceCents": 899,
  "inStock": true,
  "description": null,
  "tags": ["kitchen"]
}
```

Texto vai entre aspas, números não, e `null` significa “nada, deliberadamente” —
que é diferente de um campo estar ausente. Endpoints podem tratar os dois de
formas diferentes, e este trata.

=== quiz=empty-post,missing-path
## 4. Códigos de status: provoque alguns

A flag `-i` faz o curl imprimir a primeira linha da resposta, que é onde o
servidor diz como foi.

```bash
curl -i -s http://localhost:3000/api/posts | head -1
```

```
HTTP/1.1 200 OK
```

Agora peça algo que não existe:

```bash
curl -i -s http://localhost:3000/api/nope | head -1
```

Um **404**. Leia com atenção: o servidor te respondeu. Ele está funcionando
perfeitamente. Simplesmente não existe nada naquele endereço. Isso é diferente do
servidor estar fora do ar, o que não te dá resposta nenhuma.

Agora mande algo que ele não consegue usar — um corpo vazio onde deveria haver
um post:

```bash
curl -i -s -X POST http://localhost:3000/api/posts \
  -H 'Content-Type: application/json' \
  -d '{}' | head -1
```

Um **400**, e se você tirar o `| head -1` vai ver que ele se explica:

```json
{"error":"`title` is required"}
```

Alguém escreveu essa verificação na mão. Semana que vem, esse alguém é você.

O padrão por trás dos números — [a lista completa está no MDN](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Reference/Status):

| Faixa | Significado | Onde olhar |
|---|---|---|
| **2xx** | Funcionou | — |
| **4xx** | Sua requisição estava errada | Corrija quem chamou |
| **5xx** | O servidor quebrou | Leia o log do servidor |

Os que você vai usar de verdade:

| Código | Quando |
|---|---|
| **200** OK | Aqui está o que você pediu. |
| **201** Created | Criei a coisa. Responde a um `POST` bem-sucedido. |
| **400** Bad Request | Não consigo entender o que você mandou. |
| **404** Not Found | Não existe nada nesse caminho. |
| **422** Unprocessable | Eu te entendi, e mesmo assim não dá para fazer. |
| **500** Server Error | Eu caí. Não é culpa sua. |

Você vai conhecer o 201 e o 422 direito quando estiver escolhendo você mesmo.

:::warn Um código de status é uma promessa
Devolver `200 OK` com `{"error": "..."}` dentro é um bug real e comum. Aí todo
mundo que chama precisa ler o corpo para descobrir se deu certo — que é
exatamente o trabalho que o código de status estava ali para fazer.
:::

=== ask=get-repeat
## 5. Por que GET e POST não são intercambiáveis

Rode isto três vezes:

```bash
curl -s http://localhost:3000/api/posts
```

A mesma resposta toda vez, e nada mudou no servidor. Um `GET` **lê**.

Seu navegador reenvia GETs o tempo todo sem perguntar a ninguém: você aperta
voltar, aperta recarregar, restaura uma aba, um buscador rastreia um link. Todos
esses repetem um GET.

Então, se criar uma conta fosse um `GET /create-account?name=…`, um robô passando
por aquele link criaria uma conta. Apertar voltar criaria outra.

`POST` é o método que diz “isto muda alguma coisa”. Nada repete um POST sozinho —
navegadores realmente param e perguntam antes de reenviar um.

**A regra: GET lê, POST muda.** ([Todos os métodos, no MDN](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Reference/Methods).)
Você viu a metade que lê acima. Vai construir a metade que muda na etapa
{{step:post-happy}}.

Mais uma pergunta, respondível com o que você acabou de rodar.
