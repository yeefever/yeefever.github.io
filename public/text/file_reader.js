const fs = require('fs');


const readFile = (filePath) => {
    try {
        const fileContents = fs.readFileSync(filePath, 'utf-8');
        return fileContents;
    } catch (error){
        console.log(error);
        return null;
    }
}

module.exports = readFile;