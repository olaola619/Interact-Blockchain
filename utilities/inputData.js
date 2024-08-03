const readline = require('readline');
const fs = require('fs');
const path = require('path');

// For console colors
let chalk;

async function initializeChalk() {
    const importedChalk = await import('chalk');
    chalk = importedChalk.default;
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Reading user answer
function getAnswer(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

// Press enter to continue
function introToContinue() {
    return new Promise((resolve) => {
        rl.question(chalk.magenta('\nPress intro to go back to the menu\n'), (answer) => {
            resolve(answer);
        });
    });
}

function formatDate(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // January is 0
    const yyyy = date.getFullYear();

    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    const mili = String(date.getMilliseconds()).padStart(3, '0');

    return `[${dd}/${mm}/${yyyy} - ${hh}:${min}:${ss}:${mili}]:`;
}

function writeLog(message) {
    const logDir = path.join(__dirname, '../logs');
    const logFilePath = path.join(logDir, 'log.log');
    const timestamp = formatDate(new Date());
    const logMessage = `${timestamp} ${message}\n`;

    // Create folder if not exists
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    // Create file if not exists
    if (!fs.existsSync(logFilePath)) {
        fs.writeFileSync(logFilePath, '');
    }

    fs.appendFileSync(logFilePath, logMessage, (err) => {
        if (err) {
            console.log(err);
            throw err;  
        } else {
            console.log('Writing log:', logMessage);
        }
        //console.log('Log saved!');
    });
}

// Delay function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    rl,
    getAnswer,
    initializeChalk,
    introToContinue,
    writeLog,
    delay,
    get chalk() {
        return chalk;
    }
}