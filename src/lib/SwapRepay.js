const SwapRepayTool = require('./SwapRepayTool.json')

export default class SwapRepay {

    constructor(_web3, _wht, _swapRepay, _swapRouter, _onTransactionHash) {
        this.web3 = _web3;

        this.WHT = _wht;
        this.swapRepayTool = new this.web3.eth.Contract(SwapRepayTool.abi, _swapRepay);
        this.swapRouter = _swapRouter;
        this.onTransactionHash = _onTransactionHash;
    }

    async swapExactERC20RepayERC20(path, amountIn, repayCToken, amountOutMin, account) {
        if (path.length === 0) {
            return;
        }

        const gasEstimate = await this.swapRepayTool.methods.swapExactERC20RepayERC20(amountIn, path, repayCToken, amountOutMin).estimateGas({from: account})

        const ret = await this.swapRepayTool.methods.swapExactERC20RepayERC20(amountIn, path, repayCToken, amountOutMin).send({from: account, gasLimit: gasEstimate*2}).on('transactionHash', this.onTransactionHash);
        return ret
    }

    async swapERC20RepayExactERC20(path, repayAmount, repayCToken, amountInMax, account) {
        if (path.length === 0) {
            return;
        }

        const gasEstimate = await this.swapRepayTool.methods.swapERC20RepayExactERC20(path, repayCToken, repayAmount, amountInMax).estimateGas({from: account})

        const ret = await this.swapRepayTool.methods.swapERC20RepayExactERC20(path, repayCToken, repayAmount, amountInMax).send({from: account, gasLimit: gasEstimate*2}).on('transactionHash', this.onTransactionHash);
        return ret
    }

    async swapExactERC20RepayETH(path, amountIn, CEther, amountOutMin, account) {
        if (path.length === 0) {
            return;
        }

        const gasEstimate = await this.swapRepayTool.methods.swapExactERC20RepayETH(amountIn, path, CEther, amountOutMin).estimateGas({from: account})

        const ret = await this.swapRepayTool.methods.swapExactERC20RepayETH(amountIn, path, CEther, amountOutMin).send({from: account, gasLimit: gasEstimate*2}).on('transactionHash', this.onTransactionHash);
        return ret
    }

    async swapERC20RepayExactETH(path, repayAmount, CEther, amountInMax, account) {
        if (path.length === 0) {
            return;
        }

        const gasEstimate = await this.swapRepayTool.methods.swapERC20RepayExactETH(path, CEther, repayAmount, amountInMax).estimateGas({from: account})

        const ret = await this.swapRepayTool.methods.swapERC20RepayExactETH(path, CEther, repayAmount, amountInMax).send({from: account, gasLimit: gasEstimate*2}).on('transactionHash', this.onTransactionHash);
        return ret
    }


    async swapERC20RepayERC20All(path, repayCToken, amountInMax, account) {
        if (path.length === 0) {
            return;
        }

        const gasEstimate = await this.swapRepayTool.methods.swapERC20RepayERC20All(path, repayCToken, amountInMax).estimateGas({from: account})

        const ret = await this.swapRepayTool.methods.swapERC20RepayERC20All(path, repayCToken, amountInMax).send({from: account, gasLimit: gasEstimate*2}).on('transactionHash', this.onTransactionHash);
        return ret
    }

    async swapERC20RepayETHAll(path, CEther, amountInMax, account) {
        if (path.length === 0) {
            return;
        }

        const gasEstimate = await this.swapRepayTool.methods.swapERC20RepayETHAll(path, CEther, amountInMax).estimateGas({from: account})

        const ret = await this.swapRepayTool.methods.swapERC20RepayETHAll(path, CEther, amountInMax).send({from: account, gasLimit: gasEstimate*2}).on('transactionHash', this.onTransactionHash);
        return ret
    }

    async swapETHRepayERC20All(path, repayCToken, account, ethValue) {
        if (path.length === 0) {
            return;
        }

        const gasEstimate = await this.swapRepayTool.methods.swapETHRepayERC20All(path, repayCToken).estimateGas({from: account, value: ethValue})

        const ret = await this.swapRepayTool.methods.swapETHRepayERC20All(path, repayCToken).send({from: account, gasLimit: gasEstimate*2, value: ethValue}).on('transactionHash', this.onTransactionHash);
        return ret
    }

    async swapExactETHRepayERC20(path, repayCToken, amountOutMin, account, ethValue) {
        if (path.length === 0) {
            return;
        }

        const gasEstimate = await this.swapRepayTool.methods.swapExactETHRepayERC20(path, repayCToken, amountOutMin).estimateGas({from: account, value: ethValue})

        const ret = await this.swapRepayTool.methods.swapExactETHRepayERC20(path, repayCToken, amountOutMin).send({from: account, gasLimit: gasEstimate*2, value: ethValue}).on('transactionHash', this.onTransactionHash);
        return ret
    }
}
