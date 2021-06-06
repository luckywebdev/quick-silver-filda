import React, {useContext, useState} from 'react'
import {Button, Modal} from 'react-bootstrap'
import LoadingIcon from '../../../images/loanloading.svg'
import { useTranslation } from 'react-i18next'
import CheckIcon from '../../../images/checkyellow.svg'
import ErrorIcon from '../../../images/error.svg'
import CoreData from '../../../methods/CoreData'
import StakingData from '../../../methods/StakingData'
import log from '../../../utils/logger'
import { NetworkTypeContext, WalletAddressContext, Web3Context } from '../../../context'

export default function UnstakedModal(props) {
    const { connectedAddress } = useContext(WalletAddressContext)
    const { networkType } = useContext(NetworkTypeContext)
    const { web3 } = useContext(Web3Context)

    const styles = props.styles
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [withdrawCompleted, setWithdrawCompleted] = useState(false)
    const [withdrawFailed, setWithdrawFailed] = useState(false)
    const [txnHash, setTxnHash] = useState('')

    const handleClose = async() => {
        setLoading(false)
        setWithdrawCompleted(false)
        setWithdrawFailed(false)
        setTxnHash('')
        props.handleClose('unstake')
    }

    const getRawValue = async(value) => {
        log.info(value)
        return StakingData.getRawValue(web3, networkType, props.data.info.lpTokenContract, props.data.info.lpTokenSymbol, value)
    }

    const handleUnstake = async() => {
        setLoading(true)
        const poolContract = await StakingData.getPoolContract(web3, networkType, props.data.address)
        const gasInfo = await CoreData.getGasInfo(web3)
        const txnValue = await getRawValue(props.data.info.lpTokenStakedBalanceFormatted)

        await poolContract.methods.withdrawApplication(web3.utils.toBN(txnValue)).send({
            from: connectedAddress,
            gasLimit: web3.utils.toHex(gasInfo.gasLimit),
            gasPrice: web3.utils.toHex(gasInfo.gasPrice)
        })
        .on('transactionHash', function(hash) {
            log.info(hash)
            props.activeTxnsList.push({
                "poolAddress": props.data.address,
                "hash": hash
            })
            setTxnHash(hash)
        })
        .then(response => {
            log.info(response)
            if(response.events.Failure) {
                setWithdrawFailed(true)
            } else {
                setWithdrawCompleted(true)
            }
            props.activeTxnsList.splice(props.activeTxnsList.findIndex(e => e.hash === txnHash), 1)
        })
        .catch(error => {
            if(error.code === 4001) {
                handleClose()
            } else {
                setWithdrawFailed(true)
                props.activeTxnsList.splice(props.activeTxnsList.findIndex(e => e.hash === txnHash), 1)
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
                        txnHash == null ? '' :
                        <a style={{ color: '#4FDAB8' }} href={CoreData.getExplorerUrl(txnHash, networkType)} target="_blank">{t('Common.ViewTxnOnExplorer')}</a>
                    }
                </div>
            </Modal.Body>
        </div>


    const ModalWithdrawApplication =
            <div>
                <Modal.Body>
                    <div className={styles.approvalMsg}>
                        {t('Stake.Unstake.AlertMsg')}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="loans" onClick={handleUnstake}>{t('Stake.Unstake')}</Button>
                    <Button variant="cancel" onClick={handleClose}>{t('Common.Close')}</Button>
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
                <div className={styles.approvalMsg}>{t('UnstakeModal.SuccessMsg')}</div>
                <div className={styles.approvalMsg}>{t('UnstakeModal.SuccessMsg.Ext')}</div>
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
                <div className={styles.approvalMsg}>{t('WithdrawModal.ErrorMsg')}</div>
                <a href={CoreData.getExplorerUrl(txnHash, networkType)} target="_blank">{t('Common.ViewTxnOnExplorer')}</a>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="cancel" onClick={handleClose}>{t('Common.Close')}</Button>
            </Modal.Footer>
        </div>


    const ModalRendered =
        loading ? ModalLoading : ModalWithdrawApplication


    return(
        <Modal
            show={props.show}
            onHide={handleClose}
            aria-labelledby="contained-modal-title-vcenter"
            className={`${styles.txnModal} ${styles.unstake}`}
            centered
            animation={false}>
            <Modal.Header closeButton>
                <img
                    src={props.data.info.lpTokenLogo}
                    width="auto"
                    height="36px"
                    className="d-inline-block align-top"
                    alt="Token Logo"
                    />
                <div className={styles.assetName}>{props.data.info.lpTokenName} ({props.data.info.lpTokenSymbol})</div>
                {
                withdrawCompleted || withdrawFailed ? '' : <div className={styles.txnTypeDesc}>
                    {t('Stake.Unstake')}
                </div>
                }
            </Modal.Header>
            {
                withdrawCompleted ? TxnSuccessMsg :
                withdrawFailed ? TxnErrorMsg : ModalRendered
            }
        </Modal>
    )
}
