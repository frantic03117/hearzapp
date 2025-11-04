const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    },
});

const createFileFilter = (type) => {
    return (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();

        // Allowed extensions by type
        const types = {
            image: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
            pdf: [".pdf"],
            video: [".mp4", ".mov", ".avi", ".mkv"],
            audio: [".mp3", ".wav", ".aac", ".ogg"],
        };

        const allowed = types[type];

        if (!allowed) return cb(new Error("Invalid upload type configuration"));
        if (!allowed.includes(ext)) {
            return cb(
                new Error(`❌ Only ${type.toUpperCase()} files are allowed!`),
                false
            );
        }

        cb(null, true);
    };
};

// Factory to create multer instances for different file types
const UploadFile = (type) =>
    multer({
        storage,
        fileFilter: createFileFilter(type),
        limits: { fileSize: 100 * 1024 * 1024 },
    });

module.exports = UploadFile;
