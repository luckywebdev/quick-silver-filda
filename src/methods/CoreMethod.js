import BigNumber from 'bignumber.js'
import Config from '../utils/config'

const gasLimit = 500000

const approveERC20 = async(web3, connectedAddress, networkType, market) => {

    const contractABI = market.ABI;
    const contractAddress = market.network[networkType].address;
    let contract = await new web3.eth.Contract(contractABI, contractAddress);

    //erc20 qToken Info (eg: qDAI)
    const qContractAddress = market.qToken.network[networkType].address;
    const maxApproval = new BigNumber(2).pow(256).minus(1);

    const gasPrice = await web3.eth.getGasPrice()

    let response = await contract.methods.approve(qContractAddress, maxApproval.toString(10)).send({
        from: connectedAddress,
        gasLimit: web3.utils.toHex(gasLimit),     // posted at compound.finance/developers#gas-costs
        gasPrice: web3.utils.toHex(gasPrice) // use ethgasstation.info (mainnet only)
    })

    return response
}

const approveSwapRepayERC20 = async(web3, connectedAddress, networkType, market) => {

    const contractABI = market.ABI;
    const contractAddress = market.network[networkType].address;
    let contract = await new web3.eth.Contract(contractABI, contractAddress);

    const maxApproval = new BigNumber(2).pow(256).minus(1);

    let response = await contract.methods.approve(Config.SwapRepayContract, maxApproval.toString(10)).send({from: connectedAddress})

    return response
}

const approveLiquidateERC20 = async(web3, connectedAddress, networkType, market) => {

    const contractABI = market.ABI;
    const contractAddress = market.network[networkType].address;
    let contract = await new web3.eth.Contract(contractABI, contractAddress);

    const maxApproval = new BigNumber(2).pow(256).minus(1);

    let response = await contract.methods.approve(Config.LiquidateContract, maxApproval.toString(10)).send({from: connectedAddress})

    return response
}

export default {
    approveERC20: approveERC20,
    approveSwapRepayERC20: approveSwapRepayERC20,
    approveLiquidateERC20: approveLiquidateERC20
}
