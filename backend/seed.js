require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db');
const Aluno = require('./models/Aluno');
const Curso = require('./models/Curso');
const bd = require('../mock-data/bd.json');

async function seed() {
  await connectDB();

  await Aluno.deleteMany({});
  await Curso.deleteMany({});

  const cursos = await Curso.insertMany(
    bd.cursos.map(({ id, ...curso }) => curso)
  );
  const cursosPorId = new Map(
    bd.cursos.map((curso, indice) => [String(curso.id), cursos[indice]._id])
  );

  const alunos = bd.alunos.map(({ id, idCurso, ...aluno }) => ({
    ...aluno,
    idCurso: cursosPorId.get(String(idCurso)),
  }));
  await Aluno.insertMany(alunos);

  console.log(`Inseridos ${cursos.length} cursos e ${alunos.length} alunos.`);
}

seed()
  .catch((err) => {
    console.error('Falha no seed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
