# PIE Digital NR-10 — Gestão de Prontuário de Instalações Elétricas

O **PIE Digital NR-10** é uma plataforma web profissional desenvolvida para a gestão completa do Prontuário de Instalações Elétricas, em total conformidade com a norma regulamentadora NR-10. O sistema centraliza a gestão de clientes, documentos técnicos, inspeções e relatórios em um ambiente seguro e responsivo.

## 🎯 Objetivo

Facilitar a organização e o acesso às informações técnicas de segurança elétrica, permitindo que empresas e profissionais gerenciem seus prontuários de forma digital, eficiente e segura.

## 🚀 Funcionalidades

- **Gestão de Clientes**: Cadastro centralizado com dados empresariais, responsáveis e identidade visual.
- **Gerenciamento de Documentos**: Upload real de arquivos (Firebase Storage), categorização e controle de validade.
- **Visualização de PDF**: Visualizador integrado para consulta rápida de laudos e projetos.
- **Controle de Acesso (RBAC)**: Perfis diferenciados para Administradores, Editores e Visitantes/Fiscais.
- **Sistema de Convites**: Geração de links seguros para acesso temporário de fiscais e auditores.
- **Geração de Relatórios**: Exportação de prontuários completos em formato profissional.
- **Interface Responsiva**: Otimizado para uso em computadores, tablets e smartphones.

## 🛠️ Tecnologias

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Radix UI.
- **Backend & Database**: Firebase (Authentication, Firestore, Storage).
- **Roteamento**: Wouter.
- **Deploy**: Vercel.

## 📦 Instalação e Execução Local

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/seu-usuario/pie-digital-nr10.git
   cd pie-digital-nr10
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   # ou
   pnpm install
   ```

3. **Configure as Variáveis de Ambiente**:
   - Renomeie o arquivo `.env.example` para `.env`.
   - Insira suas credenciais do Firebase no arquivo `.env`.

4. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

5. **Gere o build de produção**:
   ```bash
   npm run build
   ```

## 🔐 Configuração do Firebase e Segurança

Este projeto utiliza **variáveis de ambiente** para proteger informações sensíveis. Nunca envie o arquivo `.env` para o GitHub.

### Passos para configurar:
1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Ative **Authentication** (E-mail/Senha), **Firestore** e **Storage**.
3. Obtenha as chaves de configuração no painel do projeto.
4. Adicione as chaves no seu arquivo `.env` local.
5. No **Vercel**, adicione essas mesmas chaves na seção **Environment Variables**.

## 🚀 Deploy na Vercel

O projeto está configurado para deploy automático na Vercel:
- **Build Command**: `npm run build` ou `vite build`
- **Output Directory**: `dist`
- **Framework Preset**: Vite

---

**Desenvolvido por Joelson Mendes**
