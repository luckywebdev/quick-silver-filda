import React, {useContext, useEffect, useState} from 'react'
import { Button, Modal, Form, ToggleButtonGroup, ToggleButton } from 'react-bootstrap'
import CoreMethod from '../../methods/CoreMethod'
import SavingsLoadingIcon from '../../images/savingsloading.svg'
import CheckIcon from '../../images/check.svg'
import ErrorIcon from '../../images/error.svg'
import { useTranslation } from 'react-i18next'
import CoreData from '../../methods/CoreData'
import BigNumber from 'bignumber.js'
import log from '../../utils/logger'
import { NetworkTypeContext, WalletAddressContext, Web3Context } from '../../context'
import FetchData from '../../methods/FetchData'

export default function DepositModal(props) {
    const { connectedAddress } = useContext(WalletAddressContext)
    const { networkType } = useContext(NetworkTypeContext)
    const { web3 } = useContext(Web3Context)

    const styles = props.styles;
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState('')
    const [lowBalance, setLowBalance] = useState(false)
    const [negativeNum, setNegativeNum] = useState(false)
    const [loading, setLoading] = useState(false)
    const [depositCompleted, setDepositCompleted] = useState(false)
    const [depositFailed, setDepositFailed] = useState(false)
    const [txnHash, setTxnHash] = useState('')
    const [needsFurtherApproval, setNeedsFurtherApproval] = useState(false)
    const [allowanceFormatted, setAllowanceFormatted] = useState('')

    const validateInput = async(value) => {
        setInputValue(value)
        if ((value !== '' && Number(value) <= 0) || value.includes('e')) {
            setLowBalance(false)
            setNegativeNum(true)
            return
        } 
        setNegativeNum(false)
        if(new BigNumber(props.data.walletBalanceFormatted).comparedTo(new BigNumber(value)) === -1) {
            setLowBalance(true)
        } else {
            setLowBalance(false)
        }
    }

    const handleClose = async() => {
        setInputValue('')
        setLowBalance(false)
        setNegativeNum(false)
        setLoading(false)
        setDepositCompleted(false)
        setDepositFailed(false)
        setTxnHash('')
        setNeedsFurtherApproval(false)
        props.handleClose('deposit')
    }

    const getRawValue = async(value) => {
        return CoreData.getRawValue(web3, networkType, props.data.symbol, value)
    }

    const verifyFurtherApproval = async (txnValue) => {
        if(CoreData.isNativeToken(props.data.symbol)) return Promise.resolve(true)

        const { allowance, allowanceFormatted } = await FetchData.getAccountAllowance(web3, connectedAddress, networkType, props.data)
        if (allowance && allowance < Number(txnValue)) {
            setNeedsFurtherApproval(true)
            setAllowanceFormatted(allowanceFormatted)
            return Promise.resolve(false)
        }
        return Promise.resolve(true)
    }

    const handleDeposit = async() => {
        setLoading(true)

        const txnValue = await getRawValue(inputValue)
        const isValidAllowance = await verifyFurtherApproval(txnValue)
        if (!isValidAllowance) {
            setLoading(false)
            return
        }

        const [ qContract, gasInfo ] = await Promise.all([
            CoreData.getQTokenContract(web3, networkType, props.data.symbol),
            CoreData.getGasInfo(web3)
        ])

        if(CoreData.isNativeToken(props.data.symbol)) {
            await qContract.methods.mint().send({
                from: connectedAddress,
                gasLimit: web3.utils.toHex(gasInfo.gasLimit),      // posted at compound.finance/developers#gas-costs
                gasPrice: web3.utils.toHex(gasInfo.gasPrice), // use ethgasstation.info (mainnet only)
                value: web3.utils.toHex(txnValue)
            })
            .on('transactionHash', function(hash) {
                log.info(hash)
                props.data.depositTxnHash = hash
                setTxnHash(hash) // we use this only for the modal's state
            })
            .then(response => {
                log.info(response)
                if(response.events.Failure) {
                    setDepositFailed(true)
                } else {
                    setDepositCompleted(true)
                }
                props.data.depositTxnHash = null
                setLoading(false)
            })
            .catch(error => {
                if(error.code === 4001) {
                    handleClose()
                } else {
                    setDepositFailed(true)
                    props.data.depositTxnHash = null
                }
            })
        } else {
            await qContract.methods.mint(web3.utils.toBN(txnValue)).send({
                from: connectedAddress,
                gasLimit: web3.utils.toHex(gasInfo.gasLimit),      // posted at compound.finance/developers#gas-costs
                gasPrice: web3.utils.toHex(gasInfo.gasPrice) // use ethgasstation.info (mainnet only)
            })
            .on('transactionHash', function(hash) {
                log.info(hash)
                props.data.depositTxnHash = hash
                setTxnHash(hash) // we use this only for the modal's state
            })
            .then(response => {
                log.info(response)
                if(response.events.Failure) {
                    setDepositFailed(true)
                } else {
                    setDepositCompleted(true)
                }
                props.data.depositTxnHash = null
                setLoading(false)
            })
            .catch(error => {
                if(error.code === 4001) {
                    handleClose()
                } else {
                    setDepositFailed(true)
                    props.data.depositTxnHash = null
                }
            })
        }
    }

    const handleApprove = async () => {
        setLoading(true)
        await CoreMethod.approveERC20(web3, connectedAddress, networkType, props.data)
            .then(async () => {
                props.data.approved = true
                const txnValue = await getRawValue(inputValue)
                await verifyFurtherApproval(txnValue)
                setLoading(false)
            })
            .catch(error => {
                log.error('deposit approve error:', error)
                if(error.code === 4001) {
                    handleClose()
                }
            })
    }

    const changeInputValue = (value) => {
        setInputValue(new BigNumber(props.data.walletBalanceFormatted).multipliedBy(value).toString())
    }

    const DepositButton =
        (negativeNum || lowBalance || isNaN(parseFloat(inputValue)) || parseFloat(inputValue) <= 0)?
            <Button variant="savings" disabled>{t('Common.Deposit')}</Button> :
            <Button variant="savings" onClick={handleDeposit}>{t('Common.Deposit')}</Button>

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
                        props.data.depositTxnHash == null ? '' :
                        <a href={CoreData.getExplorerUrl(txnHash, networkType)} target="_blank">{t('Common.ViewTxnOnExplorer')}</a>
                    }
                </div>
            </Modal.Body>
        </div>


    const ModalApprovalRequest =
        <div>
            <Modal.Body>
                <div className={styles.approvalMsg}>{t('Common.ApprovalMsg')}</div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="savings" onClick={handleApprove}>{t('Common.Approve')}</Button>
                <Button variant="cancel" onClick={handleClose}>{t('Common.Cancel')}</Button>
            </Modal.Footer>
        </div>

    const ModalFurtherApprovalRequest =
        <div>
            <Modal.Body>
                <div className="alertMsg">
                    {t('Common.FurtherApprovalMsg', {type: t('Common.SavingsBalance'), inputValue, allowanceFormatted})}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="savings" onClick={handleApprove}>{t('Common.FurtherApprove')}</Button>
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
                            placeholder={"0.00 " + props.data.symbol}
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
                    {
                        negativeNum && <div className={styles.txnError}>{t('Common.InvalidDepositAmount')}</div>
                    }
                    {lowBalance ? <div className={styles.txnError}>{t('Common.InsufficientBalance')}</div> : ''}
                </Modal.Body>
                <Modal.Footer>
                    {DepositButton}
                    <Button variant="cancel" onClick={handleClose}>{t('Common.Cancel')}</Button>
                </Modal.Footer>
                <div className={styles.footerInfo}>
                    <div>{t('Common.WalletBalance')}</div>
                    <div className={styles.tokenBalance}>
                        {parseFloat(props.data.walletBalanceFormatted).toFixed(4) + ' ' + props.data.symbol}
                    </div>
                </div>
            </div>

    const ModalLoaded = props.data.approved ? ModalDepositForm : ModalApprovalRequest
    const ModalRendered = loading ? ModalLoading : (props.data.approved && needsFurtherApproval) ? ModalFurtherApprovalRequest : ModalLoaded

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

    return(
        <Modal
            show={props.show}
            onHide={handleClose}
            aria-labelledby="contained-modal-title-vcenter"
            className={styles.txnModal}
            centered
            animation={false}>
            <Modal.Header closeButton>
                <img
                    src={props.data.logo}
                    width="auto"
                    height="36px"
                    className="d-inline-block align-top"
                    alt={`${props.data.name} Logo`}
                />
                <div className={styles.assetName}>{props.data.name}</div>
                {depositCompleted || depositFailed ? '' :  <div className={styles.txnTypeDesc}>
                    {t('DepositModal.DepositToSavingsAccount')}
                </div>}
            </Modal.Header>
            {
                depositCompleted ? TxnSuccessMsg :
                    depositFailed ? TxnErrorMsg : ModalRendered
            }
        </Modal>
    )
}
