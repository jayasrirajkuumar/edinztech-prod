const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../controllers/adminController.js');
let content = fs.readFileSync(filePath, 'utf8');

const target = "return res.status(401).json({ message: 'Invalid Admin Password' });";
const replacement = "return res.status(403).json({ message: 'Invalid Admin Password' });";

if (content.includes(target)) {
    const newContent = content.replaceAll(target, replacement);
    fs.writeFileSync(filePath, newContent);
    console.log('Successfully updated status codes to 403');
} else {
    console.log('Target string not found or already updated');
}
