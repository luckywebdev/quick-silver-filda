import React, { useCallback, useContext, useEffect, useState } from 'react'
import Dashboard from './components/Dashboard'
import Accounts from './components/Accounts'
import Markets from './components/Markets'
import './Home.scss'
import FetchData from './methods/FetchData'
import GovernanceData from './methods/GovernanceData'
import Pending from './components/Pending'
import log from './utils/logger'
import { WalletAddressContext, NetworkTypeContext, Web3Context, ReadonlyWeb3Context } from './context'
import { Modal } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { promiseWithTimeout } from './utils/promise'
import CoreData from './methods/CoreData'

async function loadAllMarketData(web3, networkType, connectedAddress, marketsArr) {
    const startTime = new Date().getTime()
    log.info(`load all market data|start`)
    log.info(`muticall|start`)
    await FetchData.callContract(web3, connectedAddress, networkType)
    log.info(`muticall|end|${(new Date().getTime() - startTime) / 1000}秒`)
    FetchData.clearMarketDataCache()
    await FetchData.cacheAllMarketData(web3, networkType, connectedAddress, marketsArr)
    const promises = []
    for (let market of marketsArr) {
        promises.push(loadMarketData(web3, networkType, connectedAddress, market))
    }
    const dataTree = await Promise.all(promises)
    await Promise.all([
        FetchData.getTotalSavingsBalance(web3, connectedAddress, networkType, marketsArr)
          .then(async (response) => {
            dataTree.totalSavingsBalance = response
          }),
        FetchData.getTotalBorrowLimit(marketsArr)
          .then(response => {
            dataTree.totalBorrowLimitFiat = response
          }),
        FetchData.getTotalBizSize(marketsArr)
          .then(response => {
            dataTree.totalBizSize = response.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')
          }),
        FetchData.getTotalLoanBalance(web3, connectedAddress, networkType, marketsArr)
          .then(response => {
            dataTree.totalLoanBalance = response
          }),
        FetchData.getTotalSavingsAPY(web3, connectedAddress, networkType, marketsArr)
          .then(response => {
            dataTree.totalSavingsAPY = response
          }),
        FetchData.getTotalLoanAPY(web3, connectedAddress, networkType, marketsArr)
          .then(response => {
            dataTree.totalLoanAPY = response
          }),
        FetchData.getAccountLiquidity(web3, connectedAddress, networkType)
          .then(response => {
            dataTree.accountLiquidity = response.inETH
            dataTree.accountLiquidityInFiat = response.inFiat
          }),
        GovernanceData.getCompBalanceWithAccrued(web3, connectedAddress, networkType)
          .then(response => {
            dataTree.compBalance = response.balance
            dataTree.compSymbol = response.symbol
            dataTree.compAccrued = response.accrued
          })
    ]);

    const endTime = new Date().getTime()
    log.info(`load all market data|end|${(endTime - startTime) / 1000}秒`)
    return dataTree
}

async function loadMarketData(web3, networkType, connectedAddress, market) {
    const startTime = new Date().getTime()
    log.info(`${market.name}|start`)
    await Promise.all([
        FetchData.getApyRate(web3, networkType, market)
          .then(response => {
            market.savingsAPY = response.savingsAPY
            market.loanAPY = response.loanAPY
            market.savingsMintAPY = response.savingsMintAPY
            market.loanMintAPY = response.loanMintAPY
          }),
        FetchData.getWalletBalance(web3, connectedAddress, networkType, market)
          .then(response => {
            market.walletBalance = response.walletBalance
            market.walletBalanceFormatted = response.walletBalanceFormatted
            market.walletBalanceFiat = response.walletBalanceFiat
          }),
        FetchData.getLiquidityBalance(web3, networkType, market)
          .then(response => {
            market.liquidity = response.liquidity
            market.liquidityFormatted = response.liquidityFormatted
            market.liquidityFiat = response.liquidityFiat
          }),
        FetchData.getTotalBorrowed(web3, networkType, market)
          .then(response => {
            market.totalBorrowed = response.totalBorrowed
            market.totalBorrowedFormatted = response.totalBorrowedFormatted
            market.totalBorrowedFiat = response.totalBorrowedFiat
          }),
        FetchData.getTotalSupply(web3, networkType, market)
          .then(response => {
            market.totalSupply = response.totalSupply
            market.totalSupplyFormatted = response.totalSupplyFormatted
            market.totalSupplyFiat = response.totalSupplyFiat
            market.utilRate = response.utilRate
          }),
        FetchData.getSavingsBalance(web3, connectedAddress, networkType, market)
          .then(response => {
            market.savingsBalance = response.savingsBalance
            market.savingsBalanceFormatted = response.savingsBalanceFormatted
            market.savingsBalanceFiat = response.savingsBalanceFiat
            market.savingsCTokenBalance = response.savingsCTokenBalance
          }),
        FetchData.getLoanBalance(web3, connectedAddress, networkType, market)
          .then(response => {
            market.loanBalance = response.loanBalance
            market.loanBalanceFormatted = response.loanBalanceFormatted
            market.loanBalanceFiat = response.loanBalanceFiat
          }),
        FetchData.checkMembership(web3, connectedAddress, networkType, market)
          .then(response => {
            market.isAssetMember = response
          }),
        FetchData.checkMintPaused(web3, networkType, market).then(response => {
          market.isMintPaused = response
        }),
        FetchData.getPrice(web3, networkType, market).then(response => {
          market.price = response
        }),
        FetchData.getAccountAllowance(web3, connectedAddress, networkType, market).then(response => {
            if(CoreData.isNativeToken(market.symbol)) {
                market.approved = true
            } else {
                market.approved = response.allowance !== 0
            }
        }),
        FetchData.getSwapRepayAllowance(web3, connectedAddress, networkType, market).then(response => {
          if(CoreData.isNativeToken(market.symbol)) {
            market.swapRepayApproved = true
          } else {
            market.swapRepayApproved = response.allowance !== 0
          }
        }),
        FetchData.getCollateralStatus(web3, connectedAddress, networkType, market).then(response => {
          market.collateralStatus = response
        })
    ])
    await FetchData.getBorrowLimit(web3, networkType, market)
        .then(response => {
            market.borrowLimit = response.borrowLimit
            market.borrowLimitFormatted = response.borrowLimitFormatted
            market.borrowLimitFiat = response.borrowLimitFiat
            market.collateralFactor = response.collateralFactor
        })
    const endTime = new Date().getTime()
    log.info(`${market.name}|end|${(endTime - startTime) / 1000}秒`)
    return market
}

function Home() {
    const { connectedAddress } = useContext(WalletAddressContext)
    const { networkType } = useContext(NetworkTypeContext)
    const { web3 } = useContext(Web3Context)
    const { readonlyWeb3 } = useContext(ReadonlyWeb3Context)

    let marketsArr = FetchData.getNetworkMarkets(networkType)
    const [data, setData] = useState(marketsArr)
    const [showLoadAlertModal, setShowLoadAlertModal] = useState(false)
    const { t } = useTranslation()

    //Lets update the state from top
    //Data that needs to be fetched on timer
    //List of markets
    //For each market - SavingsAPY, BorrowAPY, Liquidity, Allowance (ifERC20), SavingsBalance, FiatSavingsBalance, WalletBalance
    //Now lets build an object here with these data along with the necessary data from Config.js and pass through the components
    const handleClose = () => {
        setShowLoadAlertModal(false)
    }

    useEffect(() => {
        let timer = null
        let isUnMounted = false
        async function initialLoad() {
            let fetching = false
            async function loadData() {
              //console.log("1",connectedAddress, "networkType=", networkType, readonlyWeb3);
                if (!fetching && connectedAddress && networkType && networkType !== "unsupported" && readonlyWeb3 && marketsArr) {
                    try {
                        fetching = true
                        const dataTree = await loadAllMarketData(readonlyWeb3, networkType, connectedAddress, marketsArr)
                        dataTree.loading = false

                        if (!isUnMounted) {
                            setData(data => dataTree)
                        }
                    } catch (e) {
                        log.error('Error to load markets data:', e)
                    } finally {
                        fetching = false
                    }
                }
            }

            try {
                const { promiseOrTimeout, timeoutId } = promiseWithTimeout(loadData())
                await promiseOrTimeout.then(() => {
                    timer = setInterval(loadData, 5000)
                }).finally(() => {
                    clearTimeout(timeoutId)
                })
            } catch (e) {
                setShowLoadAlertModal(true)
                isUnMounted = true
                clearInterval(timer)
            }
        }

        initialLoad()

        return () => {
            isUnMounted = true
            setData(data => marketsArr)
            clearInterval(timer)
        }
    }, [connectedAddress, networkType])

    return (
        <div className="App">
            <Dashboard data={data} />
            <div className="App-Content">
                <Accounts data={data} />
                <Pending data={data} />
                <Markets data={data} />
            </div>

            <Modal
                onHide={handleClose}
                show={showLoadAlertModal}
                centered
                animation={false}>
                <div>
                    <Modal.Body>
                        <div className="alertMsg">
                            {t('Common.NetworkBusy')}
                        </div>
                    </Modal.Body>
                </div>
            </Modal>
        </div>
    )
}

export default Home
