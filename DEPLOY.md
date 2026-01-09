# Deploy do Hotel Concierge no Render

> Guia completo para fazer deploy da aplicação no Render.com usando Bun como runtime.

---

## Sumario

- [Pre-requisitos](#pre-requisitos)
- [Passo 1: Preparar o Codigo](#passo-1-preparar-o-codigo)
- [Passo 2: Criar Conta no Render](#passo-2-criar-conta-no-render)
- [Passo 3: Criar o Servico](#passo-3-criar-o-servico)
- [Passo 4: Configurar Variaveis de Ambiente](#passo-4-configurar-variaveis-de-ambiente)
- [Passo 5: Aguardar o Deploy](#passo-5-aguardar-o-deploy)
- [Passo 6: Verificar o Deploy](#passo-6-verificar-o-deploy)
- [Passo 7: Dominio Personalizado](#passo-7-dominio-personalizado-opcional)
- [Troubleshooting](#troubleshooting)
- [Arquitetura](#arquitetura)

---

## Pre-requisitos

Antes de comecar, certifique-se de ter:

| Requisito | Link | Observacao |
|-----------|------|------------|
| Conta GitHub | [github.com](https://github.com) | Com o repositorio do projeto |
| Conta Render | [render.com](https://render.com) | Plano gratuito disponivel |
| Banco Neon | [neon.tech](https://neon.tech) | PostgreSQL serverless |
| Chave OpenAI | [platform.openai.com](https://platform.openai.com) | Para o assistente de chat |
| Chave Resend | [resend.com](https://resend.com) | Opcional, para emails |

---

## Passo 1: Preparar o Codigo

### 1.1 Verificar mudancas pendentes

```bash
git status
```

### 1.2 Adicionar e commitar

```bash
git add .
git commit -m "Prepare for Render deployment"
```

### 1.3 Enviar para o GitHub

```bash
git push origin main
```

---

## Passo 2: Criar Conta no Render

1. Acesse **[render.com](https://render.com)**

2. Clique em **"Get Started for Free"**

3. Selecione **"Sign up with GitHub"** (recomendado)

4. Autorize o Render a acessar seus repositorios

---

## Passo 3: Criar o Servico

### Opcao A: Usando Blueprint (Recomendado)

O projeto ja possui um arquivo `render.yaml` configurado. O Render detecta automaticamente.

1. No Dashboard, clique em **"New +"** (canto superior direito)

2. Selecione **"Blueprint"**

3. Conecte seu repositorio:
   - Clique em **"Connect account"** se necessario
   - Busque por **"hotel-helper-ai"**
   - Clique em **"Connect"**

4. O Render mostrara as configuracoes do `render.yaml`

5. Clique em **"Apply"**

### Opcao B: Configuracao Manual

Se preferir configurar manualmente:

1. Clique em **"New +"** > **"Web Service"**

2. Conecte o repositorio `hotel-helper-ai`

3. Preencha os campos:

| Campo | Valor |
|-------|-------|
| **Name** | `hotel-concierge` |
| **Region** | Oregon (ou mais proximo) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Plan** | `Free` |

4. **Build Command:**
```bash
curl -fsSL https://bun.sh/install | bash && export PATH="$HOME/.bun/bin:$PATH" && bun install && bun run build
```

5. **Start Command:**
```bash
export PATH="$HOME/.bun/bin:$PATH" && bun dist/server/index.js
```

6. Clique em **"Create Web Service"**

---

## Passo 4: Configurar Variaveis de Ambiente

Apos criar o servico, va para a aba **"Environment"**.

### Variaveis Obrigatorias

| Variavel | Valor | Como obter |
|----------|-------|------------|
| `NODE_ENV` | `production` | Valor fixo |
| `PORT` | `3001` | Valor fixo |
| `DATABASE_URL` | `postgresql://...` | Ver abaixo |
| `OPENAI_API_KEY` | `sk-...` | Ver abaixo |
| `BETTER_AUTH_SECRET` | (gerar) | Clique em "Generate" |

### Variaveis Opcionais

| Variavel | Valor | Descricao |
|----------|-------|-----------|
| `RESEND_API_KEY` | `re_...` | Envio de emails |
| `BETTER_AUTH_URL` | (auto) | URL da aplicacao |

---

### Como obter DATABASE_URL

1. Acesse **[console.neon.tech](https://console.neon.tech)**

2. Selecione seu projeto (ou crie um novo)

3. Va em **"Connection Details"**

4. Em **"Connection string"**, copie o valor

   ```
   postgresql://user:password@host/database?sslmode=require
   ```

5. Cole no campo `DATABASE_URL` no Render

---

### Como obter OPENAI_API_KEY

1. Acesse **[platform.openai.com/api-keys](https://platform.openai.com/api-keys)**

2. Clique em **"Create new secret key"**

3. De um nome (ex: "Hotel Concierge")

4. Copie a chave (comeca com `sk-`)

5. Cole no campo `OPENAI_API_KEY` no Render

---

### Como gerar BETTER_AUTH_SECRET

**Opcao 1:** No Render, clique em **"Generate"** ao lado do campo

**Opcao 2:** Gere manualmente no terminal:
```bash
openssl rand -base64 32
```

---

## Passo 5: Aguardar o Deploy

1. O Render inicia o build automaticamente

2. Acompanhe em **"Events"** ou **"Logs"**

3. Tempo estimado: **3-5 minutos** (primeiro deploy)

4. Status **"Live"** = deploy concluido

### O que acontece no build

```
1. curl -fsSL https://bun.sh/install | bash   # Instala Bun
2. bun install                                 # Instala dependencias
3. bun run build                              # Compila frontend + backend
4. bun dist/server/index.js                   # Inicia servidor
```

---

## Passo 6: Verificar o Deploy

Substitua `<seu-app>` pelo nome do seu servico no Render.

### Health Check

```bash
curl https://<seu-app>.onrender.com/health
```

**Resposta esperada:**
```json
{"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}
```

### URLs para testar

| Pagina | URL |
|--------|-----|
| Landing | `https://<seu-app>.onrender.com/` |
| Login | `https://<seu-app>.onrender.com/login` |
| Admin | `https://<seu-app>.onrender.com/admin` |
| Health | `https://<seu-app>.onrender.com/health` |

---

## Passo 7: Dominio Personalizado (Opcional)

### Configurar no Render

1. Va em **"Settings"** > **"Custom Domains"**

2. Clique em **"Add Custom Domain"**

3. Digite seu dominio (ex: `app.seuhotel.com`)

### Configurar DNS

No painel do seu provedor de dominio:

| Tipo | Nome | Valor |
|------|------|-------|
| CNAME | `app` | `<seu-app>.onrender.com` |

### Aguardar

- Propagacao DNS: ate 48 horas
- SSL: automatico pelo Render

---

## Troubleshooting

### Build failed

```
Verifique:
- Logs de build em "Events"
- Arquivo render.yaml correto
- Dependencias no package.json
```

### Health check failed

```
Verifique:
- DATABASE_URL configurado
- Logs em "Logs"
- Servidor iniciando corretamente
```

### Database connection failed

```
Verifique:
- String de conexao do Neon
- IP do Render permitido no Neon
  (Neon > Settings > IP Allow > Allow all)
```

### Cold start lento

```
- Normal no plano gratuito (spin down apos 15min)
- Bun reduz cold start: ~800ms -> ~200ms
- Solucao: upgrade para plano pago
```

---

## Arquitetura

```
                    INTERNET
                        |
                        v
    +-------------------+-------------------+
    |                 RENDER                |
    |  +-----------------------------+      |
    |  |    hotel-concierge          |      |
    |  |                             |      |
    |  |  +-------+    +---------+   |      |
    |  |  |  Bun  |--->|  Hono   |   |      |
    |  |  +-------+    | Server  |   |      |
    |  |               +---------+   |      |
    |  |                    |        |      |
    |  +--------------------+--------+      |
    |                       |               |
    +-----------------------+---------------+
                            |
                            v
                +-------------------+
                |   NEON DATABASE   |
                |   (PostgreSQL)    |
                +-------------------+
```

### Stack

| Camada | Tecnologia |
|--------|------------|
| Runtime | Bun |
| Server | Hono |
| Frontend | React + Vite |
| Router | TanStack Router |
| Database | PostgreSQL (Neon) |
| ORM | Drizzle |
| Auth | Better Auth |
| AI | OpenAI API |

---

## Comandos Uteis

### Desenvolvimento local

```bash
# Instalar dependencias
bun install

# Rodar em desenvolvimento
bun run dev

# Build de producao
bun run build

# Testar producao localmente
NODE_ENV=production bun dist/server/index.js

# Health check local
curl http://localhost:3001/health
```

### Banco de dados

```bash
# Gerar migrations
bun run db:generate

# Aplicar migrations
bun run db:migrate

# Push direto (dev)
bun run db:push

# Drizzle Studio (GUI)
bun run db:studio
```

---

## Checklist

- [ ] Codigo commitado e enviado para GitHub
- [ ] Servico criado no Render
- [ ] `DATABASE_URL` configurado
- [ ] `OPENAI_API_KEY` configurado
- [ ] `BETTER_AUTH_SECRET` gerado
- [ ] Deploy concluido (status "Live")
- [ ] Health check OK
- [ ] Login funcionando
- [ ] Admin acessivel

---

## Suporte

- **Render Docs:** [render.com/docs](https://render.com/docs)
- **Neon Docs:** [neon.tech/docs](https://neon.tech/docs)
- **Hono Docs:** [hono.dev](https://hono.dev)
- **Bun Docs:** [bun.sh/docs](https://bun.sh/docs)
