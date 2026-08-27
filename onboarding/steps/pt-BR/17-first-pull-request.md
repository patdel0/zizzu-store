Você fez uma alteração, commitou, e causou e resolveu um conflito. O trabalho
ainda está na sua máquina e ninguém viu.

Esta etapa fecha o ciclo. É o processo inteiro de contribuição — push, abrir,
revisar, responder — sobre uma alteração pequena o bastante para que nenhuma
parte da sua atenção vá para o código.

===
## Por que fazer isto com algo trivial

O que está sendo aprendido é o processo, não a alteração. Uma edição de uma linha
num título significa que cada minuto vai para a mecânica: o que é um pull
request, o que quem revisa faz com ele, o que acontece com os comentários.

Faça isso pela primeira vez com um modelo de banco e um endpoint e você está
aprendendo duas coisas ao mesmo tempo, mal. Você vai fazer exatamente isso na
semana dois, e vai ser mais fácil porque isto já ficou para trás.

=== check=sandbox-branch,pushed-small,nothing-unpushed
## Dê push

```bash
git push -u origin sandbox/seu-nome
```

`origin` é o nome da cópia deste repositório no GitHub. O `-u` liga sua branch
local à que ele acabou de criar, para que daqui em diante um `git push` simples e
o `git pull` saibam para onde ir.

Se falhar com `Permission denied (publickey)`, a autenticação que você configurou
na etapa {{step:git-setup}} não está funcionando. Esse é um problema diferente de
o push estar errado — volte e termine aquela metade.

:::note Dar push não é fazer merge
Sua branch agora existe em dois lugares e a `main` está intocada. Nada do que
você der push afeta ninguém até alguém fazer merge, o que é um ato separado e
deliberado.
:::

=== attest=opened-small,described-small
## Abra o pull request

Um **[pull request](https://docs.github.com/pt/pull-requests)** é um pedido para
fazer merge da sua branch na `main`. É onde a revisão acontece: o diff, os
comentários linha a linha e a conversa, num lugar só.

No GitHub, sua branch recém-enviada aparece com um botão **Compare & pull
request**. Base `main`, compare a sua branch.

Depois escreva a descrição. Para uma alteração deste tamanho, duas frases:

```markdown
## What

Replaces the Next.js starter heading on the home page with the store name,
and adds a tagline underneath.

## How to check it

`./script/dev`, then http://localhost:3000
```

É esse o formato que você vai usar para tudo: **o que mudou** e **como outra
pessoa consegue ver funcionando**. Numa alteração maior, uma terceira seção — o
*porquê* — carrega as decisões de julgamento que você tomou. Aqui não há
nenhuma, e é justamente esse o motivo de começar por aqui.

:::warn A descrição não é formalidade
É a primeira coisa que quem revisa lê, e ela decide o quanto a sua revisão vai
ser boa. Quem precisa deduzir para que serve uma alteração a partir do diff gasta
a atenção nisso em vez de gastar em se ela está correta.
:::

=== attest=reviewed-small
## Peça revisão

Peça ao seu par de onboarding, ou a quem estiver definido como quem revisa. No
GitHub: **Reviewers**, no canto superior direito do pull request.

A pessoa vai comentar. Três coisas que vale saber antes disso:

**É sobre o código.** “Isto poderia ser mais simples” é uma afirmação sobre uma
função. Não existe versão disso que seja sobre você, por mais que soe assim da
primeira vez.

**Uma pergunta normalmente é uma pergunta.** “Você quis mesmo manter o verde
esmeralda?” significa o que diz. As duas respostas servem — *não, vou trocar* e
*sim, combina com a cor da marca* — e a segunda não é grosseria.

**Responda a tudo.** Mude, ou diga por que não. Um comentário sem resposta soa
como ignorado, e agora quem revisa tem que decidir se levanta de novo.

Para mudar algo, commite na mesma branch e dê push. O pull request se atualiza
sozinho. Não abra um novo.

:::note Se não houver ninguém disponível para revisar
Não pule — esta é a metade do processo que você não consegue praticar sozinho.
Peça no canal do time e, enquanto espera, leia o pull request aberto de outra
pessoa e deixe uma pergunta genuína. Essa é a outra metade da revisão, e ela
chega na sua primeira quinzena, você se sentindo pronto ou não.
:::

=== attest=closed-small
## Feche sem fazer merge

Na página do pull request, abaixo da caixa de comentário: **Close pull request**.

Este não recebe merge, porque o tutorial inteiro é um sandbox e a `main` fica
exatamente como você a encontrou. Tudo até o botão foi real — uma branch de
verdade, um diff de verdade, uma revisão de verdade — e o botão é a única parte
que você está pulando.

:::note O que teria acontecido
Aprovado e mergeado, seus commits entram na `main`, sua branch é apagada e, na
maioria dos projetos, a CI roda e aquilo vai para produção em minutos. Você vai
ver isso explicado direito na etapa {{step:pull-request}}, no fim da semana dois,
quando a alteração valer isso.
:::

===
## Isso é a semana um

Você já consegue fazer aquilo de que o trabalho é feito: pegar uma alteração,
colocá-la numa branch, commitá-la em pedaços que alguém consegue ler, dar push e
levá-la pela revisão.

Tudo na semana dois é esse mesmo ciclo com uma alteração mais difícil dentro dele
— um modelo de banco, um endpoint, testes, uma página. O processo não fica mais
complicado. Só o código fica.

:::try Antes de parar
Deixe sua branch e seus commits locais em paz; a semana dois continua na mesma
branch. Se você vai voltar amanhã, a única coisa que vale anotar é como reiniciar
o tutorial:

```bash
git switch onboarding && ./onboarding/start
```
:::
