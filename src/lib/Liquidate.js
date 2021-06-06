const LiquidateWrapper = require('./LiquidateWrapper.json')
export default class Liquidate {

    constructor(_web3, _liquidate, _onTransactionHash) {
        this.web3 = _web3;

        this.liquidate = new this.web3.eth.Contract(LiquidateWrapper.abi, _liquidate);
        this.onTransactionHash = _onTransactionHash;
    }

    async liquidateERC20AndSell(swapInPath, token, borrower, repayAmount, collateral, amountInMax, swapOutPath, slide, account) {
        let gasEstimate = await this.liquidate.methods.liquidateERC20AndSell(
                swapInPath, token, borrower, repayAmount, collateral, amountInMax, swapOutPath, slide).estimateGas({from: account})
        console.log("gasEstimate:", gasEstimate)
        let ret = await this.liquidate.methods.liquidateERC20AndSell(
                swapInPath, token, borrower, repayAmount, collateral, amountInMax, swapOutPath, slide).send({from: account, gasLimit: gasEstimate*2}).on('transactionHash', this.onTransactionHash);
        return ret
    }

    async liquidateERC20(swapInPath, token, borrower, repayAmount, collateral, amountInMax, account) {
        let gasEstimate = await this.liquidate.methods.liquidateERC20(
                swapInPath, token, borrower, repayAmount, collateral, amountInMax).estimateGas({from: account})
        console.log("gasEstimate:", gasEstimate)
        let ret = await this.liquidate.methods.liquidateERC20(
                swapInPath, token, borrower, repayAmount, collateral, amountInMax).send({from: account, gasLimit: gasEstimate*2}).on('transactionHash', this.onTransactionHash);
        return ret
    }

    async liquidateETHAndSell(swapInPath, borrower, repayAmount, collateral, amountInMax, swapOutPath, slide, account) {
        let gasEstimate = await this.liquidate.methods.liquidateETHAndSell(
                swapInPath, borrower, repayAmount, collateral, amountInMax, swapOutPath, slide).estimateGas({from: account})
        console.log("gasEstimate:", gasEstimate)
        let ret = await this.liquidate.methods.liquidateETHAndSell(
                swapInPath, borrower, repayAmount, collateral, amountInMax, swapOutPath, slide).send({from: account, gasLimit: gasEstimate*2}).on('transactionHash', this.onTransactionHash);
        return ret
    }

    async liquidateETH(swapInPath, borrower, repayAmount, collateral, amountInMax, account) {
        if (swapInPath.length === 0) {
            let gasEstimate = await this.liquidate.methods.liquidateETH(
                swapInPath, borrower, repayAmount, collateral, amountInMax).estimateGas({from: account, value: repayAmount})
            console.log("gasEstimate:", gasEstimate)
            let ret = await this.liquidate.methods.liquidateETH(
                    swapInPath, borrower, repayAmount, collateral, amountInMax).send({from: account, value: repayAmount, gasLimit: gasEstimate*2}).on('transactionHash', this.onTransactionHash);;
            return ret
        } else {
            let gasEstimate = await this.liquidate.methods.liquidateETH(
                swapInPath, borrower, repayAmount, collateral, amountInMax).estimateGas({from: account})
            console.log("gasEstimate:", gasEstimate)
            let ret = await this.liquidate.methods.liquidateETH(
                    swapInPath, borrower, repayAmount, collateral, amountInMax).send({from: account, gasLimit: gasEstimate*2}).on('transactionHash', this.onTransactionHash);;
            return ret
        }

    }


}
