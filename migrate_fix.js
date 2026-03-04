const fs = require('fs');
const path = require('path');

const OLD_IDS = ['spqjbrmpwgwjcynvbadr', 'oqtlakdvlmkaalymgrwd'];
const NEW_ID = 'tguxydfhxcmqvcrenqbl';
const NEW_URL = `https://${NEW_ID}.supabase.co`;

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            if (f !== 'node_modules' && f !== '.git' && f !== 'build') {
                walkDir(dirPath, callback);
            }
        } else {
            callback(path.join(dir, f));
        }
    });
}

const targetDirs = ['./src', './server.js'];

targetDirs.forEach(target => {
    if (fs.statSync(target).isDirectory()) {
        walkDir(target, (filePath) => {
            if (filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.env')) {
                processFile(filePath);
            }
        });
    } else {
        processFile(target);
    }
});

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;
        let modified = false;

        OLD_IDS.forEach(oldId => {
            if (content.includes(oldId)) {
                // Replace URL first to avoid double replacement if IDs overlap
                content = content.replace(new RegExp(`https://${oldId}.supabase.co`, 'g'), NEW_URL);
                // Replace naked ID
                content = content.replace(new RegExp(oldId, 'g'), NEW_ID);
                modified = true;
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    } catch (e) {
        console.error(`Error processing ${filePath}:`, e);
    }
}
