Lá na etapa 2 você rodou `npm test`, uma lista de vistos verdes passou pela tela,
e ninguém disse o que era aquilo.

Hora de resolver isso, porque tudo daqui em diante é construído em cima.

===
## Leia um

Abra `__tests__/api/posts.test.ts` e ache isto:

```typescript
it('returns the newest post first', async () => {
  await createPost({ title: 'Older' });
  await createPost({ title: 'Newer' });

  const response = await GET(getRequest('/api/posts'));
  const { data } = await response.json();

  expect(data.map((post) => post.title)).toEqual(['Newer', 'Older']);
});
```

Isso é um teste. Ele inteiro. Leia como três frases simples:

1. **Coloque dois posts no banco**, um depois do outro.
2. **Peça a lista ao endpoint.**
3. **Confira que o mais novo voltou primeiro.**

Montar uma situação, rodar o código, comparar a resposta com o que você afirmou
que ela seria. Todo o resto num arquivo de teste é variação dessas três linhas.

:::note As palavras que aparecem
`it(...)` é um teste, e a frase que você passa a ele é o nome dele — o que é
impresso quando falha, e é por isso que soa como descrição e não como rótulo.

`expect(x).toEqual(y)` é a comparação. Se forem diferentes, o teste falha e
imprime os dois.

`describe(...)` só agrupa testes relacionados para a saída ficar legível.
:::

=== attest=saw-it-catch
## Veja um fazer o trabalho dele

Ler não é o mesmo que acreditar. Quebre a coisa que ele verifica.

**1.** Abra `app/api/posts/route.ts` e ache a ordenação, por volta da linha 54:

```typescript
const posts = await db.orm.public.Post.orderBy((post) =>
  post.createdAt.desc(),
)
```

**2.** Troque `.desc()` por `.asc()` — mais novo primeiro vira mais antigo
primeiro. Salve.

**3.** Rode só aquele arquivo:

```bash
npm test -- __tests__/api/posts.test.ts
```

Ele falha. E olhe *como* falha:

```
FAIL  returns the newest post first
  expected [ 'Older', 'Newer' ] to deeply equal [ 'Newer', 'Older' ]
```

Ele nomeia o teste, então você sabe qual comportamento quebrou. Mostra as duas
listas, então você sabe o que aconteceu no lugar. Ninguém precisou abrir um
navegador, clicar em nada, nem lembrar que ordenação era algo a conferir.

**4.** Volte para `.desc()`.

=== check=ordering-restored quiz=what-a-test-is
## O que aquilo substituiu

Sem aquele teste, é assim que você descobre que quebrou a ordenação:

Você sobe o app. Vai até a página de posts. Adiciona um post, depois outro. Olha
qual está em cima. Toda vez que muda algo por perto, faz de novo — e você não
faz, porque é tedioso e você está bem certo de que está tudo bem.

**Um teste é essa conferência manual, escrita uma vez, para que um computador a
faça toda vez em vez de você nunca.**

:::why E é por isso que uma suíte verde prova menos do que parece
Na etapa {{step:tdd}} você vai mudar o limite do título para 5, quebrar o app
para todo usuário real, e ver todos os testes continuarem passando — porque um
teste só verifica um comportamento que alguém descreveu, e ninguém descreveu o
limite do título.

Testes não são uma rede que pega tudo. Eles são exatamente tão bons quanto a
lista de coisas que as pessoas se deram ao trabalho de escrever — o que é motivo
para escrevê-los, não para desconfiar deles.
:::

=== ask=what-tests-buy
## Por que um time os escreve

Pegar os próprios erros hoje é o menor dos motivos.

**Eles tornam o código alterável por estranhos.** Daqui a seis meses alguém edita
uma linha perto do seu endpoint. Essa pessoa nunca viu aquilo e não sabe o que
ele garante. Trinta segundos de `npm test` dizem se ela quebrou algo que alguém
deixou escrito. Sem isso, a jogada segura é não mexer — e código que ninguém ousa
tocar é onde projetos morrem.

**Eles dizem o que o código deveria fazer.** `returns the newest post first`,
`rejects an author who does not exist`. Ler os nomes dos testes de um arquivo que
você nunca abriu te diz o que ele promete, e, diferente de um comentário, um
teste que deixa de ser verdade falha.

**Eles deixam você arrumar as coisas.** Você vai querer reescrever algo que
escreveu semana passada. Com testes, são quinze minutos e uma suíte verde. Sem,
é aposta, então você deixa a bagunça.

**Eles significam que ninguém precisa lembrar.** A pessoa que sabia que a
ordenação importava vai sair, ou esquecer. O teste não.

:::note Duas palavras que você vai ouvir
Alguém quebrar um comportamento antigo sem querer é uma **regressão** — é contra
isso que a suíte realmente protege.

**Cobertura** é a fração do seu código que algum teste executou. É útil e não é
nota: a linha do limite do título tinha cobertura. Nada verificava o que ela
fazia.
:::

===
## O que eles não fazem

Vale saber antes de escrever o primeiro, para você não se decepcionar.

- **Uma suíte verde não significa que o código está correto.** Significa que os
  comportamentos descritos continuam funcionando.
- **Testes não provam que não há bugs.** Provam que os bugs em que você pensou
  não estão lá.
- **Eles custam tempo real.** Cerca de metade das linhas da funcionalidade
  `posts` deste projeto são testes. Isso é normal, e é uma troca — mais lento
  para escrever, muito mais barato para mudar.
- **Um teste ruim é pior que nenhum**, porque parece proteção. Um que nunca falha,
  ou que falha aleatoriamente, é ignorado e depois apagado.

O que deixa uma pergunta, e ela é o assunto da próxima etapa: como você sabe se
um teste que você escreveu presta?
