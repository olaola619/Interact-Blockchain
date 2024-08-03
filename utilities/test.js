const { ethers } = require('ethers');
const inputData = require('./inputData');
const providerUtility = require('./providerUtility');
const walletManager = require('./walletManager');
const erc20functions = require('./erc20functions');
const constants = require('./constants');
require('dotenv').config();
const { writeLog } = require('./inputData');
const fetch = require('node-fetch');
const quoteUrl = 'https://api.odos.xyz/sor/quote/v2';


async function getFeeData() {

    const provider = await providerUtility.getProvider(2);
    const feeData = await provider.getFeeData();
    // maxGasPrice = baseFeePrice + maxPriorityFeeGasPrice
    console.log('Gas price:', ethers.utils.formatUnits(feeData.gasPrice, "gwei"));
    console.log('Last base fee price:', ethers.utils.formatUnits(feeData.lastBaseFeePerGas, "gwei"));
    console.log('Max gas price:', ethers.utils.formatUnits(feeData.maxFeePerGas, "gwei"));
    console.log('Max Priority Fee gas price:', ethers.utils.formatUnits(feeData.maxPriorityFeePerGas, "gwei"));
    await inputData.introToContinue();
}


module.exports = {
    getFeeData,
}