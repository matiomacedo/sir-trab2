const mongoose = require('mongoose');

const cursoSchema = new mongoose.Schema(
  {
    nomeDoCurso: { type: String, required: true, trim: true },
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

module.exports = mongoose.model('Curso', cursoSchema, 'cursos');
