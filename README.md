# GoLog Web Panel 🚚🌍

O **GoLog** é uma plataforma inovadora para gestão de logística, monitoramento de frotas e planejamento de transportes. Este repositório contém o **Painel Administrativo Frontend (Web)** construído com alta interatividade e preparado para consumo de APIs construídas em Spring Boot.

## 🚀 Tecnologias Utilizadas

Este projeto foi inicializado utilizando o **Vite** para entregar um ambiente de desenvolvimento extremamente rápido e otimizado.

*   **Vite** (Build Tool)
*   **React 19** (Biblioteca UI)
*   **React Router DOM** (Roteamento de aplicações Single-Page)
*   **Lucide React** (Ícones modernos e leves)
*   **Vanilla CSS** (Estilização com CSS Modules/Variáveis Globais)

## 📦 Estrutura e Funcionalidades

O painel foi projetado com um layout moderno (Sidebar + Cards) para facilitar a visualização de KPIs e o gerenciamento da operação logística. As principais telas e funcionalidades incluem:

1.  **Dashboard (`/`)**: Visão geral da operação. Exibe cards de acesso rápido, mapas de calor/status gerais e painéis de estatísticas (motoristas ativos, entregas pendentes, taxa de alocação, SLA).
2.  **Gestão de Usuários e Perfis (`/perfis`)**: Cadastro completo de usuários do sistema, motoristas e administradores. Tabela interativa com badges de status de ativação.
3.  **Gestão de Frota (`/frota`)**: Controle dos recursos físicos. Formulário e tabela listando placas, status de manutenção, renavam, capacidade e tipo do veículo (Truck, Toco, Carreta).
4.  **Transportes e Rotas (`/transporte`)**: Acompanhamento de rotas e despachos com uma linha do tempo (timeline) interativa e status expansíveis. Inclui sistema de modalidades de carga.
5.  **Monitoramento em Tempo Real (`/monitoramento`)**: Tela principal com mapa para rastreamento da frota. Você pode rastrear um motorista, ver desvios de rota, histórico de paradas de GPS e prazos de conclusão aproximados em um Modal Detalhado.
6.  **Serviço Centralizado (`src/services/api.js`)**: Toda a aplicação puxa dados desse Service Manager isolado. Atualmente resolvendo Promessas simuladas, totalmente pronto para ser trocado pelo `fetch` ou `axios` conectando com a API Spring Boot do backend.

## 🛠️ Como rodar o projeto localmente

Para iniciar o seu servidor de desenvolvimento e testar a aplicação na sua máquina, siga os passos abaixo:

### Pré-requisitos
*   [Node.js](https://nodejs.org/) instalado (recomenda-se a versão LTS mais recente).

### Passos de Instalação

1. Clone o repositório:
   ```bash
   git clone git@github.com:lgs8Lucas/GoLogWeb.git
   cd GoLogWeb
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Gire o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse o servidor local (geralmente [http://localhost:5173](http://localhost:5173)) no seu navegador.

---
**Desenvolvido para GoLog Logistics**
