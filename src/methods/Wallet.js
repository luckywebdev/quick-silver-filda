import WalletConnectProvider from "@walletconnect/web3-provider";
import { Subject, BehaviorSubject } from "rxjs";
import Config from "../utils/config";
import log from "../utils/logger";

const walletTypeChangeRequest = new Subject();

const getActiveWalletType = function() {
    return window.localStorage.getItem("walletinuse");
}

const setActiveWalletType = function(walletKey) {
    if (walletKey)
        window.localStorage.setItem("walletinuse", walletKey);
    else
        window.localStorage.removeItem("walletinuse");
}

const switchToWallet = function(walletKey) {
    walletTypeChangeRequest.next(walletKey);
}

const createMetamaskWeb3Provider = async function() {
    log.info("Creating Metamask provider");
    return window.ethereum;
}

const createWalletConnectWeb3Provider = async function() {
    log.info("Creating Wallet Connect provider");

     //  Create WalletConnect Provider
    let provider = new WalletConnectProvider({
        rpc: Config.rpcUrls,
        //bridge: "http://192.168.31.114:5001"
        bridge: "https://bridge.walletconnect.org"
    });

    return provider;
}

export {
    walletTypeChangeRequest,
    switchToWallet,
    getActiveWalletType,
    setActiveWalletType,
    createMetamaskWeb3Provider,
    createWalletConnectWeb3Provider
}