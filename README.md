# Site Institucional — Dr. Ricardo Cassiano Advogado

Reconstrução fiel e independente do website profissional do advogado **Ricardo Cassiano**, desenvolvida a partir de engenharia reversa dos assets e da estrutura original, eliminando todas as dependências do WordPress e Elementor.

---

## 🏛️ Sobre o Projeto

O site original foi desenvolvido em WordPress com Elementor. Esta versão foi reconstruída com:
- **100% de Fidelidade Visual e Estrutural:** Mesmas seções, proporções, tipografias, cores, fundos, imagens e alinhamentos.
- **Tecnologias Web Modernas:** HTML5 semântico, CSS3 com variáveis nativas e JavaScript modular sem frameworks pesados.
- **Zero Dependências de Backend:** Funciona como um site estático de altíssima performance, seguro e livre de brechas de CMS.
- **Totalmente Responsivo:** Otimizado e validado para Desktop (1440px), Tablet (768px) e Mobile (390px).
- **Pronto para GitHub e Deploy na Vercel:** Configuração inclusa com headers de cache e roteamento limpo.

---

## 🎨 Design System e Tokens Extraídos

- **Cores Principais:**
  - Dourado / Champagne Principal: `#DFAE4F`
  - Dourado Hover: `#C09239`
  - Dourado Claro: `#F5EA75`
  - Fundo Dark Navy / Petróleo: `#0D1E1E`
  - Fundo Dark Profundo: `#071518`
  - Fundo dos Cards: `#0E181B` (com degradê `#181d1b` para `#0d0f0e`)
  - Texto Claro: `#FFFFFF` / `#E0E0E0` / `#CBCBCB`
  - Fundo Seção Sobre Mim: `#FFFFFF`
  - Texto Escuro (Sobre Mim): `#0D1E1E` / `#4B5563`
- **Tipografia:**
  - Títulos e Destaques: `Cormorant Garamond` (Garamond clássica serifada de alta legibilidade)
  - Textos de Apoio e Parágrafos: `Open Sans` / Sans-serif
- **Dimensões e Espaçamentos:**
  - Largura máxima do container: `1140px`
  - Altura do Header: `90px` (Desktop) / `70px` (Mobile)
  - Raio dos cards: `30px` (borda arredondada suave)

---

## 📁 Estrutura de Arquivos

```text
SITE ADVOGADO RICARDO CASSIANO/
├── index.html                 # Página principal completa, semântica e acessível
├── css/
│   ├── variables.css          # Tokens do design system (cores, fontes, espaçamentos)
│   ├── main.css               # Estilos estruturais, seções, efeitos e animações
│   └── responsive.css         # Breakpoints para Tablet (768px) e Mobile (390px)
├── js/
│   └── main.js                # Menu mobile, rolagem suave, spotlight e contador numérico
├── assets/
│   ├── fonts/                 # Tipografia local (Cormorant Garamond)
│   └── images/                # Imagens, logotipos, fotos e ícones vetoriais originais
├── vercel.json                # Configuração para publicação e cache na Vercel
├── package.json               # Scripts de desenvolvimento e metadados
├── server.js                  # Servidor HTTP local leve para testes
├── .gitignore                 # Arquivos ignorados no versionamento Git
└── README.md                  # Documentação completa do projeto
```

---

## 🚀 Como Executar Localmente

### Pré-requisito
Ter o [Node.js](https://nodejs.org/) instalado na máquina.

### Execução
1. Abra o terminal na pasta do projeto.
2. Inicie o servidor local:
   ```bash
   node server.js
   ```
   *(ou `npm start`)*
3. Acesse no navegador:
   👉 **`http://localhost:3000/`**

---

## 📦 Como Publicar no GitHub

Como o GitHub CLI (`gh`) já foi autenticado com sua conta:

1. **Inicialize o Git no repositório (caso ainda não esteja inicializado):**
   ```bash
   git init
   git add .
   git commit -m "feat: Reconstrucao fiel do site do Dr. Ricardo Cassiano"
   ```

2. **Crie o repositório no GitHub diretamente pelo terminal:**
   ```bash
   gh repo create site-advogado-ricardo-cassiano --public --source=. --remote=origin --push
   ```
   *(Ou `--private` se preferir mantê-lo privado inicialmente).*

---

## 🌐 Como Publicar na Vercel

O projeto possui arquivo [`vercel.json`](file:///c:/Users/Diego/Documents/1-ANDER%20LAB/1-%20CLIENTES/RICARDO%20CASSIANO/SITE%20ADVOGADO%20RICARDO%20CASSIANO/vercel.json) pronto para deploy estático com cache otimizado.

### Opção A: Pelo painel web da Vercel (Mais simples)
1. Acesse **[vercel.com](https://vercel.com/)** e faça login com sua conta do GitHub.
2. Clique em **Add New...** > **Project**.
3. Selecione o repositório `site-advogado-ricardo-cassiano`.
4. Em **Framework Preset**, deixe selecionado **Other** (HTML estático).
5. Clique em **Deploy**. O site estará no ar em poucos segundos com HTTPS gratuito!

### Opção B: Pela CLI da Vercel
```bash
npx vercel
```
*(Basta seguir as instruções do prompt).*

---

## ✨ Seções Restauradas e Funcionalidades

1. **Header Fixo (Sticky Navbar):**
   - Logotipo oficial com efeito translúcido (*backdrop blur*).
   - Navegação por âncoras com indicador de seção ativa.
   - Botão direto de chamada telefônica (`tel:+5583991979122`).
   - Menu lateral (*drawer*) retrátil para smartphones e tablets.

2. **Hero Section (Apresentação Principal):**
   - Tipografia em Cormorant Garamond champagne gold.
   - Fundo geométrico cúbico sutil com vinheta profunda.
   - Botão CTA com brilho dourado conectado ao WhatsApp.
   - Prova social com avatares de clientes e contador animado (+ de 100 clientes).
   - Foto recortada do Dr. Ricardo Cassiano com 20 partículas douradas flutuantes animadas (*fairies*).

3. **Áreas de Atuação:**
   - Efeito spotlight interativo nos cards (o brilho dourado acompanha o cursor do mouse).
   - Os 6 serviços com seus ícones vetoriais originais:
     - *Direito do Trabalho*
     - *Direito Eleitoral*
     - *Direito Cível*
     - *Direito Digital*
     - *Direito do Consumidor*
     - *Compliance Jurídico*
   - Links diretos com mensagem personalizada no WhatsApp.

4. **Sobre Mim (Quem sou eu?):**
   - Transição elegante para fundo branco de alto contraste.
   - Biografia profissional completa preservada com qualificações (Unipê, CENES, FACULESTE, ESA).
   - Lista de diferenciais e badges de valores.
   - Widget de avaliação 5 estrelas (4.8 de 5 - Dados Google*).
   - Foto institucional do advogado.

5. **Uma Jornada pelo Mundo Jurídico:**
   - Composição em duas colunas: fotografia em alta definição do Fórum Cível Des. Mário Moacyr Porto à esquerda.
   - Cartões de **Missão** e **Visão** com ícones de alvo dourado e textos institucionais à direita.

6. **Localização:**
   - Endereço físico: *R. Antônio Arantes, 120, Sala 3, Ernesto Geisel, João Pessoa - PB*.
   - Mapa interativo do Google Maps embutido.

7. **Rodapé e Contatos:**
   - Menus de acesso rápido.
   - Links oficiais para Instagram (`@ricardocassianoadv`) e WhatsApp.
   - Informações de e-mail e telefone com botão "LIGAR".
   - Créditos e copyright preservados.

8. **Botão Flutuante do WhatsApp:**
   - Posicionado no canto inferior direito com pulso contínuo e link direto para atendimento.
