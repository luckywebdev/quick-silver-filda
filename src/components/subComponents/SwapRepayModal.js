import React, { useState, useEffect, useContext } from 'react'
import {Button, Modal, Form, Row, Col} from 'react-bootstrap'
import { FaAngleDown, FaExclamationTriangle } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import BigNumber from 'bignumber.js'
import CoreMethod from '../../methods/CoreMethod'
import LoadingIcon from '../../images/loanloading.svg'
import LoadingSpinner from '../../images/loadingspin.svg'
import CheckIcon from '../../images/checkyellow.svg'
import ErrorIcon from '../../images/error.svg'
import CoreData from '../../methods/CoreData'
import FetchData from '../../methods/FetchData'
import log from '../../utils/logger'
import SwapRepay from '../../lib/SwapRepay'
import SwapRouter from '../../lib/SwapRouter'
import Config from '../../utils/config'
import { NetworkTypeContext, WalletAddressContext, Web3Context } from '../../context'

export default function SwapRepayModal(props) {
    const { connectedAddress } = useContext(WalletAddressContext)
    const { networkType } = useContext(NetworkTypeContext)
    const { web3 } = useContext(Web3Context)

    const styles = props.styles;
    const { t } = useTranslation();

    const [swapValue, setSwapValue] = useState('')
    const [repayValue, setRepayValue] = useState('')
    const [swapAsset, setSwapAsset] = useState()
    const [swapData, setSwapData] = useState([])
    const [swapPath, setSwapPath] = useState([])
    const [showAssetSelect, setShowAssetSelect] = useState(false)
    const [loading, setLoading] = useState(false)
    const [initDone, setInitDone] = useState(false)

    const [invalidInput, setInvalidInput] = useState(false)
    const [overPay, setOverPay] = useState(false)
    const [calculating, setCalculating] = useState(false)
    const [lowBalance, setLowBalance] = useState(false)
    const [noSwapRoute, setNoSwapRoute] = useState(false)
    const [largeDeviation, setLargeDeviation] = useState(false)

    const [needsFurtherApproval, setNeedsFurtherApproval] = useState(false)
    const [allowanceFormatted, setAllowanceFormatted] = useState('')

    const [repayInFull, setRepayInFull] = useState(true)
    const [confirmFullRepay, setConfirmFullRepay] = useState(false)

    const [confirmDeviation, setConfirmDeviation] = useState(false)
    const [deviationAmount, setDeviationAmount] = useState('')
    const [checkedDeviation, setCheckedDeviation] = useState(false)

    const [repayCompleted, setRepayCompleted] = useState(false)
    const [repayFailed, setRepayFailed] = useState(false)
    const [txnHash, setTxnHash] = useState('')

    useEffect(() => {
        if (props.show === true) {
            const swapPairs = {
                "MDX": ["USDT", "HBTC", "ETH", "HT", "BEE", "CAN"],
                "HT": ["HBTC", "ETH", "HUSD"],
                "HBTC": ["ETH"],
                "USDT": ["HBTC", "HT", "HUSD", "ETH", "HLTC", "HBCH", "HDOT", "HFIL", "HPT", "LHB", "AAVE", "SNX", "UNI", "LINK", "BAL", "YFI", "MKR", "COMP", "SLNV2"],
                "HUSD": ["FILDA"]
            }
            const data = props.allData.filter((d) => {
                if (d.symbol === props.data.symbol || numberFromString(d.walletBalance) === 0) {
                    return false
                }
                if ((swapPairs[props.data.symbol] || []).indexOf(d.symbol) > -1) {
                    return true
                }
                if ((swapPairs[d.symbol] || []).indexOf(props.data.symbol) > -1) {
                    return true
                }
                return false
            })
            setSwapData(data)
        }
    }, [props.allData, props.data, props.show])

    useEffect(() => {
        if (swapAsset) {
            const index = props.allData.findIndex((d) => d.symbol === swapAsset.symbol)
            if (index > -1) {
                setSwapAsset(props.allData[index])
            }
        }
    }, [props.allData])

    useEffect(() => {
        if ((swapData || []).length === 0) {
            setSwapAsset(undefined)
        } else if (!swapAsset || (swapData.findIndex((d) => d.symbol === swapAsset.symbol) < 0)) {
            setSwapAsset(swapData[0])
        }
        setInitDone(true)
    }, [swapData])

    function numberFromString(s) {
        return CoreData.fixedNaN(parseFloat(s))
    }

    const getRawValue = async(symbol, value) => {
        return CoreData.getRawValue(web3, networkType, symbol, value)
    }

    const fromWei = async(market, amount) => {
        if (CoreData.isNativeToken(market.symbol)) {
            return await web3.utils.fromWei(amount.toString(), 'ether')
        }
        const decimals = await FetchData.getDecimals(web3, networkType, market);
        return BigNumber(amount).shiftedBy(-parseInt(decimals))
    }

    const getTokenAddress = (symbol) => {
        if (symbol === 'HT') return Config.WHT
        return Config.markets[symbol].network[networkType].address
    }

    const getQTokenAddress = (symbol) => {
        return Config.markets[symbol].qToken.network[networkType].address
    }

    const newSwapRepay = () => {
        return new SwapRepay(web3, Config.WHT, Config.SwapRepayContract, newSwapRouter(), onTransactionHash);
    }

    const newSwapRouter = () => {
        return new SwapRouter(web3, getTokenAddress('USDT'), getTokenAddress('HUSD'), Config.WHT, Config.MDEXRouter);
    }

    const validateRepayValue = async(repayValue) => {
        if (new BigNumber(props.data.loanBalance).isLessThan(repayValue)) {
            setOverPay(true)
        } else {
            setOverPay(false)
        }
    }

    const calculateInAmount = async(amountOut) => {
        const swapRouter = newSwapRouter();
        const res = await swapRouter.getAmountOutRouter(amountOut, getTokenAddress(swapAsset.symbol), getTokenAddress(props.data.symbol))
        setNoSwapRoute(res.path.length === 0)
        setSwapPath(res.path)
        return res
    }

    const validateSwapValue = async(swapValue) => {
        if (new BigNumber(swapAsset.walletBalance).isLessThan(swapValue)) {
            setLowBalance(true)
        } else {
            setLowBalance(false)
        }
    }

    const calculateOutAmount = async(amountIn) => {
        const swapRouter = newSwapRouter();
        const res = await swapRouter.getAmountInRouter(amountIn, getTokenAddress(swapAsset.symbol), getTokenAddress(props.data.symbol))
        setNoSwapRoute(res.path.length === 0)
        setSwapPath(res.path)
        return res
    }

    const onSwapValueUpdate = async(value) => {
        let newValue = new BigNumber(value)

        if (newValue.isNegative()) {
            newValue = newValue.absoluteValue()
            setSwapValue(newValue.toString())
            setInvalidInput(false)
        } else {
            setSwapValue(value)
            const IS_NUMERIC = /^(\d+(\.\d+)?)?$/
            const isNumeric = (str) => IS_NUMERIC.test(str)
            setInvalidInput(!isNumeric(value))
        }

        setOverPay(false)
        setLowBalance(false)
        setLargeDeviation(false)
        if (numberFromString(newValue) === 0) {
            setRepayValue('')
            return
        }

        setCalculating(true)
        const txnValue = await getRawValue(
            swapAsset.symbol,
            numberFromString(newValue)
        )
        const res = await calculateOutAmount(txnValue)
        const outAmount = res.amount
        const amount = await fromWei(props.data, outAmount)
        setCalculating(false)

        setRepayValue(amount.toString())
        validateSwapValue(txnValue)
        validateRepayValue(outAmount)
    }

    const onTransactionHash = (hash) => {
        log.info(hash)
        props.data.repayTxnHash = hash
        setTxnHash(hash) // we use this only for the modal's state
    }

    const verifyFurtherApproval = async (txnValue) => {
        if (!CoreData.isNativeToken(swapAsset.symbol)) {
            const { allowance, allowanceFormatted } = await FetchData.getSwapRepayAllowance(web3, connectedAddress, networkType, swapAsset)
            if (allowance && allowance < Number(txnValue)) {
                setNeedsFurtherApproval(true)
                setAllowanceFormatted(allowanceFormatted)
                return Promise.resolve(false)
            }
        }

        return Promise.resolve(true)
    }

    const handleRepay = async(fullPay) => {
        // bad price check
        const warningLevel = 2 // (%) - show warnings
        const criticalLevel = 10 // (%) - stop repay

        const swapPrice = new BigNumber(swapValue).multipliedBy(swapAsset.price)
        const repayPrice = new BigNumber(repayValue).multipliedBy(props.data.price)
        const deviation = swapPrice.minus(repayPrice)
        setDeviationAmount(deviation.toFixed(6))
        if (deviation > swapPrice.multipliedBy(criticalLevel / 100.0)) {
            setConfirmFullRepay(false)
            setRepayInFull(false)
            setLargeDeviation(true)
            return
        } 
        if(lowBalance || overPay || invalidInput) {
            setLoading(false)
            return
        } 
        if (deviation > swapPrice.multipliedBy(warningLevel / 100.0) && !confirmDeviation) {
            setConfirmDeviation(true)
            setCheckedDeviation(false)
            return
        }
        setConfirmDeviation(false)

        // swap and repay
        setLoading(true)
        const swapRepay = newSwapRepay()
        const swapAmount = await getRawValue(swapAsset.symbol, swapValue)
        const repayAmount = await getRawValue(props.data.symbol, repayValue)

        const swapToken = getTokenAddress(swapAsset.symbol)
        const swapQToken = getQTokenAddress(swapAsset.symbol)
        const repayToken = getTokenAddress(props.data.symbol)
        const repayQToken = getQTokenAddress(props.data.symbol)

        try {
            const isValidAllowance = await verifyFurtherApproval(swapAmount)
            if (!isValidAllowance) {
                setLoading(false)
                return
            }

            let response = null
            if (repayAmount === props.data.loanBalance || fullPay) {
                // always out router is pre called
                // exceptional case maybe when the user inputed manually but matched repayAmount exactly but almost impossible
                const amountInMax = BigNumber(swapAmount).multipliedBy(1.1).toFixed(0)
                if (CoreData.isNativeToken(swapAsset.symbol) && !CoreData.isNativeToken(props.data.symbol)) {
                    response = await swapRepay.swapETHRepayERC20All(swapPath, repayQToken, connectedAddress, amountInMax)
                } else if (!CoreData.isNativeToken(swapAsset.symbol) && CoreData.isNativeToken(props.data.symbol)) {
                    response = await swapRepay.swapERC20RepayETHAll(swapPath, repayQToken, amountInMax, connectedAddress)
                } else {
                    response = await swapRepay.swapERC20RepayERC20All(swapPath, repayQToken, amountInMax, connectedAddress)
                }
            } else {
                // always in router is pre called
                const amountOutMin = BigNumber(repayAmount).multipliedBy(0.9).toFixed(0)
                if (CoreData.isNativeToken(swapAsset.symbol) && !CoreData.isNativeToken(props.data.symbol)) {
                    response = await swapRepay.swapExactETHRepayERC20(swapPath, repayQToken, amountOutMin, connectedAddress, swapAmount)
                } else if (!CoreData.isNativeToken(swapAsset.symbol) && CoreData.isNativeToken(props.data.symbol)) {
                    response = await swapRepay.swapExactERC20RepayETH(swapPath, swapAmount, repayQToken, amountOutMin, connectedAddress)
                } else {
                    response = await swapRepay.swapExactERC20RepayERC20(swapPath, swapAmount, repayQToken, amountOutMin, connectedAddress)
                }
            }

            log.info(response)

            if (props.show === false) {
                return
            }

            if(response.events.Failure) {
                setRepayFailed(true)
            } else {
                setRepayCompleted(true)
            }
            props.data.repayTxnHash = null
            setLoading(false)
        } catch(error) {
            console.log(error)
            if(error.code === 4001) {
                handleClose()
            } else {
                setRepayFailed(true)
                props.data.repayTxnHash = null
            }
        }
    }

    const handleRepayFull = async() => {
        await setMaximum(true)
        setConfirmFullRepay(true) 
    }

    const setMaximum = async(fullPayOnly) => {
        let loanRepayAmount = props.data.loanBalance
        const res = await calculateInAmount(loanRepayAmount.toString())
        let loanSwapAmount = res.amount
        if (parseFloat(loanSwapAmount) > parseFloat(swapAsset.walletBalance)) {
            if (fullPayOnly) {
                setLowBalance(true)
                setLoading(false)
                setRepayInFull(false)
            } else {
                loanSwapAmount = swapAsset.walletBalance
                const res = await calculateOutAmount(loanSwapAmount.toString())
                loanRepayAmount = res.amount
            }
        }
        const swapAmount = await fromWei(swapAsset, loanSwapAmount)
        setSwapValue(swapAmount.toString())
        validateSwapValue(loanSwapAmount)
        const repayAmount = await fromWei(props.data, loanRepayAmount)
        setRepayValue(repayAmount.toString())
        validateRepayValue(loanRepayAmount)
        return [swapAmount.toString(), repayAmount.toString()]
    }

    const handleApprove = async() => {
        setLoading(true)
        await CoreMethod.approveSwapRepayERC20(web3, connectedAddress, networkType, swapAsset)
            .then(async response => {
                if (response) {
                    const txnValue = await getRawValue(swapAsset.symbol, swapValue)
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

    const handleSelectAsset = async(asset) => {
        setShowAssetSelect(false)
        setSwapAsset(asset)
        setNoSwapRoute(false)
        setLowBalance(false)
        setOverPay(false)
        setLargeDeviation(false)
        setSwapValue('')
        setRepayValue('')
    }

    const handleClose = async() => {
        setInvalidInput(false)
        setOverPay(false)
        setLowBalance(false)
        setLargeDeviation(false)
        setNoSwapRoute(false)

        setLoading(false)
        setCalculating(false)
        setInitDone(false)

        setSwapAsset()
        setSwapValue('')
        setRepayValue('')
        setRepayInFull(true)
        setRepayCompleted(false)
        setRepayFailed(false)
        setTxnHash('')

        setNeedsFurtherApproval(false)
        setConfirmFullRepay(false)
        setConfirmDeviation(false)
        setShowAssetSelect(false)
        props.handleClose()
    }

    //UI Rendering

    const RepayButton = 
        (swapPath.length === 0 || calculating || invalidInput ||  overPay || lowBalance || isNaN(parseFloat(swapValue)) || isNaN(parseFloat(repayValue)) || parseFloat(swapValue) <= 0 || parseFloat(repayValue) <= 0 )?
            <Button variant="loans" disabled>{t('Common.Repay')}</Button> :
            <Button variant="loans" onClick={() => handleRepay(false)}>{t('Common.Repay')}</Button>

    const ModalLoading = () =>
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
                        props.data.repayTxnHash === null ? '' :
                        <a style={{ color: '#BDB780' }} href={CoreData.getExplorerUrl(txnHash, networkType)} target="_blank">{t('Common.ViewTxnOnExplorer')}</a>
                    }
                </div>
            </Modal.Body>
        </div>

        const ModalRepayOption = () =>
            <div>
                <Modal.Body>
                    <div className={styles.repayInFullContainer}>
                        <Button variant="loans" onClick={handleRepayFull}>{t('RepayModal.RepayFullAmountDue')}</Button>
                        <Button variant="cancel" onClick={() => setRepayInFull(false)}>{t('RepayModal.RepayCustomAmount')}</Button>
                    </div>
                </Modal.Body>
                {
                    swapAsset &&
                    <div className={styles.footerInfo}>
                        <div>{t('Common.WalletBalance')}</div>
                        <div className={styles.tokenBalance}>
                            {parseFloat(swapAsset.walletBalanceFormatted).toFixed(6) + ' ' + swapAsset.symbol}
                        </div>
                    </div>
                }
                <div className={styles.footerInfo}>
                    <div>{t('RepayModal.LoanAmountDue')}</div>
                    <div className={styles.tokenBalance}>
                        {parseFloat(props.data.loanBalanceFormatted).toFixed(6) + ' ' + props.data.symbol}
                    </div>
                </div>
                <div className={styles.detailedBalance}>
                {t('RepayModal.DetailedAmountDue')} {parseFloat(props.data.loanBalanceFormatted) + ' ' + props.data.symbol}
                </div>
            </div>

        const ModalRepayCustom = () =>
            <div>
                <Modal.Body>
                    <Form>
                        <div className={styles.formGroup}>
                            <Form.Group controlId="formSwapValue">
                                <Form.Control
                                className={styles.txnValue}
                                type="number"
                                placeholder={"0.00 " + swapAsset.symbol}
                                autoComplete="off"
                                value={swapValue}
                                min="0"
                                onChange={e => onSwapValueUpdate(e.target.value)} />
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
                    ) : noSwapRoute ? (
                        <div className={styles.txnError}>{t('SwapRepayModal.NoSwapRouteError')}</div>
                    ) : largeDeviation ? (
                        <div className={styles.txnError}>{t('SwapRepayModal.LargeDeviationError')}</div>
                    ) : ''}
                    <div className={styles.footerInfo}>
                        <div>{t('Common.RepayAmount')}</div>
                        <div className={styles.tokenBalance}>
                            {`${numberFromString(repayValue).toFixed(6)} ${props.data.symbol} `}
                            {calculating && <img src={LoadingSpinner} width="20" className="d-inline-block align-top" alt="" />}
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    {RepayButton}
                    <Button variant="cancel" onClick={handleClose}>{t('Common.Cancel')}</Button>
                </Modal.Footer>
                <div className={styles.footerInfo}>
                    <div>{t('Common.WalletBalance')}</div>
                    <div className={styles.tokenBalance}>
                        {parseFloat(swapAsset.walletBalanceFormatted).toFixed(6) + ' ' + swapAsset.symbol}
                    </div>
                </div>
                <div className={styles.footerInfo}>
                    <div>{t('RepayModal.LoanAmountDue')}</div>
                    <div className={styles.tokenBalance}>
                        {parseFloat(props.data.loanBalanceFormatted).toFixed(6) + ' ' + props.data.symbol}
                    </div>
                </div>
                <div className={styles.detailedBalance}>
                {t('RepayModal.DetailedAmountDue')} {parseFloat(props.data.loanBalanceFormatted) + ' ' + props.data.symbol}
                </div>
            </div>

    const ModalConfirmFullRepay = () =>
        <div>
            <Modal.Body>
                <div className={styles.approvalMsg}>
                    {t('SwapRepayModal.RepayConfirmMsg', 
                    {swapValue: `${numberFromString(swapValue).toFixed(6)} ${swapAsset.symbol} `,
                    repayValue: `${numberFromString(repayValue).toFixed(6)} ${props.data.symbol} `})}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="loans" onClick={() => handleRepay(true)}>{t('Common.Confirm')}</Button>
                <Button variant="cancel" onClick={() => setConfirmFullRepay(false)}>{t('Common.Cancel')}</Button>
            </Modal.Footer>
        </div>

    const ModalConfirmDeviation = () =>
        <div>
            <Modal.Body>
                <FaExclamationTriangle className={styles.warning} />
                <div className={styles.approvalMsg}>
                    {t('SwapRepayModal.DeviationWarning', 
                    {value: deviationAmount})}
                </div>
                <Form.Check
                    className={styles.checkBox}
                    type="checkbox"
                    label={t('Common.IUnderstand')}
                    onChange={() => {setCheckedDeviation(v => !v)}}
                    checked={checkedDeviation}
                />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="loans" onClick={() => handleRepay(repayInFull)} disabled={!checkedDeviation}>{t('Common.Repay')}</Button>
                <Button variant="cancel" onClick={() => setConfirmDeviation(false)}>{t('Common.Cancel')}</Button>
            </Modal.Footer>
        </div>

    const ModalApprovalRequest = () =>
        <div>
            <Modal.Body>
                <div className={styles.approvalMsg}>{t('Common.ApprovalMsg')}</div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="loans" onClick={handleApprove}>{t('Common.Approve')}</Button>
                <Button variant="cancel" onClick={handleClose}>{t('Common.Cancel')}</Button>
            </Modal.Footer>
        </div>

    const ModalFurtherApprovalRequest = () =>
        <div>
            <Modal.Body>
                <div className="alertMsg">
                    {t('Common.FurtherApprovalMsg', {type: t('Common.Swap'), inputValue: swapValue, allowanceFormatted})}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="savings" onClick={handleApprove}>{t('Common.FurtherApprove')}</Button>
                <Button variant="cancel" onClick={handleClose}>{t('Common.Cancel')}</Button>
            </Modal.Footer>
        </div>

    const AssetSelectDialog = () =>
        <Modal
            show={showAssetSelect}
            onHide={() => setShowAssetSelect(false)}
            aria-labelledby="contained-modal-title-vcenter"
            className={styles.assetSelectModal}
            centered
            animation={false}>
            <Modal.Header closeButton>
                <div className={styles.selectAssetDesc}>
                    {t('Common.SelectAsset')}
                </div>
            </Modal.Header>
            <div className={styles.selectContainer}>
                {
                    swapData.map(data =>
                        <Row className={styles.assetItemRow} key={data.symbol} onClick={() => handleSelectAsset(data)}>
                            <Col md={12} className={styles.assetNameContainer}>
                                <img
                                    src={data.logo}
                                    width="40"
                                    height="40"
                                    className="d-inline-block align-top"
                                    alt="Logo"
                                    />
                                <div className={styles.assetName}>{data.name}</div>
                            </Col>
                        </Row>)
                }
            </div>
        </Modal>

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
                {txnHash && <a className={styles.borrowLink} style={{color: "#BDB780"}} href={CoreData.getExplorerUrl(txnHash, networkType)} target="_blank">{t('Common.ViewTxnOnExplorer')}</a>}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="cancel" onClick={handleClose}>{t('Common.Close')}</Button>
            </Modal.Footer>
        </div>

    const NoSwapList = 
        <div>
            <Modal.Body>
                <div className={styles.approvalMsg}>{t('SwapRepayModal.NoSwapList')}</div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="cancel" onClick={handleClose}>{t('Common.Close')}</Button>
            </Modal.Footer>
        </div>

    const needsApproval = swapAsset && !swapAsset.swapRepayApproved
    const ModalRepayForm = () => confirmDeviation ? ModalConfirmDeviation() : !repayInFull ? ModalRepayCustom() : confirmFullRepay ? ModalConfirmFullRepay() : ModalRepayOption()
    const ModalLoaded = () => !swapAsset ? NoSwapList : needsApproval ? ModalApprovalRequest() : ModalRepayForm()
    const ModalRendered = () => loading ? ModalLoading() : needsFurtherApproval ? ModalFurtherApprovalRequest() : ModalLoaded()

    return showAssetSelect ? AssetSelectDialog() :
        <Modal
            show={props.show && initDone}
            onHide={handleClose}
            aria-labelledby="contained-modal-title-vcenter"
            className={styles.txnModal}
            centered
            animation={false}>
            <Modal.Header closeButton>
                {
                    swapAsset && <>
                        <img
                            src={swapAsset.logo}
                            width="auto"
                            height="36px"
                            className="d-inline-block align-top"
                            alt="Filda Logo"
                            />
                        <Button className={styles.assetName} variant="outline-*" onClick={() => setShowAssetSelect(true)} disabled={confirmFullRepay}>
                            { swapAsset.name } <FaAngleDown/>
                        </Button>
                    </>
                }
                {repayCompleted || repayFailed ? '' : <>
                <div className={styles.txnTypeDesc}>{t('Common.SwapRepayAssets')}</div>
                <div className={styles.txnTypeTip}>{t('SwapRepayModal.Tip')}</div>
                </>}
            </Modal.Header>
            {
                repayCompleted ? TxnSuccessMsg :
                repayFailed ? TxnErrorMsg : ModalRendered()
            }
        </Modal>
}
