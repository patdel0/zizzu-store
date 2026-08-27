Você vai ter a tentação de pedir a uma IA que escreva código por você — um pouco
esta semana, e o tempo todo na semana que vem, quando construir uma
funcionalidade do zero.

Este time tem duas regras sobre isso. Diferente da maior parte deste tutorial,
elas não são conselho.

===
## As duas regras

**1. O [cs50.ai](https://cs50.ai/) é o único assistente que você usa durante o
onboarding.** Não ChatGPT, não Claude, não Copilot, não a janela de chat embutida
no seu editor. Desligue a do editor — ela sugere enquanto você digita, que é
justamente a armadilha de que esta etapa trata.

**2. Nenhum código que você não tenha escrito entra neste repositório.** Nem do
assistente, nem do Stack Overflow, nem dos exemplos resolvidos deste tutorial.
Nada é colado. Nada é transcrito com o exemplo à vista.

A segunda regra é mais rígida do que parece, então o próximo card é sobre o que
ela pede de você.

:::note Por que o cs50.ai especificamente
É o assistente do [CS50](https://cs50.harvard.edu/) de Harvard — mesma classe de
modelo por baixo, deliberadamente configurado para te conduzir a uma resposta em
vez de te entregar uma. Peça que ele escreva seu endpoint e ele recusa e te
devolve uma pergunta.

Essa recusa é a funcionalidade. É gratuito, exige uma conta do GitHub, e é o que
a própria política de honestidade acadêmica do CS50 permite enquanto proíbe
assistentes gerais.
:::

===
## O que “escrever você mesmo” significa

A maioria dos blocos de código deste tutorial está completa, de propósito. Ler um
exemplo resolvido é como se aprende um formato que nunca se viu, e pular isso
tornaria tudo mais difícil, não melhor.

Então a regra não é “nunca olhe código”. É sobre o que acontece depois.

| | |
| --- | --- |
| **Colar** | Nada foi lido. Os testes ficam verdes. Você não conseguiria escrever de novo. |
| **Transcrever** | Você lê cada caractere enquanto copia. Melhor. Ainda é cópia. |
| **Escrever** | Ler, entender, desviar o olhar, e então produzir. |

**Leia o exemplo. Depois pare de olhar para ele e escreva a coisa.** Trave, olhe
de novo, feche de novo, siga. O que você produzir não precisa ser igual ao
exemplo — se funciona e você consegue explicar, é melhor que uma cópia, porque é
seu.

Aquela terceira linha é a que tem evidência por trás, e é uma afirmação maior que
“digitar faz bem”.

:::why O que a pesquisa de fato diz, inclusive onde ela é frágil
Dois achados, um forte e outro mais estreito do que costumam alegar.

**Produzir vence ler.** O efeito de geração: as pessoas lembram melhor de
material que geraram do que de material que leram.
[Bertsch et al. (2007)](https://link.springer.com/article/10.3758/BF03193441)
juntaram 86 estudos e encontraram **d = 0,40** no geral, subindo para **d = 0,64**
quando o teste vinha mais de um dia depois — embora esse último número se apoie
na menor fatia dos dados deles, 30 tamanhos de efeito, então trate como
sugestivo.

Duas ressalvas honestas, já que esta é a caixa que as prometeu. Aqueles estudos
são em sua maioria listas de palavras — lembrar itens que você produziu, não
escrever código a partir de um padrão que você entendeu, o que é um salto maior
do que o número faz parecer. E gerar com mais esforço não é automaticamente
melhor: os estudos com anagramas, a reconstrução mais trabalhosa do conjunto, não
mostraram benefício nenhum.

**Mas o efeito está em gerar, não nas teclas.** Não há boa evidência de que
digitar algo enquanto se olha para ele faça muita coisa. Transcrever é copiar com
passos extras; obriga a ler cada caractere, o que vale alguma coisa, mas não é
geração, porque a resposta estava na sua frente. É por isso que a regra aqui é
“desvie o olhar”, e não apenas “não cole”.

**E o contrapeso, que é o motivo de os exemplos existirem.** A pesquisa sobre
carga cognitiva mostra que iniciantes aprendem *melhor* estudando exemplos
resolvidos do que sendo obrigados a resolver problemas sem ajuda —
[Sweller & Cooper, 1985](https://doi.org/10.1207/s1532690xci0201_3) — uma
vantagem que encolhe e depois se inverte conforme você ganha experiência
([Kalyuga et al., 2003](https://doi.org/10.1207/s15326985ep3801_4)). Então:
estude o exemplo, depois gere a partir dele. Fazer só um dos dois é o erro, em
qualquer das direções.
:::

=== quiz=find-the-bug
## O outro motivo, que é sobre o código

Aqui está uma função. Imagine que você a pediu e foi isso que voltou.

```typescript
/** Returns the newest post first. */
export function newestFirst(posts: Post[]): Post[] {
  return posts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
```

Tem docblock. Tem tipos. Lê-se bem. Está errada de duas maneiras distintas, e os
testes que você escreveria a partir do nome dela pareceriam corretos.

Leia antes de responder — os dois bugs são visíveis.

===
## O que significa que você precisa saber ler

Esse é o problema prático de código que você não escreveu. Algo tem que
verificá-lo, e a única coisa disponível é você.

Uma pessoa sênior lê aquela função e vê o bug de mutação em dois segundos, porque
já escreveu esse bug e já se queimou com ele. Esse reconhecimento se constrói
produzindo código e errando. É o que *não* se constrói aceitando código que já
está certo.

Então **a ferramenta é mais perigosa justamente quando é mais útil para você.**
Ela fecha a distância entre o que você consegue produzir e o que você precisa, o
que dá sensação de progresso e é por isso que a distância para de se fechar
sozinha.

:::note Você não vai sentir isso acontecendo
O estudo do próximo card perguntou aos alunos, depois, como eles achavam que
tinham ido. Os que foram prejudicados **não sabiam**: não relataram ter ido pior
nem ter aprendido menos que os outros.

Então você não detecta isso conferindo como foi a sensação. Você detecta depois,
sentando para fazer algo parecido sem ajuda e descobrindo que não consegue.
:::

===
## O que acontece quando a proteção sai

Cerca de mil estudantes de ensino médio, distribuídos aleatoriamente, numa escola
de verdade.

- O grupo com um assistente de IA comum melhorou as notas de **exercício** em
  **48%**.
- Depois o assistente foi retirado para a prova. Eles tiraram **17% pior que os
  alunos que nunca tiveram IA nenhuma**.
- Um segundo grupo recebeu o mesmo modelo com proteções — dicas em vez de
  respostas. Eles ficaram **empatados** com o grupo sem IA.

Leia a linha do meio de novo. Não é “aprenderam menos do que poderiam”. *Pior do
que nunca ter tido.* Os ganhos nos exercícios foram reais e não eram
aprendizado.

Repare no que as proteções fizeram: elas recompraram o prejuízo e não
acrescentaram nada. Empatar foi o melhor resultado disponível.

[Bastani et al., *Generative AI without guardrails can harm learning*, PNAS
2025](https://www.pnas.org/doi/10.1073/pnas.2422633122)

:::note O que isto prova e o que não prova
Mostra que um assistente que entrega respostas pode te deixar pior do que não ter
nenhum, e que dicas em vez de respostas removeram o prejuízo naquele contexto.

**Não** prova que o cs50.ai especificamente é seguro. A condição com proteções ali
foi construída problema a problema pelos professores, que escreveram as dicas de
antemão para os erros que esperavam. O cs50.ai é um assistente socrático geral,
sem conhecimento desta base de código — parecido em espírito, não a mesma coisa.
Trate a regra um como a melhor aposta disponível, não como resultado comprovado.

A regra dois não precisa de estudo: uma proteção que dá para contornar colando
não é proteção.
:::

=== attest=write-not-copy ask=why-type-it
## Assumindo o compromisso

Este é o ponto em que você decide. Ninguém consegue verificar — nenhuma trava
deste tutorial distingue código digitado de código colado, e os testes ficam
verdes de qualquer jeito, que é exatamente por isso que é fácil pular e difícil
perceber que pulou.

:::note Onde o tutorial para de te dar código
Deliberadamente, e aos poucos. As primeiras etapas te entregam o arquivo
inteiro. As do meio te dão o formato com as partes interessantes em branco. As
últimas descrevem o que é preciso e deixam você escrever.

Se as etapas finais parecerem um abismo, o diagnóstico honesto quase sempre é que
as primeiras foram copiadas.
:::

=== quiz=good-use
## Como usar o pato, então

Quatro coisas para perguntar a ele. As quatro mantêm o trabalho com você:

**“Explique o que este código faz, linha por linha.”** Seu código ou de outra
pessoa. A coisa mais segura e mais útil que você pode pedir — você está pedindo
que ele leia, não que escreva.

**“Eu esperava X, recebi Y, aqui está o código. Onde eu deveria olhar? Não
conserte.”** A recusa no final importa. Sem ela você recebe um arquivo reescrito
e não aprende nada.

**“O que esta mensagem de erro significa?”** — *depois* de você ter lido o erro e
formado um palpite. Aí você está conferindo uma teoria em vez de terceirizar
uma.

**“No que eu não estou pensando aqui?”** Bom para casos limite que você não
considerou, e deixa a decisão com você.

Mais duas regras sem exceção:

- **Nunca commite nada que você não conseguiria explicar numa revisão.** Vão te
  perguntar. “A IA escreveu” é a única resposta que não tem continuação.
- **Nunca confie nele sobre esta base de código.** Ele não leu nosso contrato,
  nossas convenções nem nossos testes, e vai inventar com confiança um método do
  Prisma que não existe. `posts` é a referência, não o modelo.

:::warn Depois do onboarding
Pergunte à sua liderança qual é a regra do time para o dia a dia — é outra
pergunta, com outros trade-offs, e a resposta é dela, não deste tutorial.

Estas duas regras valem enquanto você está aprendendo a base de código. O motivo
não é que as ferramentas sejam ruins. É que você está construindo agora o
julgamento de que precisaria para usá-las com segurança, e esse julgamento se
constrói fazendo o trabalho.
:::
