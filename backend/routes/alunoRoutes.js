const { Router } = require('express');
const alunoController = require('../controllers/alunoController');

const router = Router();

router.get('/', alunoController.listar);
router.get('/:id', alunoController.obter);
router.post('/', alunoController.criar);
router.put('/:id', alunoController.atualizar);
router.patch('/:id', alunoController.atualizar);
router.delete('/:id', alunoController.apagar);

module.exports = router;
