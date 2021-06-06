import React, { useContext, useEffect, useState } from 'react'
import { Container, Row, Col, Button, Modal } from 'react-bootstrap'
import styles from './Staking.module.scss'
import StakingData from './methods/StakingData'
import staking from './images/staking.svg'
import moment from 'moment'
import 'moment/locale/zh-cn'
import { FaExternalLinkAlt, FaBolt } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import CoreData from "./methods/CoreData"
import StakeModal from './components/subComponents/staking/StakeModal'
import UnstakeModal from './components/subComponents/staking/UnstakeModal'
import WithdrawModal from './components/subComponents/staking/WithdrawModal'
import RedeemModal from './components/subComponents/staking/RedeemModal'
import ContentLoader from 'react-content-loader'
import LoadingIcon from './images/savingsloading.svg'
import log from './utils/logger'
import { LanguageContext, NetworkTypeContext, WalletAddressContext, Web3Context } from './context'
import { promiseWithTimeout } from './utils/promise'
import { formatBigNumber } from './utils/numberFormat';

function Staking() {
    const { t } = useTranslation()

    const { language } = useContext(LanguageContext)
    const { connectedAddress } = useContext(WalletAddressContext)
    const { networkType } = useContext(NetworkTypeContext)
    const { web3 } = useContext(Web3Context)

    const loadingColors = {
        background: '#111722',
        foreground: '#1A212D'
    }

    const [loading, setLoading] = useState(true)
    const [poolData, setPoolData] = useState([])
    const [activeTxnsList, setActiveTxnsList] = useState([])
    const [showStakeModal, setShowStakeModal] = useState(false)
    const [showWithdrawModal, setShowWithdrawModal] = useState(false)
    const [showUnstakeModal, setShowUnstakeModal] = useState(false)
    const [showRedeemModal, setShowRedeemModal] = useState(false)
    const [modalPoolIndex, setModalPoolIndex] = useState(0)
    const [showLoadAlertModal, setShowLoadAlertModal] = useState(false)

    const handleClose = (mode) => {
        mode === 'stake' ? setShowStakeModal(false) :
            mode === 'unstake' ? setShowUnstakeModal(false) :
                mode === 'withdraw' ? setShowWithdrawModal(false) :
                    setShowRedeemModal(false)
        setShowLoadAlertModal(false)
    }
    const handleShow = (mode, i) => {
        setModalPoolIndex(i)
        mode === 'stake' ? setShowStakeModal(true) :
            mode === 'unstake' ? setShowUnstakeModal(true) :
                mode === 'withdraw' ? setShowWithdrawModal(true) :
                    setShowRedeemModal(true)
    }

    const fetchStakingData = async () => {
        const poolList = StakingData.getPoolList()
        const poolPromises = []
        poolList.forEach((pool) => {
            poolPromises.push(StakingData.getPoolInfo(web3, networkType, connectedAddress, pool.address))
        })

        const pools = await Promise.all(poolPromises)

        return pools.map(({ address, ...info }) => {
            let activeTxnHash
            if (activeTxnsList.length > 0) {
                const activeList = activeTxnsList.filter(txn => {
                    return txn.poolAddress === address
                })
                if (activeList.length > 0) {
                    activeTxnHash = activeList[0].hash
                }
            }

            return { address, info, activeTxnHash }
        })
    }

    useEffect(() => {
        let isUnMounted = false
        let timer = null
        setLoading(true)
        async function initialLoad() {
            let fetching = false
            async function loadData() {
                if (!fetching && connectedAddress && networkType && networkType !== 'unsupported' && web3) {
                    const startTime = new Date().getTime()
                    log.info('load all staking data|start')
                    try {
                        fetching = true

                        const data = await fetchStakingData()
                        if (!isUnMounted) {
                            setLoading(false)
                            setPoolData(data)
                        }
                    } catch (e) {
                        log.error('Error to load staking data:', e)
                    } finally {
                        fetching = false
                        const endTime = new Date().getTime()
                        log.info(`load all staking data|end|${(endTime - startTime) / 1000}秒`)
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
            clearInterval(timer)
        }
    }, [connectedAddress])

    const poolsLoading =
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

    const pools = poolData.map((pool, i) => {
      console.log("pool info==>", pool);
        const LockedBalance = Number(pool.info.withdrawPeriod) !== 0
            ? (
                <Row className={styles.infoItem}>
                    <Col xs={4} className={styles.label}>{t('Stake.Unstaked')}</Col>
                    <Col xs={8} className={styles.value}>
                        <img
                            src={pool.info.lpTokenLogo}
                            width="auto"
                            height="20"
                            className="tokenLogo"
                            alt="token logo"
                        />
                        <div className={styles.tokenName}>
                            {pool.info.lockedBalanceFormatted} {pool.info.lpTokenSymbol}
                        </div>
                    </Col>
                </Row>
            ) : ''

        const StakeButton =
            pool.info.lpTokenStakedBalance > 0
                ? (
                    <Button
                        variant="primary" size="lg" block disabled={pool.info.disabled} onClick={() => handleShow('stake', i)}>
                        {t('Stake.StakeMore')} {pool.info.lpTokenShortName ?? pool.info.lpTokenName} {pool.info.lpTokenSymbol}
                    </Button>
                )
                : pool.info.lpTokenStakedBalance
                    ? (
                        <Button
                            variant="primary" size="lg" block disabled={pool.info.disabled} onClick={() => handleShow('stake', i)}>
                            {t('Stake.Stake')} {pool.info.lpTokenShortName ?? pool.info.lpTokenName} {pool.info.lpTokenSymbol}
                        </Button>
                    ) : ''

        const getWithdrawLocaleTime = (withdrawTime) => {
            moment.locale(language)
            return moment.unix(withdrawTime).fromNow()
        }

        const getWithdrawButtonText = () => {
            return language === 'en'
                ? `${t('Stake.Withdraw')} ${getWithdrawLocaleTime(parseInt(pool.info.withdrawTime))}`
                : `${getWithdrawLocaleTime(parseInt(pool.info.withdrawTime))}${t('Stake.Withdraw')}`
        }

        const WithdrawButton =
            Number(pool.info.withdrawPeriod) === 0 && Number(pool.info.lpTokenStakedBalance) === 0
                ? (
                    <Button
                        variant="withdraw" size="sm" block disabled onClick={() => handleShow('withdraw', i)} >
                        {t('Stake.Withdraw')}
                    </Button>
                )
                : pool.info.totalRewards || (pool.info.totalRedpacket >= 0 || pool.info.totalRedpacket !== undefined)
                    ? ''
                    : Number(pool.info.withdrawPeriod) === 0
                        ? (
                            <Button
                                variant="withdraw" size="sm" block onClick={() => handleShow('withdraw', i)}>
                                {t('Stake.Withdraw')}
                            </Button>
                        )
                        : !pool.info.lockedBalance || Number(pool.info.lockedBalance) === 0
                            ? (
                                <Button
                                    variant="withdraw" size="sm" block disabled onClick={() => handleShow('withdraw', i)}>
                                    {t('Stake.Withdraw.Unstaked')}
                                </Button>
                            )
                            : Number(pool.info.lockedBalance) > 0 && pool.info.withdrawWaitTime > 0
                                ? (
                                    <Button
                                        variant="withdraw" size="sm" block disabled onClick={() => handleShow('withdraw', i)}>
                                        {getWithdrawButtonText()}
                                    </Button>
                                )
                                : (
                                    <Button
                                        variant="withdraw" size="sm" block onClick={() => handleShow('withdraw', i)}>
                                        {t('Stake.Withdraw.Unstaked')}
                                    </Button>
                                )

        const UnstakeButton = (
            <Button
                variant="unstake"
                size="sm"
                block
                disabled={Number(pool.info.lpTokenStakedBalance) === 0 || Number(pool.info.lockedBalance) > 0}
                onClick={() => handleShow('unstake', i)}
            >
                {t('Stake.Unstake')}
            </Button>
        )

        const RedeemRewardsButton = pool.info.redpacketBalance > 0
            ? <Button variant="outline-rewards" size="sm" block onClick={() => handleShow('redeem', i)}>{t('Stake.Redeem.Redpacket')}</Button>
            : pool.info.rewardsEarnedBalance > 0 || pool.info.rewardsBalance > 0
                ? <Button variant="outline-rewards" size="sm" block onClick={() => handleShow("redeem", i)}>{t('Stake.Redeem.Rewards')}</Button>
                : Number(pool.info.redpacketBalance) === 0
                    ? <Button variant="outline-rewards" size="sm" block disabled>{t('Stake.Redeem.Redpacket')}</Button>
                    : <Button variant="outline-rewards" size="sm" block disabled>{t('Stake.Redeem.Rewards')}</Button>

        const WithdrawButtonsContainer = Number(pool.info.withdrawPeriod) === 0
            ? (
                <div className={styles.withdrawButtonsContainer}>
                    {WithdrawButton}
                </div>
            )
            : pool.info.withdrawPeriod
                ? (
                    <div className={styles.withdrawButtonsContainer}>
                        <div>
                            {WithdrawButton}
                        </div>
                        <div>
                            {UnstakeButton}
                        </div>
                    </div>
                ) : ''


        return (
            <Col lg={4} md={6} sm={12} className={styles.itemContainer} key={i}>
                <div className={`${styles.tile} ${pool.info.stakeActive || pool.info.rewardsActive || pool.info.redpacketActive ? styles.active : ''}`}>
                    <div className={styles.infoContainer}>
                        <div className={styles.header}>
                            <img
                                src={pool.info.lpTokenLogo}
                                width="auto"
                                height="36"
                                className="poolLogo"
                                alt="token logo"
                            />
                            {
                                pool.info.hasLockPeriod
                                    ? <div className={styles.poolName}>{pool.info.name} {t('Stake.LockPeriod')}</div>
                                    : <div className={styles.poolName}>{pool.info.name}</div>
                            }
                            <div className={styles.activeStatusContainer}>
                                {
                                    pool.info.stakeActive
                                        ? <div><FaBolt /> {t('Stake.Active')}</div>
                                        : pool.info.rewardsActive
                                            ? <div><FaBolt /> {t('Stake.RewardsActive')}</div>
                                            : pool.info.redpacketActive
                                                ? <div><FaBolt /> {t('Stake.RedpacketActive')}</div>
                                                : pool.info.stakeActive === undefined && pool.info.rewardsActive === undefined
                                                    ? <div>{t('Stake.RedpacketInActive')}</div>
                                                    : pool.info.stakeActive === undefined && pool.info.redpacketActive === undefined
                                                        ? <div>{t('Stake.RewardsInActive')}</div>
                                                        : <div>{t('Stake.InActive')}</div>
                                }
                            </div>
                        </div>
                        {
                            pool.info.lpTokenStakedTotalSupplyFormatted !== undefined
                                ? (
                                    <div className={styles.totalStakedContainer}>
                                        <div className={styles.label}>{t('Stake.Staked.Total')}</div>
                                        <div className={styles.value}>
                                            <img
                                                src={pool.info.lpTokenLogo}
                                                width="auto"
                                                height="20"
                                                className="tokenLogo"
                                                alt="token logo"
                                            />
                                            <div className={styles.tokenName}>
                                                {formatBigNumber(pool.info.lpTokenStakedTotalSupplyFormatted)} {pool.info.lpTokenSymbol}
                                            </div>
                                        </div>
                                    </div>
                                )
                                : pool.info.totalRedpacket !== undefined
                                    ? (
                                        <div className={styles.totalStakedContainer}>
                                            <div className={styles.label}>{t('Stake.Redpacket.Total')}</div>
                                            <div className={styles.value}>
                                                <img
                                                    src={pool.info.rewardTokenLogo}
                                                    width="auto"
                                                    height="20"
                                                    className="tokenLogo"
                                                    alt="token logo"
                                                />
                                                <div className={styles.tokenName}>{formatBigNumber(pool.info.totalRedpacket)} {pool.info.lpTokenSymbol}</div>
                                            </div>
                                        </div>
                                    )
                                    : (
                                        <div className={styles.totalStakedContainer}>
                                            <div className={styles.label}>{t('Stake.Bonus.Total')}</div>
                                            <div className={styles.value}>
                                                <img
                                                    src={pool.info.rewardTokenLogo}
                                                    width="auto"
                                                    height="20"
                                                    className="tokenLogo"
                                                    alt="token logo"
                                                />
                                                <div className={styles.tokenName}>
                                                    {formatBigNumber(pool.info.totalRewards)} {pool.info.lpTokenSymbol}
                                                </div>
                                            </div>
                                        </div>
                                    )
                        }
                        {
                            pool.info.poolAmountInUsd ? (
                                <div className={styles.totalStakedContainer}>
                                    <div className={styles.label}>{t('Stake.Staked.TotalInUsd')}</div>
                                    <div className={styles.value}>
                                        <div className={styles.tokenName}>${pool.info.poolAmountInUsd} </div>
                                    </div>
                                </div>
                            ) : pool.info.totalRedpacketLeft !== undefined ?
                                <div className={styles.totalStakedContainer}>
                                    <div className={styles.label}>{t('Stake.Redpacket.Left')}</div>
                                    <div className={styles.value}>
                                        <img
                                            src={pool.info.rewardTokenLogo}
                                            width="auto"
                                            height="20"
                                            className="tokenLogo"
                                            alt="token logo"
                                        />
                                        <div className={styles.tokenName}>{formatBigNumber(pool.info.totalRedpacketLeft)} {pool.info.lpTokenSymbol}</div>
                                    </div>
                                </div>
                                :
                                <div className={styles.totalStakedContainer}>
                                    <div className={styles.label}>{t('Stake.Bonus.Left')}</div>
                                    <div className={styles.value}>
                                        <img
                                            src={pool.info.rewardTokenLogo}
                                            width="auto"
                                            height="20"
                                            className="tokenLogo"
                                            alt="token logo"
                                        />
                                        <div className={styles.tokenName}>{formatBigNumber(pool.info.totalRewardsLeft)} {pool.info.lpTokenSymbol}</div>
                                    </div>
                                </div>
                        }
                        {/* <div className={styles.rateContainer}>
                            <div className={styles.rateItem}>
                                <div className={styles.label}>APY</div>
                                <div className={styles.value}>23.55%</div>
                            </div>
                            <div className={styles.rateItem}>
                                <div className={styles.label}>APR</div>
                                <div className={styles.value}>23.55%</div>
                            </div>
                        </div> */}
                        {/* <Row className={styles.infoItem}>
                            <Col xs={4} className={styles.label}>{t('Stake.Staked.Total')}</Col>
                            <Col xs={8} className={styles.value}>
                                <img
                                    src={pool.info.lpTokenLogo}
                                    width="auto"
                                    height="20"
                                    className="tokenLogo"
                                    alt="token logo"
                                    />
                                <div className={styles.tokenName}>{pool.info.lpTokenStakedTotalSupplyFormatted} {pool.info.lpTokenSymbol}</div>
                            </Col>
                        </Row> */}
                        {
                            pool.info.lpTokenStakedBalanceFormatted !== undefined ?
                                <Row className={styles.infoItem}>
                                    <Col xs={4} className={styles.label}>{t('Stake.Staked')}</Col>
                                    <Col xs={8} className={styles.value}>
                                        <img
                                            src={pool.info.lpTokenLogo}
                                            width="auto"
                                            height="20"
                                            className="tokenLogo"
                                            alt="token logo"
                                        />
                                        <div className={styles.tokenName}>{pool.info.lpTokenStakedBalanceFormatted} {pool.info.lpTokenSymbol}</div>
                                    </Col>
                                </Row> : <div></div>
                        }
                        {LockedBalance}
                        {
                            pool.info.rewardsEarnedBalanceFormatted !== undefined ?
                                <Row className={styles.infoItem}>
                                    <Col xs={4} className={styles.label}>{t('Stake.Rewards')} </Col>
                                    <Col xs={8} className={styles.value}>
                                        <img
                                            src={pool.info.rewardTokenLogo}
                                            width="auto"
                                            height="20"
                                            className="tokenLogo"
                                            alt="token logo"
                                        />
                                        <div className={styles.tokenName}>{pool.info.rewardsEarnedBalanceFormatted} {pool.info.rewardTokenSymbol}</div>
                                    </Col>
                                </Row>
                                :
                                <Row className={styles.infoItem}>
                                    <Col xs={4} className={styles.label}>{t('Stake.MyBonus.ToBeRedeemed')} </Col>
                                    <Col xs={8} className={styles.value}>
                                        <img
                                            src={pool.info.rewardTokenLogo}
                                            width="auto"
                                            height="20"
                                            className="tokenLogo"
                                            alt="token logo"
                                        />
                                        <div className={styles.tokenName}>{pool.info.rewardsBalanceFormatted} {pool.info.rewardTokenSymbol}</div>
                                    </Col>
                                </Row>
                        }
                        {
                            pool.info.rewardsRedeemed !== undefined ?
                                <Row className={styles.infoItem}>
                                    <Col xs={4} className={styles.label}>{t('Stake.MyBonus.Redeemed')} </Col>
                                    <Col xs={8} className={styles.value}>
                                        <img
                                            src={pool.info.rewardTokenLogo}
                                            width="auto"
                                            height="20"
                                            className="tokenLogo"
                                            alt="token logo"
                                        />
                                        <div className={styles.tokenName}>{formatBigNumber(pool.info.rewardsRedeemed)} {pool.info.rewardTokenSymbol}</div>
                                    </Col>
                                </Row>
                                : ''
                        }
                        {
                            (pool.info.rewardAPR !== undefined && !pool.info.isShortcut) ?
                                <Row className={styles.infoItem}>
                                    <Col xs={4} className={styles.label}>{t('Common.RewardAPR')} </Col>
                                    <Col xs={8} className={styles.value}>
                                        <img
                                            src={pool.info.rewardTokenLogo}
                                            width="auto"
                                            height="20"
                                            className="tokenLogo"
                                            alt="token logo"
                                        />
                                        <div className={styles.tokenName}>{pool.info.rewardAPR}%</div>
                                    </Col>
                                </Row>
                                : ''
                        }
                        {
                            pool.info.rewardAPY ?
                                <Row className={styles.infoItem}>
                                    <Col xs={4} className={styles.label}>{t('Common.RewardAPY')} </Col>
                                    <Col xs={8} className={styles.value}>
                                        <img
                                            src={pool.info.rewardTokenLogo}
                                            width="auto"
                                            height="20"
                                            className="tokenLogo"
                                            alt="token logo"
                                        />
                                        <div className={styles.tokenName}>{pool.info.rewardAPY}%</div>
                                    </Col>
                                </Row>
                                : ''
                        }
                        {/* <Row className={styles.infoItem}>
                            <Col xs={4} className={styles.label}>Admin</Col>
                            <Col xs={8} className={styles.value}><a href={CoreData.getAddressUrl(pool.info.adminAddress, networkType)} target="_blank">{CoreData.getShortAddress(pool.info.adminAddress)}</a></Col>
                        </Row> */}
                    </div>

                    {pool.info.isShortcut && (
                        <div className={styles.addressContainer} style={{ fontSize: "0.8rem", textAlign: "center" }}>
                            <a href={pool.info.fromDogswap ? "https://dogeswap.com/#/mining/lp" : "https://mdex.com/#/liquidity"} target="_blank">{t("Stake.description", { source: pool.info.fromDogswap ? "DogeSwap" : "MDEX" })}</a>
                        </div>
                    )}

                    <div className={styles.footerContainer}>
                        {
                            pool.info.lpTokenWalletBalanceFormatted ?
                                <div className={styles.balance}>
                                    {t('Stake.Wallet.Balance')} <span>{pool.info.lpTokenWalletBalanceFormatted} {pool.info.lpTokenSymbol}</span>
                                    {poolData.stakeTxnHashList}
                                </div>
                                : ''
                        }
                        {
                            pool.activeTxnHash === undefined || pool.activeTxnHash === null ?
                                <div className={styles.buttonsContainer}>
                                    {StakeButton}
                                    {WithdrawButtonsContainer}
                                    {RedeemRewardsButton}
                                </div> :
                                <div className={styles.inProgressMsg}>
                                    <img
                                        src={LoadingIcon}
                                        width="auto"
                                        height="30px"
                                        className="d-inline-block align-top"
                                        alt="loading"
                                    />
                                    <div>
                                        {t('Stake.InProgress')}
                                        <a
                                            className={styles.txnLink}
                                            style={{ color: "#4FDAB8" }}
                                            href={CoreData.getExplorerUrl(pool.activeTxnHash, networkType)}
                                            target="_blank"
                                        >
                                            <FaExternalLinkAlt />
                                        </a>
                                    </div>
                                </div>
                        }
                        <div className={styles.addressContainer}>
                            Pool Address:
                            <a href={pool.info.fromDogswap ?? CoreData.getAddressUrl(pool.address, networkType, pool.info.lpTokenId)} target="_blank">
                                {CoreData.getShortAddress(pool.address)}
                            </a>
                        </div>
                    </div>
                </div>
            </Col>
        )
    })

    return (
        <div className={styles.staking}>
            <div className={styles.introContainer}>
                <img
                    src={staking}
                    width="auto"
                    height="60"
                    className="styles.introIcon"
                    alt="staking icon"
                />
                <div className={styles.introText}>{t('Stake.IntroText')}</div>
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
            {/* <div className={styles.dashboardContainer}>
                <Container className={styles.tile}>
                    <Row>
                        <Col md={6} className={styles.itemContainer}>
                            <div className={styles.label}>Total Staked Balance</div>
                            <div className={styles.value}>1250.73629223 ELA</div>
                            <div className={styles.valueSmall}>$20,001.74 USD</div>
                        </Col>
                        <Col md={6} className={styles.itemContainer}>
                            <div className={styles.label}>Total Rewards Balance</div>
                            <div className={styles.value}>1250.73629223 ELA</div>
                            <div className={styles.valueSmall}>$20,001.74 USD</div>
                        </Col>
                    </Row>
                </Container>
            </div> */}
            <div className={styles.poolsContainer}>
                <Container>
                    <Row>
                        {loading ? poolsLoading : pools}
                    </Row>
                </Container>
            </div>
            {
                poolData.length > 0 ?
                    <StakeModal
                        data={poolData[modalPoolIndex]}
                        activeTxnsList={activeTxnsList}
                        show={showStakeModal}
                        handleClose={(mode) => handleClose(mode)}
                        styles={styles}
                    />
                    : ''
            }
            {
                poolData.length > 0 ?
                    <WithdrawModal
                        data={poolData[modalPoolIndex]}
                        activeTxnsList={activeTxnsList}
                        show={showWithdrawModal}
                        handleClose={(mode) => handleClose(mode)}
                        styles={styles}
                    />
                    : ''
            }
            {
                poolData.length > 0 ?
                    <UnstakeModal
                        data={poolData[modalPoolIndex]}
                        activeTxnsList={activeTxnsList}
                        show={showUnstakeModal}
                        handleClose={(mode) => handleClose(mode)}
                        styles={styles}
                    />
                    : ''
            }
            {
                poolData.length > 0 ?
                    <RedeemModal
                        data={poolData[modalPoolIndex]}
                        activeTxnsList={activeTxnsList}
                        show={showRedeemModal}
                        handleClose={(mode) => handleClose(mode)}
                        styles={styles}
                    />
                    : ''
            }
        </div>
    )
}

export default Staking
