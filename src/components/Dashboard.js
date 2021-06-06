import React, { useContext, useState } from 'react'
import {Container, Row, Col, Button} from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import styles from './Dashboard.module.scss'
import ContentLoader from 'react-content-loader'
import FetchData from '../methods/FetchData'
import Config from '../utils/config'
import ClaimModal from '../components/subComponents/ClaimModal'
import logo from '../images/logo.svg'
import { NetworkTypeContext, WalletAddressContext } from '../context'

function fixedNaN(number) {
  if (isNaN(number)) {
    return 0
  }
  return number
}

function Dashboard(props) {
    const { connectedAddress } = useContext(WalletAddressContext)
    const { networkType } = useContext(NetworkTypeContext)

  let loading = props.data.loading == undefined ? true
                : connectedAddress == undefined ? true
                : props.data.loading

  const { t } = useTranslation()
  let loanUsedPercent = ((parseFloat(props.data.totalLoanBalance) / parseFloat(props.data.totalBorrowLimitFiat)) * 100).toFixed(2)

  const loadingColors = {
    background: "#111722",
    foreground: "#1A212D"
  }

  const [showClaimModal, setShowClaimModal] = useState(false)

  const handleClaimClose = () => {
    setShowClaimModal(false)
  }
  const handleClaimShow = () => {
    setShowClaimModal(true)
  }

  const dashboardLoading =
    <div className={styles.dashboard}>
      <Container>
        <Row>
          <Col
            xs={{span: 6, order: 1}} md={{ span:4, order: 1}}
            className={styles.savingsContainer}>
              <div className={styles.title}>{t('Common.SavingsBalance')}</div>
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
            className={styles.netAPYContainer}>
              <div className={styles.netAPYTile}>
                {/* <div className={styles.title}>{t('Common.NetAPY')}</div> */}
                <ContentLoader
                  height={40}
                  width={200}
                  speed={1}
                  backgroundColor={loadingColors.background}
                  foregroundColor={loadingColors.foreground}
                >
                  {/* Only SVG shapes */}
                  <rect x="0" y="15" rx="4" ry="4" width="200" height="40" />
                </ContentLoader>
              </div>
          </Col>
          <Col
            xs={{span: 6, order: 1}} md={{span:4, order: 2}}
            className={styles.loansContainer}>
              <div className={styles.title}>{t('Common.LoanBalance')}</div>
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
        <Row className={styles.loanLimitContainer}>
          <Col xs={4} className={styles.minLoan}>
            <ContentLoader
                height={40}
                speed={1}
                backgroundColor={loadingColors.background}
                foregroundColor={loadingColors.foreground}
              >
                {/* Only SVG shapes */}
                <rect x="0" y="15" rx="4" ry="4" width="50" height="40" />
              </ContentLoader>
          </Col>
          <Col xs={4} className={styles.usedLoan}>
            <ContentLoader
              height={40}
              width={100}
              speed={1}
              backgroundColor={loadingColors.background}
              foregroundColor={loadingColors.foreground}
            >
              {/* Only SVG shapes */}
              <rect x="0" y="15" rx="4" ry="4" width="100" height="40" />
            </ContentLoader>
          </Col>
          <Col xs={4} className={styles.maxLoan}>
            <ContentLoader
              height={40}
              width={50}
              speed={1}
              backgroundColor={loadingColors.background}
              foregroundColor={loadingColors.foreground}
            >
              {/* Only SVG shapes */}
              <rect x="0" y="15" rx="4" ry="4" width="50" height="40" />
            </ContentLoader>
          </Col>
        </Row>
        <div className={styles.loanLimitBarOuter}>
          <div className={styles.loanLimitBarInner} style={{width: loanUsedPercent.toString() + '%'}}></div>
        </div>
      </Container>
    </div>

  return (
    loading ? dashboardLoading :
    <div className={styles.dashboard}>
      <Container>
        <Row>
          <Col
            xs={{span: 6, order: 1}} md={{ span:4, order: 1}}
            className={styles.savingsContainer}>
              <div className={styles.title}>{t('Common.SavingsBalance')}</div>
              <div className={styles.value}>{FetchData.getCurrencyFormatted(props.data.totalSavingsBalance, 4)}</div>
              <div className={styles.APY}><span>{t('Common.APY')}</span> {fixedNaN(parseFloat(props.data.totalSavingsAPY).toFixed(2))}%</div>
          </Col>
          <Col
            xs={12} md={{span: 4, order: 2}}
            className={styles.netAPYContainer}>
              <div className={styles.netAPYTile}>
                {/* <div className={styles.netAPYContainer}>
                  <div className={styles.title}>{t('Common.NetAPY')}</div>
                  <div className={styles.value}>{fixedNaN(parseFloat(props.data.totalNetAPY).toFixed(2))}%</div>
                </div> */}
                <div className={styles.compBalanceContainer}>
                {
                  Config.COMP.network[networkType] == undefined ? "" :
                  loading ?
                  <ContentLoader
                    height={40}
                    speed={1}
                    backgroundColor={loadingColors.background}
                    foregroundColor={loadingColors.foreground}
                  >
                    {/* Only SVG shapes */}
                    <rect x="0" y="5" rx="4" ry="4" width="100%" height="40" />
                  </ContentLoader> :
                  <div className={styles.compBalance}>{parseFloat(props.data.compAccrued).toFixed(4)} {(props.data.compSymbol).toUpperCase()} {t('Common.Unclaimed')}</div>
                }
                {
                  Config.COMP.network[networkType] == undefined ? "" :
                  loading || Number(props.data.compAccrued) === 0 ?
                <Button className={styles.claimButton} variant="savings" size="sm" disabled>{t('Header.Collect')}</Button> :
                  <Button className={styles.claimButton} variant="savings" size="sm" onClick={handleClaimShow}>{t('Header.Collect')}</Button>
                }
              </div>
              </div>
          </Col>
          <Col
            xs={{span: 6, order: 1}} md={{span:4, order: 2}}
            className={styles.loansContainer}>
              <div className={styles.title}>{t('Common.LoanBalance')}</div>
              <div className={styles.value}>{FetchData.getCurrencyFormatted(props.data.totalLoanBalance, 4)}</div>
              <div className={styles.APY}><span>{t('Common.APY')}</span> {fixedNaN(parseFloat(props.data.totalLoanAPY).toFixed(2))}%</div>
          </Col>
        </Row>
        <Row className={styles.loanLimitContainer}>
          <Col xs={4} className={styles.minLoan}>$0</Col>
          <Col xs={4} className={styles.usedLoan}>{t('Dashboard.loanUsedPercent', {loanUsedPercent: fixedNaN(loanUsedPercent)})}</Col>
          <Col xs={4} className={styles.maxLoan}>{'$' + fixedNaN(parseFloat(props.data.totalBorrowLimitFiat).toFixed(2))}</Col>
        </Row>
        <div className={styles.loanLimitBarOuter}>
          <div className={styles.loanLimitBarInner} style={{width: fixedNaN(loanUsedPercent).toString() + '%'}}></div>
        </div>
      </Container>
      {
        props.data.compSymbol == undefined ? "" :
        <ClaimModal
          data={props.data}
          logo={logo}
          styles={styles}
          handleClaimClose={handleClaimClose}
          show={showClaimModal} />
      }
    </div>
  )
}

export default Dashboard
