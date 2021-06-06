import Config from "../utils/config"

const getLiquidityArray = async() => {
    const data = await fetch(Config.apiUrls["accountsLiquidity"])
    const liquidity = await data.json()
    return liquidity.data
}

const getAccountDetail = async(address) => {
    const data = await fetch(`${Config.apiUrls["accountDetail"]}?address=${address}`)
    const res = await data.json()
    return res.data
}

export default {
    getLiquidityArray: getLiquidityArray,
    getAccountDetail: getAccountDetail,
}