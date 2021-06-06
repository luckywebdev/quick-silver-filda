import React, { useContext, useState } from 'react'
import { Button, Modal, Form, ToggleButtonGroup, ToggleButton } from 'react-bootstrap'
import SavingsLoadingIcon from '../../../images/savingsloading.svg'
import CheckIcon from '../../../images/check.svg'
import ErrorIcon from '../../../images/error.svg'
import { useTranslation } from 'react-i18next'
import StakingData from '../../../methods/StakingData'
import CoreData from '../../../methods/CoreData'
import BigNumber from 'bignumber.js'
import log from '../../../utils/logger'
import { NetworkTypeContext, WalletAddressContext, Web3Context } from '../../../context'

export default function StakeModal(props) {
    const { connectedAddress } = useContext(WalletAddressContext)
    const { networkType } = useContext(NetworkTypeContext)
    const { web3 } = useContext(Web3Context)

    const styles = props.styles;
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState('')
    const [lowBalance, setLowBalance] = useState(false)
    const [loading, setLoading] = useState(false)
    const [stakeCompleted, setStakeCompleted] = useState(false)
    const [stakeFailed, setStakeFailed] = useState(false)
    const [txnHash, setTxnHash] = useState('')
    const [showFilDaDAODeposit, setShowFilDaDAODeposit] = useState(false)

    function fixedNaN(number) {
        if (isNaN(number)) {
            return 0;
        }
        return number
    }

    const validateInput = async (value) => {
        setInputValue(value)
        const txnValue = await getRawValue(fixedNaN(value))
        if (parseFloat(props.data.info.lpTokenWalletBalance) < txnValue) {
            setLowBalance(true)
        } else {
            setLowBalance(false)
        }
    }

    const handleClose = async () => {
        setInputValue('')
        setLowBalance(false)
        setLoading(false)
        setStakeCompleted(false)
        setStakeFailed(false)
        setTxnHash('')
        setShowFilDaDAODeposit(false)
        props.handleClose('stake')
    }

    const getRawValue = async (value) => {
        return StakingData.getRawValue(web3, networkType, props.data.info.lpTokenContract, props.data.info.lpTokenSymbol, value)
    }

    const handleStake = async () => {
        setLoading(true);
        const poolContract = await StakingData.getPoolContract(web3, networkType, props.data.address, props.data.info.pool)
        const gasInfo = await CoreData.getGasInfo(web3)
        const txnValue = await getRawValue(inputValue)

        if (props.data.info.isShortcut) {
            await poolContract.methods.deposit(props.data.info.indexOfPool, web3.utils.toBN(txnValue)).send({
                from: connectedAddress,
                gasLimit: web3.utils.toHex(gasInfo.gasLimit),      // posted at compound.finance/developers#gas-costs
                gasPrice: web3.utils.toHex(gasInfo.gasPrice) // use ethgasstation.info (mainnet only)
            }).on('transactionHash', function (hash) {
                log.info(hash)
                props.activeTxnsList.push({
                    "poolAddress": props.data.address,
                    "hash": hash
                })
                setTxnHash(hash) // we use this only for the modal's state
            }).then(response => {
                log.info(response)
                if (response.events.Failure) {
                    setStakeFailed(true)
                } else {
                    setStakeCompleted(true)
                }
                props.activeTxnsList.splice(props.activeTxnsList.findIndex(e => e.hash === txnHash), 1);
            }).catch(error => {
                if (error.code === 4001) {
                    handleClose()
                } else {
                    setStakeFailed(true)
                    props.activeTxnsList.splice(props.activeTxnsList.findIndex(e => e.hash === txnHash), 1);
                }
            })
        } else {
            await poolContract.methods.stake(web3.utils.toBN(txnValue)).send({
                from: connectedAddress,
                gasLimit: web3.utils.toHex(gasInfo.gasLimit),      // posted at compound.finance/developers#gas-costs
                gasPrice: web3.utils.toHex(gasInfo.gasPrice) // use ethgasstation.info (mainnet only)
            }).on('transactionHash', function (hash) {
                log.info(hash)
                props.activeTxnsList.push({
                    "poolAddress": props.data.address,
                    "hash": hash
                })
                setTxnHash(hash) // we use this only for the modal's state
            }).then(response => {
                log.info(response)
                if (response.events.Failure) {
                    setStakeFailed(true)
                } else {
                    setStakeCompleted(true)
                }
                props.activeTxnsList.splice(props.activeTxnsList.findIndex(e => e.hash === txnHash), 1);
            }).catch(error => {
                if (error.code === 4001) {
                    handleClose()
                } else {
                    setStakeFailed(true)
                    props.activeTxnsList.splice(props.activeTxnsList.findIndex(e => e.hash === txnHash), 1);
                }
            })
        }
    }

    const handleConfirm = () => setShowFilDaDAODeposit(true)

    const handleApprove = async () => {
        setLoading(true)
        log.info('initiating approval: ', props.data)
        await StakingData.approveERC20(web3, connectedAddress, networkType, props.data.info.lpTokenAddress, props.data.address)
            .then(response => {
                props.data.info.lpTokenApproved = true
                setLoading(false)
            })
            .catch(error => {
                if (error.code === 4001) {
                    handleClose()
                }
            })
    }

    const changeInputValue = (value) => {
        setInputValue(new BigNumber(props.data.info.lpTokenWalletBalance).multipliedBy(value).shiftedBy(-parseInt(props.data.info.lpTokendecimals)).toString())
    }


    //UI Rendering

    const DepositButton =
        (lowBalance || isNaN(parseFloat(inputValue)) || parseFloat(inputValue) <= 0) ?
            <Button variant="savings" disabled>{t('Common.Deposit')}</Button> :
            <Button variant="savings" onClick={handleStake}>{t('Common.Deposit')}</Button>


    const ModalLoading =
        <div>
            <Modal.Body>
                <div className={styles.loadingContainer}>
                    <img
                        src={SavingsLoadingIcon}
                        width="auto"
                        height="60px"
                        className="d-inline-block align-top"
                        alt="loading"
                    />
                    {
                        txnHash == null ? '' :
                            <a href={CoreData.getExplorerUrl(txnHash, networkType)} target="_blank">{t('Common.ViewTxnOnExplorer')}</a>
                    }

                </div>
            </Modal.Body>
        </div>


    const ModalApprovalRequest =
        <div>
            <Modal.Body>
                <div className={styles.approvalMsg}>
                    {props.data.info.name === 'FilDA DAO' ? t('Stake.ApprovalMsg') : t('Common.ApprovalMsg')}
                </div>
            </Modal.Body>
            <Modal.Footer>
                {
                    props.data.info.lpTokenApproved
                        ? <Button variant="savings" onClick={handleConfirm}>{t('Stake.Confirm')}</Button>
                        : <Button variant="savings" onClick={handleApprove}>{t('Common.Approve')}</Button>
                }
                <Button variant="cancel" onClick={handleClose}>{t('Common.Cancel')}</Button>
            </Modal.Footer>
        </div>


    const ModalDepositForm =
        <div>
            <Modal.Body>
                <Form >
                    <Form.Group controlId="formDeposit">
                        <Form.Control
                            className={styles.txnValue}
                            type="number"
                            placeholder={"0.00 " + props.data.info.lpTokenSymbol}
                            autoComplete="off"
                            value={inputValue}
                            onChange={e => validateInput(e.target.value)} />
                        <ToggleButtonGroup name="default-value-list" type="radio" className="default-value-btn-list mt-2" onChange={changeInputValue}>
                            <ToggleButton variant="outline-primary" value={0.25} className="default-value-btn">25%</ToggleButton>
                            <ToggleButton variant="outline-primary" value={0.5} className="default-value-btn">50%</ToggleButton>
                            <ToggleButton variant="outline-primary" value={0.75} className="default-value-btn">75%</ToggleButton>
                            <ToggleButton variant="outline-primary" value={1} className="default-value-btn" >100%</ToggleButton>
                        </ToggleButtonGroup>
                    </Form.Group>
                </Form>
                {lowBalance ? <div className={styles.txnError}>{t('Common.InsufficientBalance')}</div> : ''}
            </Modal.Body>
            <Modal.Footer>
                {DepositButton}
                <Button variant="cancel" onClick={handleClose}>{t('Common.Cancel')}</Button>
            </Modal.Footer>
            <div className={styles.footerInfo}>
                <div>{t('Common.WalletBalance')}</div>
                <div className={styles.tokenBalance}>
                    {parseFloat(props.data.info.lpTokenWalletBalanceFormatted).toFixed(4) + ' ' + props.data.info.lpTokenSymbol}
                </div>
            </div>
        </div>

    const ModalLoaded = (props.data.info.lpTokenApproved || showFilDaDAODeposit) ? ModalDepositForm : ModalApprovalRequest
    const ModalRendered = loading
        ? ModalLoading
        : (props.data.info.name === 'FilDA DAO' && !showFilDaDAODeposit) ? ModalApprovalRequest : ModalLoaded

    const TxnSuccessMsg =
        <div>
            <Modal.Body>
                <div className={styles.loadingContainer}>
                    <img
                        src={CheckIcon}
                        width="auto"
                        height="60px"
                        className="d-inline-block align-top"
                        alt="error"
                    />
                </div>
                <div className={styles.approvalMsg}>{t('DepositModal.SuccessMsg')}</div>
                <a href={CoreData.getExplorerUrl(txnHash, networkType)} target="_blank">{t('Common.ViewTxnOnExplorer')}</a>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="cancel" onClick={handleClose}>{t('Common.Close')}</Button>
            </Modal.Footer>
        </div>

    const TxnErrorMsg =
        <div>
            <Modal.Body>
                <div className={styles.loadingContainer}>
                    <img
                        src={ErrorIcon}
                        width="auto"
                        height="60px"
                        className="d-inline-block align-top"
                        alt="error"
                    />
                </div>
                <div className={styles.approvalMsg}>{t('DepositModal.ErrorMsg')}</div>
                <a href={CoreData.getExplorerUrl(txnHash, networkType)} target="_blank">{t('Common.ViewTxnOnExplorer')}</a>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="cancel" onClick={handleClose}>{t('Common.Close')}</Button>
            </Modal.Footer>
        </div>

    return (
        <Modal
            show={props.show}
            onHide={handleClose}
            aria-labelledby="contained-modal-title-vcenter"
            className={styles.txnModal}
            centered
            animation={false}>
            <Modal.Header closeButton>
                <img
                    src={props.data.info.lpTokenLogo}
                    width="auto"
                    height="36px"
                    className="d-inline-block align-top"
                    alt="QuickSilver Logo"
                />
                <div className={styles.assetName}>{props.data.info.lpTokenName}</div>
                {
                    stakeCompleted || stakeFailed ? ''
                        : <div className={styles.txnTypeDesc}> {t('Stake.DepositToStake')} </div>
                }
            </Modal.Header>
            {
                stakeCompleted ? TxnSuccessMsg :
                    stakeFailed ? TxnErrorMsg : ModalRendered
            }
        </Modal>
    )
}
