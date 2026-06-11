# Contratos DIM+ Saúde

Formulário digital de Termo de Adesão ao Cartão DIM+ Saúde.

## 🌐 Acesso
[https://dmgocupacional.github.io/contratos-dimplus](https://dmgocupacional.github.io/contratos-dimplus)

## ⚙️ Setup da Integração Google Sheets

1. Crie uma planilha Google em [sheets.google.com](https://sheets.google.com)
2. Menu **Extensões → Apps Script**
3. Apague o código padrão e cole o conteúdo de `apps-script.js`
4. Salve → **Implantar → Nova implantação**
   - Tipo: Aplicativo da Web
   - Executar como: Eu mesmo
   - Quem pode acessar: Qualquer pessoa (anônimo)
5. Copie a URL gerada
6. Em `index.html`, substitua `SUA_URL_APPS_SCRIPT_AQUI` pela URL copiada
7. Faça commit e push

## 📋 Funcionalidades
- Login por vendedor (Rayane Godoy / Sandra)
- Dados do titular com máscaras (CPF, telefone, CEP, data)
- Até 4 dependentes com acordeão
- Preview do contrato completo
- Envio para Google Sheets (titular + aba separada para dependentes)
- Impressão / PDF via navegador

## 🛠️ Stack
HTML + CSS + JS puro — sem dependências externas.
Hospedado via GitHub Pages.
