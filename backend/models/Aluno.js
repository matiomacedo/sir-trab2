const mongoose = require('mongoose');

const alunoSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    apelido: { type: String, required: true, trim: true },
    idCurso: { type: mongoose.Schema.Types.ObjectId, ref: 'Curso', required: true },
    anoCurricular: { type: Number, required: true, min: 1, max: 3 },
    idade: { type: Number, min: 0, max: 120 },
  },
  {
    toJSON: {
      versionKey: false,
      transform: (_documento, resultado) => {
        resultado.id = resultado._id.toString();
        delete resultado._id;
        return resultado;
      },
    },
  }
);

module.exports = mongoose.model('Aluno', alunoSchema, 'alunos');
