const { Router } = require("express");
const { get_blog, create_blog, update_blog, delete_blog } = require("../controllers/BlogController");
const store = require("../middleware/Upload");

const router = Router();
router.get('/', get_blog);
router.post('/', store.fields([
    {
        name: "banner",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]), create_blog);
router.put('/update/:id', store.fields([
    {
        name: "banner",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]), update_blog);
router.delete('/delete/:id', delete_blog);
module.exports = router;