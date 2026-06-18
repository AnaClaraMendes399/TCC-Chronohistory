
# Tcc-Chronohistory

Projeto de TCC — Chronohistory. Este repositório contém o jogo em HTML5, recursos (imagens, áudios, fontes) e arquivos de configuração usados no desenvolvimento do trabalho.

**Visão geral**

- Linguagens: HTML, CSS, JavaScript
- Plataforma alvo: navegadores modernos (desktop)
- Objetivo: protótipo de jogo para apresentação de TCC

## Sumário

- Descrição
- Funcionalidades
- Requisitos
- Instalação e execução local
- Estrutura do repositório
- Fluxo Git (push / pull)
- Boas práticas e notas sobre binários
- Como contribuir
- Contato

## Descrição

O projeto reúne um protótipo de jogo web (arquivos HTML/CSS/JS) acompanhado de recursos de mídia e arquivos auxiliares. O repositório serve tanto para desenvolvimento local quanto para entrega/arquivamento do trabalho.

## Funcionalidades

- Jogo em HTML5 executável no navegador
- Recursos incluídos: sprites, sons, fontes embutidas
- Configurações simples em arquivos `options.ini`

## Requisitos

- Navegador moderno (Chrome, Edge, Firefox)
- Node/Python apenas se optar por servir localmente
- Espaço em disco para arquivos de mídia (alguns assets podem ser grandes)

## Instalação e execução local

1. Clone este repositório (ou copie a pasta localmente).
2. Para testar localmente, abra `index.html` no navegador ou sirva via HTTP:

```bash
# Com Python 3
python -m http.server 8000
# abrir http://localhost:8000

# Com Node (serve)
# npm install -g serve
# serve .
```

3. Arquivos principais:

- `index.html` — página principal
- `jogo.html` — entrada do jogo
- `script.js` — lógica JavaScript principal
- `medieval.css` — estilos

## Estrutura do repositório

- `index.html`, `jogo.html`, `script.js`, `medieval.css`
- `html5game/` — pasta com o projeto exportado do construtor (assets, sons, imagens)
- `README.md` — este arquivo

Exemplo (resumido):

```
./
├─ index.html
├─ jogo.html
├─ script.js
├─ medieval.css
├─ html5game/
│  ├─ BLANK GAME.js
│  ├─ builtinfonts/
│  └─ sound/
└─ README.md
```

## Fluxo Git e push

Este repositório local contém commits que ainda não foram enviados ao remoto. Fluxo recomendado:

1. Atualizar o remoto (se existir):

```bash
git fetch origin
git pull --rebase origin main
```

2. Resolver conflitos (se houver), testar localmente.

3. Adicionar e commitar alterações:

```bash
git add .
git commit -m "Descrição das alterações"
```

4. Enviar para o remoto:

```bash
git push -u origin main
```

Se o remoto tiver conteúdo divergente e você tiver certeza de sobrescrever (perda do histórico remoto), use `--force` com cautela:

```bash
git push --force origin main
```

## Boas práticas e arquivos grandes

- Arquivos binários grandes (áudio/imagens) aumentam o tamanho do repositório. Para projetos com muitos arquivos binários considere usar `git lfs`.
- Adicione um `.gitignore` para excluir arquivos gerados ou temporários.

Exemplo mínimo de `.gitignore`:

```
# Node
node_modules/

# Arquivos temporários/IDE
.vscode/
*.tmp
```

## Como contribuir

1. Faça um fork (se publicar no GitHub) ou clone o repositório.
2. Crie uma branch para sua alteração: `git checkout -b feat/minha-nova-funcao`.
3. Abra um pull request ou envie commits para o repositório remoto.

## Troubleshooting

- Push rejeitado: execute `git pull --rebase origin main` e resolva conflitos.
- Erro "Repository not found": verifique a URL do remote (`git remote -v`) e se você tem permissão.

## Contato

Para dúvidas e suporte, contate: JvictorMarcon (GitHub profile: https://github.com/JvictorMarcon)

## Licença

Adicione aqui a licença do projeto, ex.: MIT. Se não houver uma licença definida, o código não deve ser usado sem permissão explícita.

---

Se quiser, eu posso:

- adicionar um `.gitignore` apropriado,
- configurar `git lfs` para os assets grandes,
- ou executar o `git push` para o remoto que você criou.

