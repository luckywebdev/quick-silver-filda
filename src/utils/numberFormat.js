import BigNumber from 'bignumber.js'

export const formatBigNumber = (num) => {
    return new Number(num).toLocaleString("en-US", {maximumFractionDigits: 20})
}

export const formatDecimalNumber = (value) => {
    const oldValue = new BigNumber(value);
    if(oldValue.multipliedBy(100).abs() >= 1) {
        return oldValue.toFixed(2, 1);
    }
    else if(oldValue.multipliedBy(100).abs() < 1 && oldValue.multipliedBy(10000).abs() >= 1) {
        return oldValue.toFixed(4, 1);
    }
    else {
        return oldValue.toString(10);
    }
}