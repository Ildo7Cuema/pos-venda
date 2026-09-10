# Guia de Instalação e Produção - KAMBA POS Angola

Este guia detalha os passos para instalar e executar o sistema KAMBA POS no computador do cliente.

## Instalação rápida no Windows (recomendado)

O caminho mais simples: criar um instalador nesta máquina e levá-lo noutro computador (USB, ZIP, partilha). No cliente, um duplo clique instala o programa e coloca o ícone **KAMBA POS** no Ambiente de Trabalho.

### 1. Nesta máquina (desenvolvimento)

1. Feche o servidor de desenvolvimento se estiver a correr.
2. Faça duplo clique em `EMPACOTAR.bat` (ou execute `npm run pack:windows`).
3. Aguarde o fim da compilação. O Windows abre a pasta `dist`.
4. Copie **`KambaPOS-Instalador.zip`** (ou a pasta `KambaPOS-Instalador`) para uma pen USB.

O pacote já inclui um Node.js portátil: o computador do cliente **não precisa** de instalar Node.js nem Git.

### 2. No computador do cliente

1. Extraia o ZIP.
2. Faça duplo clique em `INSTALAR.bat`.
3. No Ambiente de Trabalho aparece o ícone **KAMBA POS**.
4. Clique no ícone: o sistema abre no navegador em `http://127.0.0.1:3000/`.

A instalação prefere `C:\KambaPOS`. Se não houver permissão de escrita, usa `%LOCALAPPDATA%\KambaPOS`.

**Importante:** enquanto o POS estiver aberto, não feche a janela do servidor (fica minimizada na barra de tarefas). Para parar, use **Parar KAMBA POS** no Menu Iniciar.

Os dados (produtos, stock, facturas) ficam no navegador daquele Windows. Instalar noutro PC não copia automaticamente essas vendas.

---

## Pré-requisitos (só se não usar o instalador Windows)

O computador do cliente deve ter:

1.  **Node.js**: Versão 20 ou superior (LTS).
    *   Download: [https://nodejs.org/](https://nodejs.org/)
2.  **Git**: Opcional, apenas se for clonar o código em vez de copiar a pasta.

## 1. Obter o Código Fonte (instalação manual)

Clone o repositório ou extraia o arquivo ZIP do projeto em uma pasta no computador do cliente, por exemplo em `C:\KambaPOS` ou `/opt/kambapos`.

```bash
git clone <url-do-repositorio> .
```

## 2. Configuração do Ambiente

1.  Na pasta raiz do projeto, copie o arquivo `.env.example` para um novo arquivo chamado `.env`.
2.  Abra o arquivo `.env` com um editor de texto (Bloco de Notas, VS Code, etc.).
3.  Preencha as variáveis necessárias:

```env
# Configuração do Supabase (Cloud ou Local)
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_supabase

# Informações da Aplicação
NEXT_PUBLIC_APP_NAME="POS Angola"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Chave Privada da AGT (Essencial para Assinatura de Faturas)
# Deve ser uma String Base64 da chave privada PEM
AGT_PRIVATE_KEY_B64=sua_chave_privada_base64
```

> **NOTA:** A chave privada da AGT é crítica para a validação fiscal. Mantenha-a segura.

No pacote Windows, as mesmas variáveis podem ir em `config.env` na pasta de instalação. Variáveis `NEXT_PUBLIC_*` só entram no programa se existirem **no momento do** `EMPACOTAR.bat`.

## 3. Instalação e Build (manual)

Abra o terminal na pasta do projeto e execute os seguintes comandos:

```bash
# 1. Instalar dependências
npm install

# 2. Compilar o projeto para produção
npm run build
```

Este processo pode levar alguns minutos. Se ocorrerem erros, verifique se todas as dependências do sistema estão instaladas.

## 4. Executando em Produção (manual)

Para iniciar o sistema, execute:

```bash
npm start
```

O sistema estará acessível em: `http://localhost:3000`

No Windows, prefira o ícone criado pelo `INSTALAR.bat`. Em Linux/Mac pode usar `scripts/start-prod.sh`.

## 5. Ativação do Sistema

No primeiro acesso, o sistema pode solicitar uma ativação.
Como administrador, você deve gerar um código de ativação para o cliente.

1.  Abra o arquivo `public/admin-activator.html` no seu navegador (não no do cliente).
2.  Insira a Referência do Cliente e o Plano.
3.  Gere o código e insira na tela de ativação do sistema no cliente.
