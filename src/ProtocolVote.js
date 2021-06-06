import React, { useEffect, useState } from "react"
import { Container, Row, Col, Button } from "react-bootstrap"
import styles from "./Vote.module.scss"
import { FaMinusCircle, FaCheckCircle, FaTimesCircle } from "react-icons/fa"
import GovernanceData from "./methods/GovernanceData"
import Pagination from 'react-bootstrap-4-pagination'
import { useTranslation } from 'react-i18next'
import log from './utils/logger'

function ProtocolVote(props) {

    //We have to fetch the following data from GovernanceData.js
    // CurrentVotes, CompBalance, CompEarned, ProposalsList

    let connectedAddress = props.connectedAddress
    let networkType = props.networkType
    let web3 = props.web3
    const { t } = useTranslation();
    const initialDataTree = {
        currentVotes: 0,
        compBalance: 0,
        proposals: [],
        totalPages: 0
    }
    const [data, setData] = useState(initialDataTree)
    const [proposalsInView, setProposalsInView] = useState([])

    let paginationConfig = {
        totalPages: data.totalPages,
        currentPage: 1,
        showMax: 5,
        size: 'sm',
        prevNext: true,
        onClick: ((page) => {
            paginationConfig.currentPage = page
            setProposalsInView(getProposalInView(data.proposals))
        })
    }

    const getProposalInView = (proposals) => {
        const proposalStart = (paginationConfig.currentPage * paginationConfig.showMax) - paginationConfig.showMax
        const proposalEnd = proposalStart + paginationConfig.showMax
        return proposals.slice(proposalStart, proposalEnd)
    }

    useEffect(() => {
        let timer = null

        async function initialLoad() {

            let fetching = false
            timer = setInterval(async() => {

                if(!fetching &&
                    connectedAddress !== undefined
                    && networkType !== undefined
                    && networkType !== "unsupported"
                    && web3 !== undefined)
                {
                    fetching = true;
                    let dataTree = {}
                    dataTree.currentVotes = await GovernanceData.getCurrentVotes(web3, connectedAddress, networkType)
                    dataTree.compBalance = await GovernanceData.getCOMPBalance(web3, connectedAddress, networkType)
                    dataTree.proposals = await GovernanceData.getProposals(web3, networkType)
                    dataTree.totalPages = Math.ceil(dataTree.proposals.length / 5)
                    setProposalsInView(getProposalInView(dataTree.proposals))
                    setData(dataTree)
                    log.info(dataTree)
                }

            }, 1000)
        }
        initialLoad()
    }, [connectedAddress])

    const Proposals = proposalsInView.map(proposal => {
        return(
            <div key={proposal.id} className={styles.proposalContainer}>
                <Row>
                    <Col xs={9}>
                        <div className={styles.name}>{proposal.title}</div>
                        <div className={styles.infoContainer}>
                            <div className={styles.status}>
                                {
                                    proposal.executed ? <FaCheckCircle className={styles.passed} /> :
                                    proposal.canceled ? <FaTimesCircle className={styles.canceled} /> :
                                    ''
                                }
                                <div>Passed</div>
                            </div>
                            <div className={styles.id}>{proposal.id}</div>
                            <div className={styles.date}>Executed on {proposal.executedOn}</div>
                        </div>
                    </Col>
                    <Col xs={3}>
                        <div className={styles.voteActionContainer}>
                            <FaMinusCircle />
                            <div className={styles.text}>{t('Vote.NoVote')}</div>
                        </div>
                    </Col>
                </Row>
            </div>
        )
    })

    return (
        <div className={styles.vote}>
            <div className={styles.dashboard}>
                <div className={styles.label}>{t('Vote.Votes')}</div>
                <div className={styles.value}>{(data && data.currentVotes) ? (parseFloat(data.currentVotes)).toFixed(8) : "0.00000000"}</div>
            </div>
            <div className={styles.voteContent}>
                <Container>
                    <Row>
                        <Col md={4}>
                            <div className={styles.votingWallet}>
                                <div className={styles.title}>{t('Vote.Voting Wallet')}</div>
                                <div className={styles.balanceContainer}>
                                    <div className={styles.label}>{t('Vote.COMPBalance')}</div>
                                    <div className={styles.value}>{(data && data.currentVotes) ? (parseFloat(data.compBalance)).toFixed(8) : "0.00000000"}</div>
                                </div>
                                <div className={styles.balanceContainer}>
                                    <div className={styles.label}>{t('Vote.COMPEarned')}</div>
                                    <div className={styles.value}>0.00000000</div>
                                    <Button variant="secondary" size="sm">{t('Vote.Collect')}</Button>
                                </div>
                                <div className={styles.setupContainer}>
                                    <div className={styles.label}>{t('Vote.SetupVoting')}</div>
                                    <div className={styles.desc}>
                                       {t('Vote.SetupVotingDesc')}
                                    </div>
                                    <Button variant="savings" size="lg" block>{t('Vote.GetStarted')}</Button>
                                </div>
                            </div>
                        </Col>
                        <Col md={8}>
                            <div className={styles.governanceProposals}>
                            <div className={styles.title}>{t('Vote.GovernanceProposals')}</div>
                                {Proposals}
                                <div className={styles.paginationContainer}>
                                    {/* <Pagination>
                                        <Pagination.Prev />
                                        <Pagination.Item active>{1}</Pagination.Item>
                                        <Pagination.Item>{2}</Pagination.Item>
                                        <Pagination.Item>{3}</Pagination.Item>
                                        <Pagination.Item>{4}</Pagination.Item>
                                        <Pagination.Item>{5}</Pagination.Item>
                                        <Pagination.Next />
                                    </Pagination> */}
                                    <Pagination {...paginationConfig} />
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </div>
    )
}

export default Vote
