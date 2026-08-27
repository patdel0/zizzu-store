Seu plano começa pela tabela. Esta etapa faz o banco de dados conseguir guardar
um produto.

Seis cards curtos, uma coisa em cada. Nada para decorar.

===
## Olhe uma que já existe

Abra `lib/prisma/contract.ts` no seu editor e ache isto perto do topo:

```typescript
const Post = model('Post', {
  fields: {
    id: field.id.uuidv7String(),
    title: field.text(),
    content: field.text().optional(),
    authorId: field.uuidString(),
    createdAt: field.temporal.createdAt(),
    updatedAt: field.temporal.updatedAt(),
  },
});
```

Leia como uma frase: *existe uma tabela chamada `Post`, e toda linha nela tem um
id, um título, algum conteúdo, um autor e dois carimbos de tempo.*

Esse bloco se chama **modelo** — a descrição de uma tabela. Não os dados dela; o
formato dela.

:::why O que é uma tabela, se você nunca viu uma
Um banco de dados guarda **tabelas**. Uma tabela é uma grade, como uma planilha:

| id | title | content |
|---|---|---|
| `0199…a1` | Hello | World |
| `0199…b2` | Second post | *(nada)* |

Cada **coluna** é um tipo de informação que toda linha tem. Cada **linha** é uma
coisa concreta — aqui, um post.

Toda coluna tem um tipo, e o banco faz valer. `title` guarda texto, `createdAt`
guarda um carimbo de tempo. Tente salvar a palavra “banana” onde vai um número e
ele recusa. Uma classe inteira de dado ruim simplesmente não consegue entrar.
:::

:::why Por que um arquivo descreve as tabelas
Em muitos projetos você criaria tabelas escrevendo SQL na mão. Aqui, este arquivo
as descreve, e o [Prisma](https://www.prisma.io/docs) constrói tanto as tabelas
reais do [Postgres](https://www.postgresql.org/docs/) *quanto* os tipos
TypeScript a partir dele.

É por isso que seu editor autocompleta cada nome de coluna, e por que um erro de
digitação vira erro antes de você rodar o código.
:::

===
## Experimente o formato antes de escrever

Um produto precisa de um nome, uma descrição opcional e um preço.

Três das quatro respostas estão no modelo `Post` acima. A quarta é `int` — não há
coluna de número inteiro em `Post`, então você não teria como acertar essa
olhando.

:::blank Complete o modelo Product
const Product = {{camel:model}}('Product', {
  fields: {
    id: field.id.uuidv7String(),
    name: field.{{camel:text|string}}(),
    description: field.text().{{camel:optional|nullable}}(),
    priceCents: field.{{camel:int|integer|number}}(),
    createdAt: field.temporal.createdAt(),
    updatedAt: field.temporal.updatedAt(),
  },
});
:::

Dois deles merecem uma segunda olhada: `description` é `.optional()`, então um
produto pode não ter nenhuma. `priceCents` é `field.int()` — um número inteiro.

:::why Por que o preço fica em centavos
Dinheiro é guardado como um número inteiro de centavos, em todo lugar, sempre. R$
9,99 é `999`.

Números decimais em computadores são aproximações: `0.1 + 0.2` realmente dá
`0.30000000000000004` em JavaScript. Esse erro de arredondamento é invisível até
cair na fatura de alguém. Guarde centavos como inteiro, divida por 100 na hora de
mostrar, e o problema nunca existe.
:::

=== check=sandbox-branch,model,exported
## Agora escreva de verdade

Em `lib/prisma/contract.ts`, adicione o modelo `Product` ao lado de `Post` — o
bloco que você acabou de completar.

Depois adicione-o à lista que o arquivo devolve no fim, ao lado de `User` e
`Post`:

```typescript
return {
  models: {
    User: User.relations({
      posts: rel.hasMany(Post, { by: 'authorId' }),
    }),
    Post: Post.relations({
      author: rel.belongsTo(User, { from: 'authorId', to: 'id' }),
    }),
    Product,
  },
};
```

Declarar o modelo não basta sozinho — só modelos nessa lista podem ser
consultados.

=== check=emitted
## Reconstrua os arquivos gerados

```bash
npx prisma-cli contract emit
```

:::why O que aquele comando acabou de fazer
Ele leu `contract.ts` e reescreveu dois arquivos ao lado: `contract.json`, que o
app em execução lê, e `contract.d.ts`, que o seu editor lê. Os dois são
commitados, porque o app precisa deles para rodar.

Rode toda vez que mudar o contrato. Esquecer é a forma mais comum de conseguir um
erro sem sentido — seu editor insistindo que `Product` não existe enquanto você
olha direto para ele.
:::

=== check=reset
## Avise os testes

Abra `test/helpers.ts` e ache `resetDatabase`. Adicione uma linha no topo dela:

```typescript
await db.orm.public.Product.where((product) => product.id.isNotNull()).deleteAll();
```

:::warn Pule isto e você perde uma hora
Essa função esvazia as tabelas antes de cada teste, e as lista na mão — então uma
tabela que ela desconhece mantém suas linhas entre os testes.

Nada quebra agora. Quebra três etapas adiante, quando um teste diz que há um
produto e encontra dois. A falha aparece num teste que você não escreveu, num
arquivo que parece correto, e aponta para o seu handler em vez de para esta
linha.

**O bug e a causa dele muitas vezes estão em arquivos diferentes.** Quando algo
falha num código que você não mudou, pergunte o que você *mudou* de que ele
depende.
:::

===
## Crie a tabela de verdade

Descrever uma tabela não é o mesmo que criar uma. Existem dois bancos:

**O banco de testes** — nada a fazer. O `npm test` cria o que o contrato declara
e o banco não tem, antes de a suíte rodar.

**O banco de desenvolvimento**, que o app no contêiner usa:

```bash
docker compose exec app npx prisma-cli db init --no-interactive --yes
```

```bash
docker compose restart app
```

:::why Por que esse roda dentro do contêiner
O `.env` aponta o app para `db:5432` — um nome de host que só existe na rede dos
contêineres, então o comando tem que rodar onde esse nome é resolvido.
:::

:::why Não é assim que mudanças de esquema costumam funcionar
O `db init` só adiciona o que falta. Ele não renomeia coluna nem muda tipo numa
tabela que já tem dados — isso exige *migrações*, scripts ordenados que levam um
banco de um formato ao seguinte sem perder nada. Você vai conhecê-las na primeira
vez que mudar um modelo existente. Para uma tabela novinha, `db init` basta.
:::

:::try
Commite o contrato e os dois arquivos gerados juntos — um `contract.ts` sem o seu
`contract.json` regenerado é um checkout quebrado para quem der pull.

```bash
git add lib/prisma test/helpers.ts
git commit -m "Add a Product model"
```

Depois marque a linha no seu `PLAN.md`.
:::

=== check=seller-field,seller-relation,emitted-again
## Mudando uma tabela que já existe

O `db init` criou a tabela. Ele não vai alterá-la — só adiciona o que falta.

Isso importa, porque quase toda mudança de esquema que você fizer daqui em diante
será numa tabela que já está lá, muitas vezes com linhas dentro. Então faça uma
agora.

Produtos precisam de um vendedor. Abra `lib/prisma/contract.ts` e adicione **um
campo** ao modelo `Product` que você já escreveu — deixe todo o resto exatamente
como está:

```typescript
    sellerId: field.uuidString().optional(),
```

Coloque depois de `priceCents`. Seu modelo deve agora ter `id`, `name`,
`description`, `priceCents`, `sellerId`, `createdAt` e `updatedAt`.

E no bloco `models` no fim, dê a ele a outra metade:

```typescript
Product: Product.relations({
  seller: rel.belongsTo(User, { from: 'sellerId', to: 'id' }),
}),
```

Depois regenere, como sempre:

```bash
npx prisma-cli contract emit
```

=== attest=dry-run-read
## Olhe antes de saltar

Não aplique ainda. Pergunte o que ele *faria*:

```bash
docker compose exec app npx prisma-cli db update --dry-run
```

O `--dry-run` imprime as operações e não muda nada. Leia. Este é um hábito que
vale construir: num banco com clientes de verdade dentro, o ensaio é a diferença
entre uma alteração e um incidente.

Quando estiver satisfeito:

```bash
docker compose exec app npx prisma-cli db update
```

:::note Se ele pedir que você digite o nome do banco
Essa é a trava de segurança. O `db update` aplica uma operação que poderia
destruir dados só depois de você confirmar digitando o nome — para que um `--yes`
descuidado não consiga derrubar uma coluna. Leia o que ele está prestes a fazer
antes de digitar qualquer coisa.
:::

===
## Duas coisas acabaram de acontecer

**Uma: você adicionou uma chave estrangeira.** `sellerId` guarda o `id` de uma
linha de `User`, e o `rel.belongsTo` é o que diz ao banco e ao construtor de
consultas que essas duas colunas estão ligadas. É só isso que uma relação é — uma
coluna guardando a chave de outra tabela, mais uma declaração escrita do que ela
aponta.

Agora o construtor de consultas consegue segui-la, e você nunca escreve o join:

```typescript
const products = await db.orm.public.Product.include({ seller: true }).all();

products[0].seller?.name;
```

**Duas: você a fez opcional, e não tinha escolha.** `Product` pode já ter linhas.
Uma coluna obrigatória precisa ter valor em toda linha, e ninguém sabe dizer quem
deveria ser o vendedor de um produto que já existe — então o banco recusaria, e
com razão.

Esse é o formato da maioria das mudanças de esquema numa tabela viva:

| Você quer | O que de fato acontece |
| --- | --- |
| Adicionar coluna opcional | Tudo bem. Linhas existentes ficam com `null`. |
| Adicionar coluna obrigatória | Recusado, a menos que você forneça um padrão |
| Renomear uma coluna | Dois passos — adicionar a nova, preencher, remover a antiga |
| Remover uma coluna | Os dados vão embora. Confirme com cuidado. |

:::why Onde entram as migrações
Na sua máquina, o `db update` compara e aplica. Um banco de produção não pode
funcionar assim: a alteração tem que ser revisada antes de rodar, e tem que rodar
do mesmo jeito em todo lugar, na mesma ordem. É isso que uma *migração* é — a
alteração escrita num arquivo e commitada, para poder ser lida na revisão e
repetida em todo ambiente.

`npx prisma-cli migration plan` escreve uma, e `npx prisma-cli migrate` aplica as
pendentes. Você vai usá-las na primeira vez que mudar uma tabela com dados reais
atrás. Hoje, num banco que só você enxerga, o caminho direto serve.
:::

:::try
Commite a alteração e os arquivos regenerados juntos, como antes.

```bash
git add lib/prisma
git commit -m "Add a seller relation to Product"
```
:::
