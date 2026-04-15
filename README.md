<img width="1277" height="629" alt="image" src="https://github.com/user-attachments/assets/0c74c6bc-e1a7-4852-bc5c-94eada72e8c5" />


# EndpointLab

SPA simples para montar payloads JSON, executar requisições HTTP e visualizar respostas rapidamente.

## Stack

- HTML
- TailwindCSS via CDN
- JavaScript Vanilla
- `fetch` para execução de requests
- `localStorage` para persistência local

Sem build, sem framework e sem backend.

## Objetivo

O projeto foi pensado para testar endpoints de forma rápida, com uma interface leve para:

- configurar URL e método HTTP
- adicionar e remover campos dinâmicos
- gerar payload automaticamente
- executar requisições únicas ou em lote
- visualizar resposta e tempo de execução
- salvar e importar formulários localmente

## Estrutura

```text
EndpointLab/
├── index.html
├── styles.css
└── js/
    └── app.js
```

## Arquitetura

### `js/app.js`
Concentra o bootstrap da aplicação e também as funções de:

- renderização da interface
- gerenciamento de formulário
- persistência local
- execução de requests
- importação e exportação de JSON

Essa consolidação foi feita para permitir abertura direta do `index.html` sem depender de módulos ES e sem exigir servidor local.

## Como executar

A proposta do projeto agora e abrir da forma mais simples possivel:

1. Abra a pasta do projeto.
2. Dê duplo clique em `index.html`.
3. O app abre direto no navegador.

Nao precisa subir servidor local para usar a interface.

Se preferir, tambem pode arrastar `index.html` para o navegador.

## Como usar

1. Informe a URL do endpoint.
2. Escolha o método HTTP.
3. Adicione campos com `+ Campo`.
4. Confira o `Payload Preview`.
5. Clique em `Enviar` para executar.
6. Use `Salvar` para persistir localmente.
7. Use `Exportar` e `Importar` para mover formulários em JSON.

## Execução em lote

A aplicação permite configurar:

- `Iteracoes`: quantas vezes o request será executado
- `Intervalo (ms)`: espera entre uma execução e outra

Se `Iteracoes` for maior que `1`, o app usa o fluxo em lote.

## Persistência local

Os formulários ficam salvos no navegador via `localStorage`.

Isso permite:

- recuperar o último formulário usado
- exportar o formulário atual como JSON
- importar um JSON válido novamente para o app

## Limitações

- Algumas APIs podem falhar no navegador por CORS.
- Não há proxy backend no projeto.
- O projeto foi simplificado para rodar sem servidor local, entao a maior parte da lógica fica concentrada em `js/app.js`.
- Headers customizados ainda estão previstos pela estrutura, mas a UI atual está focada no fluxo principal do MVP.

## Próximos passos possíveis

- suporte visual para headers customizados
- histórico de execuções
- validações mais ricas por tipo de campo
- presets de endpoints
- métricas agregadas para requests em lote

## Licença

Uso livre para estudo e evolução do projeto.
