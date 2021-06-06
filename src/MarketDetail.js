import React, { useState, useContext, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Container, Row, Col } from 'react-bootstrap'
import ContentLoader from 'react-content-loader'
import { CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import styles from './MarketDetail.module.scss'

import { WalletAddressContext, NetworkTypeContext, Web3Context, ReadonlyWeb3Context } from './context'
import FetchData from './methods/FetchData'
import CoreData from './methods/CoreData'
import Config from './utils/config'
import log from './utils/logger'

import InterestRateChart from './components/InterestRateChart'

async function loadMarketData(web3, networkType, connectedAddress, market) {
  await FetchData.callContract(web3, connectedAddress, networkType)
  FetchData.clearMarketDataCache()
  await FetchData.cacheAllMarketData(web3, networkType, connectedAddress, [market])
  await Promise.all([
      FetchData.getApyRate(web3, networkType, market)
        .then(response => {
          market.savingsAPY = response.savingsAPY
          market.loanAPY = response.loanAPY
          market.savingsMintAPY = response.savingsMintAPY
          market.loanMintAPY = response.loanMintAPY
          market.fildaSpeedAPY = response.fildaSpeedAPY
          market.fildaSpeedFiatAPY = response.fildaSpeedFiatAPY
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
      FetchData.getCollateralStatus(web3, connectedAddress, networkType, market).then(response => {
        market.collateralStatus = response
      }),
      FetchData.getExchangeRate(web3, networkType, market).then(response => {
        market.exchangeRate = response.exchangeRateFormatted
      }),
      FetchData.getDecimals(web3, networkType, market).then(response => {
        market.decimals = response
      }),
      FetchData.getInterestRateModel(web3, networkType, market).then(response => {
        market.blocksPerYear = response.blocksPerYear
        market.baseRatePerBlock = response.baseRatePerBlock
        market.multiplierPerBlock = response.multiplierPerBlock
        market.jumpMultiplierPerBlock = response.jumpMultiplierPerBlock
        market.kink = response.kink
      }),
      FetchData.getReserveFactor(web3, networkType, market).then(response => {
        market.reserveFactor = response
      }),
      FetchData.getMarketPercentage(web3, networkType, market).then(response => {
        market.percentageOfTotalBorrowed = response.percentageOfTotalBorrowed
        market.percentageOfTotalMining = response.percentageOfTotalMining
      })
  ])
  await FetchData.getBorrowLimit(web3, networkType, market)
      .then(response => {
          market.borrowLimit = response.borrowLimit
          market.borrowLimitFormatted = response.borrowLimitFormatted
          market.borrowLimitFiat = response.borrowLimitFiat
          market.collateralFactor = response.collateralFactor
      })
  return market
}

function fixedNaN(number) {
  if (isNaN(number)) {
    return 0
  }
  return number
}

function getLocaleString(s) {
  return parseFloat(fixedNaN(parseFloat(s).toFixed(2))).toLocaleString()
}

function MarketDetail() {
  const { connectedAddress } = useContext(WalletAddressContext)
  const { networkType } = useContext(NetworkTypeContext)
  const { web3 } = useContext(Web3Context)

  const { t } = useTranslation()
  
  const { symbol } = useParams()

  const initMarket = Config.markets[symbol]
  const [market, setMarket] = useState(initMarket)
  const [loading, setLoading] = useState(true)

  const loadingColors = {
    background: "#111722",
    foreground: "#1A212D"
  }
  const Green = "#4FDAB8"
  const Red = "#FB7777"

  useEffect(() => {
    let timer = null
    async function initialLoad() {
      let fetching = false

      timer = setInterval(async() => {
        if (!!initMarket && !fetching && connectedAddress && networkType && networkType !== "unsupported") {
          fetching = true
          try {
            const res = await loadMarketData(web3, networkType, connectedAddress, initMarket)
            setMarket({...res})
            setLoading(false)
          } catch (e) {
            log.error('Error to load markets data:', e)
          } finally {
            fetching = false
          }
        }
      }, 5000)
    }
    initialLoad()

    return () => {
      clearInterval(timer)
      setMarket(initMarket)
    }
  }, [symbol, web3, connectedAddress, networkType])

  let liquidityPercent = ((parseFloat(market.liquidity) / parseFloat(market.totalSupply)) * 100)

  const Header = (
    <Container className={styles.header}>
      <Row>
        <Col
          xs={{span: 6, order: 1}} lg={{ span:3, order: 1}}
          className={styles.borrowsContainer}>
            <div className={styles.title}>{t('Common.TotalBorrowed')}</div>
            <div className={styles.value}>{getLocaleString(market.totalBorrowedFormatted)}</div>
            <div className={styles.APY}>${getLocaleString(market.totalBorrowedFiat)}</div>
        </Col>

        <Col
          xs={12} lg={{span: 6, order: 2}}
          className={styles.introContainer}>
            <div style={{ width: 150, height: 150 }}>
              <CircularProgressbarWithChildren value={liquidityPercent} styles={buildStyles({
                pathColor: Green,
                trailColor: Red,
              })}>
                <img
                    src={market.logo}
                    className={styles.introIcon}
                    alt="logo"
                    />
              </CircularProgressbarWithChildren>
            </div>
            <div className={styles.informationPanel} style={{ color: 'white', width: '100%' }}>
              <div className={styles.panelItem}>
                <span>{t('Common.TotalSupply')}</span>
                <span>{getLocaleString(market.totalSupplyFormatted)} {market.symbol}</span>
              </div>
              <div className={styles.panelItem}>
                <span>{t('MarketDetail.UtilRate')}</span>
                <span>{parseFloat(market.utilRate).toFixed(2)}%</span>
              </div>
            </div>
        </Col>

        <Col
          xs={{span: 6, order: 1}} lg={{span:3, order: 2}}
          className={styles.liquidityContainer}>
            <div className={styles.title}>{t('Common.AvailableLiquidity')}</div>
            <div className={styles.value}>{getLocaleString(market.liquidityFormatted)}</div>
            <div className={styles.APY}>${getLocaleString(market.liquidityFiat)}</div>
        </Col>
      </Row>
      <Row style={{ marginTop: 30 }}>
        <Col lg={4} md={6}>
          <div className={styles.informationPanel}>
            <div className={styles.panelItem}>
              <span>{t('Common.SavingsAPY')}</span>
              <span>{parseFloat(market.savingsAPY).toFixed(2)}%</span>
            </div>
            <div className={styles.panelItem}>
              <span>{t('Common.BorrowAPY')}</span>
              <span>{parseFloat(market.loanAPY).toFixed(2)}%</span>
            </div>
          </div>
        </Col>

        <Col lg={4} md={6}>
          <div className={styles.informationPanel}>
              <div className={styles.panelItem}>
                <span>{t('Common.Mining')}(USD)</span>
                <span>${getLocaleString(market.fildaSpeedFiatAPY)}</span>
              </div>
              <div className={styles.panelItem}>
                <span>{t('Common.Mining')}(FilDA)</span>
                <span>{getLocaleString(market.fildaSpeedAPY)}</span>
              </div>
            </div>
        </Col>

        <Col lg={4} md={6}>
          <div className={styles.informationPanel}>
            <div className={styles.panelItem}>
              <span>{t('Common.Borrowed')}/{t('Common.Total')}</span>
              <span>{parseFloat(market.percentageOfTotalBorrowed*100).toFixed(2)}%</span>
            </div>
            <div className={styles.panelItem}>
              <span>{t('Common.Mining')}/{t('Common.Total')}</span>
              <span>{parseFloat(market.percentageOfTotalMining*100).toFixed(2)}%</span>
            </div>
          </div>
        </Col>
      </Row>

    </Container>
  )
  //** headings - end **//

  //** interest rate model - start **//
  const InterestRateModel = (
    <Container className={styles.marketDetailsContainer}>
      <div className={styles.caption}>
        {t('MarketDetail.InterestRateModel')}
      </div>
      <InterestRateChart market={market} />
    </Container>
  )
  //** interest rate model - end **//

  //** market details - start **/
  const qTokenAddress = !loading && market.qToken.network[networkType].address

  const MarketDetails = (
    <Container className={styles.marketDetailsContainer}>
      <div className={styles.caption}>
        {t('MarketDetail.MarketDetails')}
      </div>
      <Row className={styles.detailRow}>
        <Col md={3} className={styles.label}>{t('Common.Price')}</Col>
        <Col md={9} className={styles.text}>${getLocaleString(market.price)}</Col>
      </Row>

      <Row className={styles.detailRow}>
        <Col md={4} className={styles.label}>{t('MarketDetail.LiquidationThreshold')}</Col>
        <Col md={6} className={styles.text}>{(market.collateralFactor*100.0).toFixed()}%</Col>
      </Row>

      <Row className={styles.detailRow}>
        <Col md={3} className={styles.label}>{t('MarketDetail.Decimals')}</Col>
        <Col md={9} className={styles.text}>{market.decimals}</Col>
      </Row>

      <Row className={styles.detailRow}>
        <Col md={3} className={styles.label}>{t('MarketDetail.ExchangeRate')}</Col>
        <Col md={9} className={styles.text}>{`1 ${market.symbol} = ${market.exchangeRate} ${market.qToken.symbol}`}</Col>
      </Row>

      <Row className={styles.detailRow}>
        <Col md={3} className={styles.label}>{t('MarketDetail.ContractAddress')}</Col>
        <Col md={9} className={styles.text}>
          <a href={CoreData.getAddressUrl(qTokenAddress, networkType)} target="_blank">
            {qTokenAddress}
          </a>
        </Col>
      </Row>

      <Row className={styles.detailRow}>
      </Row>

      <Row className={styles.detailRow}>
      </Row>

    </Container>
  )
  //** market details - end **/

  //** content loading - end **/
  const dataLoading = (
    <div className={styles.marketDetail}>
      <Container className={styles.header}>
        <Row>
          <Col
            xs={{span: 6, order: 1}} md={{ span:4, order: 1}}
            className={styles.borrowsContainer}>
              <div className={styles.title}>{t('Common.TotalBorrowed')}</div>
              <ContentLoader
                height={100}
                speed={1}
                backgroundColor={loadingColors.background}
                foregroundColor={loadingColors.foreground}
              >
                {/* Only SVG shapes */}
                <rect x="0" y="15" rx="4" ry="4" width="200" height="40" />
                <rect x="0" y="60" rx="3" ry="3" width="100" height="20" />
              </ContentLoader>
          </Col>
          <Col
            xs={12} md={{span: 4, order: 2}}
            className={styles.introContainer}>
            <div style={{ width: 150, height: 150 }}>
              <CircularProgressbarWithChildren value={100} styles={buildStyles({
                pathColor: Green,
                trailColor: Red,
              })}>
                <img
                    src={market.logo}
                    className={styles.introIcon}
                    alt="logo"
                    />
              </CircularProgressbarWithChildren>
            </div>
          </Col>
          <Col
            xs={{span: 6, order: 1}} md={{span:4, order: 2}}
            className={styles.liquidityContainer}>
              <div className={styles.title}>{t('Common.AvailableLiquidity')}</div>
              <ContentLoader
                height={100}
                speed={1}
                backgroundColor={loadingColors.background}
                foregroundColor={loadingColors.foreground}
              >
                {/* Only SVG shapes */}
                <rect x="100" y="15" rx="4" ry="4" width="200" height="40" />
                <rect x="200" y="60" rx="3" ry="3" width="100" height="20" />
              </ContentLoader>
          </Col>
        </Row>
        <Row>
          <ContentLoader
            height={200}
            width={"100%"}
            speed={1}
            backgroundColor={loadingColors.background}
            foregroundColor={loadingColors.foreground}
          >
            {/* Only SVG shapes */}
            <rect x="0" y="20" rx="4" ry="4" width="100%" height="40" />
            <rect x="0" y="80" rx="4" ry="4" width="100%" height="40" />
          </ContentLoader>
        </Row>
      </Container>
      <div className={styles.detailContent}>
        <Row>
          <Col md={6}>
            <Container className={styles.marketDetailsContainer}>
              <div className={styles.caption}>
                {t('MarketDetail.InterestRateModel')}
              </div>
              <ContentLoader
                height={200}
                width={"100%"}
                speed={1}
                backgroundColor={loadingColors.background}
                foregroundColor={loadingColors.foreground}
              >
                {/* Only SVG shapes */}
                <rect x="0" y="20" rx="4" ry="4" width="100%" height="40" />
                <rect x="0" y="80" rx="4" ry="4" width="100%" height="40" />
                <rect x="0" y="140" rx="4" ry="4" width="100%" height="40" />
              </ContentLoader>
            </Container>
          </Col>
          <Col md={6}>
            <Container className={styles.marketDetailsContainer}>
              <div className={styles.caption}>
                {t('MarketDetail.MarketDetails')}
              </div>
              <ContentLoader
                height={200}
                width={"100%"}
                speed={1}
                backgroundColor={loadingColors.background}
                foregroundColor={loadingColors.foreground}
              >
                {/* Only SVG shapes */}
                <rect x="0" y="20" rx="4" ry="4" width="100%" height="40" />
                <rect x="0" y="80" rx="4" ry="4" width="100%" height="40" />
                <rect x="0" y="140" rx="4" ry="4" width="100%" height="40" />
              </ContentLoader>
            </Container>
          </Col>
        </Row>
      </div>
    </div>
  )
  //** content loading - end **/

  return loading ? dataLoading : (
    <div className={styles.marketDetail}>
      {Header}
      <div className={styles.detailContent}>
        <Row>
          <Col md={12} lg={6}>
            {InterestRateModel}
          </Col>
          <Col md={12} lg={6}>
            {MarketDetails}
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default MarketDetail