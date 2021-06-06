import React from 'react'

const LanguageContext = React.createContext({language: 'en'})

const WalletAddressContext = React.createContext()

const WalletTypeContext = React.createContext()

const NetworkTypeContext = React.createContext()

const Web3Context = React.createContext()

const ReadonlyWeb3Context = React.createContext()

export {
    LanguageContext,
    WalletAddressContext,
    WalletTypeContext,
    NetworkTypeContext,
    Web3Context,
    ReadonlyWeb3Context,
}
