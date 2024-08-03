## INTRO

This program acts as a kind of crypto wallet that allows you to perform various actions on the blockchain. It enables the transfer of coins/tokens between wallets, executes swaps with one or multiple wallets simultaneously, and additional features will be added over time.

The goal of this development was to facilitate quick actions with certain tokens when the frontend is overloaded, but the blockchain is still operational. This allows you to stay ahead of others and secure better buy/sell prices.

## DISCLAIMER

The program was developed by a computer science student with no professional experience in the field and who has not studied Node.js in depth. It is merely a project created for learning purposes and as a personal tool, but I am making it available for anyone who wishes to use or improve it.

This program uses private keys to interact with smart contracts and perform transactions on the blockchain. It is important that you understand the risks associated with using private keys and managing cryptocurrencies. By using this program, you acknowledge and accept the following:

**Personal Responsibility**: You are solely responsible for the security of your private keys. If you lose your private key or it is compromised, you could lose access to your funds irreversibly.

**Risk of Loss of Funds**: Cryptocurrency transactions are irreversible. If you send funds to an incorrect address or if your transaction fails, you could lose your funds with no possibility of recovery.

**Security Risks**: You must ensure that your working environment is secure and free from malware. Do not share your private keys with third parties and use robust security practices.

**No Guarantees**: This program is provided "as is", with no guarantees that it is free of errors or that it will operate uninterrupted.

**Limitation of Liability**: I will not be responsible for any loss, damage, or harm that arises from the use of this program. This includes, but is not limited to, the loss of funds, service interruption, or any other incidental or consequential damage.

#### Recommendations

If you do not know what you are doing or are unsure, do not use this program.

By using this program, you acknowledge that you have read, understood, and accepted this disclaimer and the risks associated with the use of cryptocurrencies and private keys.
## WHAT DO YOU NEED?

NodeJS versión: 20.15.0: https://nodejs.org/dist/v20.15.1/node-v20.15.1-x64.msi

## PREVIOUS STEPS

Firstly, you will need to configure a `.env` file with the same structure as `.env.example`, where you will enter the private keys and assign a name to each wallet. You can add as many wallets as you like by following the structure.

Secondly, you need to access the `utilities/constants.js` file. In this file, all the blockchains, tokens, gas parameters, etc., that the program will use are configured. You can also add these manually within the program, but this data will be lost when the program is restarted.

- autoLoadData: Automatically loads all the information from `.env` and `constants` when the application starts.
- blockchainsBase: Here, all the blockchains that can be used are defined. The first line is used to define whether you want the program to load the blockchain or not. This saves time during the program's execution. Always respect the defined structure, or the program will throw an error.
- autoLoadFastSwapData: This option is similar to the first one but loads all the necessary information for performing multiple swaps simultaneously. See below for what this option is for.
- fastSwapConfigBase: This is where all the parameters for performing multiple swaps simultaneously are defined.
- Gas limits: Defines the gas limit to be used for each type of transaction when the Auto mode is selected. See below for what this option is for.
- maxApiTryRequests: When performing a swap, the program searches the corresponding DEX or aggregator API for the optimal route. This parameter is used to specify how many times we want to retry the search in case of an error.

## PROGRAM

First of all, if the data loading options are enabled, the data will be loaded when the program starts.

- 1: Import all the data: Loads all the data of wallets, blockchains, etc., if they are not already loaded.
- 2: Check blockchain connection: Checks the speed of the RPC defined in constants. Allows you to select any of the blockchains.
- 3: Wallet manager: 
	- 1: Import wallet from private key: Allows you to add a wallet using a private key, equivalent to having written it in the .env file.
	- 2: Import wallets from ENV file: Imports all the wallets from the .env file if they are not already imported.
	- 3: Display all the wallets imported: Displays all the imported wallets.
- 4: Token manager:
	- 1: Import token from contract address: Imports a token using its contract address.
	- 2: Import tokens from file: Imports all the tokens from the constants file if they are not already imported.
	- 3: Display all the token amounts form one wallet: Displays all the added tokens of one of the imported wallets.
	- 4: Display all the token amounts from all the wallets: Displays all the added tokens from all the imported wallets.
- 5: Transfers:
	- 1: imple transfer: Allows you to send a coin/token from one of the imported wallets to another wallet.
	- 2: Transfer from all wallets to one wallet: Not available at the moment.
- 6: Swaps:
	- 1: Uniswap - simple swap: Allows you to perform a swap on Uniswap with a coin/token from the added wallets. The program guides you through all the necessary data for the swap.
	- 2: Odos - simple swap: Allows you to perform a swap on Odos with a coin/token from the added wallets. The program guides you through all the necessary data for the swap.
	- 3: Uniswap - multiple wallets swap: CAUTION, this option starts the process of swapping the coin/token defined in constants in fastSwapConfigBase for another coin/token from all the added wallets on Uniswap with the configuration defined in the file.
	- 4: Odos - multiple wallets swap: CAUTION, this option starts the process of swapping the coin/token defined in constants in fastSwapConfigBase for another coin/token from all the added wallets on Odos with the configuration defined in the file.
	- 5: Check fast swap config: Checks that all parameters written in fastSwapConfigBase of constants.js meet the required format. It also checks that there is sufficient ETH/BNB, etc., in each wallet to cover gas costs.

## IMPROVEMENTS

- Error handling. Definetely, really bad use of them.
- Function and variable names.
- Both Uniswap and Odos depend on their API, so they do not rely 100% on the blockchain. For Uniswap, I am working in something, but it depends on knowing the pool pairs and some other things, which is in process.
- Improve the gas management when auto option used. Too high most of the times.