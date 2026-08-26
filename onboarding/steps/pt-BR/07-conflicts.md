Uma mensagem do git assusta mais que qualquer outra:

```
CONFLICT (content): Merge conflict in app/page.tsx
Automatic merge failed; fix conflicts and then commit the result.
```

Parece que algo quebrou. Nada quebrou. Você vai causar um de propósito, agora, e
ele vai deixar de ser assustador.

===
## O que é um conflito, de verdade

Duas branches alteraram as mesmas linhas do mesmo arquivo.

O git junta partes diferentes de um arquivo sem perguntar — você edita o
cabeçalho, outra pessoa edita o rodapé, ele fica com os dois. Ele só para quando
duas versões discordam sobre *as mesmas linhas*, porque escolher uma
significaria jogar fora o trabalho de alguém em silêncio.

Então ele para e pergunta a você.

**Um conflito é uma pergunta, não um erro.** Ninguém perdeu nada e nada está
corrompido.

===
## Cause um

Cinco comandos. Você está em `sandbox/seu-nome` com a alteração da página
inicial commitada.

**1.** Crie uma segunda branch a partir da `main` e mude o mesmo título de outro
jeito:

```bash
git switch -c sandbox/conflict-demo main
```

Abra `app/page.tsx` e mude o `<h1>` para dizer `Zizzu Store — everything`. Então:

```bash
git add app/page.tsx
git commit -m "Change the heading a different way"
```

**2.** Volte para a sua branch e traga aquilo para dentro:

```bash
git switch sandbox/seu-nome
```

```bash
git merge sandbox/conflict-demo
```

Aí está.

=== attest=saw-markers
## Leia o que ele deixou para você

Abra `app/page.tsx`. O git escreveu as duas versões dentro do arquivo:

```
<<<<<<< HEAD
          Zizzu Store
=======
          Zizzu Store — everything
>>>>>>> sandbox/conflict-demo
```

Três marcadores, e cada um significa exatamente uma coisa:

| Marcador | Significado |
|---|---|
| `<<<<<<< HEAD` | abaixo disto está a versão **da sua branch** |
| `=======` | a linha divisória |
| `>>>>>>> outra-branch` | acima disto está a versão **da outra branch** |

`HEAD` é a palavra do git para *onde você está agora* — a branch em que você
estava quando começou o merge.

===
## Resolva

Não existe comando esperto. **Você edita o arquivo até ele dizer o que deve
dizer, e apaga as três linhas de marcador.**

Suas opções são as três de sempre:

- ficar com a sua
- ficar com a da outra pessoa
- escrever algo que aproveite as duas

Fique com a sua, desta vez. Apague a versão da outra branch e as três linhas de
marcador, para que o título volte a dizer o que dizia antes do merge:

```tsx
          Zizzu Store
```

**Mantenha tudo o mais que você escreveu.** Dependendo de quão próximas estavam
suas edições, o git pode ter arrastado seu slogan para dentro do bloco em
conflito também. Se arrastou, ele pertence ao arquivo — recoloque exatamente
como estava. Resolver um conflito é decidir o que o arquivo *deve dizer*, não
restaurá-lo a algum estado anterior.

Quando terminar: nenhum `<<<<<<<`, nenhum `=======`, nenhum `>>>>>>>`, e a
página ainda com o seu slogan.

:::warn Os marcadores não têm nada de mágico
São texto comum que o git digitou dentro do seu arquivo. Deixe um por engano e
você commita um arquivo com `>>>>>>> sandbox/conflict-demo` no meio — que então
não compila, de um jeito que parece incompreensível se você já esqueceu de onde
aquilo veio.

Essa é a forma mais comum de isso dar errado. A verificação abaixo procura
exatamente isso.
:::

=== check=sandbox-branch,no-markers,merged ask=what-conflict-is
## Termine o merge

Diga ao git que você resolveu, e commite:

```bash
git add app/page.tsx
```

```bash
git commit
```

Ele escreve a mensagem do commit para você — `Merge branch
'sandbox/conflict-demo'`. Aceite.

Agora veja o que aconteceu:

```bash
git log --oneline --graph -5
```

Você vai ver as duas linhas de histórico se juntarem de novo. Esse
bifurcar-e-reunir é o que um merge *é*, e você acabou de fazer um na mão.

Limpe a branch de treino:

```bash
git branch -d sandbox/conflict-demo
```

:::note Quando você se perder no meio de um merge
```bash
git merge --abort
```

Deixa tudo exatamente como estava antes de você começar. Nada se perde, e você
pode tentar de novo quando souber o que quer.

Lembre desse comando. É a razão pela qual um conflito nunca consegue realmente
te prender.
:::

===
## Como isto aparece no trabalho de verdade

Você vai encontrar conflitos quando sua branch fica aberta por um tempo e a
`main` anda por baixo dela. Tipicamente:

```bash
git switch main
git pull
git switch sua-branch
git merge main
```

— e se os dois mexeram nas mesmas linhas, aparecem os mesmos três marcadores.

Dois hábitos deixam isso raro e pequeno:

**Faça pull com frequência.** Uma branch um dia atrasada conflita num lugar. Uma
branch três semanas atrasada conflita em todo lugar, e cada um é mais difícil
porque você já esqueceu o que estava fazendo.

**Mantenha branches curtas.** O mesmo argumento dos commits pequenos, um nível
acima.

:::why Por que não simplesmente ficar com “a deles” para isso parar
A tentação, no quarto conflito seguido, é aceitar um lado inteiro e seguir em
frente.

Os dois lados são trabalho deliberado de alguém. Descartar o da outra pessoa
remove em silêncio uma alteração que foi revisada e mergeada; descartar o seu
significa refazer. Quando você realmente não sabe qual está certo, a resposta não
é cara ou coroa — é uma mensagem para quem escreveu o outro lado. É uma conversa
de trinta segundos e ninguém vai se importar.
:::
