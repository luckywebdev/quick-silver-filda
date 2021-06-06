This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## To run development server
npm install
npm start

## To make production build
npm install
npm run build

./build directory stores the build package

## Calculations

###SavingsAPY (Also knows as SupplyAPY in compound)
- contract: cToken (cETH / CERC20)
- method: supplyRatePerBlock()

loanAPY (Also knows as BorrowAPY in compound)
contract: cToken (cETH / CERC20)
method: borrowRatePerBlock()

## Setup log level

localStorage.setItem('loglevel:filda', 'DEBUG')
