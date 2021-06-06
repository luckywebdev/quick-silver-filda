import Config from '../utils/config'
import moment from 'moment'
import log from '../utils/logger'

const getCurrentVotes = async(web3, connectedAddress, networkType) => {

        //ERC20 Token Info (eg:DAI)
        const contractABI = Config.COMP.ABI;
        const contractAddress = Config.COMP.network[networkType].address;

        let contract = await new web3.eth.Contract(contractABI, contractAddress);
        const response = await contract.methods.getCurrentVotes(connectedAddress).call()
        return response
}

const getCompBalanceWithAccrued = async(web3, connectedAddress, networkType) => {
    if(Config.COMP.network[networkType] == undefined || Config.compoundLens.network[networkType] == undefined) {
        //Absence of governance token
        return {
            balance: 0,
            symbol: "",
            accrued: 0
        }
    }

    const compContractABI = Config.COMP.ABI;
    const compContractAddress = Config.COMP.network[networkType].address;
    let compContract = await new web3.eth.Contract(compContractABI, compContractAddress);
    const comptrollerAddress = Config.comptroller.network[networkType].address
    const contractABI = Config.compoundLens.ABI
    const contractAddress = Config.compoundLens.network[networkType].address
    const contract = await new web3.eth.Contract(contractABI, contractAddress)
    let compBalanceWithAccrued = await contract.methods.getCompBalanceWithAccrued(compContractAddress, comptrollerAddress, connectedAddress).call()
    const accrued = compBalanceWithAccrued.allocated
    const balance = compBalanceWithAccrued.balance
    const symbol = await compContract.methods.symbol().call((e, symbol) => {
        return symbol
    })
    const decimals = await compContract.methods.decimals().call();
    return {
        balance: (balance / Math.pow(10, parseInt(decimals))),
        symbol: symbol,
        accrued: (accrued / Math.pow(10, parseInt(decimals)))
    }
}

const getProposals = async(web3, networkType) => {
    const contractABI = Config.governorAlpha.ABI;
    const contractAddress = Config.governorAlpha.network[networkType].address;
    let contract = await new web3.eth.Contract(contractABI, contractAddress);

    const enumerateProposalState = (state) => {
        const proposalStates = ['Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed'];
        return proposalStates[state];
      };

    const proposalCount = await contract.methods.proposalCount().call()

    const proposalGets = []
    const proposalStateGets = []
    for (const i of Array.from(Array(parseInt(proposalCount)), (n,i) => i+1)) {
        proposalGets.push(contract.methods.proposals(i).call());
        proposalStateGets.push(contract.methods.state(i).call());
    }

    const proposals = await Promise.all(proposalGets)
    const proposalStates = await Promise.all(proposalStateGets)
    const proposalCreatedEvents = await contract.getPastEvents('ProposalCreated', {
        fromBlock: 0,
        toBlock: 'latest'
    })

    proposals.reverse()
    proposalStates.reverse()
    proposalCreatedEvents.reverse()


    proposals.forEach((p, i) => {
        const { description } = proposalCreatedEvents[i].returnValues;
        p.title = description.split(/# |\n/g)[1] || 'Untitled';
        p.description = description.split(/# |\n/g)[2] || 'No description.';
        p.state = enumerateProposalState(proposalStates[i]);
        p.for_votes = (parseFloat(p.forVotes) / 1e18).toFixed(2);
        p.against_votes = (parseFloat(p.againstVotes) / 1e18).toFixed(2);
        p.executedOn = moment(p.eta * 1000).format('MMMM Do, YYYY');
      });

    log.info(proposals)

    return proposals
}

export default {
    getCurrentVotes: getCurrentVotes,
    getProposals: getProposals,
    getCompBalanceWithAccrued: getCompBalanceWithAccrued
}
