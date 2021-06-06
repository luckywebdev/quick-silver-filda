import React, { useContext, useEffect, useState } from 'react'
import { Button, Col, Container, Modal, Row } from 'react-bootstrap'
import styles from './Vote.module.scss'
import VoteData from './methods/VoteData'
import CoreData from './methods/CoreData'
import VoteIcon from './images/vote.svg'
import { FaCheckCircle, FaMinusCircle } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import logger from './utils/logger'
import { NetworkTypeContext, WalletAddressContext, Web3Context } from './context'
import Loading from './components/Loading'
import RangeSlider from './components/RangeSlider'
import BigNumber from 'bignumber.js'
import CheckIcon from './images/check.svg'
import ErrorIcon from './images/error.svg'
import LoadingIcon from './images/savingsloading.svg'
import Config from './utils/config'

function Vote() {
    const { connectedAddress } = useContext(WalletAddressContext)
    const { networkType } = useContext(NetworkTypeContext)
    const { web3 } = useContext(Web3Context)

    const [loading, setLoading] = useState(true)
    const [txLoading, setTxLoading] = useState(false)
    const [pollsData, setPollsData] = useState([])
    const [isCumulativeVoting, setCumulativeVoting] = useState(false)
    const [proposalOptions, setProposalOptions] = useState([])
    const [pollOptions, setPollOptions] = useState([])
    const [currentPoll, setCurrentPoll] = useState()
    const [percentage, setPercentage] = useState(0)
    const [voteCompleted, setVoteCompleted] = useState(false)
    const [voteFailed, setVoteFailed] = useState(false)
    const [txnHash, setTxnHash] = useState('')
    const [lpTokenStakedBalance, setLpTokenStakedBalance] = useState(0)

    const { t } = useTranslation()

    const getVotedCount = async (pollsDataArray) => {
        const proposals = []
        for (const poll of pollsDataArray) {
            if (poll.proposalType && '1' === poll.proposalType) {
                const address = poll.proposalAddress
                const multipleVoteOptions = await VoteData.getMultipleVoteOptions(web3, networkType, address)

                const options = []
                let totalVoted = 0
                let topTotalVoted = 0
                for (const p of multipleVoteOptions) {
                    let i = multipleVoteOptions.indexOf(p)
                    const votedQuantity = await getTotalVotedQuantities(poll.proposalAddress, i)
                    const value = new BigNumber(votedQuantity).div(1e18).times(100).toFixed(0).toString(10)
                    totalVoted += Number(value)
                    if (poll.status === 'completed' && Number(value) > topTotalVoted) {
                        topTotalVoted = Number(value)
                    }
                    options.push({title: p, totalOptionVoted: Number(value)})
                }

                const proposalOptions = options.map((item) => {
                    return {...item, totalVoted, votePercentage: (item.totalOptionVoted * 100)/totalVoted, mostVoted: item.totalOptionVoted === topTotalVoted}
                })

                proposals.push({address, proposalOptions: [...proposalOptions]})
            }
        }
        return proposals
    }

    useEffect(() => {
        let timer = null
        async function initialLoad() {
            let fetching = false
            setLoading(true)

            if (web3) {
                const filDaDaoABI = Config.noMintRewardPool.ABI
                const filDaDaoContractAddress = Object.entries(Config.pools)
                  .filter(pool => pool[1].lpTokenName === 'FilDA' && pool[1].hasLockPeriod).map(pool => pool[0]).join('')
                const filDaDaoContract = await new web3.eth.Contract(filDaDaoABI, filDaDaoContractAddress)
                const lpTokenStakedBalance = await filDaDaoContract.methods.balanceOf(connectedAddress).call()
                setLpTokenStakedBalance(lpTokenStakedBalance)
            }

            timer = setInterval(async() => {
                if (!fetching && connectedAddress && networkType && networkType !== 'unsupported' && web3) {
                    fetching = true
                    const pollsDataArray = await VoteData.getPollsDataArray(web3, networkType, connectedAddress)
                    const proposals = await getVotedCount(pollsDataArray)
                    setProposalOptions(proposals)
                    setLoading(false)
                    setPollsData(pollsDataArray)
                    fetching = false
                }

            }, 3000)
        }
        initialLoad()

        return () =>  {
            clearInterval(timer)
        }
    }, [connectedAddress])

    const handleVoteYes = async() => {
        await handleVote(0)
    }

    const handleVoteNo = async() => {
        await handleVote(1)
    }

    const handleVote = async(voteItm) => {
        logger.info(`voteItm: ${voteItm}`)

        const [ proposalContract, gasInfo ] = await Promise.all([
            VoteData.getProposalContract(web3, networkType, connectedAddress),
            CoreData.getGasInfo(web3)
        ])
        await proposalContract.methods.vote(voteItm).send({
            from: connectedAddress,
            gasLimit: web3.utils.toHex(gasInfo.gasLimit),
            gasPrice: web3.utils.toHex(gasInfo.gasPrice)
        })
        .on('transactionHash', function(hash) {
            logger.info(hash)
        })
        .then(response => {
            logger.info(response)
        })
        .catch(error => {
            if(error.code === 4001) {
                //handleClose()
            }
        })
    }

    const handleMultipleVote = async () => {
        setTxLoading(true)
        const [ proposalContract, gasInfo ] = await Promise.all([
            VoteData.getMultiProposalContract(web3, currentPoll.proposalAddress),
            CoreData.getGasInfo(web3)
        ])

        const indexes = []
        const values = []
        pollOptions.map((o, i) => {
            indexes.push(i)
            const value = new BigNumber(o.value).div(100).times(1e18).toString(10)
            values.push(value)
        })

        await proposalContract.methods.vote(indexes, values).send({
            from: connectedAddress,
            gasLimit: web3.utils.toHex(gasInfo.gasLimit),
            gasPrice: web3.utils.toHex(gasInfo.gasPrice)
        })
        .on('transactionHash', function(hash) {
            logger.info(hash)
            setTxnHash(hash)
        })
        .then(response => {
            logger.info(response)
            if(response.events.Failure) {
                setVoteFailed(true)
            } else {
                setVoteCompleted(true)
            }
        })
        .catch(error => {
          if(error.code !== 4001) {
              logger.error('Failed to do multiple vote, error:', error)
              setVoteFailed(true)
          } else {
              handleClose()
          }
        })
    }

    const handleCumulativeVoting = async (poll) => {
        if (poll.proposalType && poll.proposalType === '1') {
            const proposalOptions = await VoteData.getMultipleVoteOptions(web3, networkType, poll.proposalAddress)
            const options = []
            proposalOptions.forEach((o, idx) => {
                const defaultValue = getDefaultValue(proposalOptions.length, idx)
                options.push({title: o, value: Number(defaultValue)})
            })
            setPollOptions(options)
            setCurrentPoll(poll)
            setPercentage(100)
            setCumulativeVoting(true)
        }
    }

    const handleClose = () => {
        setCurrentPoll(undefined)
        setPollOptions([])
        setCumulativeVoting(false)
        setPercentage(0)
        setVoteCompleted(false)
        setVoteFailed(false)
        setTxnHash('')
        setTxLoading(false)
    }

    const getDefaultValue = (size, idx) => {
        return 100 % size === 0 ? new BigNumber(100).div(size).toFixed(0).toString(10) : idx === size - 1
          ? new BigNumber(100).div(size).plus(1).toFixed(0).toString(10)
          : new BigNumber(100).div(size).toFixed(0).toString(10)
    }

    const handleEqualize = () => {
        const options = []
        pollOptions.forEach((o, idx) => {
            o.value = Number(getDefaultValue(pollOptions.length, idx))
            options.push({...o})
        })
        setPercentage(100)
        setPollOptions(options)
    }

    const handleSliderChange = (title, value) => {
        const idx = pollOptions.findIndex(el => el.title === title)
        pollOptions[idx] = {title, value}
        const total = pollOptions.map(o => o.value).reduce((prev, curr) => prev + curr)
        setPercentage(total)
    }

    const getTotalVotedQuantities = async (proposalAddress, idx) => {
        const multiVoteContract = await VoteData.getMultiProposalContract(web3, proposalAddress)
        return multiVoteContract.methods.totalVotes(idx).call()
    }

    const isSingleVote = (poll) => (!poll.proposalType || '0' === poll.proposalType) && poll.voted === false && poll.status === 'active'
    const isMultipleVote = (poll) => poll.voted === false && poll.status === 'active' && '1' === poll.proposalType

    const Polls = pollsData.map((poll, i) => {
        return (
            <Col md={4} className={styles.itemContainer} key={i}>
                <div className={ `${styles.tile} ${poll.status === 'active' ? styles.active : ''}` }>
                    <div className={styles.headerContainer}>
                        <div className={styles.title}>
                            <div>{poll.title}</div>
                        </div>
                        <div className={styles.title}>
                            <a href={poll.link} target="_blank">{t('Vote.ViewProrosalDetail')}</a>
                        </div>
                        {
                            poll.status === 'active' ?
                            <div className={styles.activeStatus}>{t('Vote.Active')}</div>
                            :
                            <div className={styles.activeStatus} />
                        }
                    </div>
                    <div className={styles.dataContainer}>
                        {
                            poll.status === 'active' ?
                            <div>
                                <div className={styles.cannotCancel}>{t('Vote.cannotCancel')}</div>
                                <div className={styles.timeLeftContainer}>
                                    <div className={styles.label}>{t('Vote.TimeLeft')}</div>
                                    <div className={styles.value}>{poll.timeLeft}</div>
                                </div>
                                </div>
                                :
                            poll.status === 'inactive' ?
                            <div className={styles.rejectedContainer}>
                                    <FaMinusCircle className={styles.icon} />
                                    <div className={styles.value}>{t('Vote.InActive')}</div>
                            </div>:
                            poll.status === 'passed' ?
                                <div className={styles.passedContainer}>
                                    <FaCheckCircle className={styles.icon} />
                                    <div className={styles.value}>{t('Vote.Passed')}</div>
                                </div> :
                                poll.status === 'completed' ?
                                <div className={styles.passedContainer}>
                                    <FaCheckCircle className={styles.icon} />
                                    <div className={styles.value}>{t('Vote.Completed')}</div>
                                </div>
                                    :
                                    poll.status === 'rejected' ?
                                        <div className={styles.rejectedContainer}>
                                            <FaMinusCircle className={styles.icon} />
                                            <div className={styles.value}>{t('Vote.Rejected')}</div>
                                        </div>
                                        :""
                        }

                        {
                            poll.proposalType && '1' === poll.proposalType ? (
                              <>
                                  {
                                      proposalOptions.filter(o => o.address === poll.proposalAddress)
                                        .map(o => o.proposalOptions)
                                        .map((item) => {
                                          return item.map((val, idx) => (
                                            <div className={styles.multiVoteContainer} key={idx}>
                                                <RangeSlider
                                                  option={{title: val.title, value: val.votePercentage, totalOptionVoted: val.totalOptionVoted}}
                                                  max={100}
                                                  mostVoted={val.mostVoted}
                                                  readonly={true}
                                                />
                                            </div>
                                          ))
                                      })
                                  }
                              </>
                            ) : (
                              <div className={styles.voteCountContainer}>
                                  <div className={styles.voteCountItem}>
                                      <div className={styles.label}>{t('Vote.Yes')}</div>
                                      <div className={styles.value}>{poll.yesVotes} {t('Vote.votes')}</div>
                                  </div>
                                  <div className={styles.voteCountItem}>
                                      <div className={styles.label}>{t('Vote.No')}</div>
                                      <div className={styles.value}>{poll.noVotes} {t('Vote.votes')}</div>
                                  </div>
                              </div>
                            )
                        }
                    </div>
                    {
                          poll.voted === true
                          ?
                            <div className={styles.votedMsg}>
                                {t('Vote.AlreadyVoted')}
                            </div>
                          : isSingleVote(poll) ?
                                <div className={styles.footerContainer}>
                                    <Button
                                      variant="primary"
                                      className={'mr-2'}
                                      onClick={handleVoteYes}
                                      size="lg"
                                      disabled={Number(lpTokenStakedBalance) === 0}
                                    >
                                        {t('Vote.Yes')}
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      onClick={handleVoteNo}
                                      size="lg"
                                      disabled={Number(lpTokenStakedBalance) === 0}
                                    >
                                        {t('Vote.No')}
                                    </Button>
                                </div>
                                : isMultipleVote(poll) ?
                                    <div className={`${styles.footerContainer} text-center mt-3`}>
                                        <Button
                                          variant="primary"
                                          onClick={() => handleCumulativeVoting(poll)}
                                          size="lg"
                                          disabled={Number(lpTokenStakedBalance) === 0}
                                        >
                                            {t('Footer.Vote')}
                                        </Button>
                                    </div>
                                :
                                    <div className={styles.notVotedMsg} />
                    }
                </div>
            </Col>
        )
    })

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

    const ModalRendered = txLoading ? ModalLoading :
      <>
          <Modal.Body>
              {
                  pollOptions.map((option, idx) => {
                      return (
                        <RangeSlider
                          key={idx}
                          option={option}
                          handleSliderChange={handleSliderChange}
                        />
                      )
                  })
              }
              {
                  percentage > 100 ? (
                    <div className={styles.errorMsg}>
                        {`${percentage}%`}
                    </div>
                  ) : (
                    <div className={styles.approvalMsg}>
                        {`${percentage}%`}
                    </div>
                  )
              }
          </Modal.Body>
          <Modal.Footer>
              <Button variant="cancel" onClick={handleEqualize}>{t('VoteModal.Equalise')}</Button>
              <Button variant="primary" disabled={percentage !== 100} onClick={handleMultipleVote}>{t('Footer.Vote')}</Button>
          </Modal.Footer>
      </>

    const TxnSuccessMsg =
      <>
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
              <div className={styles.approvalMsg}>{t('VoteModal.SuccessMsg')}</div>
              <a href={CoreData.getExplorerUrl(txnHash, networkType)} target="_blank">{t('Common.ViewTxnOnExplorer')}</a>
          </Modal.Body>
          <Modal.Footer>
              <Button variant="cancel" onClick={handleClose}>{t('Common.Close')}</Button>
          </Modal.Footer>
      </>

    const TxnErrorMsg =
      <>
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
              <div className={styles.approvalMsg}>{t('VoteModal.ErrorMsg')}</div>
              <a href={CoreData.getExplorerUrl(txnHash, networkType)} target="_blank">{t('Common.ViewTxnOnExplorer')}</a>
          </Modal.Body>
          <Modal.Footer>
              <Button variant="cancel" onClick={handleClose}>{t('Common.Close')}</Button>
          </Modal.Footer>
      </>

    return (
        <div className={styles.vote}>
            <div className={styles.introContainer}>
                <img
                    src={VoteIcon}
                    width="auto"
                    height="60"
                    className="styles.introIcon"
                    alt="voting icon"
                    />
                <div className={styles.introText}>{t('Vote.IntroMsg')}</div>
            </div>
            <Container className={styles.pollsContainer}>
                <Row>
                    {loading ? Loading : Polls}
                </Row>
            </Container>

            <Modal
              show={isCumulativeVoting}
              onHide={handleClose}
              aria-labelledby="voting-modal"
              className={styles.txnModal}
              contentClassName={styles.modalContent}
              centered
              animation={false}>
                <Modal.Header closeButton>
                    <div className={styles.assetName}>{currentPoll && currentPoll.title}</div>
                    <div className={styles.txnTypeDesc}>{t('Common.Voting')}</div>
                </Modal.Header>
                {
                    voteCompleted ? TxnSuccessMsg :
                      voteFailed ? TxnErrorMsg : ModalRendered
                }
            </Modal>
        </div>
    )
}

export default Vote
