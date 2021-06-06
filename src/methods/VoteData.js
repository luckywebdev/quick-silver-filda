import Config from '../utils/config'
import BigNumber from "bignumber.js";

String.prototype.toHHMMSS = function () {
    let sec_num = parseInt(this, 10) // don't forget the second param
    let hours   = Math.floor(sec_num / 3600)
    let minutes = Math.floor((sec_num - (hours * 3600)) / 60)
    let seconds = sec_num - (hours * 3600) - (minutes * 60)

    if (hours   < 10) {hours   = `0${hours}`}
    if (minutes < 10) {minutes = `0${minutes}`}
    if (seconds < 10) {seconds = `0${seconds}`}
    return `${hours} : ${minutes} : ${seconds}`
}

const getPollsDataArray = async(web3, networkType, connectedAddress) => {
    const proposalAddresses = Array.from(Config.voteProposal.network[networkType]).reverse()
    const proposalPromises = []
    for (const proposalAddress of proposalAddresses) {
        proposalPromises.push(getProposalInfo(web3, connectedAddress, proposalAddress.address, proposalAddress.isMultiple))
    }
    return Promise.all(proposalPromises)
}
const getProposalInfo = async(web3, connectedAddress, proposalAddress, isMultiple) => {
    let proposalABI
    if (isMultiple) {
        proposalABI = Config.voteProposal.MultipleABI
    } else {
        proposalABI = Config.voteProposal.ABI
    }

    let proposalContract = await new web3.eth.Contract(proposalABI, proposalAddress)

    let proposalInfo = {proposalAddress}
    const [title, link, startHeight, finishHeight, currentHeight, yesVotes, noVotes, voted] = await Promise.all([
        proposalContract.methods.title().call(),
        proposalContract.methods.link().call(),
        proposalContract.methods.startHeight().call(),
        proposalContract.methods.finishHeight().call(),
        web3.eth.getBlockNumber(),
        proposalContract.methods.totalVotes(0).call(),
        proposalContract.methods.totalVotes(1).call(),
        proposalContract.methods.exist(connectedAddress).call(),
    ])
    proposalInfo.title = title
    proposalInfo.link = link
    proposalInfo.yesVotes = (yesVotes/Math.pow(10, 18)).toFixed()
    proposalInfo.noVotes = (noVotes/Math.pow(10, 18)).toFixed()
    proposalInfo.voted = voted

    if (isMultiple) {
        proposalInfo.proposalType = await proposalContract.methods.proposalType().call()
    }

    if (currentHeight > startHeight && currentHeight < finishHeight) {
        proposalInfo.status = 'active'
        proposalInfo.timeLeft = ((finishHeight - currentHeight) * 3).toString().toHHMMSS()
    } else {
        if (proposalInfo.proposalType) {
            if (currentHeight >= finishHeight) proposalInfo.status = 'completed'
            else {
                proposalInfo.status = 'inactive'
            }
            return proposalInfo
        }

        proposalInfo.status = 'inactive'
        if (currentHeight >= finishHeight) {
            if (new BigNumber(proposalInfo.yesVotes).isGreaterThan(proposalInfo.noVotes)) {
                proposalInfo.status = 'passed'
            } else {
                proposalInfo.status = 'rejected'
            }
        }
    }
    return proposalInfo
}

const getProposalContract = async(web3, networkType) => {
    const proposalABI = Config.voteProposal.ABI
    const singleVoteLength = Config.voteProposal.network[networkType].length
    const proposalAddress = Config.voteProposal.network[networkType][singleVoteLength - 1].address
    return new web3.eth.Contract(proposalABI, proposalAddress)
}

const getMultiProposalContract = async(web3, proposalAddress) => {
    const proposalABI = Config.voteProposal.MultipleABI
    return new web3.eth.Contract(proposalABI, proposalAddress)
}

const getMultipleVoteOptions = async (web3, networkType, pollAddress) => {
    const proposalABI = Config.voteProposal.MultipleABI
    let proposalContract = await new web3.eth.Contract(proposalABI, pollAddress)

    const itemCount = await proposalContract.methods.getVoteItemCount().call()
    const optionsPromise = []
    for (let i = 0; i < itemCount; i++) {
        optionsPromise.push(proposalContract.methods.itemContents(i).call())
    }
    return Promise.all(optionsPromise)
}

export default {
    getPollsDataArray: getPollsDataArray,
    getProposalContract: getProposalContract,
    getMultipleVoteOptions,
    getMultiProposalContract
}
