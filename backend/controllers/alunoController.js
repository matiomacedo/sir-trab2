const Aluno = require('../models/Aluno');

async function listar(req, res) {
  const filtro = req.query.idCurso ? { idCurso: req.query.idCurso } : {};
  const alunos = await Aluno.find(filtro);
  res.json(alunos);
}

async function obter(req, res) {
  const aluno = await Aluno.findById(req.params.id);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado.' });
  res.json(aluno);
}

async function criar(req, res) {
  const aluno = await Aluno.create(req.body);
  res.status(201).json(aluno);
}

async function atualizar(req, res) {
  const aluno = await Aluno.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado.' });
  res.json(aluno);
}

async function apagar(req, res) {
  const aluno = await Aluno.findByIdAndDelete(req.params.id);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado.' });
  res.status(204).end();
}

module.exports = { listar, obter, criar, atualizar, apagar };
