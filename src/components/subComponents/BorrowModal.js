import React, {useContext, useEffect, useState} from 'react'
import {Button, Modal, Form, ToggleButtonGroup, ToggleButton } from 'react-bootstrap'
import LoadingIcon from '../../images/loanloading.svg'
import ErrorIcon from '../../images/error.svg'
import CheckIcon from '../../images/checkyellow.svg'
import { useTranslation } from 'react-i18next'
import CoreData from '../../methods/CoreData'
import BigNumber from 'bignumber.js'
import log from '../../utils/logger'
import { NetworkTypeContext, WalletAddressContext, Web3Context } from '../../context'

export default function BorrowModal(props) {
    const { connectedAddress } = useContext(WalletAddressContext)
    const { networkType } = useContext(NetworkTypeContext)
    const { web3 } = useContext(Web3Context)

    const styles = props.styles
    const { t } = useTranslation()
    const [inputValue, setInputValue] = useState('')
    const [invalidInput, setInvalidInput] = useState(false)
    const [borrowBtnDisabled, setBorrowBtnDisabled] = useState(false)
    const [borrowCheck, setBorrowCheck] = useState(false)
    const [loading, setLoading] = useState(false)
    const [borrowCompleted, setBorrowCompleted] = useState(false)
    const [borrowFailed, setBorrowFailed] = useState(false)
    const [txnHash, setTxnHash] = useState('')

    let updatedLoanBalance = props.totalLoanBalance + (CoreData.fixedNaN(inputValue) * props.data.price)
    const loanUsedPercent = (updatedLoanBalance / props.totalBorrowLimitFiat) * 100
    let loanUsedPercentFixed2 = loanUsedPercent.toFixed(2)
    if (loanUsedPercentFixed2 === "NaN" || loanUsedPercentFixed2 === "Infinity") {
        loanUsedPercentFixed2 = "0"
    }

    const getValue = (percent=1) => {
        const borrowSafeMaxTotal = (props.totalBorrowLimitFiat/props.data.price) * percent
        const alreayBorrowAmount = props.totalLoanBalance/props.data.price
        let accountLiquidity = alreayBorrowAmount >= borrowSafeMaxTotal ? 0 : borrowSafeMaxTotal - alreayBorrowAmount
        let marketLiquidity = props.data.liquidityFormatted
        let borrowSafeMax = accountLiquidity > marketLiquidity ? marketLiquidity : accountLiquidity
        borrowSafeMax = CoreData.fixedNaN(borrowSafeMax)

        return borrowSafeMax
    }


    const borrowMaxTotal = getValue(0.99)
    const borrowAbove85 = getValue(0.85)

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

        const inputV = Number(value)
        
        if (inputV < borrowAbove85) {
            // <85%
            setBorrowBtnDisabled(false)
        } else if (inputV > borrowAbove85 && inputV <= borrowMaxTotal) {
            // >85% && <100
            setBorrowBtnDisabled(!borrowCheck)
        } else {
            // >100%
            setBorrowBtnDisabled(true)
        }

        console.log("inputV: ", inputV, "borrowAbove85: ", borrowAbove85, "borrowMaxTotal: ", borrowMaxTotal, "invalidInput: ", invalidInput)
    }

    useEffect(()=> {
        setBorrowBtnDisabled(!borrowCheck)
    }, [borrowCheck])

    const handleClose = async() => {
        setInputValue('')
        setInvalidInput(false)
        setBorrowBtnDisabled(false)
        setLoading(false)
        setBorrowCompleted(false)
        setBorrowFailed(false)
        setBorrowCheck(false)
        setTxnHash('')
        props.handleClose('borrow')
    }

    const handleBorrow = async() => {
        setLoading(true)

        const contract = await CoreData.getQTokenContract(web3, networkType, props.data.symbol)
        const gasInfo = await CoreData.getGasInfo(web3)

        const txnValue = await CoreData.getRawValue(web3, networkType, props.data.symbol, inputValue)

        let estimatedGas = await contract.methods.borrow(web3.utils.toBN(txnValue)).estimateGas()
        estimatedGas = estimatedGas * 5
        if (estimatedGas < gasInfo.gasLimit) estimatedGas = gasInfo.gasLimit

        await contract.methods.borrow(web3.utils.toBN(txnValue)).send({
            from: connectedAddress,
            gasLimit: estimatedGas,      // posted at compound.finance/developers#gas-costs
            gasPrice: web3.utils.toHex(gasInfo.gasPrice), // use ethgasstation.info (mainnet only)
        })
        .on('transactionHash', function(hash) {
            log.info(hash)
            props.data.borrowTxnHash = hash
            setTxnHash(hash) // we use this only for the modal's state
        })
        .then(response => {
            log.info(response)
            if(response.events.Failure) {
                setBorrowFailed(true)
            } else {
                setBorrowCompleted(true)
            }
            props.data.borrowTxnHash = null
            setLoading(false)
        })
        .catch(error => {
            log.error(error)
            if(error.code === 4001) {
                handleClose()
            } else {
                setBorrowFailed(true)
                props.data.borrowTxnHash = null
            }
        })
    }

    const changeInputValue = (value) => {
        const inputValue = new BigNumber(borrowMaxTotal).multipliedBy(value).toString(10)
        setInputValue(inputValue)
        validateInput(inputValue)
    }

    //UI Rendering

    const DepositButton =
        (invalidInput || borrowBtnDisabled || isNaN(parseFloat(inputValue)) || parseFloat(inputValue) <= 0 )?
            <Button variant="loans" disabled>{t('Common.Borrow')}</Button> :
            <Button variant="loans" onClick={handleBorrow}>{t('Common.Borrow')}</Button>


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
                        props.data.borrowTxnHash == null ? '' :
                        <a style={{ color: '#BDB780' }} href={CoreData.getExplorerUrl(txnHash, networkType)} target="_blank">{t('Common.ViewTxnOnExplorer')}</a>
                    }
                </div>
            </Modal.Body>
        </div>

    const ModalCannotBorrow =
        <div>
            <Modal.Body>
                <div className={styles.loadingContainer}>
                    <img
                        src={ErrorIcon}
                        width="auto"
                        height="60px"
                        className="d-inline-block align-top"
                        alt="loading"
                        />
                    <div className={styles.noCollateralMsgTitle}>{t('BorrowModal.CannotBorrowMsgTitle')}</div>
                    <div className={styles.noCollateralMsgDesc}>{t('BorrowModal.CannotBorrowMsgDesc')}</div>
                </div>
            </Modal.Body>
        </div>


    const ModalBorrowForm = (
        <div>
            <div className={styles.footerInfo}>
                <div>{t('BorrowModal.BorrowSafeMax')}</div>
                <div className={styles.tokenBalance}>
                    {(
                        Math.floor(parseFloat(borrowAbove85) * 100) / 100
                    ).toFixed(2) +
                        ' ' +
                        props.data.symbol}
                </div>
            </div>
            <Modal.Body>
                <Form>
                    <Form.Group controlId="formDeposit">
                        <Form.Control
                            className={styles.txnValue}
                            type="number"
                            placeholder={'0.00 ' + props.data.symbol}
                            autoComplete="off"
                            value={inputValue}
                            min="0"
                            onChange={(e) => validateInput(e.target.value)}
                        />
                        <ToggleButtonGroup name="default-value-list" type="radio" className="default-value-btn-list mt-2" onChange={changeInputValue}>
                            <ToggleButton variant="outline-primary" value={0.25} className="default-value-btn">25%</ToggleButton>
                            <ToggleButton variant="outline-primary" value={0.5} className="default-value-btn">50%</ToggleButton>
                            <ToggleButton variant="outline-primary" value={0.75} className="default-value-btn">75%</ToggleButton>
                            <ToggleButton variant="outline-primary" value={0.99} className="default-value-btn" >99%</ToggleButton>
                        </ToggleButtonGroup>

                    </Form.Group>
                    {invalidInput ? (
                        <div className={styles.txnError}>
                            {t('BorrowModal.InvalidInput')}
                        </div>
                    ) : Number(loanUsedPercentFixed2) > 99 ? (
                        <div className={styles.txnError}>
                            {t('BorrowModal.ExceedsBorrowLimit')}
                        </div>
                    ) : (
                        ''
                    )}

                    {
                        (Number(loanUsedPercentFixed2) > 85 && Number(loanUsedPercentFixed2) <= 99) &&
                        <div className={styles.checkTips}>
                            <img
                                src={ErrorIcon}
                                width="auto"
                                height="20"
                                className="d-inline-block align-middle"
                                alt="error"
                            />
                            <Form.Label className={styles.txnCheckTips}>{t('BorrowModal.BorrowCheckTips')}</Form.Label>
                            <Form.Check
                                type="switch"
                                id="borrowSwitch"
                                label=""
                                checked={borrowCheck}
                                onChange={() => setBorrowCheck(v =>!v)}
                            />
                        </div>
                    }
                </Form>
            </Modal.Body>
            <Modal.Footer>
                {DepositButton}
                <Button variant="cancel" onClick={handleClose}>
                    {t('Common.Cancel')}
                </Button>
            </Modal.Footer>
            <div className={styles.percentText}>
                {t('BorrowModal.LoanPercentageUsed')}{' '}
                <span className={styles.percentValue}>
                    {loanUsedPercentFixed2} %
                </span>
            </div>
            <div className={styles.loanLimitBarOuter}>
                <div
                    className={
                        Number(loanUsedPercentFixed2) > 85
                            ? styles.loanLimitExceedBarInner
                            : styles.loanLimitBarInner
                    }
                    style={{ width: loanUsedPercentFixed2 + '%' }}
                ></div>
            </div>
            <div className={styles.infoText}>{t('BorrowModal.Info')}</div>
        </div>
    )

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
                <div className={styles.approvalMsg}>{t('BorrowModal.SuccessMsg')}</div>
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
                <div className={styles.approvalMsg}>{t('BorrowModal.ErrorMsg')}</div>
                <a className={styles.borrowLink} style={{color: "#BDB780"}} href={CoreData.getExplorerUrl(txnHash, networkType)} target="_blank">{t('Common.ViewTxnOnExplorer')}</a>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="cancel" onClick={handleClose}>{t('Common.Close')}</Button>
            </Modal.Footer>
        </div>

    const ModalRendered = Number(props.data.totalBorrowLimitFiat) === 0 ? ModalCannotBorrow
                          : loading ? ModalLoading
                          : ModalBorrowForm


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
                    alt="Filda Logo"
                    />
                <div className={styles.assetName}>{props.data.name}</div>
                {
                    (parseFloat(props.data.totalBorrowLimitFiat) === 0) || (!borrowCompleted) || borrowFailed ? '' :
                    <div className={styles.txnTypeDesc}>
                        {t('Common.BorrowAssets')}
                    </div>
                }
            </Modal.Header>
            {
                borrowCompleted ? TxnSuccessMsg :
                borrowFailed ? TxnErrorMsg : ModalRendered
            }
        </Modal>
    )
}
