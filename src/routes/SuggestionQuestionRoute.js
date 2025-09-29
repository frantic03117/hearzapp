const { Router } = require("express");
const { allQuestions, createQuestion, updateQuestion, deleteQuestion, save_attempt } = require("../controllers/SuggestionQuestionController");
const { Auth } = require("../middleware/Auth");

const router = Router();
router.get('/', allQuestions);
router.post('/', createQuestion);
router.post('/attempt', Auth, save_attempt);
router.put('/update/:id', updateQuestion);
router.delete('/delete/:id', deleteQuestion);
module.exports = router;