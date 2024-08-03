const { ethers } = require('ethers');
const readline = require('readline');
require('dotenv').config();
const providerUtility = require('./utilities/providerUtility');
const inputData = require('./utilities/inputData');
const erc20functions = require('./utilities/erc20functions');
const walletManager = require('./utilities/walletManager');
const transfer = require('./utilities/transfer');
const test = require('./utilities/test');
const constants = require('./utilities/constants');
const swap = require('./utilities/swap');
const { writeLog } = require('./utilities/inputData');

// Main menu
async function mainMenu() {
    
    console.log(inputData.chalk.bold('Select an option'));
    console.log(inputData.chalk.bold('  [1]:'), 'Import all the data');
    console.log(inputData.chalk.bold('  [2]:'), 'Check blockchain connection');
    console.log(inputData.chalk.bold('  [3]:'), 'Wallet manager');
    console.log(inputData.chalk.bold('  [4]:'), 'Token manager');
    console.log(inputData.chalk.bold('  [5]:'), 'Transfers');
    console.log(inputData.chalk.bold('  [6]:'), 'Swaps');
    console.log(inputData.chalk.bold('  [10]:'), 'Exit program');
    
    const option = await inputData.getAnswer(`\nChoose an option: `);
    return option;
}

async function initialize() {
    // Initiates chalk for the colors
    await inputData.initializeChalk();

    // Initiates the blockchain vector
    constants.initializeBlockchainsData();

    // Initiates the fast swap config var
    constants.initializeFastSwapConfig();
}

// Import all the data
async function importData(wallets, tokenContracts) {
    console.clear();
    console.log(inputData.chalk.rgb(255, 136, 0).bold('Importing data from files...\n'));
    await walletManager.importWalletsFromEnvFile(wallets);
    await erc20functions.importTokensFromConstants(tokenContracts);
    console.log(inputData.chalk.green.bold('\nImporting process finished!'));
    await inputData.introToContinue();

    return {wallets, tokenContracts};
}

// Main function
async function main(){

    writeLog("Program run");

    // Initiates everything needed for the program
    await initialize();

    let userOption = 0;
    let wallets = [];
    let tokenContracts = [];

    // Init tokenContracts matrix
    tokenContracts = erc20functions.initTokenContracts(tokenContracts);

    // Auto load data
    if(constants.autoLoadData == true) {
        ({wallets, tokenContracts} = await importData(wallets, tokenContracts));
    }

    // Main menu
    while (userOption != 10) {
        console.clear();
        console.log(inputData.chalk.yellow.bold('PROGRAM TO INTERACT WITH THE BLOCKCHAIN\n'));

        userOption = await mainMenu();
        switch (Number(userOption)) {
            // Import all data from Env file
            case 1:
                try {
                    ({wallets, tokenContracts} = await importData(wallets, tokenContracts));
                } catch (error) {
                    console.log(inputData.chalk.red('There were an error importing the data'));
                    writeLog(`There were an error importing the data ${error}`);
                    inputData.introToContinue();
                }
                break;
            // Select provider
            case 2:
                try {
                    console.clear();
                    console.log(inputData.chalk.blue.bold("BLOCKCHAIN MANAGER"));
                    const blockchainSelected = await providerUtility.selectBlockchainMenu();
                    const provider = await providerUtility.getProvider(blockchainSelected); 
                    await providerUtility.checkProvider(provider, blockchainSelected);
                    await inputData.introToContinue();
                } catch (error) {
                    console.log(inputData.chalk.red('There were an error checking the provider'));
                    writeLog(`There were an error checking the provider ${error}`);
                    inputData.introToContinue();
                }   
                break;
            // Wallet manager
            case 3:
                await walletManager.walletMenu(wallets);
                break;
            // Tokens manager
            case 4:
                console.clear();
                await erc20functions.tokenMenu(wallets, tokenContracts);
                break;
            // Trasnfers
            case 5:
                console.clear();
                await transfer.transferMenu(wallets, tokenContracts);
                break;
            // Swaps
            case 6:
                console.clear();
                await swap.swapMenu(wallets, tokenContracts);
                break;
            // Ending program
            case 10:
                console.log('Finishing program...\n');
                break;
            // Testing option
            case 11:
                console.clear();
                break;
            // Wrong option selected
            default:
                console.log('That option has no function, select another one\n');
                break;
        }
    } 
} 

main().then(() => {
    writeLog('Program ended without errors');
    inputData.rl.close();
    process.exit(0);
}).catch((error) => {
    console.log(inputData.chalk.red('There were an error during the program run, finishing the program...'));
    writeLog(error);
    writeLog('Program finished due to the error below');
    inputData.rl.close();
    process.exit(1);
});