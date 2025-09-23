const express = require('express');
const router = express.Router();
const controller = require('../controllers/testQuestionController');
const { Auth } = require('../middleware/Auth');

router.post('/', controller.createTestQuestion);
router.get('/', controller.getAllTestQuestions);
router.get('/show/:id', controller.getTestQuestionById);
router.put('/update/:id', Auth, controller.updateTestQuestion);
router.delete('/delete/:id', Auth, controller.deleteTestQuestion);

module.exports = router;
