# 🎾 Super 8 — Beach Tennis Manager

Aplicativo web para gerenciamento de torneios **Super 8 de Beach Tennis**, desenvolvido com Angular e Firebase.

🔗 **[Acesse o app](https://super8-evertonmedola.vercel.app)**

---

## 📋 Sobre o formato Super 8

O Super 8 é um formato de torneio individual com **8 jogadores** onde:

- As duplas se revezam a cada jogo, de forma que nenhuma parceria se repita
- São **14 jogos** no total na fase classificatória
- O sistema de pontuação é baseado em **saldo de games**:

| Resultado | Saldo Vencedor | Saldo Perdedor |
|-----------|---------------|----------------|
| 6×0       | +6            | -6             |
| 5×1       | +4            | -4             |
| 4×2       | +2            | -2             |
| 3×3       | 0             | 0              |

- Os **4 melhores saldos** avançam para a fase final
- Na final, as duplas são sorteadas novamente — **3 jogos** em rodízio
- Em caso de empate, o critério é o **confronto direto**
- Na final, empates são desempatados pelo **saldo da classificatória**

---

## ✨ Funcionalidades

- 📝 **Cadastro de jogadores** — 8 jogadores por torneio
- 🎲 **Geração de jogos** — sorteio automático ou definição manual das duplas
- 📊 **Classificação em tempo real** — ranking atualizado a cada placar inserido
- 🏆 **Fase final** — top 4 com duplas sorteadas e 3 jogos em rodízio
- 🔴 **Tempo real** — todos os dispositivos sincronizados via Firebase
- 🔐 **Controle de acesso** — view pública (somente leitura) e modo organizador com senha
- 📱 **Responsivo** — funciona no celular e no computador

---

## 🛠️ Tecnologias

- **[Angular 21](https://angular.dev)** — framework frontend com Signals e Standalone Components
- **[Firebase Firestore](https://firebase.google.com)** — banco de dados NoSQL em tempo real
- **[Vercel](https://vercel.com)** — deploy e hospedagem
- **SCSS** — estilização com design temático beach tennis

---

## 🚀 Rodando localmente

### Pré-requisitos
- Node.js 20+
- Angular CLI 19+

### Instalação

```bash
# Clone o repositório
git clone https://github.com/evertonmedola/super8.git
cd super8

# Instale as dependências
npm install
```

---

## 📁 Estrutura do projeto

```
src/
├── app/
│   ├── core/
│   │   ├── models/         # Interfaces TypeScript
│   │   ├── services/       # Store, Auth, Stats, Schedule
│   │   └── firebase.config.ts
│   ├── features/
│   │   ├── setup/          # Cadastro de jogadores e senha
│   │   ├── matches/        # 14 jogos da classificatória
│   │   ├── standings/      # Classificação geral
│   │   └── final/          # Fase final (top 4)
│   └── shared/
│       └── components/     # Score selector reutilizável
├── environments/           # Configurações de ambiente
└── styles/                 # SCSS global
```

---

## 👤 Autor

**Everton Medola**

- 💼 [LinkedIn](https://linkedin.com/in/evertonmedola)
- 🐙 [GitHub](https://github.com/evertonmedola)

---

<p align="center">Feito com ☀️ para a galera do beach tennis</p>