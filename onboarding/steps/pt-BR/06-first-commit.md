Você mudou um arquivo. O git sabe, mas ainda não registrou nada. Confira:

```bash
git status
```

Ele vai mostrar `app/page.tsx` como modificado. Para ver exatamente o que mudou:

```bash
git diff
```

Linhas em vermelho foram removidas, linhas em verde adicionadas. Leia seu
próprio diff antes de todo commit — é a forma mais barata de pegar aquele
`console.log` esquecido.

=== check=sandbox-branch,has-commit,clean-tree
## Preparar, depois commitar

O git registra em dois movimentos, o que parece um a mais até você precisar.

```bash
git add app/page.tsx     # escolha o que entra no próximo commit
git commit               # registre, com uma mensagem
```

O `git add` coloca uma alteração na **staging area** — uma lista de finalistas
para o próximo commit. O `git commit` registra o que estiver nessa lista.

O motivo da separação: você pode commitar *parte* das suas alterações. Se você
corrigiu um erro de digitação enquanto construía uma funcionalidade, dá para
commitar a correção sozinha em vez de enterrá-la numa alteração sem relação.

O `git commit` abre um editor para a mensagem. Se você cair num editor
desconhecido, é o [vim](https://www.vim.org/docs.php) e você pulou a etapa
{{step:git-setup}}: digite sua mensagem depois de apertar `i`, depois aperte
`Esc`, digite `:wq` e Enter. Para mensagens curtas dá para pular o editor:

```bash
git commit -m "Rename the home page heading to Zizzu Store"
```

=== check=message-style
## Escrevendo a mensagem

A mensagem é a única parte do seu trabalho que alguém lê daqui a seis meses. A
convenção aqui — e na maioria dos projetos:

**Escreva o assunto como uma ordem, dizendo o que aplicar o commit faz.**

> Add a tagline to the home page

Leia como: “aplicar este commit vai *adicionar um slogan à página inicial*.”

As regras que decorrem disso:

- Comece com maiúscula, sem ponto final. É um título, não uma frase.
- Menos de 50 caracteres, para ser legível num log.
- Diga o que mudou, não que algo mudou. “Update stuff” não diz nada a ninguém.

| Em vez de | Escreva |
|---|---|
| `updated page` | `Rename the home page heading to Zizzu Store` |
| `Fixed bug` | `Reject a post title longer than 200 characters` |
| `wip` | (não commite “wip” — diga o que ele faz até agora) |

Se uma alteração precisa de explicação, deixe uma linha em branco depois do
assunto e escreva um parágrafo. Use para o **porquê**, não para o quê — o diff já
mostra o quê.

```
Reject a post title longer than 200 characters

The column is text, so a long title was accepted and then broke the
list page's layout. 200 matches the limit the design uses.
```

:::note De onde vêm os 50
É convenção, não regra que o git imponha: **assunto abaixo de 50, corpo quebrado
em 72**. Esses números vêm dos lugares onde a mensagem é exibida — `git log
--oneline`, a lista de commits do GitHub, `git blame` — que cortam o assunto por
volta de 50 e foram pensados para terminais de 80 colunas.

O efeito colateral útil: se o seu assunto não cabe em 50 caracteres, normalmente
é porque o commit está fazendo duas coisas, e quer ser dois commits.
:::

===
## Commits pequenos

Um commit deve ser uma ideia. Não “um dia de trabalho” e não “uma linha” — uma
alteração que você conseguiria descrever numa frase sem usar a palavra “e”.

Não custa nada agora e compensa o tempo todo: quem revisa consegue ler seu
trabalho em pedaços, e se algo quebrar depois, o git consegue achar exatamente o
commit que fez isso.

:::note Dá para corrigir o último
Mensagem errada? `git commit --amend` reabre. Esqueceu um arquivo?
`git add <arquivo>` e depois `git commit --amend`. Os dois são seguros *antes* de
dar push. Depois do push, outras pessoas podem ter o seu commit, e reescrever
passa a ser deselegante.
:::

:::try
Commite sua alteração da página inicial. Depois rode `git log --oneline` e veja
seu commit no topo do histórico do projeto.
:::

A verificação do card anterior lê suas mensagens de commit e diz especificamente
o que corrigir. Ouvir “isso deveria ser `Add`, não `Added`” é uma coisa normal de
se ouvir numa revisão de código, e mais fácil de ouvir de um programa do que de
uma pessoa.
