const { ethers } = require('ethers');
const inputData = require('./inputData');
const constants = require('./constants');
require('dotenv').config();
const { writeLog } = require('./inputData');

class Wallet {
    constructor(wallet, name) {
        this.wallet = wallet;
        this.name = name;
        this.nonce = 0;
    }
}


async function walletMenu(wallets){
    let userWalletMenuOption = 0;

    while(userWalletMenuOption != 10) {
        console.clear();
        console.log(inputData.chalk.blue.bold("WALLET MANAGER\n"));
        console.log(inputData.chalk.bold('Select an option'));
        console.log(inputData.chalk.bold('  [1]:'), 'Import wallet from private key');
        console.log(inputData.chalk.bold('  [2]:'), 'Import wallets from ENV file');
        console.log(inputData.chalk.bold('  [3]:'), 'Display all the wallets imported');
        console.log(inputData.chalk.bold('  [10]:'), 'Reteurn to main menu');
    
        userWalletMenuOption = await inputData.getAnswer(`\nChoose an option: `);

        switch (Number(userWalletMenuOption)) {
            // Import wallet from private key
            case 1:
                console.clear();
                console.log(inputData.chalk.blue.bold("WALLET MANAGER\n"));
                await importWalletFromPrivateKey(wallets);
                await inputData.introToContinue();
                break;
            // Import all the wallets from the env file
            case 2:
                console.clear();
                await importWalletsFromEnvFile(wallets);
                await inputData.introToContinue();
                break;
            // Display all the wallets imported
            case 3:
                console.clear();
                console.log(inputData.chalk.blue.bold("WALLET MANAGER\n"));
                console.log("WALLETS\n");
                showWallets(wallets);
                await inputData.getAnswer('\nPress intro to go back to the menu\n');
                break;
        }
    }

    return wallets;
}

// Function to import all the wallets from the env file
async function importWalletsFromEnvFile(wallets) {
    
    console.log(inputData.chalk.cyan("Importing wallets from env file...\n"));
    
    let index = 1;

    try {
        while (true) {
            const privateKeyEnv = `WALLET_PRIVATE_KEY_${index}`;
            const nameEnv = `WALLET_NAME_${index}`;
    
            const privateKey = process.env[privateKeyEnv];
            const walletName = process.env[nameEnv];
    
            // Checks if there are more wallets to exit from the loop
            if (!privateKey || !walletName) {
                break;
            }

            const wallet = new ethers.Wallet(privateKey);

            if(checkIfAddressImported(wallets, wallet.address)) {
                console.log(`Wallet: ${wallet.address} was already imported\n`);
            } else {
                const walletInstance = new Wallet(wallet, walletName);
                wallets.push(walletInstance);
                console.log(inputData.chalk.green(`${walletInstance.name} ${walletInstance.wallet.address} imported!\n`));    
            }

            index++;
        }
    }catch(error) {
        console.log(inputData.chalk.red('\nThere were an error trying to import the wallets'));
        writeLog(error);
    }
}

// Function to import a wallet from a private key
async function importWalletFromPrivateKey(wallets) {

    try {
        const privateKey = await inputData.getAnswer("Introduce the private key: ");
        const wallet = new ethers.Wallet(privateKey);
        if(checkIfAddressImported(wallets, wallet.address)) {
            console.log(`Wallet: ${wallet.address} was already imported\n`);
        } else {
            const walletName = await inputData.getAnswer("Introduce a name for the wallet: ");
            const walletInstance = new Wallet(wallet, walletName);
            wallets.push(walletInstance);
            console.log(`${walletInstance.name} ${walletInstance.wallet.address} imported!`);
        }
    }catch(error) {
        console.log(inputData.chalk.red('\nThere were an error trying to import the wallet'));
        writeLog(error);
    }
}

// Function to check if the wallet to add is already imported
function checkIfAddressImported(wallets, walletAddress) {
    for(let i = 0; i < wallets.length; i++) {
        if(walletAddress == wallets[i].wallet.address) {
            return true;
        }
    }

    return false;
}

// Function to change the provider to the wallets when a different blockchain is selected
async function changeWalletsProvider(wallets, provider) {
    try {
        wallets.forEach(walletX => {
            walletX.wallet = walletX.wallet.connect(provider);
        });
    }catch(error) {
        console.log(inputData.chalk.red('There were an error changing the provider to the wallets'));
        writeLog(error);
    }
    return wallets;
}

async function changeWalletProvider(wallet, provider) {
    try {
        wallet.wallet = wallet.wallet.connect(provider);
    }catch(error) {
        console.log(inputData.chalk.red('There were an error changing the provider to the wallet'));
        writeLog(error);
    }
    return wallet;
}

function showWallets(wallets) {
    if (wallets.length == 0) {
        console.log("Wallets list empty");
    } else {
        for(let i = 0; i < wallets.length; i++) {
            console.log(inputData.chalk.bold(`  [${i}]:`), `${wallets[i].name} - ${wallets[i].wallet.address}`);
        }
    }
}

async function selectWallet(wallets) {
    showWallets(wallets);

    let walletSelected;
    while(true && wallets.length > 0) {
        walletSelected = await inputData.getAnswer(`\nChoose an option: `);
        if(Number(walletSelected) >= 0 && Number(walletSelected) < wallets.length) {
            break;
        }
    }

    if (walletSelected) {
        return wallets[walletSelected];
    }
}

async function introduceAddress(wallets)
 {
    let address;

    while(true) {
        address = await inputData.getAnswer(`\nIntroduce the wallet address: `);

        if(!checkIfAddressImported(wallets, address) && ethers.utils.isAddress(address)){
            break;
        } else if(checkIfAddressImported(wallets, address)){
            console.log('Address already imported!');
        } else {
            console.log('Check that the address has the correct format');
        }
    }
    
    return address;
}

module.exports = {
    walletMenu,
    changeWalletsProvider,
    changeWalletProvider,
    importWalletsFromEnvFile,
    showWallets,
    selectWallet,
    introduceAddress
}