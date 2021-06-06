import React, { useState, useEffect } from 'react'
import Web3 from 'web3'
import './AppVote.scss'
import LogoImg from './images/vote_logo.svg'
import Logo2Img from './images/vote_logo2.svg'
import ConnectBtnImg from './images/connect_btn.svg'
import proposalABI from './utils/proposalABI.json'
import log from './utils/logger'

const HOST = 'https://api-testnet.elastos.io/eth'
const web3 = new Web3(new Web3.providers.HttpProvider(HOST))
const proposalABIAddress = '0xAbE85D0d30332705fa2bBEd86E2a7f523519864E'
const proposalContract = new web3.eth.Contract(proposalABI.abi, proposalABIAddress)

function parseTime(time) {
    if (Number(time) === 0) {
        return {
            hour: '00',
            minute: '00',
            seconds: '00',
            raw: time
        }
    }
    let total = time
    const hour = (total - total % 3600) / 3600
    total = total % 3600
    const minute = (total - total % 60) / 60
    total = total % 60
    const seconds = total
    return {
        hour: hour < 10 ? `0${hour}` : hour,
        minute: minute < 10 ? `0${minute}` : minute,
        seconds: seconds < 10 ? `0${seconds}` : seconds,
        raw: time
    }
}
async function getTime() {
    try {
        const currentHeight = await web3.eth.getBlockNumber()
        const finishHeight = await proposalContract.methods.finishHeight().call()
        const time = (finishHeight - currentHeight) * 3
        if (time > 0) {
            return time
        }
        else {
            return 0
        }
    }
    catch (error) {
        log.error(error)
    }
    return 0
}

async function getDAOHref() {
    try {
        const description = await proposalContract.methods.description().call()
        return JSON.parse(description)
    }
    catch (error) {
        log.error(error)
    }
    return 0
}
async function getVoteInfo() {
    const votes = []
    try {
        const count = await proposalContract.methods.getVoteItemCount().call()
        // const currentHeight = await web3.eth.getBlockNumber()
        // const finishHeight = await proposalContract.methods.finishHeight().call()
        // const time = (finishHeight - currentHeight) * 3
        // log.info(parseInt(currentHeight), parseInt(finishHeight), parseTime(time))
        for (let index = 0; index < count; index++) {
            const [content, total] = await Promise.all([
                proposalContract.methods.itemContents(index).call(),
                proposalContract.methods.totalVotes(index).call()
            ])
            votes.push({
                index,
                content,
                total
            })
        }
    }
    catch (error) {
        log.error(error)
    }
    return votes
}
/* const ethEnabled = () => {
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum)
        window.ethereum.enable()
        return true
    }
    return false
}
ethEnabled() */
function App() {
    const [daoHref, setDaoHref] = useState({
        zh_cn: "/",
        en: "/"
    })
    const [votes, setVotes] = useState([])
    const [time, setTime] = useState(null)
    useEffect(() => {
        async function loadVoteInfo() {
            const votes = await getVoteInfo()
            setVotes(votes)
        }
        loadVoteInfo()
    }, [])
    useEffect(() => {
        async function loadDAOHref() {
            const daoHref = await getDAOHref()
            setDaoHref(daoHref)
        }
        loadDAOHref()
    }, [])

    useEffect(() => {
        async function load() {
            const result = await getTime()
            setTime(parseTime(result))
            setTimeout(() => {
                load()
            }, 5000)
        }
        load()
    }, [])



    const connectMetamask = async () => {
        await window.ethereum.enable()
    }

    async function voteItem(item) {
        if (window.web3) {
            const accounts = await window.web3.eth.getAccounts()
            if (accounts.length > 0) {
                const account = accounts[0]
                log.info(account)
                const proposalContract = new window.web3.eth.Contract(proposalABI.abi, proposalABIAddress)
                const gasEstimate = await proposalContract.methods.vote(item.index).estimateGas({from: account})
                log.info(gasEstimate)
                const gasPrice = await window.web3.eth.getGasPrice();
                log.info(gasPrice)
                const response = await proposalContract.methods.vote(item.index).send({
                    from: account,
                    gasLimit: gasEstimate,
                    gasPrice: gasPrice
                }
                );
                log.info(response)
            }

            //log.info(response)
        }
        else {

        }

    }

    return (
        <div className="main">
            <img className="connect-btn" src={ConnectBtnImg} alt={"connect button"} onClick={connectMetamask} />
            <img className="logo" src={LogoImg} alt={"logo"} />
            <img className="logo2" src={Logo2Img} alt={"logo2"} />
            {
                time ? <div className={"time"}><span>{time.hour}</span><span>:</span><span>{time.minute}</span><span>:</span><span>{time.seconds}</span></div> : null
            }
            <div className="text zh-text">
                中文版：<a href={daoHref.zh_cn}>DAO路线图</a>
            </div>
            <div className="text en-text">
                English：<a href={daoHref.en}>DAO Roadmap</a>
            </div>

            {
                votes.map(item => {
                    return <div key={item.index} className={item.content + "-btn btn"} onClick={() => {
                        voteItem(item)
                    }}>{item.content}({item.total})</div>
                })
            }
        </div>
    )
}

export default App
