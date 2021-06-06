import React, { useContext, useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import LoadingIcon from '../../../images/loanloading.svg'
import { useTranslation } from 'react-i18next'
import CheckIcon from '../../../images/checkyellow.svg'
import ErrorIcon from '../../../images/error.svg'
import CoreData from '../../../methods/CoreData'
import StakingData from '../../../methods/StakingData'
import log from '../../../utils/logger'
import { NetworkTypeContext, WalletAddressContext, Web3Context } from '../../../context'

export default function WithdrawModal(props) {
    const { connectedAddress } = useContext(WalletAddressContext)
    const { networkType } = useContext(NetworkTypeContext)
    const { web3 } = useContext(Web3Context)

    const styles = props.styles
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [withdrawCompleted, setWithdrawCompleted] = useState(false)
    const [withdrawFailed, setWithdrawFailed] = useState(false)
    const [txnHash, setTxnHash] = useState('')

    const handleClose = async () => {
        setLoading(false)
        setWithdrawCompleted(false)
        setWithdrawFailed(false)
        setTxnHash('')
        props.handleClose('withdraw')
    }

    const getRawValue = async (value) => {
        log.info(value)
        return StakingData.getRawValue(web3, networkType, props.data.info.lpTokenContract, props.data.info.lpTokenSymbol, value)
    }

    const handleWithdraw = async () => {
        setLoading(true)
        const poolContract = await StakingData.getPoolContract(web3, networkType, props.data.address, props.data.info.pool)
        const gasInfo = await CoreData.getGasInfo(web3)
        const lockedTxnValue = props.data.info.lockedBalance//await getRawValue(props.data.info.lockedBalanceFormatted)
        const stakedTxnValue = props.data.info.lpTokenStakedBalance//await getRawValue(props.data.info.lpTokenStakedBalanceFormatted)
        const txnValue = Number(props.data.info.withdrawPeriod) === 0 ? stakedTxnValue : lockedTxnValue

        let args = null
        if (props.data.info.isShortcut) {
            args = [props.data.info.indexOfPool, web3.utils.toBN(txnValue)]
        } else {
            args = [web3.utils.toBN(txnValue)]
        }

        await poolContract.methods.withdraw(...args).send({
            from: connectedAddress,
            gasLimit: web3.utils.toHex(gasInfo.gasLimit),
            gasPrice: web3.utils.toHex(gasInfo.gasPrice)
        }).on('transactionHash', function (hash) {
            log.info(hash)
            props.activeTxnsList.push({
                "poolAddress": props.data.address,
                "hash": hash
            })
            setTxnHash(hash)
        }).then(response => {
            log.info(response)
            if (response.events.Failure) {
                setWithdrawFailed(true)
            } else {
                setWithdrawCompleted(true)
            }
            props.activeTxnsList.splice(props.activeTxnsList.findIndex(e => e.hash === txnHash), 1)
        }).catch(error => {
            if (error.code === 4001) {
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

    const ModalWithdrawForm =
        <div>
            <Modal.Body>
                <div className={styles.approvalMsg}><b>{props.data.info.withdrawPeriod === 0 ? props.data.info.lpTokenStakedBalanceFormatted : props.data.info.lockedBalanceFormatted} {props.data.info.lpTokenSymbol}</b>{t('Stake.Withdraw.Msg')}</div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="loans" onClick={handleWithdraw}>{t('Stake.Withdraw')}</Button>
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
                <div className={styles.approvalMsg}>{t('WithdrawModal.SuccessMsg')}</div>
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
        loading ? ModalLoading : ModalWithdrawForm


    return (
        <Modal
            show={props.show}
            onHide={handleClose}
            aria-labelledby="contained-modal-title-vcenter"
            className={`${styles.txnModal} ${styles.withdraw}`}
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
                        {t('Stake.Withdraw')}
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
