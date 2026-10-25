const { Router } = require('express');
const cursoController = require('../controllers/cursoController');

const router = Router();

router.get('/', cursoController.listar);
router.get('/:id', cursoController.obter);

module.exports = router;
