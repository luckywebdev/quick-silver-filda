import Config from '../utils/config'
import moment from 'moment'
import filda from '../images/markets/filda.svg'
import fela from '../images/markets/fela.svg'
import fhusd from '../images/markets/fhusd.svg'
import fclc from '../images/markets/fclc.svg'
import ht from '../images/markets/ht.svg'
import fht from '../images/markets/filda-ht.png'
import mdx from '../images/markets/mdx.png'
import dog from '../images/markets/dog.png'
import filDog from '../images/markets/filda-dog.png'
import filWht from '../images/markets/filda-wht.png'
import mdxfilda from '../images/markets/filda-mdx.png'
import hfi from '../images/markets/hfi.png'
import BigNumber from 'bignumber.js'
import CoreData from './CoreData'
import FetchData from './FetchData'
import log from '../utils/logger'

const getLogo = (tokenSymbol) => {
	switch (tokenSymbol) {
		case "FELA":
			return fela

		case "FHUSD":
			return fhusd

		case "FCLC":
			return fclc

		case "FHT":
			return fht

		case "HT":
			return ht

		case "MDXFILDA":
			return mdxfilda

		case "HFI":
			return hfi

		case "MDX":
			return mdx

		case "DOG":
			return dog

		case "FILDOG":
			return filDog

		case "FILWHT":
			return filWht

		default:
			return filda
	}
}

const getPoolList = () => {
	return Object.keys(Config.pools).map(k => ({ 'address': k })).reverse()
}

const getPoolInfo = async (web3, networkType, connectedAddress, poolAddress) => {
	const noMintRewardPoolABI = Config.noMintRewardPool.ABI
	const erc20ABI = Config.erc20.ABI
	const poolInfo = { address: poolAddress }

	const isShortcut = Config.pools[poolAddress].isShortcut
	poolInfo.isShortcut = isShortcut
	poolInfo.indexOfPool = Config.pools[poolAddress].indexOfPool
	poolInfo.lpTokenShortName = Config.pools[poolAddress].lpTokenShortName
	poolInfo.fromDogswap = Config.pools[poolAddress].fromDogswap
	poolInfo.pool = Config.pools[poolAddress].pool

	let noMintRewardPoolContract
	if (!isShortcut) {
		noMintRewardPoolContract = await new web3.eth.Contract(noMintRewardPoolABI, poolAddress)
		poolInfo.name = await noMintRewardPoolContract.methods.name().call()
	} else {
		noMintRewardPoolContract = await new web3.eth.Contract(poolInfo.pool.ABI, poolInfo.pool.address)
		poolInfo.name = Config.pools[poolAddress].lpTokenName
	}


	if (Config.pools[poolAddress].lpTokenId === 'FilDA-Airdrop') {
		poolInfo.rewardTokenName = 'FilDA'
		poolInfo.rewardTokenSymbol = 'FilDA'
		poolInfo.lpTokenSymbol = 'FilDA'
		const defaultLogo = getLogo('default')
		poolInfo.rewardTokenLogo = defaultLogo
		poolInfo.lpTokenLogo = defaultLogo
		const [redpacketBalance, totalRedpacket, rewardTokenTokenAddress] = await Promise.all([
			noMintRewardPoolContract.methods.earned(connectedAddress).call(),
			noMintRewardPoolContract.methods.totalSupply().call(),
			noMintRewardPoolContract.methods.rewardToken().call()
		])
		poolInfo.redpacketBalance = redpacketBalance
		poolInfo.redpacketBalanceFormatted = (poolInfo.redpacketBalance / Math.pow(10, 18))
		poolInfo.rewardsBalance = poolInfo.redpacketBalance
		poolInfo.rewardsBalanceFormatted = poolInfo.redpacketBalanceFormatted
		poolInfo.totalRedpacket = totalRedpacket / Math.pow(10, 18)

		const [rewardTokenTokenContract, totalRedpacketLeft, periodFinish, rewardsRedeemed] = await Promise.all([
			new web3.eth.Contract(erc20ABI, rewardTokenTokenAddress),
			poolInfo.rewardTokenTokenContract.methods.balanceOf(poolAddress).call(),
			noMintRewardPoolContract.methods.periodFinish().call(),
			noMintRewardPoolContract.methods.rewards(connectedAddress).call()
		])
		poolInfo.rewardTokenTokenContract = rewardTokenTokenContract
		poolInfo.totalRedpacketLeft = totalRedpacketLeft / Math.pow(10, 18)
		poolInfo.withdrawPeriod = 0

		const now = Math.round((new Date()).getTime() / 1000)
		poolInfo.redpacketActive = periodFinish > now

		// poolInfo.rewardAPR = 0
		poolInfo.rewardsRedeemed = rewardsRedeemed / Math.pow(10, 18)

		return poolInfo
	}

	if (Config.pools[poolAddress].isAirdrop) {
		poolInfo.rewardTokenName = Config.pools[poolAddress].lpTokenName
		poolInfo.rewardTokenSymbol = poolInfo.rewardTokenName
		poolInfo.lpTokenSymbol = poolInfo.rewardTokenName
		poolInfo.rewardTokenLogo = getLogo(poolInfo.rewardTokenSymbol)
		poolInfo.lpTokenLogo = getLogo('')
		const [rewardsBalance, totalRewards, totalRewardsLeft, periodFinish, currentSnapshotId, daoPoolContract] =
			await Promise.all([
				noMintRewardPoolContract.methods.earned(connectedAddress).call(),
				noMintRewardPoolContract.methods.totalSupply().call(),
				web3.eth.getBalance(poolAddress),
				noMintRewardPoolContract.methods.periodFinish().call(),
				noMintRewardPoolContract.methods.currentSnapshotId().call(),
				new web3.eth.Contract(noMintRewardPoolABI, '0x73CB0A55Be009B30e63aD5830c85813414c66367')
			])
		poolInfo.rewardsBalance = rewardsBalance
		poolInfo.rewardsBalanceFormatted = (poolInfo.rewardsBalance / Math.pow(10, 18))
		poolInfo.totalRewards = totalRewards
		poolInfo.totalRewards = poolInfo.totalRewards / Math.pow(10, 18)
		poolInfo.totalRewardsLeft = totalRewardsLeft
		if (poolInfo.rewardTokenSymbol != "HT") {
			const rewardToken = new web3.eth.Contract(erc20ABI, Config.pools[poolAddress].airdropToken)
			poolInfo.totalRewardsLeft = await rewardToken.methods.balanceOf(poolAddress).call()
		}
		poolInfo.totalRewardsLeft = poolInfo.totalRewardsLeft / Math.pow(10, 18)
		poolInfo.withdrawPeriod = 0

		let now = Math.round((new Date()).getTime() / 1000)
		poolInfo.rewardsActive = periodFinish > now

		const htFildaLp = '0x55542f696a3fecae1c937bd2e777b130587cfd2d'
		const uniswapContractABI = Config.uniswapPair.ABI

		let [daoPoolFildaAmount, userBalance, uniswapContract] = await Promise.all([
			daoPoolContract.methods.totalSupplyAt(currentSnapshotId).call(),
			daoPoolContract.methods.balanceOfAt(connectedAddress, currentSnapshotId).call(),
			new web3.eth.Contract(uniswapContractABI, htFildaLp)
		])

		const reserves = await uniswapContract.methods.getReserves().call()
		const fildaAmount = reserves.reserve1
		const htAmount = reserves.reserve0
		const htPrice = fildaAmount / htAmount
		const htRewards = poolInfo.totalRewards
		console.log("Airdrop fildaAmount===>", fildaAmount, htAmount, htPrice, htRewards);
		daoPoolFildaAmount = daoPoolFildaAmount / Math.pow(10, 18)
		userBalance = userBalance / Math.pow(10, 18)
		let userRewards = poolInfo.totalRewards * userBalance / daoPoolFildaAmount
		const rewardsApy = htPrice * htRewards * 52 * 100 / daoPoolFildaAmount
		poolInfo.rewardAPR = rewardsApy.toFixed(4)
		poolInfo.rewardsRedeemed = userRewards - poolInfo.rewardsBalanceFormatted
		if (!poolInfo.rewardsActive) {
			poolInfo.rewardsRedeemed = 0
			poolInfo.rewardAPR = 0
		}
		poolInfo.rewardsAPY = poolInfo.rewardAPR !== 0 ? Math.pow(rewardsApy / 100 / 365 + 1, 365) * 100 : 0
		if (poolInfo.rewardsRedeemed < 0.000000001) poolInfo.rewardsRedeemed = 0
		// if (poolInfo.rewardTokenSymbol != 'HT') poolInfo.rewardAPR = undefined
		return poolInfo
	}

	//fetching LP Token Info
	if (!isShortcut) {
		poolInfo.lpTokenAddress = await noMintRewardPoolContract.methods.lpToken().call()
	} else {
		poolInfo.lpTokenAddress = poolInfo.address
	}

	poolInfo.lpTokenContract = await new web3.eth.Contract(erc20ABI, poolInfo.lpTokenAddress)

	poolInfo.lpTokenName = Config.pools[poolAddress].lpTokenName
	poolInfo.lpTokenSymbol = Config.pools[poolAddress].lpTokenSymbol
	poolInfo.lpTokenId = Config.pools[poolAddress].lpTokenId
	poolInfo.disabled = !!Config.pools[poolAddress].disabled
	poolInfo.hasLockPeriod = Config.pools[poolAddress].hasLockPeriod
	if (poolInfo.lpTokenName !== 'FilDA') poolInfo.name = poolInfo.lpTokenName

	//Important: We are reading the lpTokenName and lpTokenSymbol from hard coded values from config file.
	// The following code will make them read from the pool manager
	// poolInfo.lpTokenNameFromContract = await poolInfo.lpTokenContract.methods.name().call()
	// poolInfo.lpTokenSymbolFromContract = await poolInfo.lpTokenContract.methods.symbol().call()

	poolInfo.lpTokenLogo = getLogo(poolInfo.lpTokenId)

	let lpTokendecimals, lpTokenStakedTotalSupply, lpTokenStakedBalance, lpTokenWalletBalance, allowance, periodFinish, fildaPrice, userInfo, thePool
	lpTokendecimals = await poolInfo.lpTokenContract.methods.decimals().call()
	lpTokenWalletBalance = await poolInfo.lpTokenContract.methods.balanceOf(connectedAddress).call()
	allowance = await poolInfo.lpTokenContract.methods.allowance(connectedAddress, poolAddress).call()
	if (!isShortcut) {
		lpTokenStakedTotalSupply = await noMintRewardPoolContract.methods.totalSupply().call()
		lpTokenStakedBalance = await noMintRewardPoolContract.methods.balanceOf(connectedAddress).call()
		periodFinish = await noMintRewardPoolContract.methods.periodFinish().call()
	} else {
		thePool = await noMintRewardPoolContract.methods.poolInfo(Config.pools[poolAddress].indexOfPool).call()
		lpTokenStakedTotalSupply = thePool.totalAmount

		userInfo = await noMintRewardPoolContract.methods.userInfo(Config.pools[poolAddress].indexOfPool, connectedAddress).call()
		lpTokenStakedBalance = userInfo.amount

		periodFinish = 999999999999999
	}
	fildaPrice = await FetchData.getFildaPrice(web3, networkType)

	poolInfo.lpTokendecimals = lpTokendecimals
	poolInfo.lpTokenStakedTotalSupply = lpTokenStakedTotalSupply
	poolInfo.lpTokenStakedTotalSupplyFormatted = poolInfo.lpTokenStakedTotalSupply / Math.pow(10, parseInt(lpTokendecimals))
	poolInfo.lpTokenStakedBalance = lpTokenStakedBalance
	poolInfo.lpTokenStakedBalanceFormatted = (lpTokenStakedBalance / Math.pow(10, parseInt(lpTokendecimals)))
	poolInfo.lpTokenWalletBalance = lpTokenWalletBalance
	poolInfo.lpTokenWalletBalanceFormatted = (poolInfo.lpTokenWalletBalance / Math.pow(10, parseInt(lpTokendecimals)))

	let poolAmount
	let dogPrice = 0
	if (poolInfo.lpTokenName.toLowerCase() === poolInfo.lpTokenId.toLowerCase()) {
		poolAmount = poolInfo.lpTokenStakedTotalSupplyFormatted
	} else {
		const uniswapContractABI = isShortcut ? Config.mdex.hecoPoolPair : Config.uniswapPair.ABI
		const uniswapContract = new web3.eth.Contract(uniswapContractABI, poolInfo.lpTokenAddress)

		const [reserves, totalSupply] = await Promise.all([
			uniswapContract.methods.getReserves().call(),
			poolInfo.lpTokenContract.methods.totalSupply().call()
		])

		let totalLpToken
		totalLpToken = (reserves.reserve1 ?? reserves._reserve1) * 2 / Math.pow(10, lpTokendecimals)

		poolAmount = totalLpToken * poolInfo.lpTokenStakedTotalSupply / totalSupply

		dogPrice = await FetchData.getDogPrice(web3, fildaPrice)
	}

	poolInfo.lpTokenApproved = Number(allowance) !== 0

	let now = Math.round((new Date()).getTime() / 1000)
	//fetching rewards token info
	let rewardRate = 0
	if (periodFinish > now) {
		if (!isShortcut) {
			rewardRate = await noMintRewardPoolContract.methods.rewardRate().call()
		} else {
			rewardRate = 100
		}
	}

	let rewardRatioPerDay = 0
	if (!isShortcut) {
		if (poolAmount > 0) rewardRatioPerDay = rewardRate * 3600 * 24 / Math.pow(10, 18) / poolAmount
		const rewardRatioPerYear = rewardRatioPerDay * 365
		poolInfo.rewardAPR = rewardRatioPerYear * 100
		poolInfo.rewardAPR = poolInfo.rewardAPR.toFixed(2)
		poolInfo.rewardAPY = rewardRatioPerDay !== 0 ? Math.pow(rewardRatioPerDay + 1, 365) * 100 : 0
		poolInfo.rewardAPY = poolInfo.rewardAPY.toFixed(2)
	} else {
		const allocPoint = thePool.allocPoint

		let totalAllocPoint
		let mdxPerBlock
		if (poolInfo.fromDogswap) {
			poolInfo.coefficient = Config.pools[poolAddress].coefficient

			const tvl = new BigNumber(poolAmount).multipliedBy(fildaPrice)

			// totalAllocPoint = await noMintRewardPoolContract.methods.lpAllocPoints().call()
			// mdxPerBlock = await noMintRewardPoolContract.methods.DOGPerBlock().call()
			// rewardRatioPerDay = new BigNumber(mdxPerBlock).dividedBy(1e18).multipliedBy(28800).multipliedBy(allocPoint).dividedBy(totalAllocPoint).multipliedBy(dogPrice).dividedBy(tvl)
			// poolInfo.rewardAPY = rewardRatioPerDay.plus(1).pow(365).multipliedBy(100).toFixed(2)

			const earned365 = await noMintRewardPoolContract.methods.get365EarnedByPid(poolInfo.indexOfPool).call()
			poolInfo.rewardAPY = new BigNumber(earned365).dividedBy(1e18).multipliedBy(poolInfo.coefficient).multipliedBy(dogPrice).dividedBy(tvl).multipliedBy(100).toFixed(2)
		} else {
			totalAllocPoint = await noMintRewardPoolContract.methods.totalAllocPoint().call()
			mdxPerBlock = await noMintRewardPoolContract.methods.mdxPerBlock().call()
			rewardRatioPerDay = new BigNumber(mdxPerBlock).dividedBy(Math.pow(10, 18)).multipliedBy(28800).multipliedBy(allocPoint).dividedBy(totalAllocPoint).dividedBy(poolAmount).dividedBy(fildaPrice)
			poolInfo.rewardAPY = rewardRatioPerDay.plus(1).pow(365).multipliedBy(100).toFixed(2)
		}
	}

	poolInfo.poolAmountInUsd = poolAmount * fildaPrice
	poolInfo.poolAmountInUsd = poolInfo.poolAmountInUsd.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')

	if (!isShortcut) {
		poolInfo.rewardTokenAddress = await noMintRewardPoolContract.methods.rewardToken().call()
	} else {
		poolInfo.reward = Config.pools[poolAddress].reward
		poolInfo.rewardTokenAddress = poolInfo.reward.address
	}
	poolInfo.rewardTokenContract = await new web3.eth.Contract(erc20ABI, poolInfo.rewardTokenAddress)

	let rewardTokenName, rewardTokenSymbol, rewardDecimals, rewardsEarnedBalance, adminAddress, withdrawPeriod
	rewardTokenName = await poolInfo.rewardTokenContract.methods.name().call()
	rewardTokenSymbol = await poolInfo.rewardTokenContract.methods.symbol().call()
	rewardDecimals = await poolInfo.rewardTokenContract.methods.decimals().call()
	if (!isShortcut) {
		rewardsEarnedBalance = await noMintRewardPoolContract.methods.earned(connectedAddress).call()
		adminAddress = await noMintRewardPoolContract.methods.governance().call()
		withdrawPeriod = await noMintRewardPoolContract.methods.withdrawPeriod().call()
	} else {
		if (poolInfo.fromDogswap) {
			rewardsEarnedBalance = await noMintRewardPoolContract.methods.pendingDOG(poolInfo.indexOfPool, connectedAddress).call()
		} else {
			rewardsEarnedBalance = (await noMintRewardPoolContract.methods.pending(poolInfo.indexOfPool, connectedAddress).call())[0]
		}
		adminAddress = Config.mdex.factory
		withdrawPeriod = 0
	}

	poolInfo.rewardTokenName = rewardTokenName
	poolInfo.rewardTokenSymbol = rewardTokenSymbol
	poolInfo.rewardTokenLogo = getLogo(poolInfo.rewardTokenSymbol)
	poolInfo.rewardsEarnedBalance = rewardsEarnedBalance
	poolInfo.rewardsEarnedBalanceFormatted = (poolInfo.rewardsEarnedBalance / Math.pow(10, parseInt(rewardDecimals)))

	poolInfo.adminAddress = adminAddress
	poolInfo.stakeActive = periodFinish > now
	poolInfo.withdrawPeriod = parseInt(withdrawPeriod)

	//hardcoding the pooladdress to skip the pool that was wrongly deployed
	if (Number(poolInfo.withdrawPeriod) !== 0) {
		let withdrawTime, lockedBalance
		if (!isShortcut) {
			withdrawTime = await noMintRewardPoolContract.methods.withdrawTime().call({ from: connectedAddress })
			lockedBalance = await noMintRewardPoolContract.methods.lockedBalance().call({ from: connectedAddress })
		} else {
			withdrawTime = 0
			lockedBalance = 0
		}
		poolInfo.withdrawTime = withdrawTime
		poolInfo.withdrawWaitTime = parseInt(poolInfo.withdrawTime) - moment().unix()
		poolInfo.lockedBalance = lockedBalance
		poolInfo.lockedBalanceFormatted = (poolInfo.lockedBalance / Math.pow(10, parseInt(lpTokendecimals)))
	}

	//log.info(poolInfo.name, poolInfo.lpTokenStakedBalance)
	return poolInfo
}

const gasLimit = 500000

const approveERC20 = async (web3, connectedAddress, networkType, tokenAddress, spendAddress) => {

	const erc20ABI = Config.erc20.ABI
	let contract = await new web3.eth.Contract(erc20ABI, tokenAddress);

	const maxApproval = BigNumber(2).pow(256).minus(1).toFixed(0);

	const gasPrice = await web3.eth.getGasPrice()

	log.info(`Initiating approval: ${spendAddress} ${tokenAddress} ${maxApproval}`)
	return await contract.methods.approve(spendAddress, maxApproval.toString()).send({
		from: connectedAddress,
		gasLimit: web3.utils.toHex(gasLimit),     // posted at compound.finance/developers#gas-costs
		gasPrice: web3.utils.toHex(gasPrice) // use ethgasstation.info (mainnet only)
	})
}

const getPoolContract = async (web3, networkType, poolAddress, pool) => {
	const noMintRewardPoolABI = pool ? pool.ABI : Config.noMintRewardPool.ABI;
	let noMintRewardPoolContract = await new web3.eth.Contract(noMintRewardPoolABI, pool ? pool.address : poolAddress)
	return noMintRewardPoolContract
}

const getRawValue = async (web3, networkType, tokenContract, tokenSymbol, value) => {
	let decimals = 18
	if (!CoreData.isNativeToken(tokenSymbol)) {
		decimals = await tokenContract.methods.decimals().call()
	}

	BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_DOWN })
	const rawValue = BigNumber(value).multipliedBy(BigNumber(10).pow(parseInt(decimals))).toFixed(0)
	return rawValue
}

export default {
	getPoolList: getPoolList,
	getPoolInfo: getPoolInfo,
	approveERC20: approveERC20,
	getPoolContract: getPoolContract,
	getRawValue: getRawValue
}
