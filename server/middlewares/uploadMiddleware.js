const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination(req, file, cb) {
        // Use absolute path to 'server/uploads'
        const uploadPath = path.join(__dirname, '../uploads');

        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename(req, file, cb) {
        cb(
            null,
            `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
        );
    },
});

function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|webp|svg|pdf|doc|docx|xls|xlsx|zip/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    const validMimeTypes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/x-zip-compressed',
        'application/octet-stream' // Often used for zips or arbitrary binary files
    ];

    const isMimeValid = validMimeTypes.some(type => file.mimetype.includes(type)) || filetypes.test(file.mimetype);

    if (extname && isMimeValid) {
        return cb(null, true);
    } else {
        cb('Error: Images, PDFs, Word, Excel, and Zip files only!');
    }
}

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

module.exports = upload;
