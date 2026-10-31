# SIR — Atividade Prática #1

Aplicação de gestão de alunos com frontend em HTML/CSS/JavaScript, API simulada com JSON Server e API real em Node.js + Express + MongoDB Atlas.

## Estrutura

```
mock-data/      Base de dados JSON
mock-server/    JSON Server e coleção Postman
frontend/       Interface web
backend/        API RESTful com Express e Mongoose
```

## Parte 3 — Frontend com JSON Server

```bash
cd mock-server
npm install
npm start
```

Abrir <http://localhost:3000>.

O JSON Server serve a pasta `frontend/` e a API ao mesmo tempo. A interface permite listar, adicionar, editar e apagar alunos, usando `fetch` com pedidos assíncronos.

## Parte 4 — API com Express e MongoDB Atlas

### Atlas

1. Criar um cluster e uma base de dados chamada `sir`.
2. Criar as coleções `alunos` e `cursos`.
3. Criar um utilizador com permissão de leitura e escrita na base de dados.
4. Em Network Access, permitir `0.0.0.0/0`.
5. Copiar a connection string para `backend/.env`.

### Configuração

```bash
cd backend
npm install
cp .env.example .env
```

Editar `backend/.env`:

```
MONGODB_URI=mongodb://utilizador:password@host:27017/sir?...
PORT=3000
```

O ficheiro `.env` não é enviado para o repositório.

### Importar os dados

```bash
npm run seed
```

O seed limpa as coleções `alunos` e `cursos` e importa os dados de `mock-data/bd.json`.

### Executar

```bash
npm start
```

A API e o frontend ficam disponíveis em <http://localhost:3000>.

> O JSON Server e a API usam a mesma porta. Executar apenas um de cada vez.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/alunos` | Listar alunos (`?idCurso=<id>` para filtrar) |
| GET | `/alunos/:id` | Obter um aluno |
| POST | `/alunos` | Criar um aluno |
| PUT | `/alunos/:id` | Atualizar um aluno |
| PATCH | `/alunos/:id` | Atualizar parcialmente um aluno |
| DELETE | `/alunos/:id` | Apagar um aluno |
| GET | `/cursos` | Listar cursos |
| GET | `/cursos/:id` | Obter um curso |

## Coleção Postman

A coleção da Parte 2 está em `mock-server/tests/Collection.postman_collection.json`.

## Deploy

### API no Render

O repositório inclui `render.yaml`, que pode ser usado com Render Blueprints. Nesse caso, indicar `MONGODB_URI` quando for pedido.

Alternativamente, criar manualmente um Web Service ligado a este repositório.
2. Root Directory: `backend`.
3. Build Command: `npm install`.
4. Start Command: `npm start`.
5. Adicionar a variável de ambiente `MONGODB_URI` com a connection string do Atlas.
6. Não definir `PORT`; o Render fornece essa variável.

### Frontend no Vercel

1. Importar este repositório no Vercel.
2. Root Directory: `frontend`.
3. Framework Preset: Other.
4. Build Command: vazio.
5. Output Directory: `.`.

O endereço da API usado pelo frontend está definido no início de `frontend/js/app.js`. Se o serviço do Render tiver outro nome, atualizar essa constante.

### URLs públicas

- Frontend: `<URL do Vercel>`
- API: `<URL do Render>`
