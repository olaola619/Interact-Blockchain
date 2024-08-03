const { ethers } = require('ethers');
const inputData = require('./inputData');
const providerUtility = require('./providerUtility');
const walletManager = require('./walletManager');
const erc20functions = require('./erc20functions');
const constants = require('./constants');
require('dotenv').config();
const { writeLog } = require('./inputData');

async function transferMenu(wallets, tokenContracts){
    let transferMenuOption = 0;

    while(transferMenuOption != 10) {
        console.clear();
        console.log(inputData.chalk.blue.bold("TRANSFERS\n"));
        console.log(inputData.chalk.bold('Select an option'));
        console.log(inputData.chalk.bold('  [1]:'), 'Simple transfer');
        console.log(inputData.chalk.bold('  [2]:'), 'Transfer from all wallets to one wallet [NOT IMPLEMENTED YET]');
        console.log(inputData.chalk.bold('  [10]:'), 'Reteurn to main menu');
    
        transferMenuOption = await inputData.getAnswer(`\nChoose an option: `);

        switch (Number(transferMenuOption)) {
            // Transfer coin to a wallet
            case 1:
                try {
                    console.clear();
                    await transferCoin(wallets, tokenContracts);
                } catch (error) {
                    console.log(inputData.chalk.red('There were an error transfering the coin to the wallet'));
                    writeLog(`There were an error transfering the coin to the wallet ${error}`);
                    inputData.introToContinue();
                } 
                break;
            // Import all the wallets from the env file
            case 2:
                
                break;
            // Display all the wallets imported
            case 3:
                break;
        }
    }
}

// Aux function to check if the input is a %
function isPercentage(input) {
    const percentagePattern = /^[0-9]+(\.[0-9]+)?%$/;
    const result = percentagePattern.test(input);
    return result;
}

// Aux function to check if the input is a number
function isNumber(input) {
    const numberPattern = /^[0-9]+(\.[0-9]+)?$/;
    return numberPattern.test(input);
}

// Function to introduce an amount and checking the limits
async function introduceAmountToSend(maxAmount, maxGas, decimals) {
    let readableAmountToSend;
    let inputAnswer;

    // Checks the correct input format
    while (true) {
        inputAnswer = await inputData.getAnswer(`\nIntroduce the amount to send or a %: `);

        if (!isPercentage(inputAnswer) && !isNumber(inputAnswer)) {
            console.log(inputData.chalk.red('Introduce a number or a %'));
        } else if(Number(inputAnswer) <= 0) {
            console.log(inputData.chalk.red('The amount or percentage to send has to be greater than 0\n'));
        } else {
            break;
        }
    }

    // If it is a percentage, recalculates de amount to send
    if(isPercentage(inputAnswer)) {
        readableAmountToSend = (Number(maxAmount) * parseFloat(inputAnswer.slice(0, -1))/100).toFixed(decimals).toString();
    } else {
        readableAmountToSend = Number(inputAnswer).toFixed(decimals).toString();
    }
    
    if((Number(readableAmountToSend) > (Number(maxAmount) + Number(maxGas))) && Number(maxGas) > 0) {
        console.log(`The amount to send will be the wallet balance - maximum gas fee\n`);
        readableAmountToSend = (Number(maxAmount) - Number(maxGas)).toFixed(decimals).toString();
    } else if(Number(readableAmountToSend) > (Number(maxAmount))) {
        console.log(`The amount to send will be the wallet balance\n`);
        readableAmountToSend = (Number(maxAmount)).toFixed(decimals).toString();
    }

    return readableAmountToSend;
}

// Transfers
async function transferCoin(wallets, tokenContracts) {
    console.log(inputData.chalk.blue.bold("SEND TOKENS\n"));
    console.log(inputData.chalk.blue("Sending native coin to a wallet\n"));
    
    // Selecting sending wallet
    console.log(inputData.chalk.bold('Select the sending wallet:'));
    let walletSending = await walletManager.selectWallet(wallets);
    if (walletSending == null){
        await inputData.introToContinue();
        return;
    }

    // Select destination wallet
    console.log(inputData.chalk.bold('\nWallet destination:'));
    console.log(inputData.chalk.bold('  [1]:'), 'Wallet from list');
    console.log(inputData.chalk.bold('  [2]:'), 'Introduce a new wallet');
    const walletRecievingOption = await inputData.getAnswer(`\nChoose an option: `);

    let walletRecievingAddress;
    if (walletRecievingOption == 1) {
        walletRecievingAddress = await walletManager.selectWallet(wallets);
        walletRecievingAddress = walletRecievingAddress.wallet.address;
    } else{
        walletRecievingAddress = await walletManager.introduceAddress(wallets);
    }

    // Select the blockchain to send
    const blockchainSelected = await providerUtility.selectBlockchainMenu();
    const provider = await providerUtility.getProvider(blockchainSelected);

    // Sets the provider to the wallet
    walletSending = await walletManager.changeWalletProvider(walletSending, provider);
   
    // Gas settings
    let gasSettings = await providerUtility.setGastSettings(provider, 0);
    if (gasSettings == null) {
        console.log(inputData.chalk.red('Error defining gas settings'));
        await inputData.introToContinue();
    }

    // Show all the tokens from a blockchain
    console.log(inputData.chalk.bold(`\n${constants.blockchainsData[blockchainSelected].name} selected\n`));
    console.log(inputData.chalk.bold('Select the token to send:'));
    const tokensCount = tokenContracts[blockchainSelected].length;
    const nativeCoinBalance = await erc20functions.getNativeCoinBalance(provider, walletSending.wallet.address);
    for (let i = 0; i <= tokensCount; i++) {
        if (i < tokensCount) {
            const amount = await erc20functions.tokenBalance(tokenContracts[blockchainSelected][i].contract, tokenContracts[blockchainSelected][i].decimals,walletSending.wallet.address);
            // Only shows tokens that the wallet has
            if(amount > 0) {
                console.log(inputData.chalk.bold(`[${i}] - `), `${tokenContracts[blockchainSelected][i].name}: ${amount} $${tokenContracts[blockchainSelected][i].symbol}`);
            }
        } else {
            console.log(inputData.chalk.bold(`[${i}] - `), `${constants.blockchainsData[blockchainSelected].gasSymbol}: ${nativeCoinBalance} $${constants.blockchainsData[blockchainSelected].gasSymbol}`);
        }
    }
    
    // Checks the input
    let tokenSelected;
    while(true) {
        tokenSelected = await inputData.getAnswer(`\nChoose an option: `);
        if (Number(tokenSelected) >= 0 && Number(tokenSelected) <= tokensCount) {
            break;
        }
    }

    // Checks if there is enough gas to cover the tx fee
    const maxGasReadable = Number(gasSettings.limit) * Number(ethers.utils.formatUnits(gasSettings.maxFee), "gwei");
    if (maxGasReadable > nativeCoinBalance) {
        console.log(inputData.chalk.red(`Max gas to spend ${maxGasReadable} ${constants.blockchainsData[blockchainSelected].gasSymbol} is higher the the wallet balance ${nativeCoinBalance} ${constants.blockchainsData[blockchainSelected].gasSymbol}`));
        inputData.introToContinue();
        return;
    }

    // Checks if have to send the native coin or a token
    if (Number(tokenSelected) == tokensCount) {
        await sendNativeCoinToWallet(blockchainSelected, walletSending, nativeCoinBalance, walletRecievingAddress, gasSettings);
    } else{
        const tokenSendingContract = tokenContracts[blockchainSelected][Number(tokenSelected)];
        const tokenReadableBalance = await erc20functions.tokenBalance(tokenSendingContract.contract, tokenSendingContract.decimals,walletSending.wallet.address);
        const tokenBalance = ethers.utils.parseUnits(tokenReadableBalance, tokenSendingContract.decimals);
        await sendTokenToWallet(blockchainSelected, walletSending, tokenSendingContract, tokenBalance, walletRecievingAddress, gasSettings);
    }
}

// Send native coin from one wallet to another
async function sendNativeCoinToWallet(blockchainSelected, walletSending, nativeCoinBalance, walletRecievingAddress, gasSettings) {

    // Max gas readable
    const maxGasReadable = Number(gasSettings.limit) * Number(ethers.utils.formatUnits(gasSettings.maxFee), "gwei");

    // Amount to send. The maximum amount will be the balance of the wallet - maximum gas to spend
    const readableAmountToSend = await introduceAmountToSend(nativeCoinBalance, maxGasReadable, 18);

    const transferResumeString = 
        `\nSend ${readableAmountToSend} ${constants.blockchainsData[blockchainSelected].gasSymbol} from ${walletSending.name} ${walletSending.wallet.address} to ${walletRecievingAddress}\n` +
        `Gas limit: ${gasSettings.limit}\n` + 
        `Last block base fee: ${ethers.utils.formatUnits(gasSettings.lastBaseFee, "gwei")} gwei\n` +
        `Maximum priority fee: ${ethers.utils.formatUnits(gasSettings.maxPriorityFee, "gwei")} gwei\n` +
        `Maximum fee: ${ethers.utils.formatUnits(gasSettings.maxFee, "gwei")} gwei\n` +
        `Maximum gas to spend (Gas Limit * Maximum Fee): ${maxGasReadable} ${constants.blockchainsData[blockchainSelected].gasSymbol}`;

    console.log(transferResumeString);
    writeLog(transferResumeString);
    
    // Checking if there is enough balance for amount + gas
    if ((maxGasReadable + readableAmountToSend) > nativeCoinBalance) {
        console.log(inputData.chalk.red('The amount to send + max gas Fee is greater than  the wallet balance\n'));
        await inputData.introToContinue();
        return;
    }

    // Sending confirmation before executing the tx
    const sendingConfirmation = await inputData.getAnswer(`\nYes[Y] or No[N]: `);
    if (sendingConfirmation.toUpperCase() != 'Y') {
        console.log(inputData.chalk.red('Transfer cancelled\n'));
        writeLog('Transfer cancelled\n');
        await inputData.introToContinue();
        return;
    }

    try {
        // Creates the tx
        const tx = {
            to: walletRecievingAddress,
            value: ethers.utils.parseEther(readableAmountToSend),
            gasLimit: Number(gasSettings.limit),
            maxPriorityFeePerGas: gasSettings.maxPriorityFee,
            maxFeePerGas: gasSettings.maxFee
        };

        // Sends the tx
        console.log('Waiting transaction to be sent...');
        const txResponse = await walletSending.wallet.sendTransaction(tx);
        console.log('Transaction sent with hash:', txResponse.hash);
        writeLog(`Transaction sent with hash: ${txResponse.hash}`);

        // Waits until the tx is mined
        const receipt = await txResponse.wait();
        console.log(inputData.chalk.green('Transaction confirmed: ', receipt.transactionHash));
        writeLog(`Transaction confirmed: ${receipt.transactionHash}`);

        await inputData.introToContinue();
    } catch(error) {
        console.log(inputData.chalk.red('There were an error with the transaction'));
        writeLog(error);
        await inputData.introToContinue();
    }
    
}

// Send a token from one walle to another
async function sendTokenToWallet(blockchainSelected, walletSending, tokenSendingContract, tokenBalance, walletRecievingAddress, gasSettings) {

    // Max gas readable
    const maxGasReadable = Number(gasSettings.limit) * Number(ethers.utils.formatUnits(gasSettings.maxFee), "gwei");

    // Amount to send. The maximum amount will be the token balance
    const tokenReadableBalance = ethers.utils.formatUnits(tokenBalance, tokenSendingContract.decimals);
    const readableAmountToSend = await introduceAmountToSend(tokenReadableBalance, '0', Number(tokenSendingContract.decimals));

    const transferResumeString =
        `\nSend ${readableAmountToSend} ${tokenSendingContract.symbol} from ${walletSending.name} ${walletSending.wallet.address} to ${walletRecievingAddress}\n` +
        `Gas limit: ${gasSettings.limit}\n` + 
        `Last block base fee: ${ethers.utils.formatUnits(gasSettings.lastBaseFee, "gwei")} gwei\n` + 
        `Maximum priority fee: ${ethers.utils.formatUnits(gasSettings.maxPriorityFee, "gwei")} gwei\n` +
        `Maximum fee: ${ethers.utils.formatUnits(gasSettings.maxFee, "gwei")} gwei\n` +
        `Maximum gas to spend (Gas Limit * Maximum Fee): ${maxGasReadable} ${constants.blockchainsData[blockchainSelected].gasSymbol}`;

    console.log(transferResumeString);
    writeLog(transferResumeString);

    // Sending confirmation before executing the tx
    const sendingConfirmation = await inputData.getAnswer(`\nYes[Y] or No[N]: `);
    if (sendingConfirmation.toUpperCase() != 'Y') {
        console.log(inputData.chalk.red('Transfer cancelled\n'));
        writeLog('Transfer cancelled\n');
        await inputData.introToContinue();
        return;
    }

    try {
        // Defines the contract
        const tokenContract = new ethers.Contract(tokenSendingContract.contract.address, erc20functions.ERC20_ABI, walletSending.wallet);

        // Creates and sends the tx
        const amountToSend = ethers.utils.parseUnits(readableAmountToSend, tokenSendingContract.decimals);
        console.log('Waiting transfer transaction to be sent...');
        const tx = await tokenContract.transfer(walletRecievingAddress, amountToSend, {
            gasLimit: Number(gasSettings.limit),
            maxPriorityFeePerGas: gasSettings.maxPriorityFee,
            maxFeePerGas: gasSettings.maxFee
        });

        console.log('Transaction sent with hash:', tx.hash);
        writeLog(`Transaction sent with hash: ${tx.hash}`);

        // Waits until the tx is mined
        const receipt = await tx.wait();
        console.log(inputData.chalk.green('Transaction confirmed: ', receipt.transactionHash));
        writeLog(`Transaction confirmed: ${receipt.transactionHash}`);

        await inputData.introToContinue();
    } catch(error) {
        console.log(inputData.chalk.red('There were an error with the transaction'));
        writeLog(error);
        await inputData.introToContinue();
    }
}

module.exports = {
    transferMenu,
    introduceAmountToSend,
    isPercentage,
    isNumber
}