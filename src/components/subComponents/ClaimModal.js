import React, { useContext, useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import LoadingIcon from '../../images/savingsloading.svg'
import ErrorIcon from '../../images/error.svg'
import CheckIcon from '../../images/check.svg'
import { useTranslation } from 'react-i18next'
import { FaAngleDoubleRight } from 'react-icons/fa'
import CoreData from '../../methods/CoreData'
import log from '../../utils/logger'
import { NetworkTypeContext, WalletAddressContext, Web3Context } from '../../context'

export default function ClaimModal(props) {
    const { connectedAddress } = useContext(WalletAddressContext)
    const { networkType } = useContext(NetworkTypeContext)
    const { web3 } = useContext(Web3Context)

    const styles = props.styles
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [claimCompleted, setClaimCompleted] = useState(false)
    const [claimFailed, setClaimFailed] = useState(false)
    const [txnHash, setTxnHash] = useState('')

    const handleClose = async() => {
        setLoading(false)
        setClaimCompleted(false)
        setClaimFailed(false)
        setTxnHash('')
        props.handleClaimClose()
    }

    const handleClaim = async() => {
        setLoading(true)
        let supportedMarkets = props.data.map(item => item.qToken.network.heco.address)
        const gasInfo = await CoreData.getGasInfo(web3)
        const comptroller =  await CoreData.getComptroller(web3, networkType)
        let estimatedGas = await comptroller.methods.claimComp(connectedAddress, supportedMarkets).estimateGas();
        estimatedGas = estimatedGas * 2
        await comptroller.methods.claimComp(connectedAddress, supportedMarkets).send({
            from: connectedAddress,
            gasLimit: estimatedGas,      // posted at compound.finance/developers#gas-costs
            gasPrice: web3.utils.toHex(gasInfo.gasPrice) // use ethgasstation.info (mainnet only)
        })
        .on('transactionHash', function(hash) {
            log.info(hash)
            props.data.claimTxnHash = hash
            setTxnHash(hash) // we use this only for the modal's state
        })
        .then(response => {
            log.info(response)
            if(response.events.Failure) {
                setClaimFailed(true)
            } else {
                setClaimCompleted(true)
            }
            props.data.claimTxnHash = null
            setLoading(false)
        })
        .catch(error => {
            log.error(error)
            if(error.code === 4001) {
                handleClose()
            } else {
                setClaimFailed(true)
                props.data.claimTxnHash = null
            }
        })
    }


    //UI Rendering

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
                        txnHash === '' ? 'loading' :
                        <a style={{ color: '#4FDAB8' }} href={CoreData.getExplorerUrl(txnHash, networkType)} target="_blank">{t('Common.ViewTxnOnExplorer')}</a>
                    }
                </div>
            </Modal.Body>
        </div>


    const ModalForm =
            <div>
                <Modal.Body>
                    <div className={styles.claimContainer}>
                        <div className={styles.balanceContainer}>
                            <div className={styles.label}>{(props.data.compSymbol).toUpperCase()} {t('ClaimModal.Earned')}</div>
                            <div className={styles.value}>{parseFloat(props.data.compAccrued).toFixed(8)}</div>
                        </div>
                        <FaAngleDoubleRight className={styles.icon}/>
                        <div className={styles.balanceContainer}>
                <div className={styles.label}>{(props.data.compSymbol).toUpperCase()} {t('ClaimModal.Balance')}</div>
                            <div className={styles.value}>{parseFloat(props.data.compBalance).toFixed(8)}</div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                <Button variant="savings" onClick={handleClaim}>{t('Header.Collect')}</Button>
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
                <div className={styles.approvalMsg}>{t('ClaimModal.TokensClaimedSuccessfully')}</div>
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
                <div className={styles.approvalMsg}>{t('ClaimModal.TokensClaimFailed')}</div>
                <a className={styles.borrowLink} style={{color: "#BDB780"}} href={CoreData.getExplorerUrl(txnHash, networkType)} target="_blank">{t('Common.ViewTxnOnExplorer')}</a>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="cancel" onClick={handleClose}>{t('Common.Close')}</Button>
            </Modal.Footer>
        </div>

    const ModalRendered = loading ? ModalLoading : ModalForm


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
                    src={props.logo}
                    width="auto"
                    height="36px"
                    className="d-inline-block align-top"
                    alt="Filda Logo"
                    />
                <div className={styles.assetName}>{props.data.name}</div>
                {
                    claimCompleted || claimFailed ? '' :
                    <div className={styles.txnTypeDesc}>
                        {t('ClaimModal.ClaimToken')}
                    </div>
                }
            </Modal.Header>
            {
                claimCompleted ? TxnSuccessMsg :
                claimFailed ? TxnErrorMsg : ModalRendered
            }
        </Modal>
    )
}
