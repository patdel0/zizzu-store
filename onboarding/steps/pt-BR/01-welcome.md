Bem-vindo. Este tutorial pressupõe que você não sabe nada sobre como um projeto
web funciona, porque a maioria das pessoas que começa o primeiro não sabe, e
fingir o contrário só desperdiça o seu tempo.

Então ele começa do começo: o que é um servidor, o que acontece quando você abre
um site, o que é uma API, para que serve um banco de dados. Só depois disso ele
encosta no código deste projeto.

===
## O que você vai acabar fazendo

No final você terá adicionado uma funcionalidade que funciona a um código de
verdade — uma tabela no banco, um endpoint, uma página e testes para tudo isso —
e a terá levado pelo processo que um time de verdade usa: uma branch, commits
pequenos, um pull request, uma revisão.

Espere dois dias, e mais que isso é comum — as estimativas de cada etapa
pressupõem que você não vai parar para entender nada, o que você deveria fazer.
Ninguém está cronometrando você.

=== quiz=sandbox
## Nada do que você fizer aqui conta

Você vai trabalhar na sua própria branch descartável, e no final vai fechar seu
pull request **sem fazer merge**. O projeto termina exatamente como você o
encontrou.

Isso é proposital. Significa que não há como quebrar nada, então você pode parar
de ter cuidado do jeito que deixa as pessoas lentas — não clicar em nada, não
mudar nada, pedir permissão para tudo. Apague coisas. Veja o que acontece.

:::note Se você quebrar algo feio
Você não consegue danificar o projeto de verdade. Seu trabalho acontece na sua
própria branch, e toda etapa que muda alguma coisa diz como desfazer.

Duas coisas não voltam sozinhas, e é melhor saber agora do que se surpreender
depois:

- **Arquivos que você criou mas nunca commitou.** Eles vão junto quando você
  troca de branch, porque o git ainda não está rastreando.
- **O banco de dados de desenvolvimento.** Ele vive no Docker, não no git, então
  trocar de branch não faz nada com ele.

A etapa {{step:cleanup}} restaura os dois e mostra os comandos.
:::

===
## Como funciona

Cada etapa explica uma ideia, pede que você faça algo no seu editor e no seu
terminal, e então **verifica o seu repositório de verdade** — seus arquivos, sua
branch, seus commits, seus testes.

Nada é simulado. Quando uma verificação fica verde, a coisa funciona de verdade.
Quando fica vermelha, ela diz o que procurou e o que fazer em seguida.

Algumas etapas fazem perguntas em vez disso. Elas não são prova; você pode
responder quantas vezes quiser. Existem porque ler algo e ter entendido são
coisas diferentes, e é melhor descobrir agora.

:::warn Deixe isto rodando — e anote como reiniciar
Mantenha o servidor do tutorial na própria aba do terminal. Ele carregou tudo de
que precisa quando iniciou, então você pode trocar de branch à vontade sem
atrapalhá-lo.

Isto leva alguns dias, então em algum momento você vai fechar essa aba ou
reiniciar a máquina. **Anote isto em algum lugar fora do projeto**, porque o
comando vive numa branch da qual você está prestes a sair:

```bash
git switch onboarding && ./onboarding/start
```

Depois reabra [localhost:4000](http://localhost:4000). Defina `ONBOARDING_PORT`
se a porta 4000 estiver ocupada. Volte para a sua branch em seguida — o servidor
não se importa em qual branch você está depois de iniciado.

Seu progresso é salvo fora do projeto, então fechar a aba do navegador, ou o
notebook, não perde nada.
:::

===
## O que você vai usar

Você não precisa saber essas coisas. Precisa saber que elas existem, para que,
quando uma aparecer numa mensagem de erro, você saiba qual parte do sistema está
reclamando. Cada uma tem link para a documentação — é para lá que se vai quando
este tutorial acaba e uma pergunta de verdade começa.

| | |
|---|---|
| [Next.js](https://nextjs.org/docs) | O framework web. Serve páginas *e* responde requisições de API. |
| [React](https://react.dev) | Como as páginas são descritas, em componentes. |
| [TypeScript](https://www.typescriptlang.org/docs/) | JavaScript com tipos, para que erros sejam pegos antes de você rodar qualquer coisa. |
| [Tailwind CSS](https://tailwindcss.com/docs/styling-with-utility-classes) | Estilo, escrito como classes pequenas na marcação. |
| [PostgreSQL](https://www.postgresql.org/docs/) | O banco de dados. |
| [Prisma](https://www.prisma.io/docs) | Como o código consulta o banco, em TypeScript tipado. |
| [Vitest](https://vitest.dev/) | Testes para funções e endpoints de API. |
| [Playwright](https://playwright.dev/) | Testes que dirigem um navegador de verdade. |
| [Docker](https://docs.docker.com/) | Roda o app e o banco, para que a máquina de todo mundo seja igual. |
| [git](https://git-scm.com/docs) | Guarda o histórico do projeto. |

Cada uma é apresentada onde você precisa dela pela primeira vez.

===
## Três coisas que vale saber de saída

**Estar travado é o trabalho.** Não é uma fase que se supera. Gente com vinte
anos de experiência trava várias vezes por semana; só ficou mais rápida em
reconhecer isso e pedir ajuda. Existe uma etapa inteira sobre como pedir bem.

**Não se espera que você memorize isto.** Ninguém guarda um código inteiro na
cabeça. As pessoas sabem mais ou menos onde procurar, e procuram. Este tutorial
está tentando te dar o “mais ou menos onde”, não um mapa decorado.

**A sensação de estar perdido nunca vai embora de vez.** Toda pessoa
desenvolvedora sente isso ao cair num código desconhecido — no primeiro dia, de
novo no próximo emprego, e de novo naquele canto deste sistema que ainda não
abriu. O que a experiência muda não é a sensação, e sim quanto ela dura:
fundamentos deixam você reconhecer o formato das coisas mais rápido, então a
névoa se dissipa numa tarde em vez de numa quinzena.

Agora, coloque o projeto no ar.
