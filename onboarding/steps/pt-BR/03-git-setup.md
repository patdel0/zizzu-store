Você já tem o [git](https://git-scm.com/docs) — foi com ele que este projeto
chegou à sua máquina. Mas uma instalação nova não sabe quem você é, e até saber,
o `git commit` simplesmente recusa:

```
Author identity unknown

*** Please tell me who you are.

fatal: unable to auto-detect email address
```

Cinco minutos agora evitam bater nesse muro daqui a três etapas.

===
## Por que o git quer isso

Todo commit registra **quem o fez e quando**, permanentemente. Isso não é
burocracia — é o que permite que alguém daqui a seis meses encontre a pessoa que
escreveu uma linha confusa e pergunte sobre ela.

Como é permanente, e como este projeto está no GitHub, use seu nome real e um
endereço real.

=== check=name,email
## Diga a ele quem você é

```bash
git config --global user.name "Seu Nome"
```

```bash
git config --global user.email "voce@exemplo.com"
```

Use o e-mail da sua conta do GitHub. Se não baterem, o GitHub não vai vincular
seus commits ao seu perfil — seu trabalho aparece como o de um estranho sem
nome.

:::note O que `--global` significa
Ele escreve em `~/.gitconfig`, então vale para todo projeto nesta máquina, não
só para este. É o que você quer.

Se algum dia precisar de uma identidade diferente para um projeto — um endereço
de trabalho em repositórios de trabalho — rode o mesmo comando sem `--global`
dentro daquele projeto.
:::

=== check=editor
## Escolha um editor do qual você saiba sair

O `git commit` abre um editor de texto para a mensagem do commit. Em muitas
máquinas o padrão é o [vim](https://www.vim.org/docs.php), e o primeiro encontro
com o vim costuma ir mal: ele tem modos, ignora o que você digita, e sair dele
não é óbvio.

Escolha outra coisa agora.

| Editor | Comando |
|---|---|
| VS Code | `git config --global core.editor "code --wait"` |
| Nano — simples, no terminal | `git config --global core.editor "nano"` |
| Sublime Text | `git config --global core.editor "subl -n -w"` |
| Vim, de propósito | `git config --global core.editor "vim"` |

O [Nano](https://www.nano-editor.org/docs.php) é a escolha segura se você estiver
em dúvida: ele lista os próprios atalhos no rodapé da tela. Salvar e sair é
**Ctrl+O**, **Enter**, **Ctrl+X**.

:::note Se você escolheu o vim mesmo assim
Aperte `i` para começar a digitar. Depois `Esc`, digite `:wq` e aperte Enter
para salvar e sair — ou `:q!` para sair sem salvar.
:::

===
## Mais duas que vale configurar

```bash
git config --global init.defaultBranch main
```

Nomeia a primeira branch como `main` em qualquer repositório que você criar
daqui em diante. Este projeto já usa `main`; a configuração evita que você crie
uma chamada `master` sem querer e tenha que renomear.

```bash
git config --global pull.rebase false
```

Diz ao git como combinar seu trabalho com o das outras pessoas quando você faz
`git pull`. Sem isso, o git insiste a cada pull até você escolher. `false` é a
opção direta, e combina com o que este projeto espera.

=== check=identity-check
## Confira

```bash
git config --list --global
```

Você deve ver seu nome, seu e-mail e seu editor. Se algo parecer errado, rode o
mesmo comando `git config` de novo — o último vence.

:::note Identidade é só metade
Mandar seu trabalho *para* o GitHub exige autenticação também, que é um assunto
separado com escolhas próprias. Você só precisa disso na etapa
{{step:first-pull-request}}, no fim desta semana — mas está no próximo card
mesmo assim, pelo motivo que o card dá.
:::

===
## E deixe o GitHub saber que é você

Você acabou de dizer ao git *quem você é*. É isso que carimba seu nome num
commit, e não é a mesma coisa que ter permissão para enviar commits ao GitHub.

**Identidade não é permissão.** Faça a segunda metade agora, já que está aqui —
descobrir isso pela primeira vez no momento em que você está tentando dar push é
uma hora ruim, e é o lugar mais comum onde um primeiro dia trava.

Se você nunca deu push desta máquina, escolha uma opção:

**GitHub CLI — a mais fácil.** Instale o [`gh`](https://cli.github.com/manual/) e
então:

```bash
gh auth login
```

Responda às perguntas e ele cuida de tudo, inclusive de configurar o git.

**Chaves SSH — a escolha usual para o dia a dia.** Você gera uma chave, dá ao
GitHub a metade pública e nunca mais digita senha. O
[guia passo a passo](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
do GitHub é bom; siga do início ao fim.

**Um token de acesso pessoal por HTTPS.** Crie um token nas configurações do
GitHub e use no lugar da senha quando o git pedir. [As
instruções](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
dizem de quais escopos ele precisa.

:::warn Sua senha do GitHub não vai funcionar
O git pedindo uma “senha” e recusando a senha certa são cinco minutos confusos
que quase todo mundo passa uma vez. A autenticação por senha no git foi desligada
anos atrás — aquele prompt quer um **token**.
:::

:::note Você pode seguir sem isto
Nada antes da etapa {{step:first-pull-request}} precisa disso — commits são
locais até você dar push. Se o `gh auth login` vai significar instalar alguma coisa, anote e
siga em frente; só não deixe para a hora em que você precisar.
:::
