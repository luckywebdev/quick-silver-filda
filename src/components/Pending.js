import React, { useContext } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import styles from './Pending.module.scss'
import { useTranslation } from 'react-i18next'
import SavingsLoadingIcon from '../images/savingsloading.svg'
import LoanLoadingIcon from '../images/loanloading.svg'
import { FaExternalLinkAlt } from 'react-icons/fa'
import CoreData from '../methods/CoreData'
import { NetworkTypeContext } from '../context'

function Pending(props) {
    const { networkType } = useContext(NetworkTypeContext)

    const { t } = useTranslation()

    const pendingDeposits = props.data.map((market, i) => {
        return (
          market.depositTxnHash == null ? '' :
          <Row className={styles.marketsItemRow} key={market.symbol}>
            <Col md={3} className={styles.marketNameContainer}>
              <img
                src={market.logo}
                width="40"
                height="40"
                className="d-inline-block align-top"
                alt="Logo"
                />
              <div className={styles.marketName}>{market.name}</div>
            </Col>
            <Col md={5} className={styles.marketValue}>
              <img
                src={SavingsLoadingIcon}
                width="auto"
                height="30px"
                className="d-inline-block align-top"
                alt="loading"
                />
              <div>{t('Pending.DepositInProgress')}</div>
            </Col>
            <Col md={4} className={styles.marketAction}>
                <a className={styles.txnLink} style={{color: "#4FDAB8"}} href={CoreData.getExplorerUrl(market.depositTxnHash, networkType)} target="_blank">
                    <FaExternalLinkAlt /> <div>{t('Pending.ViewTransaction')}</div>
                </a>
            </Col>
          </Row>
        )
  })

  const pendingWithdraw = props.data.map((market, i) => {
    return (
      market.withdrawTxnHash == null ? '' :
      <Row className={styles.marketsItemRow} key={market.symbol}>
        <Col md={3} className={styles.marketNameContainer}>
          <img
            src={market.logo}
            width="40"
            height="40"
            className="d-inline-block align-top"
            alt="Logo"
            />
          <div className={styles.marketName}>{market.name}</div>
        </Col>
        <Col md={5} className={styles.marketValue}>
          <img
            src={SavingsLoadingIcon}
            width="auto"
            height="30px"
            className="d-inline-block align-top"
            alt="loading"
            />
          <div>{t('Pending.WithdrawInProgress')}</div>
        </Col>
        <Col md={4} className={styles.marketAction}>
            <a className={styles.txnLink} style={{color: "#4FDAB8"}} href={CoreData.getExplorerUrl(market.withdrawTxnHash, networkType)} target="_blank">
            <FaExternalLinkAlt /> <div>{t('Pending.ViewTransaction')}</div>
            </a>
        </Col>
      </Row>
    )
  })

  const pendingBorrow = props.data.map((market, i) => {
    return (
      market.borrowTxnHash == null ? '' :
      <Row className={styles.marketsItemRow} key={market.symbol}>
        <Col md={3} className={styles.marketNameContainer}>
          <img
            src={market.logo}
            width="40"
            height="40"
            className="d-inline-block align-top"
            alt="Logo"
            />
          <div className={styles.marketName}>{market.name}</div>
        </Col>
        <Col md={5} className={styles.marketValue}>
          <img
            src={LoanLoadingIcon}
            width="auto"
            height="30px"
            className="d-inline-block align-top"
            alt="loading"
            />
          <div>{t('Pending.BorrowInProgress')}</div>
        </Col>
        <Col md={4} className={styles.marketAction}>
            <a className={styles.txnLink} style={{color: "#BDB780"}} href={CoreData.getExplorerUrl(market.borrowTxnHash, networkType)} target="_blank">
            <FaExternalLinkAlt /> <div>{t('Pending.ViewTransaction')}</div>
            </a>
        </Col>
      </Row>
    )
  })

  const pendingRepay = props.data.map((market, i) => {
    return (
      market.repayTxnHash == null ? '' :
      <Row className={styles.marketsItemRow} key={market.symbol}>
        <Col md={3} className={styles.marketNameContainer}>
          <img
            src={market.logo}
            width="40"
            height="40"
            className="d-inline-block align-top"
            alt="Logo"
            />
          <div className={styles.marketName}>{market.name}</div>
        </Col>
        <Col md={5} className={styles.marketValue}>
          <img
            src={LoanLoadingIcon}
            width="auto"
            height="30px"
            className="d-inline-block align-top"
            alt="loading"
            />
          <div>{t('Pending.RepayInProgress')}</div>
        </Col>
        <Col md={4} className={styles.marketAction}>
            <a className={styles.txnLink} style={{color: "#BDB780"}} href={CoreData.getExplorerUrl(market.repayTxnHash, networkType)} target="_blank">
            <FaExternalLinkAlt /> <div>{t('Pending.ViewTransaction')}</div>
            </a>
        </Col>
      </Row>
    )
  })


  return (
    <div className={styles.marketsContainer}>
      <Container>
        <div className={styles.pendingListContainer}>
          {pendingDeposits}
          {pendingWithdraw}
          {pendingBorrow}
          {pendingRepay}
        </div>
      </Container>
    </div>
  )
}

export default Pending
