import React, {useContext, useState} from 'react'
import {Button, Modal, Form} from 'react-bootstrap'
import CoreMethod from '../../methods/CoreMethod'
import LoadingIcon from '../../images/loanloading.svg'
import { useTranslation } from 'react-i18next'
import CheckIcon from '../../images/checkyellow.svg'
import ErrorIcon from '../../images/error.svg'
import CoreData from '../../methods/CoreData'
import BigNumber from 'bignumber.js'
import log from '../../utils/logger'
import { NetworkTypeContext, WalletAddressContext, Web3Context } from '../../context'
import FetchData from '../../methods/FetchData'
import {SiBing} from "react-icons/all";

export default function RepayModal(props) {
    const { connectedAddress } = useContext(WalletAddressContext)
    const { networkType } = useContext(NetworkTypeContext)
    const { web3 } = useContext(Web3Context)

    const styles = props.styles
    const { t } = useTranslation()
    const [inputValue, setInputValue] = useState('')
    const [invalidInput, setInvalidInput] = useState(false)
    const [overPay, setOverPay] = useState(false)
    const [loading, setLoading] = useState(false)
    const [repayInFull, setRepayInFull] = useState(true)
    const [lowBalance, setLowBalance] = useState(false)
    const [repayCompleted, setRepayCompleted] = useState(false)
    const [repayFailed, setRepayFailed] = useState(false)
    const [txnHash, setTxnHash] = useState('')
    const [needsFurtherApproval, setNeedsFurtherApproval] = useState(false)
    const [allowanceFormatted, setAllowanceFormatted] = useState('')

    const validateInput = async(value) => {
        let newValue = new BigNumber(value)

        if (newValue.isNegative()) {
            newValue = newValue.absoluteValue()
            setInputValue(newValue.toString())
            setInvalidInput(false)
        } else {
            setInputValue(value)
            const IS_NUMERIC = /^(\d+(\.\d+)?)?$/
            const isNumeric = (str) => IS_NUMERIC.test(str)
            setInvalidInput(!isNumeric(value))
        }

        const txnValue = await getRawValue(
            CoreData.fixedNaN(newValue)
        )
        if(parseFloat(props.data.loanBalance) < parseFloat(txnValue)) {
            setOverPay(true)
        } else {
            setOverPay(false)
        }

        if (parseFloat(props.data.walletBalance) < parseFloat(txnValue)) {
            setLowBalance(true)
        } else {
            setLowBalance(false)
        }
    }

    const getRawValue = async(value) => {
        return CoreData.getRawValue(web3, networkType, props.data.symbol, value)
    }

    const handleClose = async() => {
        setInputValue('')
        setInvalidInput(false)
        setOverPay(false)
        setLoading(false)
        setRepayInFull(true)
        setLowBalance(false)
        setRepayCompleted(false)
        setRepayFailed(false)
        setTxnHash('')
        setNeedsFurtherApproval(false)
        props.handleClose()
    }

    const verifyFurtherApproval = async (txnValue) => {
        if(CoreData.isNativeToken(props.data.symbol)) return Promise.resolve(true)

        const { allowance, allowanceFormatted } = await FetchData.getAccountAllowance(web3, connectedAddress, networkType, props.data)
        if (allowance && allowance < Number(txnValue)) {
            log.warn('needs further approval:', allowance, Number(txnValue))
            setNeedsFurtherApproval(true)
            setAllowanceFormatted(allowanceFormatted)
            return Promise.resolve(false)
        }

        return Promise.resolve(true)
    }

    const setMaximum = async(fullPayOnly) => {
        let loanRepayAmount = props.data.loanBalanceFormatted;
        console.log("repay===>", loanRepayAmount, props.data.walletBalanceFormatted)
        if (parseFloat(loanRepayAmount) > parseFloat(props.data.walletBalanceFormatted)) {
            if (fullPayOnly) {
                setLowBalance(true)
                setLoading(false)
                setRepayInFull(false)
            } else {
                loanRepayAmount = props.data.walletBalanceFormatted;
            }
        }
        // const repayAmount = await fromWei(props.data, loanRepayAmount)
        setInputValue(loanRepayAmount.toString())
        return loanRepayAmount.toString();
    }



    const handleRepay = async(max) => {
        setLoading(true)
        if(max && (parseFloat(props.data.loanBalance) > parseFloat(props.data.walletBalance))) {
            setLowBalance(true)
            setLoading(false)
            setRepayInFull(false)
            return
        } else if(lowBalance || overPay || invalidInput) {
            setLoading(false)
            return
        } else {
            const minusOne = new BigNumber(2).pow(256).minus(1);
            let repayAmount = null;
            if (max) {
                repayAmount = minusOne.toString(10)
            } else {
                repayAmount = await getRawValue(inputValue)
            }

            const isValidAllowance = await verifyFurtherApproval(repayAmount)
            if (!isValidAllowance) {
                setLoading(false)
                return
            }

            const contract = await CoreData.getQTokenContract(web3, networkType, props.data.symbol)
            const gasInfo = await CoreData.getGasInfo(web3)

            if(CoreData.isNativeToken(props.data.symbol)) {
                if (max) {
                    repayAmount = BigNumber(props.data.loanBalance).multipliedBy(1.001).toFixed(0)
                    const maximillionContract = await CoreData.getMaximillion(web3, networkType)
                    await maximillionContract.methods.repayBehalf(connectedAddress).send({
                        from: connectedAddress,
                        gasLimit: web3.utils.toHex(gasInfo.gasLimit),
                        gasPrice: web3.utils.toHex(gasInfo.gasPrice),
                        value: repayAmount
                    })
                    .on('transactionHash', function(hash) {
                        log.info(hash)
                        props.data.repayTxnHash = hash
                        setTxnHash(hash) // we use this only for the modal's state
                    })
                    .then(response => {
                        log.info(response)
                        if(response.events.Failure) {
                            setRepayFailed(true)
                        } else {
                            setRepayCompleted(true)
                        }
                        props.data.repayTxnHash = null
                        setLoading(false)
                    })
                    .catch(error => {
                        if(error.code === 4001) {
                            handleClose()
                        } else {
                            setRepayFailed(true)
                            props.data.repayTxnHash = null
                        }
                    })
                } else {
                    await contract.methods.repayBorrow().send({
                        from: connectedAddress,
                        gasLimit: web3.utils.toHex(gasInfo.gasLimit),      // posted at compound.finance/developers#gas-costs
                        gasPrice: web3.utils.toHex(gasInfo.gasPrice), // use ethgasstation.info (mainnet only)
                        value: repayAmount
                    })
                    .on('transactionHash', function(hash) {
                        log.info(hash)
                        props.data.repayTxnHash = hash
                        setTxnHash(hash) // we use this only for the modal's state
                    })
                    .then(response => {
                        log.info(response)
                        if(response.events.Failure) {
                            setRepayFailed(true)
                        } else {
                            setRepayCompleted(true)
                        }
                        props.data.repayTxnHash = null
                        setLoading(false)
                    })
                    .catch(error => {
                        if(error.code === 4001) {
                            handleClose()
                        } else {
                            setRepayFailed(true)
                            props.data.repayTxnHash = null
                        }
                    })
                }
            } else {
                await contract.methods.repayBorrow(web3.utils.toBN(repayAmount)).send({
                    from: connectedAddress,
                    gasLimit: web3.utils.toHex(gasInfo.gasLimit),      // posted at compound.finance/developers#gas-costs
                    gasPrice: web3.utils.toHex(gasInfo.gasPrice), // use ethgasstation.info (mainnet only)
                })
                .on('transactionHash', function(hash) {
                    log.info(hash)
                    props.data.repayTxnHash = hash
                    setTxnHash(hash) // we use this only for the modal's state
                })
                .then(response => {
                    log.info(response)
                    if(response.events.Failure) {
                        setRepayFailed(true)
                    } else {
                        setRepayCompleted(true)
                    }
                    props.data.repayTxnHash = null
                })
                .catch(error => {
                    //log.error(error)
                    if(error.code === 4001) {
                        handleClose()
                    } else {
                        setRepayFailed(true)
                        props.data.repayTxnHash = null
                    }
                })
            }
        }
    }

    const handleApprove = async() => {
        setLoading(true)
        await CoreMethod.approveERC20(web3, connectedAddress, networkType, props.data)
            .then(async response => {
                if (response) {
                    const txnValue = await getRawValue(inputValue)
                    await verifyFurtherApproval(txnValue)
                }
                setLoading(false)
            })
            .catch(error => {
                if (error.code === 4001) {
                    handleClose()
                }
            })
    }

    const RepayButton =
        (invalidInput || overPay || lowBalance || isNaN(parseFloat(inputValue)) || parseFloat(inputValue) <= 0 )?
            <Button variant="loans" disabled>{t('Common.Repay')}</Button> :
            <Button variant="loans" onClick={() => handleRepay(false)}>{t('Common.Repay')}</Button>


    const ModalLoading =
        <div>
            <Modal.Body>
                <div className={styles.loadingContainer}>
                    <img
                        src={LoadingIcon}
                        width="auto"
                        height="60px"
                        className="d-inline-block align-top"
                        alt="loading"
                        />
                    {
                        props.data.repayTxnHash == null ? '' :
                        <a style={{ color: '#BDB780' }} href={CoreData.getExplorerUrl(txnHash, networkType)} target="_blank">{t('Common.ViewTxnOnExplorer')}</a>
                    }
                </div>
            </Modal.Body>
        </div>


    const ModalRepayForm = repayInFull ?
            <div>
                <Modal.Body>
                    <div className={styles.repayInFullContainer}>
                        <Button variant="loans" onClick={() => handleRepay(true)}>{t('RepayModal.RepayFullAmountDue')}</Button>
                        <Button variant="cancel" onClick={() => setRepayInFull(false)}>{t('RepayModal.RepayCustomAmount')}</Button>
                    </div>
                </Modal.Body>
                <div className={styles.footerInfo}>
                    <div>{t('Common.WalletBalance')}</div>
                    <div className={styles.tokenBalance}>
                        {`${parseFloat(props.data.walletBalanceFormatted).toFixed(4)} ${props.data.symbol}`}
                    </div>
                </div>
                <div className={styles.footerInfo}>
                    <div>{t('RepayModal.LoanAmountDue')}</div>
                    <div className={styles.tokenBalance}>
                        {parseFloat(props.data.loanBalanceFormatted).toFixed(2) + ' ' + props.data.symbol}
                    </div>
                </div>
                <div className={styles.detailedBalance}>
                {t('RepayModal.DetailedAmountDue')} {parseFloat(props.data.loanBalanceFormatted) + ' ' + props.data.symbol}
                </div>
            </div> :
            <div>
                <Modal.Body>
                    <Form >
                        <div className={styles.formGroup}>
                            <Form.Group controlId="formDeposit">
                                <Form.Control
                                    className={styles.txnValue}
                                    type="number"
                                    placeholder={"0.00 " + props.data.symbol}
                                    autoComplete="off"
                                    value={inputValue}
                                    min="0"
                                    onChange={e => validateInput(e.target.value)} />
                                <Button variant="secondary" onClick={() => setMaximum(false)}>{t('Common.Maximum')}</Button>
                            </Form.Group>
                        </div>
                    </Form>
                    {invalidInput ? (
                        <div className={styles.txnError}>{t('RepayModal.InvalidInput')}</div>
                    ) : overPay ? (
                        <div className={styles.txnError}>{t('RepayModal.OverPayError')}</div>
                    ) : lowBalance ? (
                        <div className={styles.txnError}>{t('RepayModal.LowBalanceError')}</div>
                    ) : ''}
                    <div className={styles.footerInfo}>
                        <div>{t('Common.WalletBalance')}</div>
                        <div className={styles.tokenBalance}>
                            {`${parseFloat(props.data.walletBalanceFormatted).toFixed(4)} ${props.data.symbol}`}
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    {RepayButton}
                    <Button variant="cancel" onClick={handleClose}>{t('Common.Cancel')}</Button>
                </Modal.Footer>
                <div className={styles.footerInfo}>
                    <div>{t('RepayModal.LoanAmountDue')}</div>
                    <div className={styles.tokenBalance}>
                        {parseFloat(props.data.loanBalanceFormatted).toFixed(2) + ' ' + props.data.symbol}
                    </div>
                </div>
                <div className={styles.detailedBalance}>
                {t('RepayModal.DetailedAmountDue')} {parseFloat(props.data.loanBalanceFormatted) + ' ' + props.data.symbol}
                </div>
            </div>

    const ModalApprovalRequest =
        <div>
            <Modal.Body>
                <div className={styles.approvalMsg}>{t('Common.ApprovalMsg')}</div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="loans" onClick={handleApprove}>{t('Common.Approve')}</Button>
                <Button variant="cancel" onClick={handleClose}>{t('Common.Cancel')}</Button>
            </Modal.Footer>
        </div>

    const ModalFurtherApprovalRequest =
        <div>
            <Modal.Body>
                <div className="alertMsg">
                    {t('Common.FurtherApprovalMsg', {type: t('Common.RepayAmount'), inputValue, allowanceFormatted})}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="savings" onClick={handleApprove}>{t('Common.FurtherApprove')}</Button>
                <Button variant="cancel" onClick={handleClose}>{t('Common.Cancel')}</Button>
            </Modal.Footer>
        </div>

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
                <div className={styles.approvalMsg}>{t('RepayModal.SuccessMsg')}</div>
                <a className={styles.borrowLink} style={{color: "#BDB780"}} href={CoreData.getExplorerUrl(txnHash, networkType)} target="_blank">{t('Common.ViewTxnOnExplorer')}</a>
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
                <div className={styles.approvalMsg}>{t('RepayModal.ErrorMsg')}</div>
                <a className={styles.borrowLink} style={{color: "#BDB780"}} href={CoreData.getExplorerUrl(txnHash, networkType)} target="_blank">{t('Common.ViewTxnOnExplorer')}</a>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="cancel" onClick={handleClose}>{t('Common.Close')}</Button>
            </Modal.Footer>
        </div>

    const ModalLoaded = props.data.approved ? ModalRepayForm : ModalApprovalRequest
    const ModalRendered = loading ? ModalLoading : (props.data.approved && needsFurtherApproval) ? ModalFurtherApprovalRequest : ModalLoaded

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
                {repayCompleted || repayFailed ? '' : <div className={styles.txnTypeDesc}>
                    {t('Common.RepayAssets')}
                </div>}
            </Modal.Header>
            {
                repayCompleted ? TxnSuccessMsg : repayFailed ? TxnErrorMsg : ModalRendered
            }
        </Modal>
    )
}
