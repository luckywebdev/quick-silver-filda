import BigNumber from 'bignumber.js'
import Config from '../utils/config'

const gasLimit = 1800000

const getComptroller = async(web3, networkType) => {

    const contractABI = Config.comptroller.ABI
    const contractAddress = Config.comptroller.network[networkType].address
    const contract = await new web3.eth.Contract(contractABI, contractAddress)
    return contract

}

const getTokenContract = async(web3, networkType, symbol) => {
    const contractABI = Config.markets[symbol].ABI;
    const contractAddress = Config.markets[symbol].network[networkType].address;
    let contract = await new web3.eth.Contract(contractABI, contractAddress);
    return contract
}

const getQTokenContract = async(web3, networkType, symbol) => {
    const qContractABI = Config.markets[symbol].qToken.ABI;
    const qContractAddress = Config.markets[symbol].qToken.network[networkType].address;
    let qContract = await new web3.eth.Contract(qContractABI, qContractAddress);
    return qContract
}

const getTokenAddress = (networkType, symbol) => {
    if (symbol === 'HT') return Config.WHT
    return Config.markets[symbol].network[networkType].address
}

const getQTokenAddress = (networkType, symbol) => {
    return Config.markets[symbol].qToken.network[networkType].address
}

const getGasInfo = async(web3) => {
    const gasPrice = await web3.eth.getGasPrice()
    return {
        gasPrice: gasPrice * 2,
        gasLimit: gasLimit
    }
}

const getExplorerUrl = (txnHash, networkType) => {
    return Config.blockExplorers[networkType]+'tx/'+txnHash
}

const getAddressUrl = (address, networkType, lpTokenId) => {
    if (['FHT', 'FHUSD', 'FELA'].includes(lpTokenId)) {
        return Config.mdexUrls[lpTokenId]
    }
    return `${Config.blockExplorers[networkType]}address/${address}`
}

const getShortAddress = (address) => {
    let addressStr = address.toString()
    return addressStr.slice(0,5) + '...' + addressStr.slice((addressStr.length - 3) - addressStr.length)
}

const getRawValue = async (web3, networkType, symbol, value)  => {
    let decimals = 18
    if (!isNativeToken(symbol)) {
        const contract = await getTokenContract(web3, networkType, symbol)
        decimals = await contract.methods.decimals().call()
    }
    BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_DOWN})
    return BigNumber(value).shiftedBy(parseInt(decimals)).toFixed(0)
}

function padLeft(num, nSize, ch)
{
    var len = 0;
    var s = num ? num.toString() : "";
    ch = ch ? ch : '0';// 默认补0

    len = s.length;
    while (len < nSize)
    {
        s = ch + s;
        len++;
    }
    return s;
}

function padRight(number, nSize, ch) {
    var len = 0;
    var s = number;
    ch = ch ? ch : '0';// 默认补0

    len = s.length;
    while (len < nSize)
    {
        s = s + ch;
        len++;
    }
    return s;
}

function movePointRight(num, scale) {
    var s, s1, s2, ch, ps;
    ch = '.';
    s = num.toString();
    if (scale <= 0) return s;
    ps = s.split('.');
    s1 = ps[0] ? ps[0] : "";
    s2 = ps[1] ? ps[1] : "";
    if (s2.length <= scale)  {
        ch = '';
        s2 = padRight(s2, scale, 0);
    }
    return s1 + s2.slice(0, scale) + ch + s2.slice(scale, s2.length);
}

function movePointLeft(num, scale)
{
    var s, s1, s2, ch, ps, sign;
    ch = '.';
    sign = '';
    s = num ? num : "";
    if (scale <= 0) return s;
    ps = s.split('.');
    s1 = ps[0] ? ps[0] : "";
    s2 = ps[1] ? ps[1] : "";
    if (s1.slice(0, 1) === '-')
    {
        s1 = s1.slice(1);
        sign = '-';
    }
    if (s1.length <= scale)
    {
        ch = "0.";
        s1 = padLeft(s1, scale);
    }
    return sign + s1.slice(0, -scale) + ch + s1.slice(-scale) + s2;
}

function toFixed(x) {
    if (Math.abs(x) < 1.0) {
      var e = parseInt(x.toString().split('e-')[1]);
      if (e) {
        x *= Math.pow(10,e-1);
          x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
      }
    } else {
      var e = parseInt(x.toString().split('+')[1]);
      if (e > 20) {
          e -= 20;
          x /= Math.pow(10,e);
          x += (new Array(e+1)).join('0');
      }
    }
    return x;
}

function fixedNaN(number) {
    if (isNaN(number)) {
      return 0
    }
    return number
}

function fromWei(web3, number, unit) {
    const truncatedNumber = toFixed(Math.trunc(number))
    return web3.utils.fromWei(truncatedNumber.toString(), unit)
}

const getCompLens = async(web3, networkType) => {
    const contractABI = Config.compoundLens.ABI
    const contractAddress = Config.compoundLens.network[networkType].address
    const contract = await new web3.eth.Contract(contractABI, contractAddress)
    return contract
}

const getMaximillion = async(web3, networkType) => {
    const contractABI = Config.maximillion.ABI
    const contractAddress = Config.maximillion.network[networkType].address
    const contract = await new web3.eth.Contract(contractABI, contractAddress)
    return contract
}

function isNativeToken(symbol) {
    if (symbol === 'ETH' || symbol === 'ELA' || symbol === 'HT') {
        return true
    }
    return false
}

export default {
    getComptroller: getComptroller,
    getTokenContract: getTokenContract,
    getQTokenContract: getQTokenContract,
    getTokenAddress: getTokenAddress,
    getQTokenAddress: getQTokenAddress,
    getGasInfo: getGasInfo,
    getExplorerUrl: getExplorerUrl,
    getAddressUrl: getAddressUrl,
    getShortAddress: getShortAddress,
    getRawValue,
    fixedNaN,
    getCompLens,
    toFixed,
    getMaximillion,
    isNativeToken,
    fromWei,
    movePointRight
}
