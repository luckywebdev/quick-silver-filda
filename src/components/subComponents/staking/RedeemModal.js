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

export default function RedeemModal(props) {
    const { connectedAddress } = useContext(WalletAddressContext)
    const { networkType } = useContext(NetworkTypeContext)
    const { web3 } = useContext(Web3Context)

    const styles = props.styles
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [redeemCompleted, setRedeemCompleted] = useState(false)
    const [redeemFailed, setRedeemFailed] = useState(false)
    const [txnHash, setTxnHash] = useState('')

    const handleClose = async() => {
        setLoading(false)
        setRedeemCompleted(false)
        setRedeemFailed(false)
        setTxnHash('')
        props.handleClose('redeem')
    }

    const handleRedeem = async() => {
        setLoading(true)
        const poolContract = await StakingData.getPoolContract(web3, networkType, props.data.address, props.data.info.pool)
        const gasInfo = await CoreData.getGasInfo(web3)

        let args = null
        let func = null
        if (props.data.info.isShortcut) {
            args = [props.data.info.indexOfPool, 0]

            if (props.data.info.fromDogswap) {
                func = poolContract.methods.withdraw
            } else {
                func = poolContract.methods.deposit
            }
        } else {
            args = []
            func = poolContract.methods.getReward
        }

        await func(...args).send({
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
            setRedeemFailed(true)
            } else {
            setRedeemCompleted(true)
            }
            props.activeTxnsList.splice(props.activeTxnsList.findIndex(e => e.hash === txnHash), 1)
        })
        .catch(error => {
            if(error.code === 4001) {
                handleClose()
            } else {
                setRedeemFailed(true)
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

    const ModalRedeemForm =
    props.data.info.rewardsEarnedBalanceFormatted ?
        <div>
            <Modal.Body>
                <div className={styles.approvalMsg}><b>{props.data.info.rewardsEarnedBalanceFormatted} {props.data.info.rewardTokenSymbol}</b>{t('Stake.RedeemRewards.Msg')}</div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="loans" onClick={handleRedeem}>{t('Common.Redeem')}</Button>
                <Button variant="cancel" onClick={handleClose}>{t('Common.Close')}</Button>
            </Modal.Footer>
        </div>
    :
    props.data.info.rewardsBalanceFormatted ?
    <div>
    <Modal.Body>
        <div className={styles.approvalMsg}><b>{props.data.info.rewardsBalanceFormatted} {props.data.info.rewardTokenSymbol}</b>{t('Stake.RedeemRewards.Msg')}</div>
    </Modal.Body>
    <Modal.Footer>
        <Button variant="loans" onClick={handleRedeem}>{t('Common.Redeem')}</Button>
        <Button variant="cancel" onClick={handleClose}>{t('Common.Close')}</Button>
    </Modal.Footer>
    </div>
    :""

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
                <div className={styles.approvalMsg}>{t('RedeemModal.SuccessMsg')}</div>
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
                <div className={styles.approvalMsg}>{t('RedeemModal.ErrorMsg')}</div>
                <a href={CoreData.getExplorerUrl(txnHash, networkType)} target="_blank">{t('Common.ViewTxnOnExplorer')}</a>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="cancel" onClick={handleClose}>{t('Common.Close')}</Button>
            </Modal.Footer>
        </div>


    const ModalRendered =
        loading ? ModalLoading : ModalRedeemForm


    return(
        <Modal
            show={props.show}
            onHide={handleClose}
            aria-labelledby="contained-modal-title-vcenter"
            className={`${styles.txnModal} ${styles.redeem}`}
            centered
            animation={false}>
            <Modal.Header closeButton>
                <img
                    src={props.data.info.rewardTokenLogo}
                    width="auto"
                    height="36px"
                    className="d-inline-block align-top"
                    alt="Token Logo"
                    />
                <div className={styles.assetName}>{props.data.info.rewardTokenName} ({props.data.info.rewardTokenSymbol})</div>
                {
                redeemCompleted || redeemFailed ? '' : <div className={styles.txnTypeDesc}>
                    {t('Common.Redeem.Rewards')}
                </div>
                }
            </Modal.Header>
            {
                redeemCompleted ? TxnSuccessMsg :
                redeemFailed ? TxnErrorMsg : ModalRendered
            }
        </Modal>
    )
}
