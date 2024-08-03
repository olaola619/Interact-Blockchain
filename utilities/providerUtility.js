const { ethers } = require('ethers');
require('dotenv').config();
const inputData = require('./inputData');
const constants = require('./constants');
const { writeLog } = require('./inputData');
const { performance } = require('perf_hooks');
const { start } = require('repl');
const { exec } = require('child_process');

// Gas settings class
class GasSettings {
    constructor(limit, lastBaseFee, maxPriorityFee, maxFee) {
        this.limit = limit;
        this.lastBaseFee = lastBaseFee;
        this.maxPriorityFee = maxPriorityFee;
        this.maxFee = maxFee;
    }
}

// Get provider of given blockchain
async function getProvider(blockchainSelected) {
    
    let provider;

    try {
        providerUrl = constants.blockchainsData[blockchainSelected].rpc;
        if (providerUrl.startsWith('wss')) {
            provider = new ethers.providers.WebSocketProvider(providerUrl);
        } else {
            provider = new ethers.providers.JsonRpcProvider(providerUrl);
        }
        //await checkProvider(provider, blockchainSelected);
        return provider;
    } catch (error) {
        console.log(inputData.chalk.red('There were an error trying to connect to the RPC, check if everything is OK\n'));
        writeLog(error);
    }
}

// Checks if there is a connection to the RPC
async function checkProvider(provider, blockchainSelected) {
    try {
        let blockNumber;
        const startTime = performance.now();
        // Calculates the response average time for 5 calls
        for (let i = 0; i < 5; i++) {
            blockNumber = await provider.getBlockNumber();
        }
        const endTime = performance.now();
        const executionTime = (endTime - startTime)/5;
        console.log(inputData.chalk.green(`\nConnected to ${constants.blockchainsData[blockchainSelected].name}, last block: ${blockNumber}`));
        console.log(inputData.chalk.green(`Average response time: ${executionTime.toFixed(0)} milliseconds`));
    } catch(error) {
        console.log(inputData.chalk.red('\nCould not stablished the connection\n'));
        writeLog(error);
    }    
}

// Option menu to select a Blockchain
async function selectBlockchainMenu() {
    console.log(inputData.chalk.bold('\nSelect a blockchain:'));
    for (let i = 0; i < constants.blockchainsData.length; i++) {
        console.log(inputData.chalk.bold(`  [${i}]:`), `${constants.blockchainsData[i].name}`);
    }
    let blockchainSelected;
    while(true) {
        blockchainSelected = await inputData.getAnswer(`\nChoose an option: `);
        if (Number(blockchainSelected >= 0 && Number(blockchainSelected) < constants.blockchainsData.length)) {
            break;
        }
    }

    return blockchainSelected;
}

// Option menu to select a Blockchain for Uniswap
async function selectBlockchainDexMenu(dexBlockchains) {
    console.log(inputData.chalk.bold('\nSelect a blockchain:'));
    for (let i = 0; i < constants.blockchainsData.length; i++) {
        for (let j = 0; j < dexBlockchains.length; j++) {
            if (constants.blockchainsData[i].name == dexBlockchains[j]) {
                console.log(inputData.chalk.bold(`  [${i}]:`), `${constants.blockchainsData[i].name}`);
                break;
            }
        } 
    }
    let blockchainSelected;
    while(true) {
        blockchainSelected = await inputData.getAnswer(`\nChoose an option: `);
        if (Number(blockchainSelected >= 0 && Number(blockchainSelected) < constants.blockchainsData.length)) {
            break;
        }
    }

    return blockchainSelected;
}

// Function that returns the index from blockchainData given the name of hte blockchain
function getBlockchainIndex(blockchainName) {

    for(let i = 0; i < constants.blockchainsData.length; i++) {
        if(constants.blockchainsData[i].name == blockchainName) {
            return i;
        }
    }

    return null;
}

// Function to set the gas settings
// Transaction type:
// 0: Transfer
// 1: Approve
// 2: Swap
async function setGastSettings(provider, transactionType){

    let gasOption;
    let gasSettings;

    while(true) {
        if (transactionType == 0) {
            console.log('\nSelect how to define the Gas settings for the Transfer');
        } else if(transactionType == 1) {
            console.log('\nSelect how to define the Gas settings for the Approval');
        } else if(transactionType == 2) {
            console.log('\nSelect how to define the Gas settings for the Swap');
        }
        gasOption = await inputData.getAnswer(`Auto[A] or Manual[M]: `);
        if (gasOption.toUpperCase() == 'A' || gasOption.toUpperCase() == 'M') {
            break;
        }
    }

    try {
        let providerGasSettings = await provider.getFeeData();
        if(gasOption.toUpperCase() == 'A') {
            let gasLimit;
            if (transactionType == 0) {
                gasLimit = constants.defaultGasLimitTransfer;
            } else if(transactionType == 1) {
                gasLimit = constants.defaultApproveLimit;
            } else if(transactionType == 2) {
                gasLimit = constants.defaultGasLimitSwap;
            }
            gasSettings = new GasSettings(
                gasLimit,
                providerGasSettings.lastBaseFeePerGas,
                providerGasSettings.maxPriorityFeePerGas, 
                providerGasSettings.maxFeePerGas
            );
        } else if(gasOption.toUpperCase() == 'M') {
            const gasLimitAnswer = await inputData.getAnswer(`Introduce the gas Limit: `);
            const maxPriorityAnswer = await inputData.getAnswer(`Introduce the Max Priority Fee Gas (in Gwei): `);
            const maxFeeAnswer =  await inputData.getAnswer(`Introduce the Max Fee Gas (in Gwei): `);
            
            gasSettings = new GasSettings(
                gasLimitAnswer, 
                providerGasSettings.lastBaseFeePerGas,
                ethers.utils.parseUnits(maxPriorityAnswer, "gwei"), 
                ethers.utils.parseUnits(maxFeeAnswer, "gwei")
            );
        }
    } catch (error) {
        writeLog(error);
    }
    
    return gasSettings;
}


module.exports = {
    getProvider,
    checkProvider,
    selectBlockchainMenu,
    setGastSettings,
    selectBlockchainDexMenu,
    getBlockchainIndex,
    GasSettings
}