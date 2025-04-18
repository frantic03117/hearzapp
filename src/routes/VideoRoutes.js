const { Router } = require("express");
const { get_video, create_video, delete_video, update_video } = require("../controllers/VideoController");
const store = require("../middleware/Upload");

const router = Router();
router.get('/view/:page_name?', get_video);

router.post('/', store.fields([
    {
        name: "banner",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    },
    {
        name: "video",
        maxCount: 1
    }

]), create_video);
router.delete('/delete/:id', delete_video);
router.put('/update/:id', store.fields([
    {
        name: "banner",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    },
    {
        name: "video",
        maxCount: 1
    }

]), update_video);
module.exports = router;