# 🤝 KAMBA Money

## O Amigo do Seu Negócio

> *Venda, Stock e Facturação Eletrónica*

Sistema completo de Ponto de Venda (POS), Gestão de Stock e Facturação Eletrónica em **conformidade total com a legislação angolana**:
- ✅ Decreto Executivo n.º 74/19 (6 de Março)
- ✅ Decreto Presidencial n.º 71/25 (20 de Março de 2025)

### 🎯 Características Principais

#### ⚡ Offline-First
- Funciona **100% offline** sem necessidade de internet
- Base de dados local SQLite (WASM)
- Sincronização automática quando há conexão
- Resolução inteligente de conflitos

#### 📦 Gestão de Stock
- Cadastro completo de produtos
- Controlo de entradas e saídas
- Alertas de stock baixo
- Histórico de movimentações
- Suporte a código de barras

#### 💰 Ponto de Venda (POS)
- Interface optimizada para venda rápida
- Scanner de código de barras integrado
- Pesquisa rápida de produtos
- Cálculo automático de IVA e totais
- Múltiplos métodos de pagamento

#### 📄 Facturação Conforme Legislação
**Documentos Não Fiscais:**
- Factura Proforma (sem valor fiscal)

**Documentos Fiscais:**
- Factura
- Factura-Recibo
- Factura Simplificada
- Nota de Crédito
- Nota de Débito

**Requisitos Legais Implementados:**
- ✅ Numeração sequencial única
- ✅ Data e hora de emissão
- ✅ NIF do emitente e cliente
- ✅ Cálculo automático de IVA (14%)
- ✅ Hash/assinatura eletrónica
- ✅ Código ATCUD
- ✅ Geração de ficheiros SAF-T
- ✅ Imutabilidade dos documentos
- ✅ Armazenamento obrigatório (10 anos)

#### 🖨️ Impressão Térmica
- Suporte para impressoras térmicas 80mm
- Layout optimizado para POS
- Comandos ESC/POS
- Impressão directa após venda
- Mensagens legais obrigatórias

#### 💳 Sistema SaaS
- Planos de assinatura (Mensal, Trimestral, Semestral, Anual)
- Activação/expiração automática
- Bloqueio funcional em licença expirada
- Gestão centralizada pelo SuperAdmin

#### 🔒 Segurança
- Autenticação segura
- Criptografia de dados sensíveis
- Logs de auditoria imutáveis
- Controlo de acesso por função
- Protecção contra corrupção de dados

---

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ e npm
- (Opcional) Conta Supabase para sincronização online

> **Para levar o sistema a outro PC Windows** (ícone no Ambiente de Trabalho): execute `EMPACOTAR.bat`, copie `dist\KambaPOS-Instalador.zip` e no cliente execute `INSTALAR.bat`. Detalhes em [INSTALL.md](INSTALL.md).


### Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente (opcional)
cp .env.example .env.local

# 3. Copiar arquivos SQL para public
mkdir -p public/database public/sql-wasm
cp database/schema.sql public/database/
cp node_modules/sql.js/dist/sql-wasm.wasm public/sql-wasm/
cp node_modules/sql.js/dist/sql-wasm.js public/sql-wasm/

# 4. Executar em modo desenvolvimento
npm run dev
```

### Primeiro Acesso - SuperAdmin

**Credenciais:**
- Email: `ildocuema@gmail.com`
- Password: `Ildo7..Marques`

> ⚠️ **IMPORTANTE**: Altere a password após o primeiro acesso!

---

## 📁 Estrutura do Projeto

```
kamba-money/
├── database/          # Schemas SQL
├── src/
│   ├── app/          # Next.js Pages
│   ├── components/   # Componentes React
│   ├── lib/          # Lógica de negócio
│   └── types/        # TypeScript types
└── docs/             # Documentação
```

---

## 🛠️ Stack Tecnológica

- **Next.js 15** + **React 19** + **TypeScript**
- **SQLite WASM** (offline) + **PostgreSQL Supabase** (sync)
- **Tailwind CSS**
- **Zustand**, **Zod**, **React Hook Form**

---

## 📖 Uso do Sistema

### 1. Gestão de Produtos
- Cadastre produtos com código, barcode, preço e stock

### 2. Realizar Venda (POS)
- Escaneie ou pesquise produtos
- Finalize e imprima factura

### 3. Emitir Facturas
- Geradas automaticamente ou manualmente
- Hash e ATCUD automáticos

### 4. Administração
- Gestão de utilizadores, licenças e configurações

---

## 📝 Conformidade Legal

- ✅ Decreto 74/19 e 71/25
- ✅ IVA 14% Angola
- ✅ Retenção 10 anos

---

## 🤝 Sobre o Nome

**KAMBA** significa **"Amigo"** em Kimbundu, uma das línguas nacionais de Angola. O nome representa a nossa missão: ser o **amigo de confiança** dos comerciantes angolanos.

**KAMBA Money** - *O Amigo do Seu Negócio* 🇦🇴

---

Para suporte: **ildocuema@gmail.com**
