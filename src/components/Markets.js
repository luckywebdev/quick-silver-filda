import React, {useContext, useState, useCallback} from 'react';
import {useHistory} from 'react-router-dom';
import {Container, Row, Col, Button} from 'react-bootstrap'
import styles from './Markets.module.scss';
import DepositModal from './subComponents/DepositModal'
import BorrowModal from './subComponents/BorrowModal'
import { useTranslation } from 'react-i18next'
import ContentLoader from 'react-content-loader'
import FetchData from '../methods/FetchData'
import log from '../utils/logger'
import { WalletAddressContext } from '../context'

function Markets(props) {
  const { connectedAddress } = useContext(WalletAddressContext)

  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [modalMarketIndex, setModalMarketIndex] = useState(0)
  let loading = props.data.loading === undefined ? true
                : connectedAddress === undefined ? true
                : props.data.loading

  log.info('Markets: ', props.data)
  const handleClose = (mode) => {
    mode === 'deposit' ? setShowDepositModal(false) : setShowBorrowModal(false)
  }
  const handleShow = (mode, i, e) => {
    e.stopPropagation()
    setModalMarketIndex(i)
    mode === 'deposit' ? setShowDepositModal(true) : setShowBorrowModal(true)
  }
  const { t } = useTranslation();

  const loadingColors = {
    background: "#111722",
    foreground: "#1A212D"
  }

  const marketsLoading =
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

  const itemClass = `${styles.marketValueItem} px-0 px-sm-1`

  const history = useHistory()
  const handleOnMarketClick = useCallback((symbol) => history.push('/markets/' + symbol), [history])

  const marketsList = props.data.map((market, i) => {
    return (
      <Row className={styles.marketsItemRow} key={market.symbol} onClick={() => handleOnMarketClick(market.symbol)}>
        <Col md={3}>
          <Row>
            <Col className={styles.marketNameContainer}>
              <img
                src={market.logo}
                width="24"
                height="24"
                className="d-inline-block align-top"
                alt={`${market.symbol} logo`}
                />
              <div className={styles.marketName} title={market.name}>{market.name}</div>
            </Col>
          </Row>
        </Col>
        <Col md={6} lg={7} className={styles.marketValue}>
          <Row>
            <Col xs={4} md={2} className={itemClass}>
              <div className={styles.marketValueLabel}>{t('Common.SavingsAPY')}</div>
              <div>
                {(parseFloat(market.savingsAPY) + parseFloat(market.savingsMintAPY)).toFixed(2) + '%'}
              </div>
              <div className={styles.tokenValue}>
                {parseFloat(market.savingsAPY).toFixed(2) + '%'} + {parseFloat(market.savingsMintAPY).toFixed(2) + '%'}
              </div>
            </Col>
            <Col xs={4} md={2} className={itemClass}>
              <div className={styles.marketValueLabel}>{t('Common.BorrowAPY')}</div>
              <div>
                {(parseFloat(market.loanAPY) - parseFloat(market.loanMintAPY)).toFixed(2) + '%'}
              </div>
              <div className={styles.tokenValue}>
                {parseFloat(market.loanAPY).toFixed(2) + '%'} - {parseFloat(market.loanMintAPY).toFixed(2) + '%'}
              </div>
            </Col>
            <Col xs={4} md={2} className={itemClass}>
              <div className={styles.marketValueLabel}>{t('Common.Liquidity')}</div>
              <div>{FetchData.getCurrencyFormatted(market.liquidityFiat)}</div>
              <div className={styles.tokenValue}>{parseFloat(market.liquidityFormatted).toFixed(2) + ' ' + market.symbol}</div>
            </Col>
            <Col xs={4} md={2} className={`${itemClass} pr-1`}>
              <div className={styles.marketValueLabel}>{t('Common.TotalBorrowed')}</div>
              <div>{FetchData.getCurrencyFormatted(market.totalBorrowedFiat)}</div>
              <div className={styles.tokenValue}>{parseFloat(market.totalBorrowedFormatted).toFixed(2) + ' ' + market.symbol}</div>
            </Col>
            <Col xs={4} md={2} className={`${itemClass} pr-1`}>
              <div className={styles.marketValueLabel}>{t('Common.TotalSupply')}</div>
              <div>{FetchData.getCurrencyFormatted(market.totalSupplyFiat)}</div>
              <div className={styles.tokenValue}>{parseFloat(market.totalSupplyFormatted).toFixed(2) + ' ' + market.symbol}</div>
            </Col>
            <Col xs={4} md={2} className={`${itemClass} text-md-center text-left`}>
              <div className={styles.marketValueLabel}>{t('Common.UtilRate')}</div>
              <div>{parseFloat(market.utilRate) < 1e-10 ? '-' : parseFloat(market.utilRate).toFixed(2) + '%'}</div>
            </Col>
          </Row>
        </Col>
        <Col md={3} lg={2} className={`${styles.marketAction} px-md-2`}>
          <Row>
            {
              market.isMintPaused ?
            <Col xs={6} className={`${styles.deposit} pl-0 pl-md-2 pr-2`}>
            <Button variant="savings" size="sm" block disabled onClick={(e) => handleShow("deposit", i, e)}>{t('Common.Deposit')}</Button>
            </Col>
            :
            <Col xs={6} className={`${styles.deposit} pl-0 pl-md-2 pr-2`}>
            <Button variant="savings" size="sm" block onClick={(e) => handleShow("deposit", i, e)}>{t('Common.Deposit')}</Button>
            </Col>
            }
            <Col xs={6} className={`${styles.borrow} pl-2 pr-0 pr-md-2`}>
              <Button variant="loans" size="sm" block onClick={(e) => handleShow("borrow", i, e)}>{t('Common.Borrow')}</Button>
            </Col>
          </Row>
        </Col>
      </Row>
    )
  })


  return (
    <div className={styles.marketsContainer}>
      <Container className={styles.marketsContainer}>
        <div className={styles.marketsTitle}>{t('Markets.Title')}</div>
        {/* <div className={styles.marketsCap}>{t('Markets.Cap')}: ${props.data.totalMarketCap}</div> */}
        <div className={styles.marketsBiz}>{t('Markets.BizSize')}: ${props.data.totalBizSize}</div>
        <Row className={styles.marketsTableTitleRow}>
          <Col md={3} className={styles.marketsTableTitle}>
            <Row>
              <Col md={12}>{t('Common.Assets')}</Col>
            </Row>
          </Col>
          <Col md={6} lg={7} className={styles.marketsTableTitle}>
            <Row>
              <Col md={2} className={'px-0 px-sm-1'}>{t('Common.SavingsAPY')}</Col>
              <Col md={2} className={'px-0 px-sm-1'}>{t('Common.BorrowAPY')}</Col>
              <Col md={2} className={'px-0 px-sm-1'}>{t('Common.Liquidity')}</Col>
              <Col md={2} className={'px-0 px-sm-1'}>{t('Common.TotalBorrowed')}</Col>
              <Col md={2} className={'px-0 px-sm-1'}>{t('Common.TotalSupply')}</Col>
              <Col md={2} className={'px-0 px-sm-1 text-md-center'}>{t('Common.UtilRate')}</Col>
            </Row>
          </Col>
          <Col md={3} lg={2} className={styles.marketsTableTitle}>
            <Row>
              <Col>{t("Markets.DepositOrBorrowAssets")}</Col>
            </Row>
          </Col>
        </Row>
        {loading ? marketsLoading : marketsList}
        <div className={styles.marketsTableNotes}>{t('Markets.Notes')}</div>
      </Container>
      <DepositModal
        data={props.data[modalMarketIndex]}
        show={showDepositModal}
        handleClose={(mode) => handleClose(mode)}
        styles={styles}
        />
      <BorrowModal
        data={props.data[modalMarketIndex]}
        accountLiquidityInFiat={props.data.accountLiquidityInFiat}
        totalBorrowLimitFiat={props.data.totalBorrowLimitFiat}
        totalLoanBalance={props.data.totalLoanBalance}
        show={showBorrowModal}
        handleClose={(mode) => handleClose(mode)}
        styles={styles}
        />
    </div>
  );
}

export default Markets;
