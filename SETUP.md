# ⚙️ Setup Automação Apps Script — DIM+ Saúde

> **Faça isso uma única vez. Depois disso, qualquer mudança no `apps-script.js`
> commitada no GitHub atualiza o Apps Script automaticamente em ~30 segundos.**

---

## O que você vai configurar

Após este setup, o fluxo será:

```
Você edita apps-script.js → git push → GitHub Actions → Apps Script atualizado ✅
```

---

## PASSO 1 — Ativar Apps Script API no Google Cloud

1. Acesse: https://console.cloud.google.com/apis/library/script.googleapis.com
2. Certifique-se de estar logado com a conta **da DIMEG** (mesma do Apps Script)
3. Clique em **"Ativar"** (se já estiver ativo, pule)

---

## PASSO 2 — Criar credencial OAuth Desktop

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Clique em **"+ Criar credenciais" → "ID do cliente OAuth"**
3. Tipo de aplicativo: **"App para computador"**
4. Nome: `clasp-dimplus` (qualquer nome)
5. Clique em **"Criar"**
6. Clique em **"Baixar JSON"** → salve como `credentials.json` em qualquer pasta

---

## PASSO 3 — Login com clasp e gerar .clasprc.json

No terminal (qualquer pasta):

```bash
npx @google/clasp login --creds /caminho/para/credentials.json
```

- Abre o browser → faça login com a conta DIMEG → autorize
- Volta ao terminal → você verá: `Saved credentials`
- Um arquivo `~/.clasprc.json` foi criado

Copie o **conteúdo completo** desse arquivo:

```bash
# Mac/Linux:
cat ~/.clasprc.json

# Windows (PowerShell):
Get-Content $HOME\.clasprc.json
```

---

## PASSO 4 — Pegar o Script ID do Apps Script

1. Abra o Apps Script: https://script.google.com
2. Clique no seu projeto DIM+ Saúde
3. No menu: **Projeto → Configurações do projeto** (ícone ⚙️)
4. Copie o **"ID do script"** (algo como `1ABC...xyz`)

---

## PASSO 5 — Adicionar os 3 Secrets no GitHub

Acesse: https://github.com/dmgocupacional/contratos-dimplus/settings/secrets/actions

Clique em **"New repository secret"** para cada um:

### Secret 1: `CLASP_CLASPRC`
- **Name:** `CLASP_CLASPRC`
- **Value:** cole o conteúdo inteiro do `~/.clasprc.json` (do Passo 3)

### Secret 2: `CLASP_SCRIPT_ID`
- **Name:** `CLASP_SCRIPT_ID`
- **Value:** cole o Script ID copiado no Passo 4

### Secret 3: `CLASP_DEPLOYMENT_ID`
- **Name:** `CLASP_DEPLOYMENT_ID`
- **Value:** `AKfycby3cQ6YStUlB7BDKD38lnlSLY1icUE4iPD0XXH4MolyciZbd_ZYyfVf5cDgIK0Srxjo`
  *(já está preenchido — é o ID da implantação atual)*

---

## PASSO 6 — Testar

Após adicionar os secrets, faça qualquer alteração mínima no `apps-script.js`
(ex: mudar um comentário) e faça commit + push.

Acompanhe em tempo real:
👉 https://github.com/dmgocupacional/contratos-dimplus/actions

Você verá o workflow `Deploy Apps Script` rodando. Em ~30s, estará concluído. ✅

---

## ❓ Dúvidas frequentes

**"O workflow falhou com erro de autenticação"**
→ Refaça o Passo 3 (login clasp) e atualize o Secret `CLASP_CLASPRC`

**"O .clasprc.json expira?"**
→ Sim, o token expira após ~6 meses. Quando isso acontecer, refaça o Passo 3.
Você receberá um email de falha do GitHub Actions avisando.

**"Preciso mudar o Apps Script no futuro"**
→ Apenas edite o `apps-script.js` e faça `git push`. O GitHub Actions cuida do resto.

---

*Setup feito por: Claude / Easy Doctor Representações LTDA*
