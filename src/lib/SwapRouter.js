
const IUniswapV2Router02 = require('@uniswap/v2-periphery/build/IUniswapV2Router02.json');
const BigNumber = require('bignumber.js');

export default class SwapRouter {
    constructor(_web3, _usdt, _husd, _wht, _router) {
        this.web3 = _web3;
        this.USDT = _usdt;
        this.HUSD = _husd;
        this.WHT = _wht;
        this.router = new this.web3.eth.Contract(IUniswapV2Router02.abi, _router);
    }

    getPath(tokenA, tokenB) {
        const pathArray = [];
        pathArray.push([tokenA, tokenB]);
        if (tokenA !== this.WHT && tokenB !== this.WHT) {
            pathArray.push([tokenA, this.WHT, tokenB]);
        }

        if (tokenA !== this.HUSD && tokenB !== this.HUSD) {
            pathArray.push([tokenA, this.HUSD, tokenB]);
        }

        if (tokenA !== this.USDT && tokenB !== this.USDT) {
            pathArray.push([tokenA, this.USDT, tokenB]);
        }
        return pathArray;
    }

    async getAmountOutRouter(amountOut, tokenA, tokenB) {
        let out = [];
        const pathArray = this.getPath(tokenA, tokenB);

        let amountIn = BigNumber(0);
        for (let i = 0; i < pathArray.length; i++) {
            try {
                let amountsIn = await this.router.methods.getAmountsIn(amountOut, pathArray[i]).call();
                if (amountIn.isEqualTo(0) || amountIn.comparedTo(BigNumber(amountsIn[0])) == 1) {
                    amountIn = BigNumber(amountsIn[0]);
                    out = pathArray[i];
                }

            } catch (e) {
                console.log("error: ", e);
            }
        }

        return {
            path: out,
            amount: amountIn.toString(10)
        };
    }

    async getAmountInRouter(amountIn, tokenA, tokenB) {
        let out = [];
        const pathArray = this.getPath(tokenA, tokenB);

        let amountOut = BigNumber(0);
        for (let i = 0; i < pathArray.length; i++) {
            try {
                let amountsOut = await this.router.methods.getAmountsOut(amountIn, pathArray[i]).call();
                if (amountOut.isEqualTo(0) || amountOut.comparedTo(BigNumber(amountsOut[amountsOut.length - 1])) == -1) {
                    amountOut = BigNumber(amountsOut[amountsOut.length - 1]);
                    out = pathArray[i];
                }

            } catch (e) {
                console.log("error: ", e);
            }
        }

        return {
            path: out,
            amount: amountOut.toString(10)
        };
    }
}
