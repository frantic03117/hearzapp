const { Router } = require("express");
const { allQuestions, createQuestion, updateQuestion, deleteQuestion } = require("../controllers/SuggestionQuestionController");

const router = Router();
router.get('/', allQuestions);
router.post('/', createQuestion);
router.put('/update/:id', updateQuestion);
router.delete('/delete/:id', deleteQuestion);
module.exports = router;