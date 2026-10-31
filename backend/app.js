require('dotenv').config();
const path = require('node:path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const alunoRoutes = require('./routes/alunoRoutes');
const cursoRoutes = require('./routes/cursoRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/alunos', alunoRoutes);
app.use('/cursos', cursoRoutes);
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

app.use((err, req, res, next) => {
  const status =
    err.name === 'ValidationError' || err.name === 'CastError' ? 400 : err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 ? 'Erro interno do servidor.' : err.message,
  });
});

async function start() {
  try {
    await connectDB();
    app.listen(port, () => console.log(`API em http://localhost:${port}`));
  } catch (err) {
    console.error('Falha ao ligar ao MongoDB:', err.message);
    process.exit(1);
  }
}

start();
