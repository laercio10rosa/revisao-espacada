# Revisão Espaçada

Sistema simples de revisão espaçada (estilo Anki) com algoritmo SM-2, autenticação e banco de dados no Firebase, e deploy automático no GitHub Pages.

## Funcionalidades

- Login/cadastro por e-mail e senha (Firebase Auth)
- Baralhos e cartões (frente/verso) salvos no Firestore, por usuário
- Sessão de revisão com algoritmo SM-2 (mesmo usado como base pelo Anki)
- Deploy automático via GitHub Actions ao dar push na branch `main`

## 1. Criar o projeto no Firebase

1. Acesse https://console.firebase.google.com e crie um novo projeto.
2. Em **Build > Authentication**, habilite o provedor **E-mail/senha**.
3. Em **Build > Firestore Database**, crie o banco (modo produção).
4. Publique as regras de segurança deste repositório (`firestore.rules`) no console do Firestore, aba **Regras**. Elas garantem que cada usuário só acesse os próprios dados.
5. Em **Configurações do projeto > Geral**, crie um app da Web e copie as credenciais (`apiKey`, `authDomain`, etc).

## 2. Configurar variáveis de ambiente localmente

Copie `.env.example` para `.env` e preencha com as credenciais do passo anterior:

```bash
cp .env.example .env
```

## 3. Rodar localmente

```bash
npm install
npm run dev
```

## 4. Publicar no GitHub Pages

1. Crie o repositório `revisao-espacada` no GitHub e envie este código (`git push`).
2. No repositório, vá em **Settings > Pages** e defina **Source** como **GitHub Actions**.
3. Em **Settings > Secrets and variables > Actions**, cadastre os mesmos 6 valores do seu `.env` como *secrets* (mesmos nomes: `VITE_FIREBASE_API_KEY`, etc).
4. A cada `git push` na branch `main`, o workflow em `.github/workflows/deploy.yml` builda e publica o site automaticamente em `https://SEU_USUARIO.github.io/revisao-espacada/`.

Se o nome do repositório for diferente de `revisao-espacada`, ajuste o campo `base` em `vite.config.js` para `/NOME-DO-REPO/`.
