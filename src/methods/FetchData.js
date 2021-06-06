import Config from '../utils/config'
import CoreData from './CoreData'
import BigNumber from 'bignumber.js'
import log from '../utils/logger'
import { Multicall } from 'ethereum-multicall'

const ContractCallResult = {}
const callContract = async (web3, connectedAddress, networkType) => {
    const multicall = new Multicall({
        multicallCustomContractAddress: Config.multiCall.network[networkType].address,
        web3Instance: web3
    });
    let marketsArr = getNetworkMarkets(networkType)
    let contractCallContext = []
    let comtrollerCalls = []
    let compoundLensCalls = []
    for (let market of marketsArr) {
        let marketFTokenCallContext = {
            reference: market.symbol + ".fToken",
            contractAddress: market.qToken.network[networkType].address,
            abi: market.qToken.ABI,
            calls: [
                { reference: market.symbol + '.fToken.supplyRatePerBlock', methodName: 'supplyRatePerBlock' },
                { reference: market.symbol + '.fToken.borrowRatePerBlock', methodName: 'borrowRatePerBlock' },
                { reference: market.symbol + '.fToken.getCash', methodName: 'getCash' },
                { reference: market.symbol + '.fToken.totalBorrowsCurrent', methodName: 'totalBorrowsCurrent' },
                { reference: market.symbol + '.fToken.balanceOfUnderlying.' + connectedAddress, methodName: 'balanceOfUnderlying', methodParameters: [connectedAddress] },
                { reference: market.symbol + '.fToken.balanceOf.' + connectedAddress, methodName: 'balanceOf', methodParameters: [connectedAddress] },
                { reference: market.symbol + '.fToken.borrowBalanceCurrent.' + connectedAddress, methodName: 'borrowBalanceCurrent', methodParameters: [connectedAddress] },
                { reference: market.symbol + '.fToken.exchangeRateCurrent', methodName: 'exchangeRateCurrent' },
                { reference: market.symbol + '.fToken.interestRateModel', methodName: 'interestRateModel' },
                { reference: market.symbol + '.fToken.reserveFactorMantissa', methodName: 'reserveFactorMantissa' }

            ]
        }
        if (!CoreData.isNativeToken(market.symbol)) {
            let marketTokenCallContext = {
                reference: market.symbol,
                contractAddress: market.network[networkType].address,
                abi: market.ABI,
                calls: [
                    { reference: market.symbol + '.balanceOf.' + connectedAddress, methodName: 'balanceOf', methodParameters: [connectedAddress] },
                    { reference: market.symbol + '.decimals', methodName: 'decimals' },
                ]
            }
            contractCallContext.push(marketTokenCallContext)

            let erc20CallContext = {
                reference: market.symbol + ".erc20",
                contractAddress: market.network[networkType].address,
                abi: Config.erc20.ABI,
                calls: [
                    { reference: market.symbol + '.erc20.allowance.' + connectedAddress, methodName: 'allowance', methodParameters: [connectedAddress, market.qToken.network[networkType].address] },
                    { reference: market.symbol + '.swaprepay.erc20.allowance.' + connectedAddress, methodName: 'allowance', methodParameters: [connectedAddress, Config.SwapRepayContract] },
                    { reference: market.symbol + '.liquidate.erc20.allowance.' + connectedAddress, methodName: 'allowance', methodParameters: [connectedAddress, Config.LiquidateContract] },
                ]
            }
            contractCallContext.push(erc20CallContext)
        }

        let priceOracleCallContext = {
            reference: market.symbol + ".priceOracle",
            contractAddress: Config.priceOracle.network[networkType].address,
            abi: Config.priceOracle.ABI,
            calls: [
                { reference: market.symbol + '.priceOracle.getUnderlyingPrice', methodName: 'getUnderlyingPrice', methodParameters: [market.qToken.network[networkType].address] },
            ]
        }

        contractCallContext.push(marketFTokenCallContext)
        contractCallContext.push(priceOracleCallContext)

        comtrollerCalls.push({ reference: market.symbol + '.compSpeeds', methodName: 'compSpeeds', methodParameters: [market.qToken.network[networkType].address] })
        comtrollerCalls.push({ reference: 'comptroller.getAssetsIn.' + connectedAddress, methodName: "getAssetsIn", methodParameters: [connectedAddress] })
        comtrollerCalls.push({ reference: market.symbol + '.checkMembership.' + connectedAddress, methodName: "checkMembership", methodParameters: [connectedAddress, market.qToken.network[networkType].address] })
        comtrollerCalls.push({ reference: market.symbol + '.mintGuardianPaused', methodName: "mintGuardianPaused", methodParameters: [market.qToken.network[networkType].address] })

        compoundLensCalls.push({ reference: market.symbol + '.compoundLens.cTokenMetadataExpand', methodName: 'cTokenMetadataExpand', methodParameters: [market.qToken.network[networkType].address] },
        )
    }
    compoundLensCalls.push({ reference: 'compoundLens.getAccountLimitsExpand.' + connectedAddress, methodName: 'getAccountLimitsExpand', methodParameters: [Config.comptroller.network[networkType].address, connectedAddress] },)
    let comtrollerCallContext = {
        reference: "comtroller",
        contractAddress: Config.comptroller.network[networkType].address,
        abi: Config.comptroller.ABI,
        calls: comtrollerCalls
    }
    let compoundLensCallContext = {
        reference: "compoundLens",
        contractAddress: Config.compoundLens.network[networkType].address,
        abi: Config.compoundLens.ABI,
        calls: compoundLensCalls
    }
    contractCallContext.push(comtrollerCallContext)
    contractCallContext.push(compoundLensCallContext)

    const multicallResult = await multicall.call(contractCallContext)
    for (const resultItem in multicallResult.results) {
        let callsReturnArray = multicallResult.results[resultItem].callsReturnContext
        for (let callsReturnItem of callsReturnArray) {
            ContractCallResult[callsReturnItem.reference] = callsReturnItem.returnValues
        }
    }

    await getFildaPriceInternal(web3, networkType)

    log.debug("======= multicallResult =====", multicallResult)
    log.debug("+++++++ ContractCallResult +++++++", ContractCallResult)
}

const getMulticallKey = (market, methodName, connectedAddress) => {
    let marketKey = ""
    if (market) {
        marketKey = market.symbol + "."
    }
    if (connectedAddress) {
        return marketKey + methodName + "." + connectedAddress
    } else {
        return marketKey + methodName
    }
}

const getWalletBalance = async (web3, connectedAddress, networkType, market) => {
    if (CoreData.isNativeToken(market.symbol)) {
        const walletBalance = await web3.eth.getBalance(connectedAddress.toString());
        const walletBalanceFormatted = web3.utils.fromWei(walletBalance.toString(), 'ether')
        const walletBalanceFiat = await getFiatValue(web3, networkType, walletBalanceFormatted, market.symbol)
        return {
            walletBalance: walletBalance,
            walletBalanceFormatted: walletBalanceFormatted,
            walletBalanceFiat: walletBalanceFiat
        }
    }
    else {
        const multicallKey = getMulticallKey(market, "balanceOf", connectedAddress)
        const walletBalance = new BigNumber(ContractCallResult[multicallKey][0].hex).toString()

        const decimals = await getDecimals(web3, networkType, market);
        const walletBalanceFormatted = new BigNumber(walletBalance).shiftedBy(-parseInt(decimals))
        const walletBalanceFiat = await getFiatValue(web3, networkType, walletBalanceFormatted, market.symbol)

        return {
            walletBalance: walletBalance,
            walletBalanceFormatted: walletBalanceFormatted,
            walletBalanceFiat: walletBalanceFiat
        }
    }
}

const getApyRate = async (web3, networkType, market) => {
    const key = `${networkType}|${market.symbol}|getApyRate`
    if (MarketDataCache[key]) {
        return MarketDataCache[key]
    }
    const ethMantissa = 1e18;
    const blocksPerDay = 20 * 60 * 24;
    const daysPerYear = 365;

    const supplyRatePerBlock = new BigNumber(ContractCallResult[getMulticallKey(market, "fToken.supplyRatePerBlock")][0].hex).toString(10)
    const supplyApy = (((Math.pow((supplyRatePerBlock / ethMantissa * blocksPerDay) + 1, daysPerYear - 1))) - 1) * 100;

    const borrowRatePerBlock = new BigNumber(ContractCallResult[getMulticallKey(market, "fToken.borrowRatePerBlock")][0].hex).toString(10)
    const borrowApy = (((Math.pow((borrowRatePerBlock / ethMantissa * blocksPerDay) + 1, daysPerYear - 1))) - 1) * 100;
    const compSpeedPerBlock = new BigNumber(ContractCallResult[getMulticallKey(market, "compSpeeds")][0].hex).toString(10)
    const compSpeedPerDay = compSpeedPerBlock * blocksPerDay
    const fildaPrice = await getFildaPrice(web3, networkType)
    const fildaSpeedAPY = compSpeedPerDay * daysPerYear / ethMantissa
    const fildaSpeedFiatAPY = fildaPrice * fildaSpeedAPY

    const totalBorrowed = await getTotalBorrowed(web3, networkType, market)
    let borrowMintApy = compSpeedPerDay * fildaPrice * daysPerYear / totalBorrowed.totalBorrowedFiat / Math.pow(10, 16)
    const totalSupply = await getTotalSupply(web3, networkType, market)
    let supplyMintApy = compSpeedPerDay * fildaPrice * daysPerYear / totalSupply.totalSupplyFiat / Math.pow(10, 16)

    return {
        savingsAPY: supplyApy,
        loanAPY: borrowApy,
        savingsMintAPY: supplyMintApy,
        loanMintAPY: borrowMintApy,
        fildaSpeedAPY,
        fildaSpeedFiatAPY,
    }
}

const getMarketPercentage = async (web3, networkType, market) => {
    let marketsArr = getNetworkMarkets(networkType)

    const compSpeedPerBlock = new BigNumber(ContractCallResult[getMulticallKey(market, "compSpeeds")][0].hex).toString(10)
    const totalBorrowed = await getTotalBorrowed(web3, networkType, market)

    let totalCompSpeed = new BigNumber(0);
    let totalBorrowedFiat = new BigNumber(0);
    for (let market of marketsArr) {
        totalCompSpeed = totalCompSpeed.plus(ContractCallResult[getMulticallKey(market, "compSpeeds")][0].hex)
        const totalBorrowed = await getTotalBorrowed(web3, networkType, market)
        totalBorrowedFiat = totalBorrowedFiat.plus(totalBorrowed.totalBorrowedFiat)
    }
    const percentageOfTotalBorrowed = new BigNumber(totalBorrowed.totalBorrowedFiat).dividedBy(totalBorrowedFiat).toString(10)
    const percentageOfTotalMining = new BigNumber(compSpeedPerBlock).dividedBy(totalCompSpeed).toString(10)

    return {
        percentageOfTotalBorrowed,
        percentageOfTotalMining
    }
}

const getFildaPriceInternal = async (web3, networkType) => {
    let reserves = ContractCallResult["uniswap.getReserves"]
    if (!reserves) {
        const uniswapContractABI = Config.uniswapPair.ABI
        const uniswapContractAddress = Config.uniswapPair.network[networkType].address
        const uniswapContract = new web3.eth.Contract(uniswapContractABI, uniswapContractAddress)
        reserves = await uniswapContract.methods.getReserves().call()
        ContractCallResult["uniswap.getReserves"] = reserves
    }
    return reserves
}

const getFildaPrice = async (web3, networkType) => {
    if (!Config.uniswapPair.network[networkType]) {
        return 0
    }
    const reserves = await getFildaPriceInternal(web3, networkType)
    const husdReserve = reserves.reserve0
    const fildaReserve = reserves.reserve1
    return husdReserve * Math.pow(10, 10) / fildaReserve
}

const getDogPrice = async (web3, fildaPrice) => {
    const uniswapContractABI = Config.mdex.hecoPoolPair
    const uniswapContractAddress = "0xBd0d0482B6a6c1783857fb6B9Db02932A100Ee10"
    const uniswapContract = new web3.eth.Contract(uniswapContractABI, uniswapContractAddress)
    const reserves = await uniswapContract.methods.getReserves().call()
    const dogReserve = reserves._reserve0
    const fildaReserve = reserves._reserve1
    return new BigNumber(fildaReserve).multipliedBy(fildaPrice).dividedBy(dogReserve)
}

const getLiquidityBalance = async (web3, networkType, market) => {
    const key = `${networkType}|${market.symbol}|getLiquidityBalance`
    if (MarketDataCache[key]) {
        return MarketDataCache[key]
    }
    const price = await getPrice(web3, networkType, market);
    const liquidity = new BigNumber(ContractCallResult[getMulticallKey(market, "fToken.getCash")][0].hex).toString(10)
    if (CoreData.isNativeToken(market.symbol)) {
        const liquidityFormatted = web3.utils.fromWei(liquidity.toString(), 'ether');
        const liquidityFiat = liquidityFormatted * price
        return {
            liquidity: liquidity,
            liquidityFormatted: liquidityFormatted,
            liquidityFiat: liquidityFiat
        }
    }
    else {
        const decimals = await getDecimals(web3, networkType, market);
        const liquidityFormatted = (liquidity / Math.pow(10, parseInt(decimals)))
        const liquidityFiat = liquidityFormatted * price
        return {
            liquidity: liquidity,
            liquidityFormatted: liquidityFormatted,
            liquidityFiat: liquidityFiat
        }
    }
}

const getPriceInUSD = async (web3, networkType, market) => {
    var usdtMarket = Config.markets['HUSD']

    const contractAddress = Config.priceOracle.network[networkType].address

    const marketPriceInETH = new BigNumber(ContractCallResult[getMulticallKey(market, "priceOracle.getUnderlyingPrice")][0].hex).toString(10)
    var marketDecimals = 18
    if (market.ABI) {
        marketDecimals = await getDecimals(web3, networkType, market);
    }

    const usdtPriceInETH = new BigNumber(ContractCallResult[getMulticallKey(usdtMarket, "priceOracle.getUnderlyingPrice")][0].hex).toString(10)

    const priceInUsdt = parseFloat(marketPriceInETH / Math.pow(10, 8)) / parseFloat(web3.utils.fromWei(usdtPriceInETH)) / Math.pow(10, parseInt(18 - marketDecimals))
    log.info(`${market.symbol} priceInUsdt: ${priceInUsdt} from ${contractAddress}`)
    return priceInUsdt
}
const MarketDataCache = {}
const clearMarketDataCache = () => {
    for (let key in MarketDataCache) {
        delete MarketDataCache[key];
    }
}
const cacheAllMarketData = async (web3, networkType, connectedAddress, marketsArr) => {
    const promises = [];
    for (let market of marketsArr) {
        promises.push(getPrice(web3, networkType, market).then(response => {
            MarketDataCache[`${networkType}|${market.symbol}|getPrice`] = response;
        }))
        if (!CoreData.isNativeToken(market.symbol)) {
            promises.push(getDecimals(web3, networkType, market).then(response => {
                MarketDataCache[`${networkType}|${market.symbol}|getDecimals`] = response;
            }))
        }
        promises.push(getReserveFactor(web3, networkType, market).then(response => {
            MarketDataCache[`${networkType}|${market.symbol}|getReserveFactor`] = response;
        }))
        promises.push(getLoanBalance(web3, connectedAddress, networkType, market).then(response => {
            MarketDataCache[`${networkType}|${market.symbol}|getLoanBalance`] = response;
        }))
        promises.push(getSavingsBalance(web3, connectedAddress, networkType, market).then(response => {
            MarketDataCache[`${networkType}|${market.symbol}|getSavingsBalance`] = response;
        }))
        promises.push(getLiquidityBalance(web3, networkType, market).then(response => {
            MarketDataCache[`${networkType}|${market.symbol}|getLiquidityBalance`] = response;
        }))
        promises.push(getTotalBorrowed(web3, networkType, market).then(response => {
            MarketDataCache[`${networkType}|${market.symbol}|getTotalBorrowed`] = response;
        }))
        promises.push(getExchangeRate(web3, networkType, market).then(response => {
            MarketDataCache[`${networkType}|${market.symbol}|getExchangeRate`] = response;
        }))
        promises.push(getApyRate(web3, networkType, market).then(response => {
            MarketDataCache[`${networkType}|${market.symbol}|getApyRate`] = response;
        }))
    }
    await Promise.all(promises);
}

const getPrice = async (web3, networkType, market) => {
    const key = `${networkType}|${market.symbol}|getPrice`
    if (MarketDataCache[key]) {
        return MarketDataCache[key]
    }

    const priceInUSD = await getPriceInUSD(web3, networkType, market)
    return priceInUSD
}
const getDecimals = async (web3, networkType, market) => {
    const key = `${networkType}|${market.symbol}|getDecimals`
    if (MarketDataCache[key]) {
        return MarketDataCache[key]
    }
    if (CoreData.isNativeToken(market.symbol)) {
        return 18;
    }
    const decimals = new BigNumber(ContractCallResult[getMulticallKey(market, "decimals")][0]).toString(10)
    return decimals;
}
const getReserveFactor = async (web3, networkType, market) => {
    const key = `${networkType}|${market.symbol}|getReserveFactor`
    if (MarketDataCache[key]) {
        return MarketDataCache[key]
    }
    const reserveFactorMantissa = new BigNumber(ContractCallResult[getMulticallKey(market, "fToken.reserveFactorMantissa")][0].hex).toString(10)
    return reserveFactorMantissa / 1e18;
}

const getSavingsBalance = async (web3, connectedAddress, networkType, market) => {
    const key = `${networkType}|${market.symbol}|getSavingsBalance`
    if (MarketDataCache[key]) {
        return MarketDataCache[key]
    }

    const price = await getPrice(web3, networkType, market);

    const savingsBalance = new BigNumber(ContractCallResult[getMulticallKey(market, "fToken.balanceOfUnderlying", connectedAddress)][0].hex).toString(10)
    const savingsCTokenBalance = new BigNumber(ContractCallResult[getMulticallKey(market, "fToken.balanceOf", connectedAddress)][0].hex).toString(10)

    if (CoreData.isNativeToken(market.symbol)) {
        const savingsBalanceFormatted = web3.utils.fromWei(savingsBalance.toString(), 'ether');
        const savingsBalanceFiat = savingsBalanceFormatted * price
        return {
            savingsBalance: savingsBalance,
            savingsBalanceFormatted: savingsBalanceFormatted,
            savingsBalanceFiat: savingsBalanceFiat,
            savingsCTokenBalance: savingsCTokenBalance
        }
    }
    else {
        const decimals = await getDecimals(web3, networkType, market);
        const savingsBalanceFormatted = (savingsBalance / Math.pow(10, parseInt(decimals)))
        const savingsBalanceFiat = savingsBalanceFormatted * price
        return {
            savingsBalance: savingsBalance,
            savingsBalanceFormatted: savingsBalanceFormatted,
            savingsBalanceFiat: savingsBalanceFiat,
            savingsCTokenBalance: savingsCTokenBalance
        }
    }
}

const getInterestRateModelInternal = async (web3, networkType, marketsArr) => {
    const multicall = new Multicall({
        multicallCustomContractAddress: Config.multiCall.network[networkType].address,
        web3Instance: web3
    });
    let contractCallContext = []
    for (let market of marketsArr) {
        const interestRateModelAddress = ContractCallResult[market.symbol + '.fToken.interestRateModel']
        let interestRateModelContractCallContext = {
            reference: market.symbol + ".fToken.interestRateModel",
            contractAddress: interestRateModelAddress[0],
            abi: Config.interestRateModel.ABI,
            calls: [
                { reference: market.symbol + '.fToken.interestRateModel.blocksPerYear', methodName: 'blocksPerYear' },
                { reference: market.symbol + '.fToken.interestRateModel.baseRatePerBlock', methodName: 'baseRatePerBlock' },
                { reference: market.symbol + '.fToken.interestRateModel.multiplierPerBlock', methodName: 'multiplierPerBlock' },
                { reference: market.symbol + '.fToken.interestRateModel.jumpMultiplierPerBlock', methodName: 'jumpMultiplierPerBlock' },
                { reference: market.symbol + '.fToken.interestRateModel.kink', methodName: 'kink' },

            ]
        }
        contractCallContext.push(interestRateModelContractCallContext)
    }

    const multicallResult = await multicall.call(contractCallContext)
    for (const resultItem in multicallResult.results) {
        let callsReturnArray = multicallResult.results[resultItem].callsReturnContext
        for (let callsReturnItem of callsReturnArray) {
            ContractCallResult[callsReturnItem.reference] = callsReturnItem.returnValues
        }
    }
}

const getInterestRateModel = async (web3, networkType, market) => {
    const key = `${networkType}|${market.symbol}|getInterestRateModel`
    if (MarketDataCache[key]) {
        return MarketDataCache[key]
    }

    await getInterestRateModelInternal(web3, networkType, [market])

    const blocksPerYear = new BigNumber(ContractCallResult[getMulticallKey(market, "fToken.interestRateModel.blocksPerYear")][0].hex).toString(10)
    const baseRatePerBlock = new BigNumber(ContractCallResult[getMulticallKey(market, "fToken.interestRateModel.baseRatePerBlock")][0].hex).toString(10)
    const jumpMultiplierPerBlock = new BigNumber(ContractCallResult[getMulticallKey(market, "fToken.interestRateModel.jumpMultiplierPerBlock")][0].hex).toString(10)
    const multiplierPerBlock = new BigNumber(ContractCallResult[getMulticallKey(market, "fToken.interestRateModel.multiplierPerBlock")][0].hex).toString(10)
    const kink = new BigNumber(ContractCallResult[getMulticallKey(market, "fToken.interestRateModel.kink")][0].hex).toString(10)

    const response = {
        blocksPerYear: blocksPerYear,
        baseRatePerBlock: baseRatePerBlock,
        jumpMultiplierPerBlock: jumpMultiplierPerBlock,
        multiplierPerBlock: multiplierPerBlock,
        kink: kink,
    }
    MarketDataCache[`${networkType}|${market.symbol}|getInterestRateModel`] = response
    return response
}

const getTotalSavingsBalance = async (web3, connectedAddress, networkType, marketsArr) => {
    let totalFiatBalance = 0;
    await Promise.all(marketsArr.map(async (market) => {
        const marketSavingsBalance = await getSavingsBalance(web3, connectedAddress, networkType, market);
        const marketPrice = await getPrice(web3, networkType, market);
        const marektFiatBalance = marketSavingsBalance.savingsBalanceFormatted * marketPrice;
        totalFiatBalance = totalFiatBalance + marektFiatBalance;
    }));
    return totalFiatBalance;
}

const getFiatValue = async (web3, networkType, tokenValue, tokenSymbol) => {
    var market = Config.markets[tokenSymbol]
    if (tokenSymbol == 'ETH' && market.qToken.network[networkType] == undefined) {
        market = Config.markets["ELA"];
        if (market.qToken.network[networkType] == undefined) {
            market = Config.markets["HT"];
        }
    }
    if (tokenSymbol == 'ELA' && market.qToken.network[networkType] == undefined) {
        market = Config.markets["ETH"];
        if (market.qToken.network[networkType] == undefined) {
            market = Config.markets["HT"];
        }
    }
    const tokenPrice = await getPrice(web3, networkType, market);
    return tokenValue * tokenPrice;
}

const getAccountAllowance = async (web3, connectedAddress, networkType, market) => {
    if (!CoreData.isNativeToken(market.symbol)) {
        const [allowance, decimals] = await Promise.all([
            new BigNumber(ContractCallResult[getMulticallKey(market, "erc20.allowance", connectedAddress)][0].hex).toString(10),
            getDecimals(web3, networkType, market)
        ])
        const allowanceFormatted = (allowance / Math.pow(10, parseInt(decimals)))
        return { allowance: Number(allowance), allowanceFormatted }
    }
}

const getSwapRepayAllowance = async (web3, connectedAddress, networkType, market) => {
    if (!CoreData.isNativeToken(market.symbol)) {
        const [allowance, decimals] = await Promise.all([
            new BigNumber(ContractCallResult[getMulticallKey(market, "swaprepay.erc20.allowance", connectedAddress)][0].hex).toString(10),
            getDecimals(web3, networkType, market)
        ])
        const allowanceFormatted = (allowance / Math.pow(10, parseInt(decimals)))
        return { allowance: Number(allowance), allowanceFormatted }
    }
}

const getLiquidateAllowance = async (web3, connectedAddress, networkType, market) => {
    if (!CoreData.isNativeToken(market.symbol)) {
        const [allowance, decimals] = await Promise.all([
            new BigNumber(ContractCallResult[getMulticallKey(market, "liquidate.erc20.allowance", connectedAddress)][0].hex).toString(10),
            getDecimals(web3, networkType, market)
        ])
        const allowanceFormatted = (allowance / Math.pow(10, parseInt(decimals)))
        return { allowance: Number(allowance), allowanceFormatted }
    }
}

const getAccountLiquidity = async (web3, connectedAddress, networkType) => {
    const liquidity = new BigNumber(ContractCallResult[getMulticallKey(null, "compoundLens.getAccountLimitsExpand", connectedAddress)][0].hex).toString(10)
    const liquidityInFiat = await getFiatValue(web3, networkType, web3.utils.fromWei(liquidity).toString(), 'ETH')

    return {
        "inETH": web3.utils.fromWei(liquidity).toString(),
        "inFiat": liquidityInFiat
    }

}

const getCollateralStatus = async (web3, connectedAddress, networkType, market) => {
    const marketAddress = market.qToken.network[networkType].address

    let activeCollaterals = ContractCallResult[getMulticallKey(null, "comptroller.getAssetsIn", connectedAddress)]

    let status = false
    await Promise.all(activeCollaterals.map(collateral => {
        if (collateral.toLowerCase() === marketAddress.toLowerCase()) {
            status = true
        }
    }))
    return status
}


const getLoanBalance = async (web3, connectedAddress, networkType, market) => {
    const key = `${networkType}|${market.symbol}|getLoanBalance`
    if (MarketDataCache[key]) {
        return MarketDataCache[key]
    }
    const price = await getPrice(web3, networkType, market);

    const loanBalance = new BigNumber(ContractCallResult[getMulticallKey(market, "fToken.borrowBalanceCurrent", connectedAddress)][0].hex).toString(10)
    if (CoreData.isNativeToken(market.symbol)) {
        const loanBalanceFormatted = web3.utils.fromWei(loanBalance.toString(), 'ether');
        const loanBalanceFiat = loanBalanceFormatted * price
        return {
            loanBalance: loanBalance,
            loanBalanceFormatted: loanBalanceFormatted,
            loanBalanceFiat: loanBalanceFiat
        }
    }
    else {
        const decimals = await getDecimals(web3, networkType, market);
        const loanBalanceFormatted = (loanBalance / Math.pow(10, parseInt(decimals)))
        const loanBalanceFiat = loanBalanceFormatted * price
        return {
            loanBalance: loanBalance,
            loanBalanceFormatted: loanBalanceFormatted,
            loanBalanceFiat: loanBalanceFiat
        }
    }
}

const getTotalLoanBalance = async (web3, connectedAddress, networkType, marketsArr) => {
    let totalBalanceInFiat = 0;
    await Promise.all(marketsArr.map(async (market) => {
        const marketBalance = await getLoanBalance(web3, connectedAddress, networkType, market);
        const marketPrice = await getPrice(web3, networkType, market);
        const marektBalanceInFiat = marketBalance.loanBalanceFormatted * marketPrice;
        totalBalanceInFiat = totalBalanceInFiat + marektBalanceInFiat;
    }));
    return totalBalanceInFiat;
}

const getTotalSavingsAPY = async (web3, connectedAddress, networkType, marketsArr) => {
    let totalSavingsBalanceFiat = 0
    let totalSavingsInterest = 0
    await Promise.all(marketsArr.map(async (market) => {
        const savingsBalance = await getSavingsBalance(web3, connectedAddress, networkType, market)
        const apy = await getApyRate(web3, networkType, market)
        if (savingsBalance.savingsBalance > 0) {
            totalSavingsBalanceFiat = totalSavingsBalanceFiat + savingsBalance.savingsBalanceFiat
            totalSavingsInterest = totalSavingsInterest + savingsBalance.savingsBalanceFiat * apy.savingsAPY / 100
        }
    }))
    return (totalSavingsInterest / totalSavingsBalanceFiat) * 100
}

const getTotalLoanAPY = async (web3, connectedAddress, networkType, marketsArr) => {
    let totalLoanBalanceFiat = 0
    let totalLoanInterest = 0
    await Promise.all(marketsArr.map(async (market) => {
        const loanBalance = await getLoanBalance(web3, connectedAddress, networkType, market)
        const apy = await getApyRate(web3, networkType, market)
        if (loanBalance.loanBalance > 0) {
            totalLoanBalanceFiat = totalLoanBalanceFiat + loanBalance.loanBalanceFiat
            totalLoanInterest = totalLoanInterest + loanBalance.loanBalanceFiat * apy.loanAPY / 100
        }
    }))
    return (totalLoanInterest / totalLoanBalanceFiat) * 100
}

const getNetAPY = async (web3, connectedAddress, networkType, marketsArr) => {
    let totalBalance = 0
    let totalInterest = 0
    await Promise.all(marketsArr.map(async (market) => {
        const loanBalance = await getLoanBalance(web3, connectedAddress, networkType, market)
        const savingsBalance = await getSavingsBalance(web3, connectedAddress, networkType, market)
        const apy = await getApyRate(web3, networkType, market)
        if (loanBalance.loanBalance > 0 || savingsBalance.savingsBalance > 0) {
            totalBalance = totalBalance + savingsBalance.savingsBalanceFiat - loanBalance.loanBalanceFiat
            totalInterest = totalInterest + savingsBalance.savingsBalanceFiat * apy.savingsAPY / 100 - loanBalance.loanBalanceFiat * apy.loanAPY / 100
        }
    }))
    return (totalInterest / totalBalance) * 100
}

const getNetworkMarkets = (networkType) => {
    let marketsArr = Object.values(Config.markets)
    return !networkType ? [marketsArr] : marketsArr.filter(market => !!market.qToken.network[networkType])
}

const getCurrencyFormatted = (num, decimals) => {
    num = parseFloat(num)
    let si = [
        { value: 1, symbol: "" },
        { value: 1E3, symbol: " K" },
        { value: 1E6, symbol: " M" }
    ];
    var rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var i;
    for (i = si.length - 1; i > 0; i--) {
        if (num >= si[i].value) {
            break;
        }
    }
    return "$" + (num / si[i].value).toFixed(decimals == undefined ? 2 : decimals).replace(rx, "$1") + si[i].symbol;
}

const getBorrowLimit = async (web3, networkType, market) => {
    const collateralFactorMantissa = new BigNumber(ContractCallResult[getMulticallKey(market, "compoundLens.cTokenMetadataExpand")][0].hex).toString(10)
    const collateralFactor = collateralFactorMantissa / 1e18

    const price = await getPrice(web3, networkType, market);
    let borrowLimit = 0
    if (market.savingsBalance) {
        borrowLimit = market.collateralStatus ? collateralFactor * market.savingsBalance : 0
    }
    borrowLimit = toFixed(borrowLimit)
    if (CoreData.isNativeToken(market.symbol)) {
        const borrowLimitFormatted = CoreData.fromWei(web3, borrowLimit.toString(), 'ether');
        const borrowLimitFiat = borrowLimitFormatted * price

        return {
            borrowLimit: borrowLimit,
            borrowLimitFormatted: borrowLimitFormatted,
            borrowLimitFiat: borrowLimitFiat,
            collateralFactor: collateralFactor
        }
    }
    else {
        const decimals = await getDecimals(web3, networkType, market);
        const borrowLimitFormatted = (borrowLimit / Math.pow(10, parseInt(decimals)))
        const borrowLimitFiat = borrowLimitFormatted * price

        return {
            borrowLimit: borrowLimit,
            borrowLimitFormatted: borrowLimitFormatted,
            borrowLimitFiat: borrowLimitFiat,
            collateralFactor: collateralFactor
        }
    }
}

const getTotalBorrowLimit = async (marketsArr) => {
    let totalBorrowLimitFiat = 0
    await Promise.all(marketsArr.map(async (market) => {
        totalBorrowLimitFiat = totalBorrowLimitFiat + market.borrowLimitFiat
    }))
    //NEED TO VERIFY CALCULATION
    return totalBorrowLimitFiat
}

const getTotalMarketCap = async (marketsArr) => {
    let totalSupplyFiat = 0
    await Promise.all(marketsArr.map(async (market) => {
        totalSupplyFiat = totalSupplyFiat + market.totalSupplyFiat
    }))
    //NEED TO VERIFY CALCULATION
    return totalSupplyFiat
}

const getTotalBizSize = async (marketsArr) => {
    let totalBorrowedFiat = 0
    await Promise.all(marketsArr.map(async (market) => {
        totalBorrowedFiat = totalBorrowedFiat + market.totalBorrowedFiat
    }))
    let totalMktSize = await getTotalMarketCap(marketsArr)
    let totalBizSize = totalMktSize + totalBorrowedFiat
    return totalBizSize
}

const checkMembership = async (web3, connectedAddress, networkType, market) => {
    const isAssetMember = ContractCallResult[getMulticallKey(market, "checkMembership", connectedAddress)][0]
    return isAssetMember
}

const checkMintPaused = async (web3, networkType, market) => {
    let isMintPaused = ContractCallResult[getMulticallKey(market, "mintGuardianPaused")][0]
    return isMintPaused
}

const getTotalBorrowed = async (web3, networkType, market) => {
    const key = `${networkType}|${market.symbol}|getTotalBorrowed`
    if (MarketDataCache[key]) {
        return MarketDataCache[key]
    }

    const price = await getPrice(web3, networkType, market);
    const totalBorrowed = new BigNumber(ContractCallResult[getMulticallKey(market, "fToken.totalBorrowsCurrent")][0].hex).toString(10)
    if (CoreData.isNativeToken(market.symbol)) {
        const totalBorrowedFormatted = web3.utils.fromWei(totalBorrowed.toString(), 'ether');
        const totalBorrowedFiat = totalBorrowedFormatted * price
        return {
            totalBorrowed: totalBorrowed,
            totalBorrowedFormatted: totalBorrowedFormatted,
            totalBorrowedFiat: totalBorrowedFiat
        }
    }
    else {
        const decimals = await getDecimals(web3, networkType, market);
        const totalBorrowedFormatted = (totalBorrowed / Math.pow(10, parseInt(decimals)))
        const totalBorrowedFiat = totalBorrowedFormatted * price
        return {
            totalBorrowed: totalBorrowed,
            totalBorrowedFormatted: totalBorrowedFormatted,
            totalBorrowedFiat: totalBorrowedFiat
        }
    }
}

const getTotalSupply = async (web3, networkType, market) => {
    if (market.totalBorrowed && market.liquidity) {
        return {
            totalSupply: (parseFloat(market.totalBorrowed) + parseFloat(market.liquidity)) + "",
            totalSupplyFiat: market.totalBorrowedFiat + market.liquidityFiat,
            totalSupplyFormatted: (parseFloat(market.totalBorrowedFormatted) + parseFloat(market.liquidityFormatted)) + "",
            utilRate: (parseFloat(market.totalBorrowed) / (parseFloat(market.totalBorrowed) + parseFloat(market.liquidity))) * 100
        }
    }
    else {
        const totalBorrowedInfo = await getTotalBorrowed(web3, networkType, market);
        const liquidityInfo = await getLiquidityBalance(web3, networkType, market);
        return {
            totalSupply:
                parseFloat(totalBorrowedInfo.totalBorrowed) +
                parseFloat(liquidityInfo.liquidity) +
                '',
            totalSupplyFiat:
                totalBorrowedInfo.totalBorrowedFiat +
                liquidityInfo.liquidityFiat,
            totalSupplyFormatted:
                parseFloat(totalBorrowedInfo.totalBorrowedFormatted) +
                parseFloat(liquidityInfo.liquidityFormatted) +
                '',
            utilRate:
                (parseFloat(totalBorrowedInfo.totalBorrowed) * 100) /
                (parseFloat(totalBorrowedInfo.totalBorrowed) +
                    parseFloat(liquidityInfo.liquidity)),
        }
    }
}

const getExchangeRate = async (web3, networkType, market) => {
    const key = `${networkType}|${market.symbol}|getExchangeRate`
    if (MarketDataCache[key]) {
        return MarketDataCache[key]
    }

    const exchangeRateCurrent = new BigNumber(ContractCallResult[getMulticallKey(market, "fToken.exchangeRateCurrent")][0].hex).toString(10)

    let decimals = 18
    if (!CoreData.isNativeToken(market.symbol)) {
        decimals = await getDecimals(web3, networkType, market);
    }
    const oneFTokenInUnderlying = exchangeRateCurrent / Math.pow(10, decimals);
    const exchangeRateFormatted = 1 / oneFTokenInUnderlying
    return {
        exchangeRateFormatted: exchangeRateFormatted
    }
}

function toFixed(x) {
    if (Math.abs(x) < 1.0) {
        var e = parseInt(x.toString().split('e-')[1]);
        if (e) {
            x *= Math.pow(10, e - 1);
            x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
        }
    } else {
        var e = parseInt(x.toString().split('+')[1]);
        if (e > 20) {
            e -= 20;
            x /= Math.pow(10, e);
            x += (new Array(e + 1)).join('0');
        }
    }
    return x;
}

export default {
    clearMarketDataCache: clearMarketDataCache,
    cacheAllMarketData: cacheAllMarketData,
    getWalletBalance: getWalletBalance,
    getApyRate: getApyRate,
    getDecimals: getDecimals,
    getLiquidityBalance: getLiquidityBalance,
    getPrice: getPrice,
    getSavingsBalance: getSavingsBalance,
    getTotalSavingsBalance: getTotalSavingsBalance,
    getFiatValue: getFiatValue,
    getAccountLiquidity: getAccountLiquidity,
    getCollateralStatus: getCollateralStatus,
    getLoanBalance: getLoanBalance,
    getTotalLoanBalance: getTotalLoanBalance,
    getTotalSavingsAPY: getTotalSavingsAPY,
    getTotalLoanAPY: getTotalLoanAPY,
    getNetAPY: getNetAPY,
    getNetworkMarkets: getNetworkMarkets,
    getCurrencyFormatted: getCurrencyFormatted,
    getBorrowLimit: getBorrowLimit,
    getTotalBorrowLimit: getTotalBorrowLimit,
    checkMembership: checkMembership,
    getTotalBorrowed: getTotalBorrowed,
    getTotalSupply: getTotalSupply,
    getTotalBizSize: getTotalBizSize,
    getFildaPrice: getFildaPrice,
    getDogPrice: getDogPrice,
    checkMintPaused: checkMintPaused,
    getAccountAllowance,
    getSwapRepayAllowance,
    getLiquidateAllowance,
    getExchangeRate,
    getInterestRateModel,
    getReserveFactor,
    getMarketPercentage,
    callContract
}
