const { ethers } = require('ethers');
const { CurrencyAmount, Ether } = require('@uniswap/sdk-core');
const { Percent } = require('@uniswap/sdk-core');
const inputData = require('./inputData');
const providerUtility = require('./providerUtility');
const constants = require('./constants');
const walletManager = require('./walletManager');
require('dotenv').config();
const { writeLog } = require('./inputData');
const erc20functions = require('./erc20functions');
const getRoute = require('./getRoute');
const transfer = require('./transfer');
const fetch = require('node-fetch');

// Swap Menu
async function swapMenu(wallets, tokenContracts){
    let userSwapMenuOption = 0;
  
    while(userSwapMenuOption != 10) {
        console.clear();
        console.log(inputData.chalk.blue.bold("SWAP TOKENS\n"));
        console.log(inputData.chalk.bold('Select an option'));
        console.log(inputData.chalk.bold('  [1]:'), 'Uniswap - simple swap');
        console.log(inputData.chalk.bold('  [2]:'), 'Odos - simple swap');
        console.log(inputData.chalk.bold('  [3]:'), 'Uniswap - multiple wallets swap (it will use predefined parameters in constants and IT WILL START ONCE YOU SELECT THE OPTION)');
        console.log(inputData.chalk.bold('  [4]:'), 'Odos - multiple wallets swap (it will use predefined parameters in constants and IT WILL START ONCE YOU SELECT THE OPTION)');
        console.log(inputData.chalk.bold('  [5]:'), 'Check fast swap config. RECOMMENDED BEFORE USING MULTIPLE WALLETS SWAP');
        console.log(inputData.chalk.bold('  [10]:'), 'Reteurn to main menu');
    
        userSwapMenuOption = await inputData.getAnswer(`\nChoose an option: `);
  
        switch (Number(userSwapMenuOption)) {
            // uniswap simple swap
            case 1:
                try {
                    console.clear();
                    await setInfoForUniswap(wallets, tokenContracts);
                } catch (error) {
                    console.log(inputData.chalk.red('There were an error in Uniswap single swap'));
                    writeLog(`There were an error in Uniswap single swap ${error}`);
                    inputData.introToContinue();
                }
                break;
            // Odos simple swap
            case 2:
                try {
                    console.clear();
                    await setInfoForOdos(wallets, tokenContracts);
                } catch (error) {
                    console.log(inputData.chalk.red('There were an error in Odos single swap'));
                    writeLog(`There were an error in Odos single swap ${error}`);
                    inputData.introToContinue();
                }
                break;
            // Uniswap - multiple wallets swap
            case 3:
                try {
                    console.clear();
                    await setInfoForUniswapMultiple(wallets, tokenContracts)
                } catch (error) {
                    console.log(inputData.chalk.red('There were an error in Uniswap multiple swap'));
                    writeLog(`There were an error in Uniswap multiple swap ${error}`);
                    inputData.introToContinue();
                }   
                break;
            // Odos - multiple wallets swap
            case 4:
                try {
                    console.clear();
                    await setInfoForOdosMultiple(wallets, tokenContracts);
                } catch (error) {
                    console.log(inputData.chalk.red('There were an error in Odos multiple swap'));
                    writeLog(`There were an error in Odos multiple swap ${error}`);
                    inputData.introToContinue();
                }
                break;
            // Fast swap config checking
            case 5:
                try{
                    console.clear();
                    await checkFastSwapConfig(wallets, tokenContracts);
                } catch (error) {
                    console.log(inputData.chalk.red('There were an error checking the fast swap config'));
                    writeLog(`There were an error checking the fast swap config ${error}`);
                    inputData.introToContinue();
                }
                break;
        }
    }
}

// Function to introduce an amount and checking the limits
async function introduceAmountToSwap(maxAmount, decimals) {
    let readableAmountToSwap;
    let inputAnswer;

    // Checks the correct input format
    while (true) {
        inputAnswer = await inputData.getAnswer(`\nIntroduce the amount to swap or a %: `);

        if (!transfer.isPercentage(inputAnswer) && !transfer.isNumber(inputAnswer)) {
            console.log(inputData.chalk.red('Introduce a number or a %'));
        } else if(Number(inputAnswer) <= 0) {
            console.log(inputData.chalk.red('The amount or percentage to swap has to be greater than 0\n'));
        } else {
            break;
        }
    }

    // If it is a percentage, recalculates de amount to send
    if(transfer.isPercentage(inputAnswer)) {
        readableAmountToSwap = (Number(maxAmount) * parseFloat(inputAnswer.slice(0, -1))/100).toFixed(decimals).toString();
    } else {
        readableAmountToSwap = Number(inputAnswer).toFixed(decimals).toString();
    }
    
    if(Number(readableAmountToSwap) > (Number(maxAmount))) {
        console.log(`The amount to swap will be the wallet token balance\n`);
        readableAmountToSwap = (Number(maxAmount)).toFixed(decimals).toString();
    }

    return readableAmountToSwap;
}

// Function to introduce all the info required for Uniswap
async function setInfoForOdos(wallets, tokenContracts) {
    console.log(inputData.chalk.blue.bold("SWAP TOKENS\n"));
    console.log(inputData.chalk.blue("Odos - simple swap\n"));
    
    // Selecting the wallet
    console.log(inputData.chalk.bold('Select a wallet:'));
    let walletSending = await walletManager.selectWallet(wallets);
    if (walletSending == null){
        await inputData.introToContinue();
        return;
    }

    // Select the blockchain to send
    const blockchainSelected = await providerUtility.selectBlockchainDexMenu(constants.odosBlockchains);
    const provider = await providerUtility.getProvider(blockchainSelected);
    const networkProvider = await provider.getNetwork();

    // Sets the provider to the wallet
    walletSending = await walletManager.changeWalletProvider(walletSending, provider);
   
    // Gets the nonce
    walletSending.nonce = await provider.getTransactionCount(walletSending.wallet.address);

    // Gas settings for the approval
    let gasSettingsApproval = await providerUtility.setGastSettings(provider, 1);
    if (gasSettingsApproval == null) {
        console.log(inputData.chalk.red('Error defining gas settings'));
        await inputData.introToContinue();
    }
    // Gas settings for the swap
    let gasSettingsSwap = await providerUtility.setGastSettings(provider, 2);
    if (gasSettingsSwap == null) {
        console.log(inputData.chalk.red('Error defining gas settings'));
        await inputData.introToContinue();
    }

    // Show all the tokens from a blockchain for the Input token
    console.log(inputData.chalk.bold(`\n${constants.blockchainsData[blockchainSelected].name} selected\n`));
    console.log(inputData.chalk.bold('Select the Input token to swap:'));
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

    // Checks the token Input
    let tokenInputSelected;
    while(true) {
        tokenInputSelected = await inputData.getAnswer(`\nChoose an option: `);
        if (Number(tokenInputSelected) >= 0 && Number(tokenInputSelected) <= tokensCount) {
            break;
        }
    }

    // Show all the tokens from a blockchain for the Output token
    console.log(inputData.chalk.bold('Select the Output token to swap:'));
    for (let i = 0; i <= tokensCount; i++) {
        if (i < tokensCount) {
            const amount = await erc20functions.tokenBalance(tokenContracts[blockchainSelected][i].contract, tokenContracts[blockchainSelected][i].decimals,walletSending.wallet.address);
            console.log(inputData.chalk.bold(`[${i}] - `), `${tokenContracts[blockchainSelected][i].name}: ${amount} $${tokenContracts[blockchainSelected][i].symbol}`);
        } else {
            console.log(inputData.chalk.bold(`[${i}] - `), `${constants.blockchainsData[blockchainSelected].gasSymbol}: ${nativeCoinBalance} $${constants.blockchainsData[blockchainSelected].gasSymbol}`);
        }
    }
    
    // Checks the token Output
    let tokenOutputSelected;
    while(true) {
        tokenOutputSelected = await inputData.getAnswer(`\nChoose an option: `);
        if (Number(tokenOutputSelected) >= 0 && Number(tokenOutputSelected) <= tokensCount) {
            break;
        }
    }

    // Checks if there is enough gas to cover the tx fee
    // Do not count approval if input token is native coin
    let maxGasReadable;
    if (tokenInputSelected == tokensCount) {
        maxGasReadable = Number(gasSettingsSwap.limit) * Number(ethers.utils.formatEther(gasSettingsSwap.maxFee));
    } else {
        maxGasReadable = Number(gasSettingsApproval.limit) * Number(ethers.utils.formatEther(gasSettingsApproval.maxFee)) + 
                        Number(gasSettingsSwap.limit) * Number(ethers.utils.formatEther(gasSettingsSwap.maxFee));
    }
    
    if (maxGasReadable > nativeCoinBalance) {
        console.log(inputData.chalk.red(`Max gas to spend ${maxGasReadable} ${constants.blockchainsData[blockchainSelected].gasSymbol} is higher the the wallet balance ${nativeCoinBalance} ${constants.blockchainsData[blockchainSelected].gasSymbol}`));
        await inputData.introToContinue();
        return;
    }

    // Input token
    let amountIn;
    let readableAmountToSwap;
    let tokenIn;
    let tokenInAddress;
    let tokenInSymbol;
    let tokenOutAddress;
    let tokenOutSymbol;
    // Native Coin
    if (tokenInputSelected == tokensCount) {
        readableAmountToSwap = await introduceAmountToSwap(nativeCoinBalance, 18);

        // Route parameters and best route
        amountIn = ethers.utils.parseUnits(readableAmountToSwap, 18).toString();
        tokenInSymbol = constants.blockchainsData[blockchainSelected].gasSymbol;
        tokenInAddress = ethers.constants.AddressZero;      // Direction used to specify native coin instead of token
    } else {    //Token
        // Returns all the info about the token
        tokenIn = await getRoute.readInfoToken(tokenContracts[blockchainSelected][tokenInputSelected], networkProvider.chainId);

        // Amount to swap. The maximum amount will be the token balance
        const tokenReadableBalance =  await erc20functions.tokenBalance(tokenContracts[blockchainSelected][tokenInputSelected].contract, tokenIn.decimals, walletSending.wallet.address);
        readableAmountToSwap = await introduceAmountToSwap(tokenReadableBalance, Number(tokenIn.decimals));

        // Route parameters and best route
        amountIn = ethers.utils.parseUnits(readableAmountToSwap, tokenIn.decimals).toString();
        tokenInSymbol = tokenIn.symbol;
        tokenInAddress = tokenIn.address;
    }

    // Output token
    // Native coin
    let tokenOut;
    if (tokenOutputSelected == tokensCount) {
        tokenOut = Ether.onChain(networkProvider.chainId);
        tokenOutSymbol = constants.blockchainsData[blockchainSelected].gasSymbol;
        tokenOutAddress = ethers.constants.AddressZero;      // Direction used to specify native coin instead of token
    } else {    // Token
        tokenOut = await getRoute.readInfoToken(tokenContracts[blockchainSelected][tokenOutputSelected], networkProvider.chainId);
        tokenOutSymbol = tokenOut.symbol;
        tokenOutAddress = tokenOut.address;
    }

    const slippageInput = await inputData.getAnswer('Introduce the slippage: ');
    let slippage;
    if(transfer.isPercentage(slippageInput)) {
        slippageInputParsed = parseFloat(slippageInput.slice(0, -1));
        slippage = Number(slippageInputParsed).toFixed(2) * 100;
        slippage = new Percent(slippage, 10000);
    } else {
        slippage = Number(slippageInput).toFixed(2) * 100;
        slippage = new Percent(slippage, 10000);
    }
    slippage = Number(slippage.numerator.toString()/100);

    // Find best route
    let sendingConfirmation = 'U';
    let bestRoute;
    let priceImpact;
    let amountOutReadable;
    let amountOutInUSD;
    while (sendingConfirmation.toUpperCase() != 'Y' && sendingConfirmation.toUpperCase() != 'N') {

        let apiTryRequests = 1;
        
        while(apiTryRequests <= constants.maxApiTryRequests) {
            console.log(`(Attempt ${apiTryRequests} of ${constants.maxApiTryRequests}): Finding best route in Odos...`);        
            [bestRoute, priceImpact] = await getRoute.findBestRouteOdos(walletSending.wallet.address, tokenInAddress, amountIn, tokenOutAddress, slippage, networkProvider);
            if (bestRoute != null) {
                break;
            } else if(bestRoute == null && apiTryRequests == constants.maxApiTryRequests){
                await inputData.introToContinue();
                return;
            }
            await inputData.delay(1000);
            apiTryRequests++;
        }
        
        amountOutReadable = ethers.utils.formatUnits(bestRoute.outputTokens[0].amount, tokenOut.decimals).toString();
        amountOutInUSD = Number(bestRoute.outValues[0]);

        // Best route result
        const swapResumeString = 
            inputData.chalk.bold('\nSwap resume\n') +
            `${constants.blockchainsData[blockchainSelected].name} - ${walletSending.name}: ${walletSending.wallet.address}\n` +
            `Swap ${Number(readableAmountToSwap).toFixed(6)} $${tokenInSymbol} for ${Number(amountOutReadable).toFixed(6)} $${tokenOutSymbol} worth ${amountOutInUSD.toFixed(4)}$ --> ${(amountOutInUSD/Number(readableAmountToSwap)).toFixed(4)}$/${tokenInSymbol}\n` +
            `Price impact: ${Number(priceImpact).toFixed(4)}%\n` +
            `Gas limit Approve: ${gasSettingsApproval.limit}\n` +
            `Last block base fee: ${ethers.utils.formatUnits(gasSettingsSwap.lastBaseFee, "gwei")} gwei\n` +
            `Maximum priority fee: ${ethers.utils.formatUnits(gasSettingsSwap.maxPriorityFee, "gwei")} gwei\n` +
            `Maximum fee: ${ethers.utils.formatUnits(gasSettingsSwap.maxFee, "gwei")} gwei\n` +
            `Maximum gas to spend (Gas Limit * Maximum Fee): ${Number(maxGasReadable).toFixed(6)} ${constants.blockchainsData[blockchainSelected].gasSymbol}\n`;

        console.log(swapResumeString);
        writeLog(swapResumeString);

        // Sending confirmation before executing the tx
        sendingConfirmation = await inputData.getAnswer(`Yes[Y], No[N] or Update best route[U]: `);
        if (sendingConfirmation.toUpperCase() == 'N') {
            console.log(inputData.chalk.red('\nSwap cancelled'));
            writeLog('Swap cancelled');
            await inputData.introToContinue();
            return;
        }
    }

    // Only approves if token in is a token
    if (tokenInputSelected != tokensCount) {
        const routerAddress = constants.blockchainsData[blockchainSelected].odosRouterAddress;
        await approveTokenSimpleSwap(tokenIn.address, walletSending, amountIn, gasSettingsApproval, walletSending.nonce++, routerAddress);
    }

    // Swap
    await swapToken(bestRoute, walletSending, gasSettingsSwap, blockchainSelected, walletSending.nonce++, 1);

    await inputData.introToContinue();
}

// Function to introduce all the info required for Uniswap
async function setInfoForUniswap(wallets, tokenContracts) {
    console.log(inputData.chalk.blue.bold("SWAP TOKENS\n"));
    console.log(inputData.chalk.blue("Uniswap - simple swap\n"));
    
    // Selecting the wallet
    console.log(inputData.chalk.bold('Select a wallet:'));
    let walletSending = await walletManager.selectWallet(wallets);
    if (walletSending == null){
        await inputData.introToContinue();
        return;
    }

    // Select the blockchain to send
    const blockchainSelected = await providerUtility.selectBlockchainDexMenu(constants.uniswapBlockchains);
    const provider = await providerUtility.getProvider(blockchainSelected);
    const networkProvider = await provider.getNetwork();

    // Sets the provider to the wallet
    walletSending = await walletManager.changeWalletProvider(walletSending, provider);
   
    // Gets the nonce
    walletSending.nonce = await provider.getTransactionCount(walletSending.wallet.address);

    // Gas settings for the approval
    let gasSettingsApproval = await providerUtility.setGastSettings(provider, 1);
    if (gasSettingsApproval == null) {
        console.log(inputData.chalk.red('Error defining gas settings'));
        await inputData.introToContinue();
    }
    // Gas settings for the swap
    let gasSettingsSwap = await providerUtility.setGastSettings(provider, 2);
    if (gasSettingsSwap == null) {
        console.log(inputData.chalk.red('Error defining gas settings'));
        await inputData.introToContinue();
    }

    // Show all the tokens from a blockchain for the Input token
    console.log(inputData.chalk.bold(`\n${constants.blockchainsData[blockchainSelected].name} selected\n`));
    console.log(inputData.chalk.bold('Select the Input token to swap:'));
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

    // Checks the token Input
    let tokenInputSelected;
    while(true) {
        tokenInputSelected = await inputData.getAnswer(`\nChoose an option: `);
        if (Number(tokenInputSelected) >= 0 && Number(tokenInputSelected) <= tokensCount) {
            break;
        }
    }

    // Show all the tokens from a blockchain for the Output token
    console.log(inputData.chalk.bold('Select the Output token to swap:'));
    for (let i = 0; i <= tokensCount; i++) {
        if (i < tokensCount) {
            const amount = await erc20functions.tokenBalance(tokenContracts[blockchainSelected][i].contract, tokenContracts[blockchainSelected][i].decimals,walletSending.wallet.address);
            console.log(inputData.chalk.bold(`[${i}] - `), `${tokenContracts[blockchainSelected][i].name}: ${amount} $${tokenContracts[blockchainSelected][i].symbol}`);
        } else {
            console.log(inputData.chalk.bold(`[${i}] - `), `${constants.blockchainsData[blockchainSelected].gasSymbol}: ${nativeCoinBalance} $${constants.blockchainsData[blockchainSelected].gasSymbol}`);
        }
    }
    
    // Checks the token Output
    let tokenOutputSelected;
    while(true) {
        tokenOutputSelected = await inputData.getAnswer(`\nChoose an option: `);
        if (Number(tokenOutputSelected) >= 0 && Number(tokenOutputSelected) <= tokensCount) {
            break;
        }
    }

    // Checks if there is enough gas to cover the tx fee
    // Do not count approval if input token is native coin
    let maxGasReadable;
    if (tokenInputSelected == tokensCount) {
        maxGasReadable = Number(gasSettingsSwap.limit) * Number(ethers.utils.formatEther(gasSettingsSwap.maxFee));
    } else {
        maxGasReadable = Number(gasSettingsApproval.limit) * Number(ethers.utils.formatEther(gasSettingsApproval.maxFee)) + 
                        Number(gasSettingsSwap.limit) * Number(ethers.utils.formatEther(gasSettingsSwap.maxFee));
    }
    
    if (maxGasReadable > nativeCoinBalance) {
        console.log(inputData.chalk.red(`Max gas to spend ${maxGasReadable} ${constants.blockchainsData[blockchainSelected].gasSymbol} is higher the the wallet balance ${nativeCoinBalance} ${constants.blockchainsData[blockchainSelected].gasSymbol}`));
        await inputData.introToContinue();
        return;
    }

    // Input token
    let amountIn;
    let amountInCurrency;
    let readableAmountToSwap;
    let tokenIn;
    let tokenInSymbol;
    let tokenOutSymbol;
    // Native Coin
    if (tokenInputSelected == tokensCount) {
        readableAmountToSwap = await introduceAmountToSwap(nativeCoinBalance, 18);

        // Route parameters and best route
        amountIn = ethers.utils.parseUnits(readableAmountToSwap, 18).toString();
        amountInCurrency = CurrencyAmount.fromRawAmount(Ether.onChain(networkProvider.chainId), amountIn);
        tokenInSymbol = constants.blockchainsData[blockchainSelected].gasSymbol;
    } else {    //Token
        // Returns all the info about the token
        tokenIn = await getRoute.readInfoToken(tokenContracts[blockchainSelected][tokenInputSelected], networkProvider.chainId);

        // Amount to swap. The maximum amount will be the token balance
        const tokenReadableBalance =  await erc20functions.tokenBalance(tokenContracts[blockchainSelected][tokenInputSelected].contract, tokenIn.decimals, walletSending.wallet.address);
        readableAmountToSwap = await introduceAmountToSwap(tokenReadableBalance, Number(tokenIn.decimals));

        // Route parameters and best route
        amountIn = ethers.utils.parseUnits(readableAmountToSwap, tokenIn.decimals).toString();
        amountInCurrency = CurrencyAmount.fromRawAmount(tokenIn, amountIn);
        tokenInSymbol = tokenIn.symbol;
    }

    // Output token
    // Native coin
    let tokenOut;
    if (tokenOutputSelected == tokensCount) {
        //tokenOut = CurrencyAmount.fromRawAmount(Ether.onChain(networkProvider.chainId), '0');
        tokenOut = Ether.onChain(networkProvider.chainId);
        tokenOutSymbol = constants.blockchainsData[blockchainSelected].gasSymbol;
    } else {    // Token
        tokenOut = await getRoute.readInfoToken(tokenContracts[blockchainSelected][tokenOutputSelected], networkProvider.chainId);
        tokenOutSymbol = tokenOut.symbol;
    }

    const slippageInput = await inputData.getAnswer('Introduce the slippage: ');
    let slippage;
    if(transfer.isPercentage(slippageInput)) {
        slippageInputParsed = parseFloat(slippageInput.slice(0, -1));
        slippage = Number(slippageInputParsed).toFixed(2) * 100;
        slippage = new Percent(slippage, 10000);
    } else {
        slippage = Number(slippageInput).toFixed(2) * 100;
        slippage = new Percent(slippage, 10000);
    }

    // Find best route
    let sendingConfirmation = 'U';
    let bestRoute;
    let amountOutReadable;
    let priceImpact;
    while (sendingConfirmation.toUpperCase() != 'Y' && sendingConfirmation.toUpperCase() != 'N') {

        let apiTryRequests = 1;
        
        while(apiTryRequests <= constants.maxApiTryRequests) {
            console.log(`(Attempt ${apiTryRequests} of ${constants.maxApiTryRequests}): Finding best route in Uniswap...`);
            
            bestRoute = await getRoute.findBestRouteUniswap(walletSending.wallet.address, tokenOut, amountInCurrency, slippage, networkProvider.chainId, provider);
            if (bestRoute != null) {
                break;
            } else if(bestRoute == null && apiTryRequests == constants.maxApiTryRequests){
                await inputData.introToContinue();
                return;
            }
            await inputData.delay(1000);
            apiTryRequests++;
        }

        amountOutReadable = bestRoute.trade.outputAmount.toSignificant(6);
        priceImpact = bestRoute.trade.priceImpact.toSignificant(4);

        // Best route result
        const swapResumeString = 
            inputData.chalk.bold('\nSwap resume\n') +
            `${constants.blockchainsData[blockchainSelected].name} - ${walletSending.name}: ${walletSending.wallet.address}\n` +
            `Swap ${Number(readableAmountToSwap).toFixed(6)} $${tokenInSymbol} for ${amountOutReadable} $${tokenOutSymbol}\n` +
            `Price impact: ${priceImpact}%\n` +
            `Gas limit Approve: ${gasSettingsApproval.limit}\n` +
            `Last block base fee: ${ethers.utils.formatUnits(gasSettingsSwap.lastBaseFee, "gwei")} gwei\n` +
            `Maximum priority fee: ${ethers.utils.formatUnits(gasSettingsSwap.maxPriorityFee, "gwei")} gwei\n` +
            `Maximum fee: ${ethers.utils.formatUnits(gasSettingsSwap.maxFee, "gwei")} gwei\n` +
            `Maximum gas to spend (Gas Limit * Maximum Fee): ${maxGasReadable} ${constants.blockchainsData[blockchainSelected].gasSymbol}\n`;

        console.log(swapResumeString);
        writeLog(swapResumeString);

        // Sending confirmation before executing the tx
        sendingConfirmation = await inputData.getAnswer(`Yes[Y], No[N] or Update best route[U]: `);
        if (sendingConfirmation.toUpperCase() == 'N') {
            console.log(inputData.chalk.red('\nSwap cancelled'));
            writeLog('Swap cancelled');
            await inputData.introToContinue();
            return;
        }
    }

    // Only approves if token in is a token
    if (tokenInputSelected != tokensCount) {
        const routerAddress = constants.blockchainsData[blockchainSelected].uniRouterAddress;
        await approveTokenSimpleSwap(tokenIn.address, walletSending, amountIn, gasSettingsApproval, walletSending.nonce++, routerAddress);
    }

    // Swap
    await swapToken(bestRoute, walletSending, gasSettingsSwap, blockchainSelected, walletSending.nonce++, 0);

    await inputData.introToContinue();
}

async function approveTokenFastSwap(routerAddress, tokenContract, amountIn, nonce, gasSettings) {
    try {
        console.log('Waiting approval transaction to be sent...');
        const approvalTx = await tokenContract.approve(routerAddress, amountIn, {
            nonce: nonce,
            gasLimit: Number(gasSettings.limit),
            maxPriorityFeePerGas: gasSettings.maxPriorityFee,
            maxFeePerGas: gasSettings.maxFee
        });

        return approvalTx;
    } catch (error) {
        console.log(inputData.chalk.red('There were an error approving the token'));
        writeLog(`There were an error approving the token ${error}`);
    }
}

// Function to approve a token amount to Uniswap
async function approveTokenSimpleSwap(tokenAddress, walletSending, amountIn, gasSettings, nonce, routerAddress) {
    try{
        // Creates the contract
        const tokenContract = new ethers.Contract(tokenAddress, erc20functions.ERC20_ABI, walletSending.wallet);

        // Checks allowance
        const allowanceToken = await tokenContract.allowance(walletSending.wallet.address, routerAddress);
        if(Number(allowanceToken) < Number(amountIn)) {
            console.log('Waiting approval transaction to be sent...');
            const approvalTx = await tokenContract.approve(routerAddress, amountIn, {
                nonce: nonce,
                gasLimit: Number(gasSettings.limit),
                maxPriorityFeePerGas: gasSettings.maxPriorityFee,
                maxFeePerGas: gasSettings.maxFee
            });
            console.log(`Approval transaction hash: ${approvalTx.hash}`);
            writeLog(`Approval transaction sent with hash: ${approvalTx.hash}`);
            console.log('Waiting for approval confirmation...');
            await approvalTx.wait();
            console.log(inputData.chalk.green(`Token approved, hash: ${approvalTx.hash}\n`));
            writeLog(`Token approved, hash: ${approvalTx.hash}\n`);
        } else {
            walletSending.nonce--;
            console.log('Token already approved, skipping approval...\n');
            writeLog('Token already approved, skipping approval...\n');
        }
    } catch (error) {
        console.log(inputData.chalk.red('There were an error approving the token'));
        writeLog(`There were an error approving the token ${error}`);
        await inputData.introToContinue();
    }
}

// Function to execute the swap
async function swapTokenFastSwap(route, walletSending, gasSettings, blockchainSelected, nonce, dex) {
    
    try{
        // Defines the tx
        let tx;
        if(dex == 0) {          // Uniswap
            tx = {
                from: walletSending.wallet.address,
                to: constants.blockchainsData[blockchainSelected].uniRouterAddress,
                data: route.methodParameters.calldata,
                value: route.methodParameters.value,
                nonce: nonce,
                gasLimit: Number(gasSettings.limit),
                maxPriorityFeePerGas: gasSettings.maxPriorityFee,
                maxFeePerGas: gasSettings.maxFee
            };
        } else if(dex == 1) {   // Odos
            tx = {
                to: route.transaction.to,
                data: route.transaction.data,
                value: ethers.BigNumber.from(route.transaction.value),
                gasLimit: Number(gasSettings.limit),
                maxPriorityFeePerGas: gasSettings.maxPriorityFee,
                maxFeePerGas: gasSettings.maxFee
            };
        }
        
        console.log('Waiting swap transaction to be sent...');
        const swapTx = await walletSending.wallet.sendTransaction(tx);

        return swapTx;

    } catch(error) {
        throw new Error(error);
    }
}

// Function to execute the swap
async function swapToken(route, walletSending, gasSettings, blockchainSelected, nonce, dex) {
    
    try{
        // Defines the tx
        let tx;
        if(dex == 0) {          // Uniswap
            tx = {
                from: walletSending.wallet.address,
                to: constants.blockchainsData[blockchainSelected].uniRouterAddress,
                data: route.methodParameters.calldata,
                value: route.methodParameters.value,
                nonce: nonce,
                gasLimit: Number(gasSettings.limit),
                maxPriorityFeePerGas: gasSettings.maxPriorityFee,
                maxFeePerGas: gasSettings.maxFee
            };
        } else if(dex == 1) {   // Odos
            tx = {
                to: route.transaction.to,
                data: route.transaction.data,
                value: ethers.BigNumber.from(route.transaction.value),
                gasLimit: Number(gasSettings.limit),
                maxPriorityFeePerGas: gasSettings.maxPriorityFee,
                maxFeePerGas: gasSettings.maxFee
            };
        }
        
        console.log('Waiting swap transaction to be sent...');
        const swapTx = await walletSending.wallet.sendTransaction(tx);
        console.log(`Swap transaction sent with hash: ${swapTx.hash}`);
        writeLog(`Swap transaction hash: ${swapTx.hash}`);
        console.log('Waiting for swap confirmation...');
        await swapTx.wait();
        console.log(inputData.chalk.green('Swapped tokens successfully!\n'));
        writeLog('Swapped tokens successfully!\n');
    } catch(error) {
        console.log(inputData.chalk.red('There were an error in the swap'));
        writeLog(`There were an error in the swap: ${error}`);
        await inputData.introToContinue();
    }
}

// Function to multiple swap on Odos
async function setInfoForOdosMultiple(wallets, tokenContracts) {
    console.log(inputData.chalk.blue.bold("SWAP TOKENS\n"));
    console.log(inputData.chalk.blue("Odos - Multiple swap"));
    
    const fastSwapConfig = constants.getFastSwapConfig();

    for(let i = 0; i < wallets.length; i++) {

        try {
            // Sets the wallet
            let walletSending = wallets[i];

            console.log(inputData.chalk.rgb(255, 136, 0)(`\n${walletSending.name}: ${walletSending.wallet.address}\n`));

            // Sets the provider
            const blockchainSelected = providerUtility.getBlockchainIndex(fastSwapConfig.blockchainName);
            const provider = await providerUtility.getProvider(blockchainSelected);
            const networkProvider = await provider.getNetwork();

            // Sets the provider to the wallet
            walletSending = await walletManager.changeWalletProvider(walletSending, provider);

            // Gets the nonce
            walletSending.nonce = await provider.getTransactionCount(walletSending.wallet.address);

            let amountIn;
            let tokenIn;
            let tokenInAddress;
            let tokenInSymbol;
            let readableAmountToSwap;
            // Native Coin In
            if (fastSwapConfig.isNativeCoinIn) {
                tokenIn = Ether.onChain(networkProvider.chainId);
                const nativeCoinBalance = await erc20functions.getNativeCoinBalance(provider, walletSending.wallet.address);
                readableAmountToSwap = (Number(nativeCoinBalance) * parseFloat(fastSwapConfig.amountIn.slice(0, -1))/100).toFixed(tokenIn.decimals).toString();

                // Route parameters and best route
                amountIn = ethers.utils.parseUnits(readableAmountToSwap, 18).toString();
                tokenInSymbol = constants.blockchainsData[blockchainSelected].gasSymbol;
                tokenInAddress = ethers.constants.AddressZero;
            } else {    //Token
                const token = erc20functions.getToken(tokenContracts, blockchainSelected, fastSwapConfig.tokenInAddress);

                // Returns all the info about the token
                tokenIn = getRoute.readInfoToken(token, networkProvider.chainId);

                // Amount to swap. The maximum amount will be the token balance
                const tokenReadableBalance =  await erc20functions.tokenBalance(token.contract, tokenIn.decimals, walletSending.wallet.address);
                readableAmountToSwap = (Number(tokenReadableBalance) * parseFloat(fastSwapConfig.amountIn.slice(0, -1))/100).toFixed(tokenIn.decimals).toString();

                // Route parameters and best route
                amountIn = ethers.utils.parseUnits(readableAmountToSwap, tokenIn.decimals).toString();
                tokenInSymbol = tokenIn.symbol;
                tokenInAddress = fastSwapConfig.tokenInAddress;
            }
            // Checks if the wallet has no amount of the input token to skip it
            if (Number(readableAmountToSwap) <= 0) {
                console.log(`${walletSending.name}: has 0 ${tokenInSymbol} skipping...`);
                continue;
            }

            // Output token
            let tokenOut;
            let tokenOutAddress;
            let tokenOutSymbol;
            // Native coin Out
            if (fastSwapConfig.isNativeCoinOut) {
                tokenOut = Ether.onChain(networkProvider.chainId);
                tokenOutSymbol = constants.blockchainsData[blockchainSelected].gasSymbol;
                tokenOutAddress = ethers.constants.AddressZero;
            } else {    // Token
                const token = erc20functions.getToken(tokenContracts, blockchainSelected, fastSwapConfig.tokenOutAddress);
                tokenOut = await getRoute.readInfoToken(token, networkProvider.chainId);
                tokenOutSymbol = tokenOut.symbol;
                tokenOutAddress = fastSwapConfig.tokenOutAddress;
            }

            // Slippage
            const slippageInputParsed = parseFloat(fastSwapConfig.slippage.slice(0, -1));
            let slippage = Number(slippageInputParsed).toFixed(2);
            
            // Find best route
            let bestRoute;
            let priceImpact;
            let gasSettingsApproval;
            let gasSettingsSwap;
            let sendingConfirmation = 'U';

            while (sendingConfirmation.toUpperCase() != 'Y' && sendingConfirmation.toUpperCase() != 'N') {
                
                let apiTryRequests = 1;
                while(apiTryRequests <= constants.maxApiTryRequests) {
                    console.log(`(Attempt ${apiTryRequests} of ${constants.maxApiTryRequests}): Finding best route in Odos...`);
                    
                    [bestRoute, priceImpact] = await getRoute.findBestRouteOdos(walletSending.wallet.address, tokenInAddress, amountIn, tokenOutAddress, slippage, networkProvider);
                    if (bestRoute != null) {
                        break;
                    }
                    await inputData.delay(1000);
                    apiTryRequests++;
                }
                // Checks if it couldn't find the best route to move to the next wallet
                if (bestRoute == null) {
                    break;
                }
                
                const amountOutReadable = ethers.utils.formatUnits(bestRoute.outputTokens[0].amount, tokenOut.decimals).toString();
                const amountOutInUSD = Number(bestRoute.outValues[0]);

                // Gas settings
                gasSettingsApproval = new providerUtility.GasSettings(fastSwapConfig.gasLimitApprove, 0, ethers.utils.parseUnits(fastSwapConfig.maxPriorityFeeGas, 'gwei'), ethers.utils.parseUnits(fastSwapConfig.maxGas, 'gwei'));
                gasSettingsSwap = new providerUtility.GasSettings(fastSwapConfig.gasLimitSwap, 0, ethers.utils.parseUnits(fastSwapConfig.maxPriorityFeeGas, 'gwei'), ethers.utils.parseUnits(fastSwapConfig.maxGas, 'gwei'));

                // Best route result
                const swapResumeString = 
                inputData.chalk.bold('\nSwap resume\n') +
                `${constants.blockchainsData[blockchainSelected].name} - ${walletSending.name}: ${walletSending.wallet.address}\n` +
                `Swap the ${fastSwapConfig.amountIn}: ${Number(readableAmountToSwap).toFixed(6)} $${tokenInSymbol} for ${Number(amountOutReadable).toFixed(6)} $${tokenOutSymbol} worth ${amountOutInUSD.toFixed(4)}$ --> ${(amountOutInUSD/Number(readableAmountToSwap)).toFixed(4)}$/${tokenInSymbol}\n` +
                `Price impact: ${Number(priceImpact).toFixed(4)}%\n`;

                console.log(swapResumeString);
                writeLog(swapResumeString);

                // Sending confirmation before executing the tx
                sendingConfirmation = await inputData.getAnswer(`Yes[Y], Next Wallet[N] or Update best route[U]: `);
                  
            }
            
            // Next wallet
            if (sendingConfirmation.toUpperCase() == 'N') {
                continue;
            } 

            let approveTx;
            // Only approves if token In is a token
            if (!fastSwapConfig.isNativeCoinIn) {
                // Creates the contract
                const tokenContract = new ethers.Contract(fastSwapConfig.tokenInAddress, erc20functions.ERC20_ABI, walletSending.wallet);

                // Checks allowance
                const routerAddress = constants.blockchainsData[blockchainSelected].uniRouterAddress;
                const allowanceToken = await tokenContract.allowance(walletSending.wallet.address, routerAddress);
                if(Number(allowanceToken) < Number(amountIn)) {
                    approveTx = await approveTokenFastSwap(routerAddress, tokenContract, amountIn, walletSending.nonce++, gasSettingsApproval);
                    console.log(`Approval transaction hash: ${approveTx.hash}`);
                    writeLog(`Approval transaction sent with hash: ${approveTx.hash}`);
                } else {
                    console.log('Token already approved, skipping approval...\n');
                    writeLog('Token already approved, skipping approval...\n');
                }
            }

            // Swap
            const swapTx = await swapTokenFastSwap(bestRoute, walletSending, gasSettingsSwap, blockchainSelected, walletSending.nonce++, 1);
            console.log(`Swap transaction sent with hash: ${swapTx.hash}`);
            writeLog(`Swap transaction hash: ${swapTx.hash}\n`);

            if (approveTx != null) {
                console.log('Waiting for approval confirmation...');
                await approveTx.wait();
                console.log(inputData.chalk.green(`Token approved, hash: ${approveTx.hash}`));
                writeLog(`Token approved, hash: ${approveTx.hash}`);
            }
            console.log('Waiting for swap confirmation...');
            await swapTx.wait();
            console.log(inputData.chalk.green('Swapped tokens successfully!\n'));
            writeLog('Swapped tokens successfully!');
        } catch (error) {
            console.log(inputData.chalk.blue.red(`There were an error in the swapping process with the actual wallet, skipping...\n`));
            writeLog(`There were an error in the swapping process with the actual wallet, skipping...: ${error}`);
        }        
    }    

    console.log('Multiple wallet swap finished!');

    await inputData.introToContinue();
}


// Function to multiple swap on Uniswap
async function setInfoForUniswapMultiple(wallets, tokenContracts) {
    console.log(inputData.chalk.blue.bold("SWAP TOKENS\n"));
    console.log(inputData.chalk.blue("Uniswap - Multiple swap"));
    
    const fastSwapConfig = constants.getFastSwapConfig();

    for(let i = 0; i < wallets.length; i++) {

        try {
            // Sets the wallet
            let walletSending = wallets[i];

            console.log(inputData.chalk.rgb(255, 136, 0)(`\n${walletSending.name}: ${walletSending.wallet.address}\n`));

            // Sets the provider
            const blockchainSelected = providerUtility.getBlockchainIndex(fastSwapConfig.blockchainName);
            const provider = await providerUtility.getProvider(blockchainSelected);
            const networkProvider = await provider.getNetwork();

            // Sets the provider to the wallet
            walletSending = await walletManager.changeWalletProvider(walletSending, provider);

            // Gets the nonce
            walletSending.nonce = await provider.getTransactionCount(walletSending.wallet.address);

            let amountIn;
            let tokenIn;
            let amountInCurrency;
            let tokenInSymbol;
            let readableAmountToSwap;
            // Native Coin In
            if (fastSwapConfig.isNativeCoinIn) {
                tokenIn = Ether.onChain(networkProvider.chainId);
                const nativeCoinBalance = await erc20functions.getNativeCoinBalance(provider, walletSending.wallet.address);
                readableAmountToSwap = (Number(nativeCoinBalance) * parseFloat(fastSwapConfig.amountIn.slice(0, -1))/100).toFixed(tokenIn.decimals).toString();

                // Route parameters and best route
                amountIn = ethers.utils.parseUnits(readableAmountToSwap, 18).toString();
                amountInCurrency = CurrencyAmount.fromRawAmount(Ether.onChain(networkProvider.chainId), amountIn);
                tokenInSymbol = constants.blockchainsData[blockchainSelected].gasSymbol;
            } else {    //Token
                const token = erc20functions.getToken(tokenContracts, blockchainSelected, fastSwapConfig.tokenInAddress);

                // Returns all the info about the token
                tokenIn = getRoute.readInfoToken(token, networkProvider.chainId);

                // Amount to swap. The maximum amount will be the token balance
                const tokenReadableBalance =  await erc20functions.tokenBalance(token.contract, tokenIn.decimals, walletSending.wallet.address);
                readableAmountToSwap = (Number(tokenReadableBalance) * parseFloat(fastSwapConfig.amountIn.slice(0, -1))/100).toFixed(tokenIn.decimals).toString();

                // Route parameters and best route
                amountIn = ethers.utils.parseUnits(readableAmountToSwap, tokenIn.decimals).toString();
                amountInCurrency = CurrencyAmount.fromRawAmount(tokenIn, amountIn);
                tokenInSymbol = tokenIn.symbol;
            }
            // Checks if the wallet has no amount of the input token to skip it
            if (Number(readableAmountToSwap) <= 0) {
                console.log(`${walletSending.name}: has 0 ${tokenInSymbol} skipping...`);
                continue;
            }

            // Output token
            let tokenOut;
            let tokenOutSymbol;
            // Native coin Out
            if (fastSwapConfig.isNativeCoinOut) {
                tokenOut = Ether.onChain(networkProvider.chainId);
                tokenOutSymbol = constants.blockchainsData[blockchainSelected].gasSymbol;
            } else {    // Token
                const token = erc20functions.getToken(tokenContracts, blockchainSelected, fastSwapConfig.tokenOutAddress);
                tokenOut = await getRoute.readInfoToken(token, networkProvider.chainId);
                tokenOutSymbol = tokenOut.symbol;
            }

            // Slippage
            const slippageInputParsed = parseFloat(fastSwapConfig.slippage.slice(0, -1));
            let slippage = Number(slippageInputParsed).toFixed(2) * 100;
            slippage = new Percent(slippage, 10000);
            
            // Find best route
            let bestRoute;
            let gasSettingsApproval;
            let gasSettingsSwap;
            let sendingConfirmation = 'U';

            while (sendingConfirmation.toUpperCase() != 'Y' && sendingConfirmation.toUpperCase() != 'N') {
                
                let apiTryRequests = 1;
                while(apiTryRequests <= constants.maxApiTryRequests) {
                    console.log(`(Attempt ${apiTryRequests} of ${constants.maxApiTryRequests}): Finding best route in Uniswap...`);
                    
                    bestRoute = await getRoute.findBestRouteUniswap(walletSending.wallet.address, tokenOut, amountInCurrency, slippage, networkProvider.chainId, provider);
                    if (bestRoute != null) {
                        break;
                    }
                    await inputData.delay(1000);
                    apiTryRequests++;
                }
                // Checks if it couldn't find the best route to move to the next wallet
                if (bestRoute == null) {
                    break;
                }
                
                const amountOutReadable = bestRoute.trade.outputAmount.toSignificant(6);
                const priceImpact = bestRoute.trade.priceImpact.toSignificant(4);

                // Gas settings
                gasSettingsApproval = new providerUtility.GasSettings(fastSwapConfig.gasLimitApprove, 0, ethers.utils.parseUnits(fastSwapConfig.maxPriorityFeeGas, 'gwei'), ethers.utils.parseUnits(fastSwapConfig.maxGas, 'gwei'));
                gasSettingsSwap = new providerUtility.GasSettings(fastSwapConfig.gasLimitSwap, 0, ethers.utils.parseUnits(fastSwapConfig.maxPriorityFeeGas, 'gwei'), ethers.utils.parseUnits(fastSwapConfig.maxGas, 'gwei'));

                // Best route result
                const swapResumeString = 
                inputData.chalk.bold('\nSwap resume\n') +
                `${constants.blockchainsData[blockchainSelected].name} - ${walletSending.name}: ${walletSending.wallet.address}\n` +
                `Swap the ${fastSwapConfig.amountIn}: ${Number(readableAmountToSwap).toFixed(6)} $${tokenInSymbol} for ${amountOutReadable} $${tokenOutSymbol}\n` +
                `Price impact: ${priceImpact}%\n`;

                console.log(swapResumeString);
                writeLog(swapResumeString);

                // Sending confirmation before executing the tx
                sendingConfirmation = await inputData.getAnswer(`Yes[Y], Next Wallet[N] or Update best route[U]: `);
                
            }

            // Next wallet
            if (sendingConfirmation.toUpperCase() == 'N') {
                continue;
            } 

            let approveTx;
            // Only approves if token In is a token
            if (!fastSwapConfig.isNativeCoinIn) {
                // Creates the contract
                const tokenContract = new ethers.Contract(fastSwapConfig.tokenInAddress, erc20functions.ERC20_ABI, walletSending.wallet);

                // Checks allowance
                const routerAddress = constants.blockchainsData[blockchainSelected].uniRouterAddress;
                const allowanceToken = await tokenContract.allowance(walletSending.wallet.address, routerAddress);
                if(Number(allowanceToken) < Number(amountIn)) {
                    approveTx = await approveTokenFastSwap(routerAddress, tokenContract, amountIn, walletSending.nonce++, gasSettingsApproval);
                    console.log(`Approval transaction hash: ${approveTx.hash}`);
                    writeLog(`Approval transaction sent with hash: ${approveTx.hash}`);
                } else {
                    console.log('Token already approved, skipping approval...\n');
                    writeLog('Token already approved, skipping approval...\n');
                }
            }

            // Swap
            const swapTx = await swapTokenFastSwap(bestRoute, walletSending, gasSettingsSwap, blockchainSelected, walletSending.nonce++, 0);
            console.log(`Swap transaction sent with hash: ${swapTx.hash}`);
            writeLog(`Swap transaction hash: ${swapTx.hash}\n`);

            if (approveTx != null) {
                console.log('Waiting for approval confirmation...');
                await approveTx.wait();
                console.log(inputData.chalk.green(`Token approved, hash: ${approveTx.hash}`));
                writeLog(`Token approved, hash: ${approveTx.hash}`);
            }
            console.log('Waiting for swap confirmation...');
            await swapTx.wait();
            console.log(inputData.chalk.green('Swapped tokens successfully!\n'));
            writeLog('Swapped tokens successfully!\n');
        } catch (error) {
            console.log(inputData.chalk.blue.red(`There were an error in the swapping process with the actual wallet, skipping...\n`));
            writeLog(`There were an error in the swapping process with the actual wallet, skipping...: ${error}`);
        }        
    }    

    console.log('\nMultiple wallet swap finished!');

    await inputData.introToContinue();
}

// Function to check that all the configuration set to the Fast Swap is ok
async function checkFastSwapConfig(wallets, tokenContracts) {
    console.log(inputData.chalk.blue.bold("CHECK FAST SWAP CONFIGURATION\n"));
    console.log(inputData.chalk.rgb(255, 136, 0)("At the end of the check, all the checks must be green\n"));

    const fastSwapConfig = constants.getFastSwapConfig();

    // Checks blockchain name
    let blockchainSelected = providerUtility.getBlockchainIndex(fastSwapConfig.blockchainName);

    if (blockchainSelected == null) {
        console.log(inputData.chalk.red('Blockchain name is NOT in the blockchain data and will not be able to get the provider\n'));
    } else {
        console.log(inputData.chalk.green('Blockchain name correct\n'));
    }

    // Checks if the token in address is already added
    if (!fastSwapConfig.isNativeCoinIn) {
        if(!erc20functions.checkIfTokenImported(tokenContracts, fastSwapConfig.tokenInAddress, blockchainSelected)) {
            console.log(inputData.chalk.red('The tokenIn for the swap is NOT already imported\n'));
        } else {
            console.log(inputData.chalk.green('The tokenIn for the swap is already imported\n'));
        }
    }

    // Checks if the token in address is already added
    if (!fastSwapConfig.isNativeCoinOut) {
        if(!erc20functions.checkIfTokenImported(tokenContracts, fastSwapConfig.tokenOutAddress, blockchainSelected)) {
            console.log(inputData.chalk.red('The token out for the swap is NOT already imported\n'));
        } else {
            console.log(inputData.chalk.green('The token out for the swap is already imported\n'));
        }
    }

    // Checks slippage
    if (!transfer.isPercentage(fastSwapConfig.slippage)) {
        console.log(inputData.chalk.red('The slippage does NOT have the correct format\n'));
    } else {
        console.log(inputData.chalk.green('The slippage have the correct format\n'));
    }

    // Checks gas limit
    if (Number(fastSwapConfig.gasLimitApprove) <= 0 || Number(fastSwapConfig.gasLimitSwap <= 0)) {
        console.log(inputData.chalk.red('The gas limit has to be a positive integer\n'));
    } else {
        console.log(inputData.chalk.green('The gas limit is correctly written\n'));
    }

    // Checks gas prices
    if (Number(fastSwapConfig.maxPriorityFeeGas) < 0 || Number(fastSwapConfig.maxGas) <= 0) {
        console.log(inputData.chalk.red('The gas price has to be positive\n'));
    } else {
        console.log(inputData.chalk.green('The gas price is correctly written\n'));
    }

    // Checks if there is enough gas to cover the tx fee
    // Do not count approval if input token is native coin
    const provider = await providerUtility.getProvider(blockchainSelected);

    let maxGasReadable;
    let maxGasReadableApprove = 0;
    let maxGasReadableSwap = 0;

    const gasSettingsApproval = new providerUtility.GasSettings(
        fastSwapConfig.gasLimitApprove,
         0,
         ethers.utils.parseUnits(fastSwapConfig.maxPriorityFeeGas, 'gwei'),
         ethers.utils.parseUnits(fastSwapConfig.maxGas, 'gwei')
    );
    const gasSettingsSwap = new providerUtility.GasSettings(fastSwapConfig.gasLimitSwap,
        0,
        ethers.utils.parseUnits(fastSwapConfig.maxPriorityFeeGas, 'gwei'),
        ethers.utils.parseUnits(fastSwapConfig.maxGas, 'gwei')
    );
    let testen = ethers.utils.formatUnits(gasSettingsApproval.maxFee, "gwei");

    if (fastSwapConfig.isNativeCoinIn) {
        maxGasReadable = gasSettingsApproval.limit * Number(ethers.utils.formatEther(gasSettingsApproval.maxFee));
    } else {
        maxGasReadableApprove = gasSettingsApproval.limit * Number(ethers.utils.formatEther(gasSettingsApproval.maxFee)); 
        maxGasReadableSwap = gasSettingsSwap.limit * Number(ethers.utils.formatEther(gasSettingsApproval.maxFee));
        maxGasReadable = maxGasReadableApprove + maxGasReadableSwap;
    }
    
    if(wallets.length == 0) {
        console.log(inputData.chalk.red('No wallets imported!\n'));
    } else {
        let enoughGas = true;
        for(let i = 0; i <wallets.length; i++) {
            // Gets the nonce
            wallets[i].nonce = await provider.getTransactionCount(wallets[i].wallet.address);
    
            const nativeCoinBalance = await erc20functions.getNativeCoinBalance(provider, wallets[i].wallet.address);
            if (nativeCoinBalance > maxGasReadable) {
                if (fastSwapConfig.isNativeCoinIn) {
                    console.log(inputData.chalk.green(`${wallets[i].name} has: ${Number(nativeCoinBalance).toFixed(6)} ${constants.blockchainsData[blockchainSelected].gasSymbol} enough for max cost Swapping:  ${Number(maxGasReadable).toFixed(6)} ${constants.blockchainsData[blockchainSelected].gasSymbol}\n`));
                } else {
                    console.log(inputData.chalk.green(`${wallets[i].name} has: ${Number(nativeCoinBalance).toFixed(6)} ${constants.blockchainsData[blockchainSelected].gasSymbol} enough for max cost Approving + Swapping:  ${Number(maxGasReadable).toFixed(6)} ${constants.blockchainsData[blockchainSelected].gasSymbol}\n`));
                }
            } else if (nativeCoinBalance > maxGasReadableSwap && !fastSwapConfig.isNativeCoinIn) {
                console.log(inputData.chalk.rgb(255, 136, 0)(`${wallets[i].name} has: ${Number(nativeCoinBalance).toFixed(6)} ${constants.blockchainsData[blockchainSelected].gasSymbol} only enough for max cost Swapping:  ${Number(maxGasReadableSwap).toFixed(6)} ${constants.blockchainsData[blockchainSelected].gasSymbol}. Ok if token is already approved\n`));
                enoughGas = false;
            } else {
                console.log(inputData.chalk.red(`${wallets[i].name} has: ${Number(nativeCoinBalance).toFixed(6)} ${constants.blockchainsData[blockchainSelected].gasSymbol} NOT enough for max cost Approving + Swapping or even only Swapping: ${Number(maxGasReadable).toFixed(6)} ${constants.blockchainsData[blockchainSelected].gasSymbol}\n`));
                enoughGas = false
            }
        }
        
        if(!enoughGas) {
            console.log(inputData.chalk.rgb(255, 136, 0)(`One or more wallets probably would fail the transactions due to low amount to cover fees.\n`));
        }
    }

    console.log(inputData.chalk.green.bold(`Checking process finished\n`));

    await inputData.introToContinue();
}

module.exports = {
    swapMenu
}