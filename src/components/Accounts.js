import React, {useContext, useState} from 'react'
import {Container, Nav, Tab, Row, Col, Button, Form, Modal} from 'react-bootstrap'
import styles from './Accounts.module.scss'
import savingsEmpty from '../images/savings_empty.svg'
import loansEmpty from '../images/loans_empty.svg'
import SavingsLoadingIcon from '../images/savingsloading.svg'
import RepayModal from './subComponents/RepayModal'
import SwapRepayModal from './subComponents/SwapRepayModal'
import WithdrawModal from './subComponents/WithdrawModal'
import { useTranslation } from 'react-i18next'
import ContentLoader from 'react-content-loader'
import ErrorIcon from '../images/error.svg'
import FetchData from '../methods/FetchData'
import CoreData from '../methods/CoreData'
import { FaExternalLinkAlt } from 'react-icons/fa'
import log from '../utils/logger'
import { NetworkTypeContext, WalletAddressContext, Web3Context } from '../context'

function Accounts(props) {
    const { connectedAddress } = useContext(WalletAddressContext)
    const { networkType } = useContext(NetworkTypeContext)
    const { web3 } = useContext(Web3Context)

  const [showRepayModal, setShowRepayModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showSwapRepayModal, setShowSwapRepayModal] = useState(false)
  const [showCollateralErrorModal, setShowCollateralErrorModal] = useState(false)
  const [modalMarketIndex, setModalMarketIndex] = useState(0)

  let loading = props.data.loading === undefined ? true
                : connectedAddress === undefined ? true
                : props.data.loading

  const loadingColors = {
    background: "#111722",
    foreground: "#1A212D"
  }

  const handleClose = (mode) => {
    mode === "repay" ? setShowRepayModal(false) : mode === "withdraw" ? setShowWithdrawModal(false) : setShowSwapRepayModal(false)
  }
  const handleShow = (mode, i) => {
    setModalMarketIndex(i)
    mode === "repay" ? setShowRepayModal(true) : mode === "withdraw" ? setShowWithdrawModal(true) : setShowSwapRepayModal(true)
  }

  const { t } = useTranslation()

  const handleCollateral = async(market) => {
    market.collateralInProgress = true

    const gasInfo = await CoreData.getGasInfo(web3)
    const comptroller =  await CoreData.getComptroller(web3, networkType)
    const marketAddress = market.qToken.network[networkType].address

    if(market.collateralStatus) {
      await comptroller.methods.exitMarket(marketAddress).send({
        from: connectedAddress,
        gasLimit: web3.utils.toHex(gasInfo.gasLimit),     // posted at compound.finance/developers#gas-costs
        gasPrice: web3.utils.toHex(gasInfo.gasPrice) // use ethgasstation.info (mainnet only)
      })
      .on('transactionHash', function(hash) {
          log.info(hash)
          market.collateralTxnHash = hash
      })
      .then(response => {
        log.info(response)
        market.collateralInProgress = false
        market.collateralTxnHash = null
        if(Number(response.events.Failure.returnValues.error) === 12) {
          setShowCollateralErrorModal(true)
        }
      })
      .catch(error => {
          log.error(error)
        market.collateralInProgress = false
        market.collateralTxnHash = null
      })
    }
    else {
      await comptroller.methods.enterMarkets([marketAddress]).send({
        from: connectedAddress,
        gasLimit: web3.utils.toHex(gasInfo.gasLimit),     // posted at compound.finance/developers#gas-costs
        gasPrice: web3.utils.toHex(gasInfo.gasPrice) // use ethgasstation.info (mainnet only)
      })
      .on('transactionHash', function(hash) {
          log.info(hash)
          market.collateralTxnHash = hash
      })
      .then(response => {
        log.info(response)
        market.collateralStatus = true
        market.collateralInProgress = false
        market.collateralTxnHash = null
      })
      .catch(error => {
        log.error(error)
        market.collateralInProgress = false
        market.collateralTxnHash = null
      })
    }
  }

  const AccountsLoading =
    <div className={styles.emptyMessageContainer}>
      <ContentLoader
          height={150}
          width={"75%"}
          speed={1}
          backgroundColor={loadingColors.background}
          foregroundColor={loadingColors.foreground}
        >
          {/* Only SVG shapes */}
          <rect x="0" y="20" rx="4" ry="4" width="100%" height="40" />
          <rect x="0" y="80" rx="4" ry="4" width="100%" height="20" />
      </ContentLoader>
    </div>

  const SavingsEmptyMsg =
    <div className={styles.emptyMessageContainer}>
      <img
        src={savingsEmpty}
        width="auto"
        height="72"
        className="d-inline-block align-top"
        alt="Filda Logo"
        />
      <div className={styles.messageTitle}>{t('Accounts.SavingsEmptyMsgTitle')}</div>
      <div className={styles.messageDesc}>{t('Accounts.SavingsEmptyMsgDesc')}</div>
    </div>

  const LoanEmptyMsg =
    <div className={styles.emptyMessageContainer}>
      <img
        src={loansEmpty}
        width="auto"
        height="72"
        className="d-inline-block align-top"
        alt="Filda Logo"
        />
      <div className={styles.messageTitle}>{t('Accounts.LoanEmptyMsgTitle')}</div>
      <div className={styles.messageDesc}>{t('Accounts.LoanEmptyMsgDesc')}</div>
    </div>

  const ActiveSavingsAccounts = props.data.map((market,i) => {
    return(
      market.savingsBalance > 0 ?
      <Row className={styles.marketsItemRow} key={market.symbol}>
        <Col md={3} className={styles.marketNameContainer}>
          <img
            src={market.logo}
            width="24"
            height="24"
            className="d-inline-block align-top"
            alt="Logo"
            />
          <div className={styles.marketName}>{market.name}</div>
        </Col>
        <Col md={5} className={styles.marketValue}>
          <Row>
            <Col xs={6} md={3} className={styles.marketValueItem}>
              <div className={styles.marketValueLabel}>{t('Common.APY')}</div>
              <div>{parseFloat(market.savingsAPY).toFixed(2) + '%'}</div>
            </Col>
            <Col xs={6} md={3} className={styles.marketValueItem}>
              <div className={styles.marketValueLabel}>{t('Common.MintAPY')}</div>
              <div>{parseFloat(market.savingsMintAPY).toFixed(2) + '%'}</div>
            </Col>
            <Col xs={6} md={3} className={styles.marketValueItem}>
              <div className={styles.marketValueLabel}>{t('Common.SavingsBalance')}</div>
              <div>
                {FetchData.getCurrencyFormatted(market.savingsBalanceFiat)}
              </div>
              <div className={styles.valueSmall}>
                {parseFloat(market.savingsBalanceFormatted).toFixed(4) + ' ' + market.symbol}
              </div>
            </Col>
            <Col xs={6} md={3} className={styles.marketValueItem}>
              <div className={styles.marketValueLabel}>{t('Common.WalletBalance')}</div>
              <div>{FetchData.getCurrencyFormatted(market.walletBalanceFiat)}</div>
              <div className={styles.valueSmall}>
                {parseFloat(market.walletBalanceFormatted).toFixed(4) + ' ' + market.symbol}
              </div>
            </Col>
          </Row>
        </Col>
        <Col md={4} className={styles.marketAction}>
        {
          market.collateralInProgress ?
            <Row>
              <Col className={styles.inProgressContainer}>
              <img
                  src={SavingsLoadingIcon}
                  width="auto"
                  height="30px"
                  className="d-inline-block align-top"
                  alt="loading"
                  />
                <div className={styles.inProgressMsg}>
                  {market.collateralStatus ? t('Accounts.DisablingCollateral') : t('Accounts.EnablingCollateral')}
                  {
                    market.collateralTxnHash == null ? '' :
                    <a className={styles.txnLink} style={{color: "#4FDAB8"}} href={CoreData.getExplorerUrl(market.collateralTxnHash, networkType)} target="_blank">
                      <FaExternalLinkAlt />
                    </a>
                  }
                </div>
              </Col>
          </Row> :
            <Row style={{"width": "100%"}} noGutters={true}>
              <Col xs={6} className={styles.borrow}>
                <Form>
                  <Form.Check
                    type="switch"
                    id={market.symbol + '-switch'}
                    label={t('Common.Collateral')}
                    checked={market.collateralStatus}
                    onChange={() => handleCollateral(market)}
                  />
                </Form>
              </Col>
              <Col xs={6} className={styles.deposit}>
                <Button variant="cancel" size="sm" block  onClick={() => handleShow("withdraw", i)}>{t('Common.Withdraw')}</Button>
              </Col>
          </Row>
          }
        </Col>
      </Row> : ''
    )
  })

  const ActiveLoanAccounts = props.data.map((market,i) => {
    return(
      market.loanBalance > 0 ?
      <Row className={styles.marketsItemRow} key={market.symbol}>
        <Col md={3} className={styles.marketNameContainer}>
          <img
            src={market.logo}
            width="24"
            height="24"
            className="d-inline-block align-top"
            alt="Logo"
            />
          <div className={styles.marketName}>{market.name}</div>
        </Col>
        <Col md={5} className={styles.marketValue}>
          <Row>
            <Col xs={6} md={3} className={styles.marketValueItem}>
              <div className={styles.marketValueLabel}>{t('Common.APY')}</div>
              <div>{parseFloat(market.loanAPY).toFixed(2) + '%'}</div>
            </Col>
            <Col xs={6} md={3} className={styles.marketValueItem}>
              <div className={styles.marketValueLabel}>{t('Common.MintAPY')}</div>
              <div>{parseFloat(market.loanMintAPY).toFixed(2) + '%'}</div>
            </Col>
            <Col xs={6} md={3} className={styles.marketValueItem}>
              <div className={styles.marketValueLabel}>{t('Common.LoanBalance')}</div>
              <div>
                {'$' + parseFloat(market.loanBalanceFiat).toFixed(2)}
              </div>
              <div className={styles.valueSmall}>
                {parseFloat(market.loanBalanceFormatted).toFixed(4) + ' ' + market.symbol}
              </div>
            </Col>
            <Col xs={6} md={3} className={styles.marketValueItem}>
              <div className={styles.marketValueLabel}>{t('Common.WalletBalance')}</div>
              <div>{'$' + parseFloat(market.walletBalanceFiat).toFixed(2)}</div>
              <div className={styles.valueSmall}>
                {parseFloat(market.walletBalanceFormatted).toFixed(4) + ' ' + market.symbol}
              </div>
            </Col>
          </Row>
        </Col>
        <Col md={4}>
          <Row className={styles.marketAction}>
            <Col xs={6}>
              <Button variant="secondary" size="sm" className={styles.repayButton} block onClick={() => handleShow("swapRepay", i)}>{t('Common.SwapRepay')}</Button>
            </Col>
            <Col xs={4}>
              <Button variant="loans" size="sm" className={styles.repayButton} block onClick={() => handleShow("repay", i)}>{t('Common.Repay')}</Button>
            </Col>
        </Row>
        </Col>
      </Row> : ''
    )
  })

  const SavingsAccountsList =
    <div className={styles.savingsAccountsItem}>
      <Row className={styles.marketsTableTitleRow}>
        <Col md={3} className={styles.marketsTableTitle}>
          <Row>
            <Col md={12}>{t('Common.Assets')}</Col>
          </Row>
        </Col>
        <Col md={5} className={styles.marketsTableTitle}>
          <Row>
            <Col md={3}>{t('Common.APY')}</Col>
            <Col md={3}>{t('Common.MintAPY')}</Col>
            <Col md={3}>{t('Common.SavingsBalance')}</Col>
            <Col md={3}>{t('Common.WalletBalance')}</Col>
          </Row>
        </Col>
      </Row>
      {ActiveSavingsAccounts}
    </div>

const LoanAccountsList =
  <div className={styles.savingsAccountsItem}>
    <Row className={styles.marketsTableTitleRow}>
      <Col md={3} className={styles.marketsTableTitle}>
        <Row>
          <Col md={12}>{t('Common.Assets')}</Col>
        </Row>
      </Col>
      <Col md={5} className={styles.marketsTableTitle}>
        <Row>
          <Col md={3}>{t('Common.APY')}</Col>
          <Col md={3}>{t('Common.MintAPY')}</Col>
          <Col md={3}>{t('Common.LoanBalance')}</Col>
          <Col md={3}>{t('Common.WalletBalance')}</Col>
        </Row>
      </Col>
    </Row>
    {ActiveLoanAccounts}
  </div>


  return (
    <div className={styles.accountsContainer}>
      <Container>
        <Tab.Container id="accountsTabs" defaultActiveKey="savings" transition={false}>
          <Nav fill justify variant="tabs" className={styles.tabsTitleContainer}>
            <Nav.Item>
              <Nav.Link className={styles.savingsTab} eventKey="savings">{t('Common.Savings')}</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link className={styles.loansTab} eventKey="loans">{t('Common.Loans')}</Nav.Link>
            </Nav.Item>
          </Nav>
          <Tab.Content>
            <Tab.Pane className={styles.tabContent} eventKey="savings">
              {
                loading ? AccountsLoading
                : props.data.totalSavingsBalance > 0 ? SavingsAccountsList
                : SavingsEmptyMsg
              }
            </Tab.Pane>
            <Tab.Pane className={styles.tabContent} eventKey="loans">
              {
                loading ? AccountsLoading
                : props.data.totalLoanBalance > 0 ? LoanAccountsList
                : LoanEmptyMsg
              }
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Container>
      <SwapRepayModal
        data={props.data[modalMarketIndex]}
        allData={props.data}
        show={showSwapRepayModal}
        handleClose={() => handleClose("swapRepay")}
        styles={styles}
        />
      <RepayModal
        data={props.data[modalMarketIndex]}
        show={showRepayModal}
        handleClose={() => handleClose('repay')}
        styles={styles}
        />
      <WithdrawModal
        data={props.data[modalMarketIndex]}
        totalBorrowLimitFiat={props.data.totalBorrowLimitFiat}
        totalLoanBalance={props.data.totalLoanBalance}
        accountLiquidityInFiat={props.data.accountLiquidityInFiat}
        totalSavingsBalance={props.data.totalSavingsBalance}
        show={showWithdrawModal}
        handleClose={() => handleClose("withdraw")}
        styles={styles}
        />
      <Modal
            show={showCollateralErrorModal}
            onHide={() => setShowCollateralErrorModal(false)}
            aria-labelledby="contained-modal-title-vcenter"
            className={styles.txnModal}
            centered
            animation={false}>
            <Modal.Header closeButton>
            </Modal.Header>
            <Modal.Body>
                <img
                    src={ErrorIcon}
                    width="auto"
                    height="36px"
                    className="d-inline-block align-top"
                    alt="error icon"
                    />
                <div className={styles.assetName}>Unable to Remove Collateral</div>
                <div className={styles.txnTypeDesc}>
                    You have outstanding loans. Please repay to remove this asses as a collateral.
                </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="cancel" onClick={() => setShowCollateralErrorModal(false)}>Close</Button>
            </Modal.Footer>
        </Modal>
    </div>
  )
}

export default Accounts
