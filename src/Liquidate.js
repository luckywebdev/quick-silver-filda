import React, { useContext, useEffect, useState } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import ContentLoader from "react-content-loader";
import { useTranslation } from 'react-i18next'
import { Modal } from 'react-bootstrap'
import { TiArrowSortedDown, TiArrowSortedUp, TiArrowUnsorted } from 'react-icons/ti'
import BigNumber from 'bignumber.js';
import truncateMiddle from 'truncate-middle'

import { NetworkTypeContext, WalletAddressContext, Web3Context, ReadonlyWeb3Context } from './context'
import LiquidateModal from './components/subComponents/LiquidateModal'
import Pagination from './components/Pagination'
import LiquidateData from './methods/LiquidateData'
import FetchData from './methods/FetchData'
import CoreData from './methods/CoreData'
import styles from './Liquidate.module.scss'
import log from './utils/logger'
import { promiseWithTimeout } from './utils/promise'

async function loadLiquidityData() {
  const accountArray = await LiquidateData.getLiquidityArray()
  const liquidableAccounts = accountArray.filter((d) => parseFloat(d.shortfall) > 0)
  const promises = []
  for (let account of liquidableAccounts) {
      promises.push(LiquidateData.getAccountDetail(account.borrower))
  }
  return await Promise.all(promises)
}

async function loadAllMarketData(web3, networkType, connectedAddress, marketsArr) {
  await FetchData.callContract(web3, connectedAddress, networkType)
  FetchData.clearMarketDataCache()
  await FetchData.cacheAllMarketData(web3, networkType, connectedAddress, marketsArr)
  const promises = []
  for (let market of marketsArr) {
      promises.push(loadMarketData(web3, networkType, connectedAddress, market))
  }
  const dataTree = await Promise.all(promises)
  return dataTree
}

async function loadMarketData(web3, networkType, connectedAddress, market) {
  await Promise.all([
      FetchData.getWalletBalance(web3, connectedAddress, networkType, market)
        .then(response => {
          market.walletBalance = response.walletBalance
          market.walletBalanceFormatted = response.walletBalanceFormatted
          market.walletBalanceFiat = response.walletBalanceFiat
        }),
      FetchData.getSavingsBalance(web3, connectedAddress, networkType, market)
        .then(response => {
          market.savingsBalance = response.savingsBalance
          market.savingsBalanceFormatted = response.savingsBalanceFormatted
          market.savingsBalanceFiat = response.savingsBalanceFiat
          market.savingsCTokenBalance = response.savingsCTokenBalance
        }),
      FetchData.getPrice(web3, networkType, market).then(response => {
        market.price = response
      }),
      FetchData.getLiquidateAllowance(web3, connectedAddress, networkType, market).then(response => {
        if(CoreData.isNativeToken(market.symbol)) {
          market.liquidateApproved = true
        } else {
          market.liquidateApproved = response.allowance !== 0
        }
      }),
  ])
  return market
}

function Liquidate() {
    const { connectedAddress } = useContext(WalletAddressContext)
    const { networkType } = useContext(NetworkTypeContext)
    const { readonlyWeb3 } = useContext(ReadonlyWeb3Context)

    const { t } = useTranslation()

    const [loading, setLoading] = useState(true)
    const [liquidityData, setLiquidityData] = useState([])
    const [displayTableData, setDisplayTableData] = useState([])
    const [tableData, setTableData] = useState([])
    const [sortField, setSortField] = useState('')
    const [sortDireciton, setSortDirection] = useState(true)

    const [showLiquidateModal, setShowLiquidateModal] = useState(false)
    const [activeTData, setActiveTData] = useState()

    let marketsArr = FetchData.getNetworkMarkets(networkType)
    const [markets, setMarkets] = useState([])
    const [showLoadAlertModal, setShowLoadAlertModal] = useState(false)

    const loadingColors = {
        background: '#111722',
        foreground: '#1A212D'
    }

    // asset amounts less than this value are not listed in the liquidation list
    const minimumAssetAmount = 0.000001

    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const itemsPerPage = 20

    useEffect(() => {
      let timer = null
      let isUnMounted = false
      async function initialLoad() {
          let fetching = false
          async function loadData() {
              if (!isUnMounted && !fetching && connectedAddress && networkType && networkType !== "unsupported" && readonlyWeb3) {
                  try {
                      fetching = true
                      let [dataTree, data] = await Promise.all([loadAllMarketData(readonlyWeb3, networkType, connectedAddress, marketsArr), loadLiquidityData()])
                      log.info(dataTree)
                      setMarkets(dataTree)

                      data = data.sort((a, b) => a.health - b.health).filter((d) => d.shortfall > 0 && d.total_collateral_value_in_eth > 0)
                      setLiquidityData(data)
                      setLoading(false)
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
              isUnMounted = true
              setLoading(true)
              setShowLoadAlertModal(true)
              clearInterval(timer)
            }
      }
      initialLoad()
      return () => {
          isUnMounted = true
          setMarkets([])
          setLiquidityData([])
          setTableData([])
          clearInterval(timer)
      }
    }, [connectedAddress])

    const sortTable = (tableData, field, direction) => {
      const compare = (s1, s2) => s1 === s2 ? 0 : s1 < s2 ? -1 : 1
      return [...tableData].sort((t1, t2) => {
        let res = 0;
        if (field === 'borrower') {
          res = compare(t1.address.toLowerCase(), t2.address.toLowerCase())
        }
        if (field === 'collateral') {
          res = compare(t1.cAsset.symbol, t2.cAsset.symbol)
          if (res === 0) {
            res = compare(parseFloat(t1.cAsset.collateral_balance_underlying), parseFloat(t2.cAsset.collateral_balance_underlying))
          }
        }
        if (field === 'amount') {
          res = compare(parseFloat(t1.cAsset.maxCollateralValue), parseFloat(t2.cAsset.maxCollateralValue))
        }
        if (field === 'borrowed') {
          res = compare(t1.bAsset.symbol, t2.bAsset.symbol)
          if (res === 0) {
            res = compare(parseFloat(t1.bAsset.max_repay_underlying), parseFloat(t2.bAsset.max_repay_underlying))
          }
        }
        if (field === 'balance') {
          res = compare(parseFloat(t1.bAsset.walletBalance), parseFloat(t2.bAsset.walletBalance))
          if (res === 0) {
            res = compare(t1.bAsset.symbol, t2.bAsset.symbol)
          }
        }
        return direction ? -res : res
      })
    }

    useEffect(() => {
      const marketMap = {}
      for (let market of markets) {
        marketMap[market.qToken.symbol] = market
      }

      const tableData1 = []
      liquidityData.forEach((data, i) => {
        const bTokens = data.tokens.filter((t) => new BigNumber(t.max_repay_underlying).isGreaterThan(minimumAssetAmount) && !!marketMap[t.symbol])
        const cTokens = data.tokens.filter((t) => new BigNumber(t.collateral_balance_underlying).isGreaterThan(minimumAssetAmount) && !!marketMap[t.symbol])

        bTokens.forEach((bToken) => {
          const bMarket = marketMap[bToken.symbol]
          const maxRepayValue = new BigNumber(bToken.max_repay_underlying).multipliedBy(bMarket.price).toFixed(6)
          const bAsset = {
            ...bToken,
            ...bMarket,
            maxRepayValue
          }

          cTokens.forEach((cToken) => {
            const cMarket = marketMap[cToken.symbol]
            const maxCollateralValue = new BigNumber(cToken.collateral_balance_underlying).multipliedBy(cMarket.price).toFixed(6)
            const cAsset = {
              ...cToken,
              ...cMarket,
              maxCollateralValue
            }

            tableData1.push({
              bAsset,
              cAsset,
              address: data.address,
              dataIndex: i,
            })
          })
        })
      })

      setTotalPages(Math.ceil(tableData1.length / itemsPerPage))
      const sortedData = sortTable(tableData1, sortField, sortDireciton)
      setTableData(tableData1)
      setDisplayTableData(sortedData)

      if (activeTData) {
        const index = tableData1.findIndex((tData) =>
          activeTData.address === tData.address &&
          activeTData.bAsset.symbol == tData.bAsset.symbol &&
          activeTData.cAsset.symbol == tData.cAsset.symbol
        )
        if (index > -1) {
          setActiveTData(tableData1[index])
        } else {
          setActiveTData()
        }
      }

    }, [liquidityData, markets])

    const handleClose = () => {
      setShowLoadAlertModal(false)
    }

    const handleClickLiquidation = async(tData) => {
        setActiveTData(tData)
        setShowLiquidateModal(true)
    }

    const handleSortChange = (field, event) => {
      if (event) {
        event.stopPropagation()
      }
      let newField;
      let newDirection
      if (field !== sortField) {
        newField = field
        newDirection = true
      } else if (sortDireciton) {
        newField = sortField
        newDirection = false
      } else {
        newField = ""
        newDirection = true
      }
      
      const sortedData = sortTable(tableData, newField, newDirection)
      setSortField(newField)
      setSortDirection(newDirection)
      setDisplayTableData(sortedData)
  }

    const dataLoading = (
      <ContentLoader
        height={130}
        width={"100%"}
        speed={1}
        backgroundColor={loadingColors.background}
        foregroundColor={loadingColors.foreground}
      >
        {/* Only SVG shapes */}
        <rect x="0" y="20" rx="4" ry="4" width="100%" height="40" />
        <rect x="0" y="80" rx="4" ry="4" width="100%" height="40" />
      </ContentLoader>
    );


    const pagination = (
      <div className={styles.paginationContainer}>
        <Pagination totalPages={totalPages} currentPage={currentPage} onChangePage={setCurrentPage} />
      </div>
    )      

    const sortButton = (field) => (
      field !== sortField ? <TiArrowUnsorted/> :
      sortDireciton ? <TiArrowSortedDown/> : <TiArrowSortedUp/>
    )

    const liquidityPools = !loading ? (
      displayTableData.slice(itemsPerPage * (currentPage - 1), itemsPerPage * currentPage).map((tData, i) => (
        <Row className={styles.poolItem} key={`item - ${i}`} onClick={() => handleClickLiquidation(tData)}>
          <Col md={2} className={styles.value}>
            <div className={styles.valueLabel} onClick={(e) => handleSortChange('borrower', e)}>{sortButton('borrower')} {t('Liquidate.Borrower')}:</div>
            <div className={styles.valueContent}>
              {truncateMiddle(tData.address, 6, 4, '...')}
            </div>
          </Col>

          <Col md={3} className={styles.value}>
            <div className={styles.valueLabel} onClick={(e) => handleSortChange('collateral', e)}>{sortButton('collateral')} {t('Liquidate.Collateral')}:</div>
            <div className={styles.valueContent}>
              <img src={tData.cAsset.logo} width="20" height="20" alt="token logo" />
              {parseFloat(tData.cAsset.collateral_balance_underlying).toFixed(6) + ' ' + tData.cAsset.symbol}
            </div>
          </Col>

          <Col md={2} className={styles.value}>
            <div className={styles.valueLabel} onClick={(e) => handleSortChange('amount', e)}>{sortButton('amount')} {t('Liquidate.Amount')}:</div>
            <div className={styles.valueContent}>
              ${tData.cAsset.maxCollateralValue}
            </div>
          </Col>

          <Col md={3} className={styles.value}>
              <div className={styles.valueLabel} onClick={(e) => handleSortChange('borrowed', e)}>{sortButton('borrowed')} {t('Liquidate.Borrowed')}:</div>
              <div className={styles.valueContent}>
                <img src={tData.bAsset.logo} width="20" height="20" alt="token logo" />
                {parseFloat(tData.bAsset.max_repay_underlying).toFixed(6) + ' ' + tData.bAsset.symbol}
              </div>
          </Col>

          <Col md={2} className={styles.value}>
              <div className={styles.valueLabel} onClick={(e) => handleSortChange('balance', e)}>{sortButton('balance')} {t('Liquidate.Wallet')}:</div>
              <div className={styles.valueContent}>
                {parseFloat(tData.bAsset.walletBalanceFormatted).toFixed(6) + ' ' + tData.bAsset.symbol}
              </div>
          </Col>
        </Row>))
      ) : (
        <div>{dataLoading}</div>
    );

    const liquidity = (
        <Col className={styles.poolContainer}>
          <div className={styles.tile}>
            <div className={styles.infoContainer}>
                <Row className={styles.header}>
                  <Col md={2} className={styles.label} onClick={() => handleSortChange('borrower')}>
                    {t('Liquidate.Borrower')} {sortButton('borrower')}
                  </Col>
                  <Col md={3} className={styles.label} onClick={() => handleSortChange('collateral')}>
                    {t('Liquidate.CollateralAssets')} {sortButton('collateral')}
                  </Col>
                  <Col md={2} className={styles.label} onClick={() => handleSortChange('amount')}>
                    {t('Liquidate.Amount')} {sortButton('amount')}
                  </Col>
                  <Col md={3} className={styles.label} onClick={() => handleSortChange('borrowed')}>
                    {t('Liquidate.BorrowedAssets')} {sortButton('borrowed')}
                  </Col>
                  <Col md={2} className={styles.label} onClick={() => handleSortChange('balance')}>
                    {t('Common.WalletBalance')} {sortButton('balance')}
                  </Col>
                </Row>
                {liquidityPools}
                {pagination}
            </div>
          </div>
        </Col>
      );

    return (
        <div className={styles.liquidate}>
          <div className={styles.introContainer}>
              <div className={styles.introText}>{t('Liquidate.IntroMsg')}</div>
          </div>
          <div className={styles.poolsContainer}>
              <Container>
                  <Row>{liquidity}</Row>
              </Container>
          </div>
          <LiquidateModal
              markets={markets}
              borrower={activeTData || {}}
              repayAsset={(activeTData || {}).bAsset}
              receiveAsset={(activeTData || {}).cAsset}
              show={showLiquidateModal}
              handleClose={() => setShowLiquidateModal(false)}
              styles={styles}
              />

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

export default Liquidate
