Antes de escrever qualquer coisa, coloque o projeto no ar e os testes passando.
Essa é a sua linha de base: daqui em diante, se algo ficar vermelho, foi você.

Você precisa de duas coisas instaladas: **Docker** e **Node.js**. O Docker roda
o app e o banco de dados; o Node roda os testes e as ferramentas a partir do seu
próprio terminal.

- Docker: [docs.docker.com/get-started/get-docker](https://docs.docker.com/get-started/get-docker/)
- Node.js 20 ou mais novo: [nodejs.org](https://nodejs.org)

=== check=fixtures,env,node-modules
## Preparação

Na pasta do projeto:

```bash
./script/setup
```

Isso copia `.env.example` para `.env` e instala as dependências. O `.env` guarda
configurações que mudam de máquina para máquina — senhas de banco, esse tipo de
coisa. Ele é deliberadamente nunca commitado, e é por isso que existe um
`.env.example` para copiar.

Enquanto isso roda, veja o que a segunda metade está fazendo.

===
## O código que você não escreveu

O `npm install` acabou de baixar várias centenas de pastas para dentro de
`node_modules/`. Dois arquivos decidem o que vai parar lá.

**`package.json`** é a lista que você mantém. Abra — `dependencies` é o que o
app precisa para rodar, `devDependencies` é o que só você precisa enquanto
trabalha (o executor de testes, o linter, o compilador de TypeScript). Versões
podem ser escritas como faixas: `^4.1.0` significa “4.1.0 ou qualquer 4.x mais
nova”, enquanto um `16.3.2` puro fixa uma versão exata.

**`package-lock.json`** é gerado, enorme, e é o que de fato importa. Ele
registra a versão exata de cada pacote, e de cada pacote de que esses pacotes
precisaram. Ele é commitado de propósito — sem ele, uma faixa como `^4.1.0`
poderia resolver de um jeito na sua máquina e de outro na do seu colega, e você
passaria uma tarde num bug que só existe para um de vocês.

| Comando | O que faz | Quando |
| --- | --- | --- |
| `npm install` | Resolve as faixas, pode atualizar o lockfile | Adicionando ou trocando uma dependência |
| `npm install <nome>` | Adiciona um pacote e o registra | Dependência nova |
| `npm ci` | Instala exatamente o lockfile, ignorando as faixas | Builds automatizados, e quando o seu está uma bagunça |

:::warn `node_modules` nunca é commitado
É enorme, específico da máquina e totalmente reconstruível a partir dos dois
arquivos acima. Está no `.gitignore` por esses motivos. Commitá-lo é um erro
memorável de primeira semana.
:::

:::note Adicionar uma dependência é uma decisão, não um detalhe
Todo pacote é código que você agora distribui e tem que manter atualizado, e
normalmente ele traz outros junto. Antes de adicionar um, pergunte se vale a
pena e se o time já usa algo para isso. É normal levantar isso na issue antes de
fazer.
:::

=== check=app-up
## Coloque no ar

```bash
./script/server
```

Isso sobe dois contêineres: o app na porta 3000 e o Postgres na porta 5432. Dê
alguns segundos para o Next.js compilar e abra
[localhost:3000](http://localhost:3000). Você deve ver a página inicial.

Agora um segundo comando, em outra aba do terminal, e deixe rodando:

```bash
docker compose watch
```

**Você precisa disto a partir da primeira edição.** O contêiner foi construído
com uma *cópia* do seu código, então sem isso nada do que você digitar no seu
computador chega ao app — você edita um arquivo, recarrega e vê a página antiga,
sem nenhum erro para explicar. O `watch` sincroniza suas edições conforme você
salva.

:::note O que é um contêiner
Um contêiner é uma caixinha lacrada com um programa e tudo de que ele precisa. O
banco roda dentro de um, então você nunca instala o Postgres no seu computador e
todo mundo do time fica com a mesma versão. O `docker compose` sobe os dois
juntos.
:::

=== check=db-up,suite-green
## Rode os testes

```bash
npm test
```

Um **teste** é um pedacinho de código que roda parte deste projeto e verifica se
a resposta é a que alguém disse que seria. Há algumas dezenas deles aqui, e o
`npm test` roda todos.

Por enquanto é só o que você precisa — a etapa {{step:what-tests-are}} destrincha
isso direito, e você escreve os seus na semana que vem.

A primeira execução é lenta: ela cria um banco `zizzu_test` separado e as
tabelas dele. Todas as seguintes são mais rápidas.

:::warn Dois bancos, de propósito
A suíte de testes **esvazia todas as tabelas antes de cada teste**. É isso que
permite rodar os testes em qualquer ordem sem que dependam uns dos outros — mas
significa que o banco de testes nunca pode ser aquele em que você está
desenvolvendo. É por isso que o `.env` tem tanto `DATABASE_URL` quanto
`TEST_DATABASE_URL`.
:::

===
## Quando algo dá errado

| O que você vê | O que significa |
|---|---|
| `Cannot connect to the Docker daemon` | O Docker não está rodando. Abra o Docker Desktop. |
| `port is already allocated` | Tem outra coisa na 3000 ou na 5432. Pare, ou descubra com `lsof -i :3000`. |
| `Could not reach Postgres` | Os contêineres não estão de pé. `./script/server`. |
| A página nunca carrega | O Next.js ainda está compilando. Acompanhe com `docker compose logs -f app`. |

`docker compose logs -f app` é o primeiro comando ao qual recorrer quando o app
se comporta mal. Ele te mostra o que o servidor está realmente dizendo.
Acostume-se a recorrer a ele antes de começar a chutar.
