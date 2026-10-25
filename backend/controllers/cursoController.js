const Curso = require('../models/Curso');

async function listar(req, res) {
  const cursos = await Curso.find();
  res.json(cursos);
}

async function obter(req, res) {
  const curso = await Curso.findById(req.params.id);
  if (!curso) return res.status(404).json({ error: 'Curso não encontrado.' });
  res.json(curso);
}

module.exports = { listar, obter };
