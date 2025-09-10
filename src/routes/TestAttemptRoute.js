const { Router } = require("express");
const { Auth } = require("../middleware/Auth");
const { createOrUpdateAttempt, getAttempts, deleteAttempt } = require("../controllers/TestAttemptController");

const router = Router();
router.post('/', Auth, createOrUpdateAttempt);
router.get('/', Auth, getAttempts);
router.delete('/:id', Auth, deleteAttempt);
module.exports = router;