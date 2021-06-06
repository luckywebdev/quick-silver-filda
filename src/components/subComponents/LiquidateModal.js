import React, { useState, useEffect, useContext } from 'react'
import {Button, Modal, Form, Row, Col, InputGroup, Container} from 'react-bootstrap'
import { FaAngleDown } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import BigNumber from 'bignumber.js'
import { NetworkTypeContext, WalletAddressContext, Web3Context } from '../../context'
import LoadingIcon from '../../images/loanloading.svg'
import LoadingSpinner from '../../images/loadingspin.svg'
import CheckIcon from '../../images/checkyellow.svg'
import ErrorIcon from '../../images/error.svg'
import CoreMethod from '../../methods/CoreMethod'
import CoreData from '../../methods/CoreData'
import FetchData from '../../methods/FetchData'
import SwapRouter from '../../lib/SwapRouter'
import Liquidate from '../../lib/Liquidate'
import Config from '../../utils/config'
import log from '../../utils/logger'

export default function LiquidateModal(props) {
    const { connectedAddress } = useContext(WalletAddressContext)
    const { networkType } = useContext(NetworkTypeContext)
    const { web3 } = useContext(Web3Context)

    const { styles, repayAsset, receiveAsset, markets, borrower } = props;

    const { t } = useTranslation();

    const [swapAsset, setSwapAsset] = useState()
    const [swapValue, setSwapValue] = useState('')
    const [repayValue, setRepayValue] = useState('')
    const [receiveValue, setReceiveValue] = useState('')
    const [swapPath, setSwapPath] = useState([])

    const [loading, setLoading] = useState(false)
    const [calculating, setCalculating] = useState(0)

    const [repayCompleted, setRepayCompleted] = useState(false)
    const [repayFailed, setRepayFailed] = useState(false)
    const [txnHash, setTxnHash] = useState(null)
    const [needsFurtherApproval, setNeedsFurtherApproval] = useState(false)
    const [allowanceFormatted, setAllowanceFormatted] = useState('')
    const [showAssetSelect, setShowAssetSelect] = useState(false)

    const [overPay, setOverPay] = useState(false)
    const [lowBalance, setLowBalance] = useState(false)
    const [lowUserSupply, setLowUserSupply] = useState(false)
    const [noSwapRoute, setNoSwapRoute] = useState(false)

    /// <start>
    /// Constant Inits
    /// <start>
    const liquidateIncentive = 1.1
    const discount = 91

    const swapPairs = {
        "MDX": ["USDT", "HBTC", "ETH", "HT", "BEE", "CAN"],
        "HT": ["HBTC", "ETH", "HUSD"],
        "HBTC": ["ETH"],
        "USDT": ["HBTC", "HT", "HUSD", "ETH", "HLTC", "HBCH", "HDOT", "HFIL", "HPT", "LHB", "AAVE", "SNX", "UNI", "LINK", "BAL", "YFI", "MKR", "COMP", "SLNV2"],
        "HUSD": ["FILDA"]
    }
    const supportedSwapAssets = ["USDT", "HT", "HUSD"]

    const swappableAssets = function(){
        if (!repayAsset) return []
        const assetSymbols = supportedSwapAssets.filter((symbol) => (swapPairs[symbol] || []).includes(repayAsset.symbol) || (swapPairs[repayAsset.symbol] || []).includes(symbol))
        return markets.filter((m) => assetSymbols.includes(m.symbol)).filter((m) => new BigNumber(m.walletBalance).isGreaterThan(0))
    }()

    const repayMode = function() {
         // not initialized yet
        if (!repayAsset) {
            return 0
        }
        // user has enough assets for repay
        if (new BigNumber(repayAsset.walletBalance).isGreaterThan(0)) {
            return 1
        }
        // user has assets to swap for repay
        if (swappableAssets.length > 0) {
            return 2
        }
        return 0
    }()
    const transferAsset = repayMode === 1 ? repayAsset : repayMode === 2 ? swapAsset : undefined
    const transferValue = repayMode === 1 ? repayValue : repayMode === 2 ? swapValue : ''

    const unliquidatable = overPay || noSwapRoute || lowBalance || lowUserSupply || calculating > 0;

    
    const bonus = function() {
        if (!transferAsset || !receiveAsset) return 0
        const receivePrice = receiveAsset.price * receiveValue
        const repayPrice = transferAsset.price * transferValue
        return receivePrice - repayPrice
    }()
    /// <end>
    /// Constant Inits
    /// <end>

    /// <start>
    /// Utils
    /// <start>
    const fromWei = async(market, amount) => {
        if (CoreData.isNativeToken(market.symbol)) {
            return await web3.utils.fromWei(amount.toString(), 'ether')
        }
        const decimals = await FetchData.getDecimals(web3, networkType, market);
        return BigNumber(amount).shiftedBy(-parseInt(decimals))
    }

    const newSwapRouter = () => {
        return new SwapRouter(web3, CoreData.getTokenAddress(networkType, 'USDT'), CoreData.getTokenAddress(networkType,'HUSD'), Config.WHT, Config.MDEXRouter);
    }

    /// <end>
    /// Utils
    /// <end>

    /// <start>
    /// Set values from fixed amount
    /// <start>
    const validateInputs = (swapValue, repayValue, receiveValue) => {
        if (new BigNumber(swapValue).isNaN()) swapValue = '0'
        if (new BigNumber(repayValue).isNaN()) repayValue = '0'
        if (new BigNumber(receiveValue).isNaN()) receiveValue = '0'

        setLowBalance(new BigNumber(transferAsset.walletBalanceFormatted).isLessThan(repayMode === 1 ? repayValue : swapValue))
        setOverPay(new BigNumber(repayAsset.max_repay_underlying).isLessThan(repayValue))
        setLowUserSupply(new BigNumber(receiveAsset.collateral_balance_underlying).isLessThan(receiveValue))
    }

    const resetAlerts = () => {
        setOverPay(false)
        setLowBalance(false)
        setLowUserSupply(false)
    }

    const resetInputs = () => {
        resetAlerts()
        setSwapValue('')
        setRepayValue('')
        setReceiveValue('')
    }

    const calculateInAmount = async(amountOut) => {
        const swapRouter = newSwapRouter();
        const res = await swapRouter.getAmountOutRouter(amountOut, CoreData.getTokenAddress(networkType, swapAsset.symbol), CoreData.getTokenAddress(networkType, repayAsset.symbol))
        setNoSwapRoute(res.path.length === 0)
        return res
    }

    const calculateOutAmount = async(amountIn) => {
        const swapRouter = newSwapRouter();
        const res = await swapRouter.getAmountInRouter(amountIn, CoreData.getTokenAddress(networkType, swapAsset.symbol), CoreData.getTokenAddress(networkType, repayAsset.symbol))
        setNoSwapRoute(res.path.length === 0)
        return res
    }

    const calculateFromSwapValue = async(swapValue) => {
        if (new BigNumber(swapValue).isZero() || new BigNumber(swapValue).isNaN()) {
            resetAlerts()
            setRepayValue('')
            setReceiveValue('')
            return
        }

        setCalculating(2)
        const swapWeiAmount = await CoreData.getRawValue(web3, networkType, swapAsset.symbol, swapValue)
        const res = await calculateOutAmount(swapWeiAmount)
        const repayAmount = await fromWei(repayAsset, res.amount)
        setSwapPath(res.path)
        setRepayValue(repayAmount.toString())
        setCalculating(0)

        const receiveAmount = repayAmount * repayAsset.price / receiveAsset.price * liquidateIncentive
        setReceiveValue(receiveAmount.toString())

        validateInputs(swapValue, repayAmount, receiveAmount)
    }

    const calculateFromRepayValue = async(repayAmount) => {
        if (new BigNumber(repayAmount).isZero() || new BigNumber(repayAmount).isNaN()) {
            resetAlerts()
            setSwapValue('')
            setReceiveValue('')
            return
        }
        // calculate swapValue from repay value
        let swapAmount = 0
        if (repayMode === 2) {
            setCalculating(1)
            const repayWeiAmount = await CoreData.getRawValue(web3, networkType, repayAsset.symbol, repayAmount)
            const res = await calculateInAmount(repayWeiAmount)
            swapAmount = await fromWei(swapAsset, res.amount)
            setSwapValue(swapAmount.toString())
            const res1 = await calculateOutAmount(res.amount)
            setSwapPath(res1.path)
            setCalculating(0)
        }

        const receiveAmount = repayAmount * repayAsset.price / receiveAsset.price * liquidateIncentive
        setReceiveValue(receiveAmount.toString())

        validateInputs(swapAmount, repayAmount, receiveAmount)
    }

    const calculateFromReceiveValue = async(receiveAmount) => {
        if (new BigNumber(receiveAmount).isZero() || new BigNumber(receiveAmount).isNaN()) {
            resetAlerts()
            setSwapValue('')
            setRepayValue('')
            return
        }
        const repayAmount = receiveAmount * receiveAsset.price / repayAsset.price / liquidateIncentive
        setRepayValue(repayAmount.toString())

        // calculate swapValue from repay value
        let swapAmount = 0
        if (repayMode === 2) {
            setCalculating(1)
            const repayWeiAmount = await CoreData.getRawValue(web3, networkType, repayAsset.symbol, repayAmount.toString())
            const res = await calculateInAmount(repayWeiAmount)
            swapAmount = await fromWei(swapAsset, res.amount)
            setSwapValue(swapAmount.toString())
            const res1 = await calculateOutAmount(res.amount)
            setSwapPath(res1.path)
            setCalculating(0)
        }

        validateInputs(swapAmount, repayAmount, receiveAmount)
    }

    const setMaxBalance = () => {
        onSwapValueUpdate(swapAsset.walletBalanceFormatted)        
    }

    const setMaxQuantity = () => {
        if (repayMode === 2 && !swapAsset) {
            return
        }
        resetAlerts()
        setRepayValue(repayAsset.max_repay_underlying)
        calculateFromRepayValue(repayAsset.max_repay_underlying)
    }

    const setMaxUserSupply = () => {
        if (repayMode === 2 &&!swapAsset) {
            return
        }
        resetAlerts()
        setReceiveValue(receiveAsset.collateral_balance_underlying)
        calculateFromReceiveValue(receiveAsset.collateral_balance_underlying)
    }
    /// <end>
    /// Set values from fixed amount
    /// <end>

    /// <start>
    /// Process inputs
    /// <start>
    const onSwapValueUpdate = (value) => {
        resetAlerts()
        setSwapValue(value)
        calculateFromSwapValue(value)
    }

    const onRepayValueUpdate = (value) => {
        resetAlerts()
        setRepayValue(value)
        calculateFromRepayValue(value)
    }

    const onTransactionHash = (hash) => {
        log.info(hash)
        repayAsset.repayTxnHash = hash
        setTxnHash(hash) // we use this only for the modal's state
    }
    /// <end>
    /// Process inputs
    /// <end>

    /// <start>
    /// Take action
    /// <start>
    const verifyFurtherApproval = async (txnValue) => {
        if (!CoreData.isNativeToken(transferAsset.symbol)) {
            const { allowance, allowanceFormatted } = await FetchData.getSwapRepayAllowance(web3, connectedAddress, networkType, transferAsset)
            if (allowance && allowance < Number(txnValue)) {
                setNeedsFurtherApproval(true)
                setAllowanceFormatted(allowanceFormatted)
                return Promise.resolve(false)
            }
        }

        return Promise.resolve(true)
    }

    const handleLiquidate = async() => {
        if (swapPath.length === 0 && repayMode === 2) {
            setNoSwapRoute(true)
            return;
        }

        setLoading(true)

        const liquidate = new Liquidate(web3, Config.LiquidateContract, onTransactionHash)

        let swapAmount = 0
        if (repayMode === 2) {
            swapAmount = await CoreData.getRawValue(web3, networkType, swapAsset.symbol, swapValue)
        }
        const repayAmount = await CoreData.getRawValue(web3, networkType, repayAsset.symbol, repayValue)
        const repayQToken = CoreData.getQTokenAddress(networkType, repayAsset.symbol)
        const receiveQToken = CoreData.getQTokenAddress(networkType, receiveAsset.symbol)

        try {
            const isValidAllowance = await verifyFurtherApproval(repayAmount)
            if (!isValidAllowance) {
                setLoading(false)
                return
            }

            var response = null
            const amountInMax = BigNumber(swapAmount).multipliedBy(1.1).toFixed(0)
            if (CoreData.isNativeToken(repayAsset.symbol)) {
                response = await liquidate.liquidateETH(repayMode === 2 ? swapPath : [], borrower.address, repayAmount, receiveQToken, amountInMax, connectedAddress)
            } else {
                response = await liquidate.liquidateERC20(repayMode === 2 ? swapPath : [], repayQToken, borrower.address, repayAmount, receiveQToken, amountInMax, connectedAddress)
            }

            log.info(response)
            if(response.events.Failure) {
                setRepayFailed(true)
            } else {
                setRepayCompleted(true)
            }
        } catch(error) {
            console.log(error)
            if(error.code === 4001) {
                handleClose()
            } else {
                setRepayFailed(true)
            }
        } finally {
            repayAsset.repayTxnHash = null
            setTxnHash(null)
        }
    }

    const handleApprove = async() => {
        setLoading(true)
        await CoreMethod.approveLiquidateERC20(web3, connectedAddress, networkType, transferAsset)
            .then(async response => {
                if (response) {
                    const txnValue = await CoreData.getRawValue(web3, networkType, transferAsset.symbol, receiveValue)
                    await verifyFurtherApproval(txnValue)
                    setLoading(false)
                }
            })
            .catch(error => {
                if (error.code === 4001) {
                    handleClose()
                }
            })
    }

    const handleSelectAsset = async(data) => {
        resetInputs()
        setSwapAsset(data)
        setShowAssetSelect(false)
    }

    const handleClose = () => {
        resetAlerts()

        setSwapAsset()
        setSwapValue('')
        setRepayValue('')
        setReceiveValue('')
        setSwapPath([])

        setCalculating(0)
        setLoading(false)
        setRepayCompleted(false)
        setRepayFailed(false)
        setTxnHash(null)
        setNeedsFurtherApproval(false)
        setShowAssetSelect(false)
        props.handleClose()
    }

    const handleCloseApprove = () => {
        if (repayMode === 1) {
            handleClose()
        } else if (repayMode === 2) {
            setSwapAsset()
            setShowAssetSelect(true)
        } else {
            setShowAssetSelect(false)
        }
    }
    /// <end>
    /// Take action
    /// <end>

    /// <start>
    /// UI Rendering
    /// <start>
    const RepayButton = 
        (unliquidatable || isNaN(parseFloat(repayValue)) || isNaN(parseFloat(receiveValue)) || parseFloat(repayValue) <= 0 || parseFloat(receiveValue) <= 0 )?
            <Button variant="savings" disabled>{t('Liquidate.Liquidate')}</Button> :
            <Button variant="savings" onClick={() => handleLiquidate()}>{t('Liquidate.Liquidate')}</Button>

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
                        txnHash === null ? '' :
                        <a style={{ color: '#BDB780' }} href={CoreData.getExplorerUrl(txnHash, networkType)} target="_blank">{t('Common.ViewTxnOnExplorer')}</a>
                    }
                </div>
            </Modal.Body>
        </div>

    const ModalRepayForm = () =>
        <div className={styles.liquidateContainer}>
            <Modal.Body>
                <Form >
                    <Form.Group controlId="formSwapValue">
                        {repayMode === 2 && <div className={`${styles.amountInputContainer}`}>
                            <div className={styles.inputLabelContainer}>
                                <Form.Label className={styles.inputLabel}>
                                    {t('Common.Swap')}
                                    {calculating === 1 && <img src={LoadingSpinner} width="20" className="d-inline-block align-top" alt="" />}
                                </Form.Label>
                                {swapAsset && <Form.Label className={styles.inputInfo} onClick={setMaxBalance}>{t('Common.WalletBalance')}: {parseFloat(swapAsset.walletBalanceFormatted).toFixed(6) + ' ' + swapAsset.symbol}</Form.Label>}
                            </div>
                            <InputGroup>
                                <Form.Control
                                    className={styles.amountInput}
                                    type="number"
                                    autoComplete="off"
                                    placeholder="0.0"
                                    value={swapValue}
                                    onChange={(e) => onSwapValueUpdate(e.target.value)}
                                    disabled={!swapAsset}/>
                                <InputGroup.Append className={styles.assetSelect} onClick={() => setShowAssetSelect(true)}>
                                    {!!swapAsset ? <>
                                        <img
                                            src={swapAsset.logo}
                                            width="30"
                                            height="30"
                                            className={`${styles.tokenLogo} d-inline-block align-top`}
                                            alt="Logo"
                                            />
                                        <span className="ml-1">{swapAsset.symbol}</span>
                                    </> : <span className="ml-1">Select a token</span>
                                    }
                                    <FaAngleDown className="ml-1"/>
                                </InputGroup.Append>
                            </InputGroup>
                        </div>}
                        <div className={`${styles.amountInputContainer} mt-3`}>
                            <div className={styles.inputLabelContainer}>
                                <Form.Label className={styles.inputLabel}>
                                    {t('LiquidateModal.RepayBorrow')}
                                    {calculating === 2 && <img src={LoadingSpinner} width="20" className="d-inline-block align-top" alt="" />}
                                </Form.Label>
                                {repayAsset && <Form.Label className={styles.inputInfo} onClick={setMaxQuantity}>{t('LiquidateModal.MaxQuantity')}: {parseFloat(repayAsset.max_repay_underlying).toFixed(6) + ' ' + repayAsset.symbol}</Form.Label>}
                            </div>
                            <InputGroup>
                                <Form.Control
                                    className={styles.amountInput}
                                    type="number"
                                    autoComplete="off"
                                    placeholder="0.0"
                                    value={repayValue}
                                    onChange={(e) => onRepayValueUpdate(e.target.value)}
                                    disabled={repayMode !== 1}/>
                                <InputGroup.Append className={styles.assetSelect}>
                                    {!!repayAsset ? <>
                                        <img
                                            src={repayAsset.logo}
                                            width="30"
                                            height="30"
                                            className={`${styles.tokenLogo} d-inline-block align-top`}
                                            alt="Logo"
                                            />
                                        <span className="ml-1">{repayAsset.symbol}</span>
                                    </> : <span className="ml-1">Select a token</span>
                                    }
                                    {/* <FaAngleDown className="ml-1"/> */}
                                </InputGroup.Append>
                            </InputGroup>                                
                        </div>
                        <div className={`${styles.amountInputContainer} mt-3`}>
                            <div className={styles.inputLabelContainer}>
                                <Form.Label className={styles.inputLabel}>
                                    {t('LiquidateModal.ReceiveCollateral')}
                                    {calculating === 2 && <img src={LoadingSpinner} width="20" className="d-inline-block align-top" alt="" />}
                                </Form.Label>
                                {receiveAsset && <Form.Label className={styles.inputInfo} onClick={setMaxUserSupply}>{t('LiquidateModal.UserSupplied')}: {parseFloat(receiveAsset.collateral_balance_underlying).toFixed(6) + ' ' + receiveAsset.symbol}</Form.Label>}
                            </div>
                            <InputGroup>
                                <Form.Control
                                    className={styles.amountInput}
                                    type="number"
                                    autoComplete="off"
                                    placeholder="0.0"
                                    value={receiveValue}
                                    disabled/>
                                <InputGroup.Append className={styles.assetSelect}>
                                {!!receiveAsset ? <>
                                        <img
                                            src={receiveAsset.logo}
                                            width="30"
                                            height="30"
                                            className={`${styles.tokenLogo} d-inline-block align-top`}
                                            alt="Logo"
                                            />
                                        <span className="ml-1">{receiveAsset.symbol}</span>
                                    </> : <span className="ml-1">Select a token</span>
                                    }
                                    {/* <FaAngleDown className="ml-1"/> */}
                                </InputGroup.Append>
                            </InputGroup>                                
                        </div>
                    </Form.Group>
                </Form>
                {lowBalance ? <div className={styles.txnError}>{t('RepayModal.LowBalanceError')}</div> : 
                overPay ? <div className={styles.txnError}>{t('LiquidateModal.OverPayError')}</div> : 
                lowUserSupply ? <div className={styles.txnError}>{t('LiquidateModal.LowUserSupply')}</div> : 
                noSwapRoute ? <div className={styles.txnError}>{t('SwapRepayModal.NoSwapRouteError')}</div> : ''}
                <Container>
                    <Row className={styles.infoItem}>
                        <Col xs={4} className={styles.label}>{t('Common.Repay')}</Col>
                        <Col xs={8} className={styles.value}>
                            {transferAsset && <div className={styles.tokenValue}>$<span className={styles.number}>{(transferValue * transferAsset.price).toFixed(2)}</span></div>}
                        </Col>
                    </Row>
                    <Row className={styles.infoItem}>
                        <Col xs={4} className={styles.label}>Receive</Col>
                        <Col xs={8} className={styles.value}>
                            {receiveAsset && <div className={styles.tokenValue}>$<span className={styles.number}>{(receiveValue * receiveAsset.price).toFixed(2)}</span></div>}
                        </Col>
                    </Row>
                    <Row className={styles.infoItem}>
                        <Col xs={4} className={styles.label}>{t('Common.Discount')}</Col>
                        <Col xs={8} className={styles.value}>
                            <div className={styles.tokenInfo}>{100-discount}%</div>
                        </Col>
                    </Row>
                    <Row className={styles.infoItem}>
                        <Col xs={4} className={styles.label}>{t('Common.Bonus')}</Col>
                        <Col xs={8} className={styles.value}>
                            <div className={styles.tokenInfo}>${bonus.toFixed(2)}</div>
                        </Col>
                    </Row>
                </Container>
            </Modal.Body>
            <Modal.Footer>
                {RepayButton}
                <Button variant="cancel" onClick={handleClose}>{t('Common.Cancel')}</Button>
            </Modal.Footer>
            {repayMode === 1 &&
                <div className={styles.footerInfo}>
                    <div>{t('Common.WalletBalance')}</div>
                    <div className={styles.tokenBalance}>
                        {repayAsset && parseFloat(repayAsset.walletBalanceFormatted).toFixed(6) + ' ' + repayAsset.symbol}
                    </div>
                </div>
            }
        </div>

    const ModalApprovalRequest = () =>
        <div>
            <Modal.Body>
                {transferAsset && 
                    <div className={styles.headerInfo}>
                        <img
                            src={transferAsset.logo}
                            width="50"
                            height="50"
                            className={`${styles.tokenLogo} d-inline-block align-top`}
                            alt="Logo"
                            />
                        <div className="mt-1">{transferAsset.name}</div>
                    </div>
                }
                <div className={styles.approvalMsg}>{t('Common.ApprovalMsg')}</div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="loans" onClick={handleApprove}>{t('Common.Approve')}</Button>
                <Button variant="cancel" onClick={handleCloseApprove}>{t('Common.Cancel')}</Button>
            </Modal.Footer>
        </div>

    const ModalFurtherApprovalRequest = () =>
        <div>
            <Modal.Body>
                <div className="alertMsg">
                    {t('Common.FurtherApprovalMsg', {type: t('Common.Swap'), inputValue: receiveValue, allowanceFormatted})}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="savings" onClick={handleApprove}>{t('Common.FurtherApprove')}</Button>
                <Button variant="cancel" onClick={handleClose}>{t('Common.Cancel')}</Button>
            </Modal.Footer>
        </div>

    const AssetSelectDialog = () => {
        return (
        <Modal
            show={showAssetSelect > 0}
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
                    swappableAssets.map((data, i) => 
                        <Row className={styles.assetItemRow} key={i} onClick={() => handleSelectAsset(data)}>
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
                        </Row>
                    )
                }
            </div>
        </Modal>)
    }

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

    const NoRepayAsset = 
        <div>
            <Modal.Body>
                <div className={styles.approvalMsg}>{t('LiquidateModal.NoRepayAsset')}</div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="cancel" onClick={handleClose}>{t('Common.Close')}</Button>
            </Modal.Footer>
        </div>

    const needsApproval = transferAsset && !transferAsset.liquidateApproved
    const ModalLoaded = () => needsFurtherApproval ? ModalFurtherApprovalRequest() : needsApproval ? ModalApprovalRequest() : ModalRepayForm()
    const ModalRendered = () => repayMode === 0 ? NoRepayAsset : loading ? ModalLoading() : ModalLoaded()
    
    return showAssetSelect ? AssetSelectDialog() :
        <Modal
            show={props.show && repayAsset && receiveAsset}
            onHide={handleClose}
            aria-labelledby="contained-modal-title-vcenter"
            className={styles.txnModal}
            centered
            animation={false}>
            <Modal.Header closeButton>
                <div className={styles.headerInfo}>
                    {t('LiquidateModal.Heading')}
                </div>
            </Modal.Header>
           {
                repayCompleted ? TxnSuccessMsg :
                repayFailed ? TxnErrorMsg : ModalRendered()
            }
        </Modal>
    /// <end>
    /// UI Rendering
    /// <end>
}
