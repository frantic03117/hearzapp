const express = require('express');
const router = express.Router();
const controller = require('../controllers/testQuestionController');

router.post('/', controller.createTestQuestion);
router.get('/', controller.getAllTestQuestions);
router.get('/show/:id', controller.getTestQuestionById);
router.put('/update/:id', controller.updateTestQuestion);
router.delete('/delete/:id', controller.deleteTestQuestion);

module.exports = router;
