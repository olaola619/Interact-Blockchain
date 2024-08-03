const { ethers, Contract, errors } = require('ethers');
const { AlphaRouter, SwapType } = require('@uniswap/smart-order-router');
const { Token, CurrencyAmount, TradeType } = require('@uniswap/sdk-core');
const { Percent } = require('@uniswap/sdk-core');
const erc20functions = require('./erc20functions');
const inputData = require('./inputData');
const constants = require('./constants');

// Function to define a new token
function readInfoToken(token, chainId) {
    
    // Token
    const tokenInstance = new Token(chainId, token.contract.address, token.decimals, token.symbol, token.name);

    return tokenInstance;
}

async function findBestRouteUniswap(sendingAddress, tokenOut, amountInCurrency, slippage, chainId, provider) {

    try {
        // Alpharouter instance
        const router = new AlphaRouter({ chainId: chainId, provider: provider });
      
        // Best route
        const route = await router.route(
            amountInCurrency,
            tokenOut,
            TradeType.EXACT_INPUT,
            {
              type: SwapType.SWAP_ROUTER_02,
              recipient: sendingAddress,
              slippageTolerance: slippage,
              deadline: Math.floor(Date.now() / 1000) + 60 * 20,  // 20 minutes
            }
        );
      
        if (!route || !route.methodParameters) {
            console.log('No se encontró una ruta para el intercambio.');
        } else {
            /*
            console.log(`La mejor ruta para cambiar ${amountIn.toFixed(tokenIn.decimals)} ${tokenIn.symbol} a ${tokenOut.symbol} es:`);
            route.route[0].tokenPath.forEach((token, index) => {
              console.log(`Paso ${index + 1}: ${token.symbol}`);
            });
        
            console.log(`Monto de salida esperado: ${route.quote.toFixed(tokenOut.decimals)} ${tokenOut.symbol}`);

            const executionPrice = route.trade.executionPrice;
            const priceImpact= route.trade.priceImpact.toSignificant(4);

            console.log(`Price impact: ${priceImpact}%`);
            */
            
            return route;
        }
    } catch(error) {
      console.log(inputData.chalk.red('There were an error finding the best route for the swap'));
      console.log(inputData.chalk.rgb(255, 136, 0)('Uniswap smart router sometimes fails getting the route for some swaps (specially in testnet)'));
      console.log(inputData.chalk.rgb(255, 136, 0)('Also fails to direct wrap or unwrapp. Insted of nativeCoin <--> wrappedNativeCoin try nativeCoin <--> Token\n')); 
      inputData.writeLog(`There were an error finding the best route for the swap ${error}`);
      return null;
    }
}

async function findBestRouteOdos(sendingAddress, tokenInAddress, amountTokenIn, tokenOutAddress, slippage, networkProvider) {
  
  try {
      const quoteRequestBody = {
        chainId: networkProvider.chainId, // ID de la cadena, por ejemplo, 1 para Ethereum Mainnet
        inputTokens: [
          {
            chainId: networkProvider.chainId,
            tokenAddress: tokenInAddress, // Dirección del token de entrada
            amount: amountTokenIn, // Cantidad del token de entrada en precisión entera fija
          }
        ],
        outputTokens: [
          {
            chainId: networkProvider.chainId,
            tokenAddress: tokenOutAddress, // Dirección del token de salida
            proportion: 1
          }
        ],
        userAddr: sendingAddress, // Dirección del usuario
        slippageLimitPercent: slippage, // Límite de slippage en porcentaje
        referralCode: 0, // Código de referencia
        disableRFQs: true,
        compact: true,
      };

      const responseQuote = await fetch(constants.quoteUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quoteRequestBody),
        });

      let quote;
      if (responseQuote.status === 200) {
          quote = await responseQuote.json();
      } else {
          console.log(inputData.chalk.red(`Error in Quote, try increasing the slippage`));
          inputData.writeLog(`Error in Quote, try increasing the slippage`);
      }

      const assembleRequestBody = {
          userAddr: sendingAddress, // Dirección del usuario utilizada para generar la cotización
          pathId: quote.pathId, // El pathId obtenido de la respuesta de la cotización
          simulate: false, // Puedes ponerlo en true si no estás haciendo tu propia estimación de gas
        };

      const responseAssemble = await fetch(constants.assembleUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assembleRequestBody),
      });

      let assembledTransaction;
      if (responseAssemble.status === 200) {
          assembledTransaction = await responseAssemble.json();
          const priceImpact = quote.priceImpact;
          return [assembledTransaction, priceImpact];
      } else {
          inputData.writeLog(`Error in Assemble`);
      }
  } catch(error) {
    console.log(inputData.chalk.red('There were an error finding the best route for the swap'));
    inputData.writeLog(`There were an error finding the best route for the swap ${error}`);
    return [null ,null];
  }
}

module.exports = {
    readInfoToken,
    findBestRouteUniswap,
    findBestRouteOdos
}