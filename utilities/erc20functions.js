const { ethers } = require('ethers');
const inputData = require('./inputData');
const providerUtility = require('./providerUtility');
const constants = require('./constants');
const walletManager = require('./walletManager');
require('dotenv').config();
const { writeLog } = require('./inputData');

const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 value) returns (bool)",
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) public view returns (uint256)"
  ];

class Token {
  constructor(contract, symbol, name, decimals) {
    this.contract = contract;
    this.symbol = symbol;
    this.name = name;
    this.decimals = decimals;
  }
}

// Token Menu
async function tokenMenu(wallets, tokenContracts){
  let userTokenMenuOption = 0;

  while(userTokenMenuOption != 10) {
      console.clear();
      console.log(inputData.chalk.blue.bold("TOKEN MANAGER\n"));
      console.log(inputData.chalk.bold('Select an option'));
      console.log(inputData.chalk.bold('  [1]:'), 'Import token from contract address');
      console.log(inputData.chalk.bold('  [2]:'), 'Import tokens from file');
      console.log(inputData.chalk.bold('  [3]:'), 'Display all the token amounts from one wallets');
      console.log(inputData.chalk.bold('  [4]:'), 'Display all the token amounts from all the wallets');
      console.log(inputData.chalk.bold('  [10]:'), 'Reteurn to main menu');
  
      userTokenMenuOption = await inputData.getAnswer(`\nChoose an option: `);

      switch (Number(userTokenMenuOption)) {
          // Import token from contract address
          case 1:
              try{
                console.clear();
                console.log(inputData.chalk.blue.bold("TOKEN MANAGER"));
                await importTokenFromContractFromAddress(tokenContracts);
                await inputData.introToContinue();
              } catch (error) {
                console.log(inputData.chalk.red('There were an error importing the token from contract address'));
                writeLog(`There were an error importing the token from contract address ${error}`);
                inputData.introToContinue();
              }   
              break;
          // Import all the tokens from the env file
          case 2:
                try{
                    console.clear();
                    console.log(inputData.chalk.blue.bold("TOKEN MANAGER\n"));
                    await importTokensFromConstants(tokenContracts);
                    await inputData.introToContinue();
                } catch (error) {
                    console.log(inputData.chalk.red('There were an error importing the tokens from env file'));
                    writeLog(`There were an error importing the tokens from env file ${error}`);
                    inputData.introToContinue();
                } 
                break;
          // Display all the token balances from one wallet
          case 3:
            try{
              await displayTokenWalletBalances(wallets, tokenContracts);
            } catch (error) {
                console.log(inputData.chalk.red('There were an error with the tokens balances from the wallet'));
                writeLog(`There were an error with the tokens balances from the wallet ${error}`);
                inputData.introToContinue();
            } 
            break;
          // Display all the token amounts from all the wallets
          case 4:
            try{
              await displayTokensWalletsBalances(wallets, tokenContracts);
            } catch (error) {
                console.log(inputData.chalk.red('There were an error with the tokens balances from all the wallets'));
                writeLog(`There were an error with the tokens balances from all the wallets ${error}`);
                inputData.introToContinue();
            } 
            break;
      }
  }

  return tokenContracts;
}

// Function to initialise the tokenContracts matrix
function initTokenContracts(tokenContracts) {
  for (let i = 0; i < constants.blockchainsData.length; i++){
    tokenContracts[i] = [];
  }

  return tokenContracts;
}

// Aux function to get token balance
async function tokenBalance(tokenContract, tokenDecimals, walletAddress){
  try {
    const amount = await tokenContract.balanceOf(walletAddress);
    const readableAmount = ethers.utils.formatUnits(amount, tokenDecimals);
    return readableAmount;
  }catch(error) {
    console.log(inputData.chalk.red("There were an error reading the token balance\n"));
    writeLog(error);
  }
}

// Function to get the token contract
function getToken(tokenContracts, blockchainSelected, tokenAddress) {
  for(let i = 0; i < tokenContracts[blockchainSelected].length; i++) {
    if(tokenContracts[blockchainSelected][i].contract.address == tokenAddress) {
      return tokenContracts[blockchainSelected][i];
    }
  }
}

// Aux function to get native coin Balance
async function getNativeCoinBalance(provider, walletAddress){
  try {
    const balance = await provider.getBalance(walletAddress);
    const readableBalance = ethers.utils.formatEther(balance);
    return readableBalance;
  }catch(error) {
    console.log(inputData.chalk.red("There were an error reading the native coin balance\n"));
    writeLog(error);
  }
}

// Wallet balances
async function walletBalances(wallet, tokenContracts){
  try {
    console.log("\n===============================================");
    console.log(inputData.chalk.blue(`${wallet.name}`));
    for (let j = 0; j < constants.blockchainsData.length; j++) {
      console.log(inputData.chalk.yellow(`\n${constants.blockchainsData[j].name}`));
      const provider = await providerUtility.getProvider(j);
      const nativeCoinBalance = await getNativeCoinBalance(provider, wallet.wallet.address);
      console.log(`${nativeCoinBalance} ${constants.blockchainsData[j].gasSymbol}`);
      for (let m = 0; m < tokenContracts[j].length; m++) {
        const amount = await tokenBalance(tokenContracts[j][m].contract, tokenContracts[j][m].decimals,wallet.wallet.address);
        console.log(`${tokenContracts[j][m].name}: ${amount} $${tokenContracts[j][m].symbol}`);
      }
    }
  } catch(error) {
    console.log(inputData.chalk.red("There were an error getting the token balances\n"));
    writeLog(error);
  }
}

// Function to show all tokens balances and all blockchains from one wallet
async function displayTokenWalletBalances(wallets, tokenContracts) {
  console.clear();
  console.log(inputData.chalk.blue.bold("TOKEN AMOUNTS\n"));

  // Select a wallet
  console.log(inputData.chalk.bold("Select a wallet"));
  const walletSelected = await walletManager.selectWallet(wallets);
  if (walletSelected == null){
    await inputData.introToContinue();
    return;
  }

  // Show amounts
  await walletBalances(walletSelected, tokenContracts);
  console.log("\n===============================================");
  await inputData.introToContinue();
}

// Function to show all the token balances from all blockchain and wallets
async function displayTokensWalletsBalances(wallets, tokenContracts) {
    console.clear();
    console.log(inputData.chalk.blue.bold("TOKEN AMOUNTS"));
    for (let i = 0; i < wallets.length; i++) {
      await walletBalances(wallets[i], tokenContracts);
    }
    console.log("\n===============================================");
    await inputData.introToContinue();
}

// Function to import a token
async function importTokenContract(tokenContracts, tokenAddress, tokenBlockchain) {
  const tokenProvider = await providerUtility.getProvider(tokenBlockchain);

  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, tokenProvider);
    const tokenSymbol = await tokenContract.symbol();
    const tokenName = await tokenContract.name();
    const tokenDecimals = await tokenContract.decimals();
  
    const tokenInstance = new Token(tokenContract, tokenSymbol, tokenName, tokenDecimals);
    tokenContracts[tokenBlockchain].push(tokenInstance);

    console.log(inputData.chalk.green(`\n${constants.blockchainsData[tokenBlockchain].name}: Token ${tokenName} ${tokenSymbol} with ${tokenDecimals} decimals and ${tokenAddress} address IMPORTED!`));

  }catch (error) {
    console.log(inputData.chalk.red('\nThere were an error trying to import the token'));
    writeLog(error);
  }

  return tokenContracts;
}

// Function for checking ig the token is already imported
function checkIfTokenImported(tokenContracts, tokenAddress, tokenBlockchain) {
  for(let i = 0; i < tokenContracts[tokenBlockchain].length; i++) {
    if(tokenAddress == tokenContracts[tokenBlockchain][i].contract.address) {
      return true;
    }
  }

  return false;
}

// Function to import token from contract address
async function importTokenFromContractFromAddress (tokenContracts){

  const tokenBlockchain = await providerUtility.selectBlockchainMenu();
  const tokenAddress = await inputData.getAnswer(`Introduce the contract address: `);

  if (checkIfTokenImported(tokenContracts, tokenAddress, tokenBlockchain)) {
    console.log(`Token: ${tokenAddress} was already imported\n`);
  } else {
    tokenContracts = await importTokenContract(tokenContracts, tokenAddress, tokenBlockchain);
  }
}

// Function to import all the tokens from ENV file
async function importTokensFromConstants(tokenContracts) {
  
  console.log(inputData.chalk.cyan("Importing tokens..."));

  for(let i = 0; i < constants.blockchainsData.length; i++) {
    for(let j = 0; j < constants.blockchainsData[i].tokensAddress.length; j++) {
      if (checkIfTokenImported(tokenContracts, constants.blockchainsData[i].tokensAddress[j], i)) {
        console.log(`Token: ${constants.blockchainsData[i].tokensAddress[j]} was already imported\n`);
      } else {
        tokenContracts = await importTokenContract(tokenContracts, constants.blockchainsData[i].tokensAddress[j], i);
      }
    }
  }

  // Load Fast Swap data

  const fastSwapConfig = constants.getFastSwapConfig();
  
  if (constants.autoLoadFastSwapData) {
    console.log(inputData.chalk.cyan('\nImporting tokens from fast swap data...\n'));
    let j;
    for(let i = 0; i < constants.blockchainsData.length; i++) {
      if (constants.blockchainsData[i].name == fastSwapConfig.blockchainName) {
        j = i;
        break;
      }
    }
    if (j != null) {
      if (!fastSwapConfig.isNativeCoinIn) {
        if (checkIfTokenImported(tokenContracts, fastSwapConfig.tokenInAddress, j)) {
          console.log(`Token: ${fastSwapConfig.tokenInAddress} was already imported\n`);
        } else {
          tokenContracts = await importTokenContract(tokenContracts, fastSwapConfig.tokenInAddress, j);
        }
      }
      if (!fastSwapConfig.isNativeCoinOut) {
        if (checkIfTokenImported(tokenContracts, fastSwapConfig.tokenOutAddress, j)) {
          console.log(`Token: ${fastSwapConfig.tokenOutAddress} was already imported\n`);
        } else {
          tokenContracts = await importTokenContract(tokenContracts, fastSwapConfig.tokenOutAddress, j);
        }
      }
    } else {
      console.log(inputData.chalk.red('\nCould not import tokens from fast swap data'));
    }
  }
}

module.exports = {
  tokenMenu,
  initTokenContracts,
  importTokensFromConstants,
  getNativeCoinBalance,
  tokenBalance,
  checkIfTokenImported,
  getToken,
  ERC20_ABI
}