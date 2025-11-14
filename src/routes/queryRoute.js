const { Router } = require("express");
const { getQueries, createQuery } = require("../controllers/QueryController");

const router = new Router();
router.get('/', getQueries);
router.post('/', createQuery);
module.exports = router;