import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import Home from './Home'
import Staking from './Staking'
import Dashboard from './Dashboard'
import Vote from './Vote'
import Liquidate from './Liquidate'
import MarketDetail from './MarketDetail'
import Header from './components/Header'
import Web3 from 'web3'
import Config from './utils/config'
import './App.scss'
import Footer from './components/Footer'
import { useTranslation } from 'react-i18next'
import { LanguageContext, WalletAddressContext, WalletTypeContext, NetworkTypeContext, Web3Context, ReadonlyWeb3Context } from './context'
import logger from './utils/logger'
import detectEthereumProvider from '@metamask/detect-provider'
import { walletTypeChangeRequest, createWalletConnectWeb3Provider, getActiveWalletType, setActiveWalletType } from './methods/Wallet';
import log from './utils/logger'

const AboutUs = lazy(() => import('./pages/aboutUs')) // 关于我们

function App() {
    const [connectedAddress, setConnectedAddress] = useState()
    const [walletType, setWalletType] = useState()
    const [networkType, setNetworkType] = useState()
    let [web3, setWeb3] = useState()
    const [readonlyWeb3, setReadonlyWeb3] = useState()
    const [language, setLanguage] = useState('en')
    const { t } = useTranslation();

    useEffect(() => {
        // Listen to new "connect with wallet xxx" requests from users.
        walletTypeChangeRequest.subscribe((walletKey)=>{
            log.info("User wants to use another wallet:", walletKey);
            // Rebuild the web3 environment with that target wallet (metamask, wallet connect)
            updateWeb3Environment(walletKey);
        })

        setTimeout(async () => {
            updateWeb3Environment()
        }, 1500);

        // Get UI ready from persistent storage
        setWalletType(getActiveWalletType());
    }, []);

    /* const handleChainChanged = (_chainId) => {
        console.log("Chain ID changed:", _chainId);
        //window.location.reload()
    } */

    const handleAccountsChanged = (accounts) => {
        log.info("Accounts changed", accounts);
        if (!accounts || accounts.length === 0) {
            logger.info('Please connect to your wallet.')
            setConnectedAddress(undefined)
            // Possibly disconnecting from the active wallet - forget the active wallet type in local storage
            setActiveWalletType(null);
            setWalletType(null);
        } else if (accounts[0] !== connectedAddress) {
            setConnectedAddress(accounts[0])
        }
    }

    const handleNetworkChanged = (networkId) => {
        const networkType = Config.chainIdMap[parseInt(networkId)] // parseInt() because the network sometimes comes as base-10, sometimes hex
        log.info("Network changed", Config.chainIdMap, networkId, networkType)
        if(networkType) {
            setNetworkType(networkType)
        } else {
            setNetworkType(t('App.Unsupported'))
        }
    }

    const checkProviderChanges = async (web3, provider) => {
        try {
            const [ accounts, networkId ] = await Promise.all([
                provider.request({ method: 'eth_accounts' }),
                provider.request({ method: 'eth_chainId' })
            ])
            handleNetworkChanged(Number(networkId))
            let viewAccount = window.location.hash.substr(1)
            if (web3.utils.isAddress(viewAccount)) {
                accounts[0] = viewAccount
            }
            handleAccountsChanged(accounts)
        } catch(err) {
            logger.error('handleEthereum error:', err)
            const accounts = await provider.enable()
            handleAccountsChanged(accounts)
            // setConnectedAddress('0x8d14592bfaC956eaa81919A21652045F846056Db')
        }
    }

    // If forcedWalletType is defined, this means we are switching to another wallet.
    // Otherwise, we are just restoring the web3 context.
    const updateWeb3Environment = async(forcedWalletType) => {
        try{
            //console.log("updateWeb3Environment");

            let walletType = forcedWalletType || getActiveWalletType();

            //console.log("walletType=", walletType);
            //console.log("Current web3:", web3);

            // Switching wallet type: force disconnecting the current wallet first.
            if (forcedWalletType && web3 && web3.currentProvider && web3.currentProvider.connected) {
                log.info("Disconnecting from current wallet provider");
                await web3.currentProvider.disconnect();

                // Kill wallet connect session if previous provider was wallet connect - dirty
                if ("getWalletConnector" in web3.currentProvider)
                    (await web3.currentProvider.getWalletConnector()).killSession();

                setConnectedAddress(undefined)
            }

            let provider, newWeb3;
            if (walletType) {
                if (walletType === "metamask") {
                    log.info("Updating wallet type: metamask");
                    provider = await detectEthereumProvider({mustBeMetaMask: true, silent: true, timeout: 5000});
                    if (provider) {
                        log.info("Detected metamask ethereum provider:", provider);
                        newWeb3 = new Web3(provider);
                    }
                }
                else if (walletType === "walletconnect") {
                    log.info("Updating wallet type: walletconnect");
                    provider = await createWalletConnectWeb3Provider();
                    if (provider) {
                        newWeb3 = new Web3(provider);
                    }
                }
                else {
                    log.error("Unsupported wallet in use! "+walletType);

                    // Try to repair the stored wallet - reset to nothing
                    setActiveWalletType(null);
                    setWalletType(null);
                }

                // Provider can be null in case there is no metamask plugin or wallet available.
                if (provider) {
                    log.info("Using provider:", provider);

                    web3 = newWeb3;
                    setWeb3(newWeb3);
                    //console.log("web3 after setWeb3:", web3);

                    let readonlyWeb3 = new Web3(newWeb3.currentProvider)
                    setReadonlyWeb3(readonlyWeb3)

                    provider.on('chainChanged', handleNetworkChanged)
                    provider.on('accountsChanged', handleAccountsChanged)
                    //provider.on('connected', ()=>{ console.log("PROVIDER CONNECTED") })
                    //provider.on('disconnected', ()=>{ console.log("PROVIDER DISCONNECTED") })
                    //provider.on('networkChanged', handleNetworkChanged)

                    await provider.enable();
                    await checkProviderChanges(newWeb3, provider);

                    // After a successful connection initiated by user, save this choice to storage
                    if (forcedWalletType) {
                        let accounts = await provider.request({ method: 'eth_accounts' });
                        if (accounts && accounts.length > 0) {
                            // Successfully connected
                            setActiveWalletType(forcedWalletType);
                            setWalletType(forcedWalletType);
                        }
                    }
                }
                else {
                    handleNotConnected();
                }
            }
            else {
                handleNotConnected();
            }
        } catch (e) {
            // Silently catch weird "User closed modal" exception from wallet connect
            if (e.message === "User closed modal") {
                console.warn(e.message);
            }
            else {
                throw e;
            }
        }
    }

    const handleNotConnected = async () => {
        // Use HECO as default network to query current data from chain (read only)
        // This way, visitors can see filda stats without a wallet.
        let provider = new Web3.providers.HttpProvider(Config.rpcUrls[128]); // Heco mainnet
        let web3 = new Web3(provider);
        setWeb3(web3);
        setReadonlyWeb3(new Web3(web3.currentProvider));
        handleNetworkChanged(128)
        // No account connected:
        handleAccountsChanged(['0x0000000000000000000000000000000000000000']);
    }

    return (
        <Web3Context.Provider value={{web3}}>
            <ReadonlyWeb3Context.Provider value={{readonlyWeb3}}>
                <WalletTypeContext.Provider value={{walletType}}>
                    <NetworkTypeContext.Provider value={{networkType}}>
                        <WalletAddressContext.Provider value={{connectedAddress}}>
                            <LanguageContext.Provider value={{language, setLanguage}}>
                                <BrowserRouter>
                                    <Header />
                                    <Switch className="appContent">
                                        <Route exact path="/">
                                            <Home />
                                        </Route>
                                        <Route exact path="/staking">
                                            <Staking />
                                        </Route>
                                        <Route exact path="/dashboard">
                                            <Dashboard />
                                        </Route>
                                        <Route exact path="/vote">
                                            <Vote />
                                        </Route>
                                        <Route exact path="/liquidate">
                                            <Liquidate />
                                        </Route>
                                        <Route path="/markets/:symbol" component={MarketDetail}/>
                                        <Suspense fallback={<div>loading</div>}>
                                            <Route exact path="/aboutus">
                                                <AboutUs />
                                            </Route>
                                        </Suspense>
                                    </Switch>
                                    <Footer />
                                </BrowserRouter>
                            </LanguageContext.Provider>
                        </WalletAddressContext.Provider>
                    </NetworkTypeContext.Provider>
                </WalletTypeContext.Provider>
            </ReadonlyWeb3Context.Provider>
        </Web3Context.Provider>
    )
}

export default App
