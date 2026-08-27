Ler é a metade fácil. Agora o endpoint tem que aceitar dados de fora.

Esta etapa faz só o caminho feliz: um produto válido entra, um **201** volta. A
próxima trata de tudo o que pode dar errado, que é a maior parte do trabalho.

=== check=sandbox-branch,asserts-201
## Como um POST aparece num teste

Uma requisição POST carrega um corpo. O `test/request.ts` monta um para você:

```typescript
postRequest('/api/products', { name: 'Mug', priceCents: 899 })
```

Então o teste tem os mesmos três tempos de antes — arrange, act, assert:

```typescript
import { GET, POST } from '@/app/api/products/route';
import { getRequest, postRequest } from '@/test/request';

describe('POST /api/products', () => {
  it('creates a product and returns it', async () => {
    const response = await POST(
      postRequest('/api/products', { name: 'Mug', priceCents: 899 }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      data: { name: 'Mug', priceCents: 899 },
    });
  });
});
```

Repare no [`toMatchObject`](https://vitest.dev/api/expect.html#tomatchobject) em
vez de `toEqual`. O produto salvo também tem um `id`, um `createdAt` e um
`updatedAt` que você não consegue prever, e o `toMatchObject` verifica os campos
que você nomeou e ignora o resto.

**201, não 200.** A requisição criou algo, e o código de status deveria dizer
isso.

Escreva, rode, veja falhar:

```bash
npm test -- __tests__/api/products.test.ts
```

=== ask=why-post-here
## Antes de escrever

Você viu isto horas atrás. Responda de memória — errar aqui não custa nada, e
tentar lembrar é a parte que funciona.

=== check=post-exported,green
## Faça passar

Adicione um export `POST` ao lado do seu `GET`:

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();

  const product = await db.orm.public.Product.create({
    name: body.name,
    description: body.description ?? null,
    priceCents: body.priceCents,
  });

  return Response.json({ data: product }, { status: 201 });
}
```

Verde.

:::warn Esse código não está pronto, e você deveria estar incomodado
Ele confia em tudo o que recebe. Um corpo sem `name`, um preço `"banana"`, um
corpo que nem é JSON — cada um desses o quebra, e uma quebra chega a quem chamou
como um 500, que alega que o servidor está com problema quando na verdade a
requisição é que estava.

Deixe assim por enquanto. Consertar é a próxima etapa, e fazer nessa ordem é o
ponto: você tem uma coisa que funciona, e agora a torna correta.
:::

===
## Prove que ele realmente salvou

Um teste que vale escrever agora, porque pega uma classe inteira de
implementação de fachada:

```typescript
it('saves the product, so a later request can read it back', async () => {
  await POST(postRequest('/api/products', { name: 'Mug', priceCents: 899 }));

  const { data } = await (await GET(getRequest('/api/products'))).json();

  expect(data).toHaveLength(1);
  expect(data[0].name).toBe('Mug');
});
```

O primeiro teste só verifica o que o `POST` *disse*. Este verifica o que ele
*fez* — POST, depois GET, e ver voltar. Se o seu handler devolvesse um objeto
plausível sem escrever no banco, o primeiro teste passaria e este não.

:::note Por que todo teste começa com o banco vazio
`expect(data).toHaveLength(1)` só funciona porque os produtos de nenhum outro
teste ficaram por ali. O `test/setup.ts` chama `resetDatabase` antes de cada
teste — incluindo a linha do `Product` que você adicionou na etapa
{{step:database}} — e é isso que permite rodar os testes em qualquer ordem sem
interferência.
:::

:::try
Commite conforme avança — o teste, depois o handler, depois o segundo teste.
Commits pequenos são mais fáceis de escrever do que de lembrar de dividir depois.
:::
