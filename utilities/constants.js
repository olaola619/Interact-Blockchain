// BLOCKCHAINS

class Blockchain {
    constructor(name, gasSymbol, rpc, tokensAddress, uniRouterAddress, odosRouterAddress) {
        this.name = name;
        this.gasSymbol = gasSymbol;
        this.rpc = rpc;
        this.tokensAddress = tokensAddress;
        this.uniRouterAddress = uniRouterAddress;
        this.odosRouterAddress = odosRouterAddress;
    }
}

// Instead of opening the application and select the option import data, import automatically when opened
const autoLoadData = true;

// Var used in the program which will contain all the blockchains visibles
let blockchainsData = [];

// Variable to fill with all the data required
// For Uniswap V3 Router02 addresses: https://docs.uniswap.org/contracts/v3/reference/deployments/
// For Uniswap V3 tokens on Ethereum Sepolia: https://www.geckoterminal.com/es/sepolia-testnet/uniswap-v3-sepolia-testnet/pools
// For Odos Router address: https://docs.odos.xyz/product/sor/v2/
const blockchainsBase = [
    //Ethereum
    [
        false,                                                      // Visibility in the program. If TRUE the program will take it into account, FALSE for not showing it
        'Ethereum',                                                 // Blockchain name
        'ETH',                                                      // Token gas symbol
        'https://rpc.ankr.com/eth',                                 // RPC. https or wss, program autodetect
        [                                                           // TOKENS
            '0xD533a949740bb3306d119CC777fa900bA034cd52',           // Curve
            '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',           // Uni token
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'            // WETH
        ],
        '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',               // Uniswap V3 router address
        '0xCf5540fFFCdC3d510B18bFcA6d2b9987b0772559'                // Odos router address
    ],
    // Arbitrum
    [
        false,                                                      // Visibility in the program. If TRUE the program will take it into account, FALSE for not showing it
        'Arbitrum',                                                 // Blockchain name
        'ETH',                                                      // Token gas symbol
        'https://rpc.ankr.com/arbitrum',                            // RPC. https or wss, program autodetect
        [                                                           // TOKENS
            '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',           // WETH
            '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'            // USDC
        ],
        '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',               // Uniswap V3 router address
        '0xa669e7A0d4b3e4Fa48af2dE86BD4CD7126Be4e13'                // Odos router address
    ],
    // Binance Smart chain
    [
        false,                                                      // Visibility in the program. If TRUE the program will take it into account, FALSE for not showing it
        'Binance Smart Chain',                                      // Blockchain name
        'ETH',                                                      // Token gas symbol
        'https://rpc.ankr.com/bsc',                                 // RPC. https or wss, program autodetect
        [                                                           // TOKENS
            '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82'            // Cake token
        ],
        '0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2',               // Uniswap V3 router address
        '0x89b8AA89FDd0507a99d334CBe3C808fAFC7d850E'                // Odos router address
    ],
    // Ethereum Sepolia
    [
        true,                                                      // Visibility in the program. If TRUE the program will take it into account, FALSE for not showing it
        'Ethereum Sepolia',                                         // Blockchain name
        'ETH',                                                      // Token gas symbol
        'https://rpc.ankr.com/eth_sepolia',                         // RPC. https or wss, program autodetect
        [                                                           // TOKENS
            '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',           // WETH
            '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238',           // USDC
            '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'            // UNI
        ],
        '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',               // Uniswap V3 router address
        ''                                                          // Odos router address - Do not support testnets
    ],
    // Arbitrum Sepolia
    [
        false,                                                      // Visibility in the program. If TRUE the program will take it into account, FALSE for not showing it
        'Arbitrum Sepolia',                                         // Blockchain name
        'ETH',                                                      // Token gas symbol
        'https://rpc.ankr.com/arbitrum_sepolia',                    // RPC. https or wss, program autodetect
        [                                                           // TOKENS
            
        ],
        '0x101F443B4d1b059569D643917553c771E1b9663E',               // Uniswap V3 router address
        ''                                                          // Odos router address - Do not support testnets
    ],
    // Blast
    [
        false,                                                      // Visibility in the program. If TRUE the program will take it into account, FALSE for not showing it
        'Blast',                                                    // Blockchain name
        'ETH',                                                      // Token gas symbol
        'https://rpc.ankr.com/blast',                               // RPC. https or wss, program autodetect
        [                                                           // TOKENS
            
        ],
        '0x549FEB8c9bd4c12Ad2AB27022dA12492aC452B66',               // Uniswap V3 router address
        ''                                                          // Odos router address - Do not support testnets
    ],
    // Scroll
    [
        false,                                                      // Visibility in the program. If TRUE the program will take it into account, FALSE for not showing it
        'Scroll',                                                   // Blockchain name
        'ETH',                                                      // Token gas symbol
        'https://rpc.ankr.com/scroll',                              // RPC. https or wss, program autodetect
        [                                                           // TOKENS
            
        ],
        '',                                                         // Uniswap V3 router address
        '0xbFe03C9E20a9Fc0b37de01A172F207004935E0b1'                // Odos router address - Do not support testnets
    ],
];

// Function to initiate blockchain and only get those blockchains visibles
function initializeBlockchainsData(){
    let j = 0;
    for(let i = 0; i < blockchainsBase.length; i++)
        if (blockchainsBase[i][0] == true) {
            auxBlockchain = new Blockchain(
                blockchainsBase[i][1],
                blockchainsBase[i][2],
                blockchainsBase[i][3],
                blockchainsBase[i][4],
                blockchainsBase[i][5],
                blockchainsBase[i][6]
            );
            blockchainsData.push(auxBlockchain);
            j++;
        }
}

/*==================================================================================================================================*/

// SWAP ALL WALLETS CONFIGURATION
// Here you will define all the parameters necessary to swap a coin/token from ALL THE WALLETS to a another coin/token as fast as possible

// Loads when started the FastSwapData, turn this to false for not missclicking in the swap menu
const autoLoadFastSwapData = true;

// Class for fast swap config
class FastSwapConfig {
    constructor(blockchainName, isNativeCoinIn, tokenInAddress, amountIn, isNativeCoinOut, tokenOutAddress, slippage, gasLimitApprove, gasLimitSwap, maxPriorityFeeGas, maxGas) {
        this.blockchainName = blockchainName;
        this.isNativeCoinIn = isNativeCoinIn;
        this.tokenInAddress = tokenInAddress;
        this.amountIn = amountIn;
        this.isNativeCoinOut = isNativeCoinOut;
        this.tokenOutAddress = tokenOutAddress;
        this.slippage = slippage;
        this.gasLimitApprove = gasLimitApprove;
        this.gasLimitSwap = gasLimitSwap;
        this.maxPriorityFeeGas = maxPriorityFeeGas;
        this.maxGas = maxGas;
    }
}

// Var used in program
let fastSwapConfig;

// Defines all the parameters for the fast Swap. 
// REMEMBER TO SET TO TRUE THE BLOCKCAIN IN blockchainsBase IN ORDER TO ADD ALL THE NECESSARY PARAMETERS
const fastSwapConfigBase = [
    'Ethereum Sepolia',                                                     // Blockchain name, MUST USE THE SAME NAME THAT YOU DEFINE IN blockchainsBase
    false,                                                           // true for using the native coin as the coin to swap or false for a token
    '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238',                                                             // If the above parameter is false (means a token) defines the token address
    '1%',                                                           // Amount of the token to swap. ALWAYS IN %
    false,                                                          // true for using the native coin as the coin to receive from the swap or false for a token
    '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',                   // If the above parameter is false (means a token) defines the token address
    '5%',                                                         // Slippage. ALWAYS IN %
    '300000',                                                       // Gas limit for approvals
    '1000000',                                                      // Gas limit for the swap
    '2',                                                            // Max priority fee gas, in GWEI
    '10'                                                        // Max gas, IN GWEI
];

// Function to initialize the fast swap config
function initializeFastSwapConfig(){
    
    fastSwapConfig = new FastSwapConfig(
        fastSwapConfigBase[0],
        fastSwapConfigBase[1],
        fastSwapConfigBase[2],
        fastSwapConfigBase[3],
        fastSwapConfigBase[4],
        fastSwapConfigBase[5],
        fastSwapConfigBase[6],
        fastSwapConfigBase[7],
        fastSwapConfigBase[8],
        fastSwapConfigBase[9],
        fastSwapConfigBase[10]
    );
}

// Function to get the current fastSwapConfig
function getFastSwapConfig() {
    return fastSwapConfig;
}

/*==================================================================================================================================*/

// GAS LIMITS
// This is used when Auto Gas Settings. Remember that this limit could be deferent in diferent networks
const defaultGasLimitTransfer = '1000000';
const defaultApproveLimit = '1000000';
const defaultGasLimitSwap = '1000000';

/*==================================================================================================================================*/

// Max api requests

const maxApiTryRequests = 5;                                                   // Number of intents to find the best route before stopping

// Odos endpoints
// This is used to get the best route on Odos. The limit is 500 requests / 5 minutes

const quoteUrl = 'https://api.odos.xyz/sor/quote/v2';
const assembleUrl = 'https://api.odos.xyz/sor/assemble';

// Odos blockchains supported
const odosBlockchains =                                                         // MUST USE THE SAME NAME THAT YOU DEFINE IN blockchainsBase
    [
        'Ethereum',
        'Arbitrum',
        'Optimism',
        'Polygon',
        'Base',
        'Binance Smart Chain',
        'Avalanche',
        'ZKsync',
        'Linea',
        'Scroll',
        'Mantle',
        'Mode',
        'Fantom'
    ];

/*==================================================================================================================================*/

// Uniswap blockchains supported
const uniswapBlockchains =                                                      // MUST USE THE SAME NAME THAT YOU DEFINE IN blockchainsBase
[
    'Ethereum',
    'Ethereum Goerli',
    'Ethereum Sepolia',
    'Arbitrum',
    'Arbitrum Goerli',
    'Optimism',
    'Optimism Goerli',
    'Polygon',
    'Polygon Mumbai',
    'Base',
    'Binance Smart Chain',
    'Avalanche',
    'Celo',
    'Celo Alfajores',
    'Blast',
    'Zora',
    'ZKsync'
];

/*==================================================================================================================================*/

// Exported modules
module.exports = {
    defaultGasLimitSwap,
    defaultApproveLimit,
    defaultGasLimitTransfer,
    initializeBlockchainsData,
    blockchainsData,
    autoLoadData,
    quoteUrl,
    assembleUrl,
    maxApiTryRequests,
    odosBlockchains,
    uniswapBlockchains,
    initializeFastSwapConfig,
    getFastSwapConfig,
    autoLoadFastSwapData
}