import React, { useContext, useEffect, useState } from 'react'
import { Container, Row, Col, Nav, Button, Modal } from 'react-bootstrap'
import logo from '../images/logo.svg'
import banking from '../images/banking.svg'
import vote from '../images/vote.svg'
import staking from '../images/staking.svg'
import dashboard from '../images/dashboard.svg'
import metamask from '../images/metamask.svg'
import walletconnectlogo from '../images/walletconnect.svg'
import ledger from '../images/ledger.svg'
import styles from './Header.module.scss'
import truncateMiddle from 'truncate-middle'
import { useTranslation } from 'react-i18next'
import { FaExclamationCircle } from 'react-icons/fa'
import { NavLink, useLocation } from 'react-router-dom'
import classNames from 'classnames'
import { WalletAddressContext, WalletTypeContext, NetworkTypeContext } from '../context'
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3 from "web3";
import Config from '../utils/config';
import { switchToWallet, createWalletConnectWeb3Provider } from '../methods/Wallet';

function Header() {
    const { connectedAddress } = useContext(WalletAddressContext)
    const { walletType } = useContext(WalletTypeContext)
    const { networkType } = useContext(NetworkTypeContext)

    const [show, setShow] = useState(false);
    const [connectedWalletLogo, setConnectedWalletLogo] = useState();

    const { t } = useTranslation()

    const { pathname } = useLocation()

    const handleClose = () => setShow(false)
    const handleShow = () => {
        setShow(true)
    }

    const handleMetaMask = async () => {
        switchToWallet("metamask");
        handleClose()
    }

    const handleWalletConnect = async () => {
        switchToWallet("walletconnect");
        handleClose()
    }

    const testnetWarningMessage = !networkType ? (
        ''
    ) : (
        <div
            className={
                networkType === 'unsupported'
                    ? styles.networkUnsupported
                    : styles.networkWarning
            }
        >
            <FaExclamationCircle />
            <div className={styles.warningText}>
                {t('Header.YouAreConnectedTo')}{' '}
                {networkType.replace(/^\w/, (c) => c.toUpperCase())} Network
            </div>
        </div>
    )

    const noConnectedAccountsMessage = (
        <div className={styles.accountWarning}>
            <FaExclamationCircle />
            <div className={styles.warningText}>
                <span className={styles.animTextFlow}>
                    {[...t('Header.ConnectWalletWarningMsg')].map(
                        (letter, index) => (
                            <span key={index}>{letter}</span>
                        )
                    )}
                </span>
            </div>
        </div>
    )

    const hide_Nav_Btn = () => {
        return pathname === '/aboutus'
    }

    const renderConnectAddress = () => {
        return  hide_Nav_Btn() ? '' : (
            <>
                {!connectedAddress || connectedAddress === '0x0000000000000000000000000000000000000000'
                    ? noConnectedAccountsMessage
                    : networkType !== 'main'
                    ? testnetWarningMessage
                    : ''}
            </>
        )
    }

    const renderNav = () => {
        return hide_Nav_Btn() ? '' : (
            <Nav className={styles.navMenuContainer}>
                <NavLink
                    exact
                    activeClassName={styles.active}
                    className={styles.headerLink}
                    to="/"
                >
                    <img
                        src={banking}
                        width="30"
                        height="auto"
                        className="d-inline-block align-top"
                        alt="Banking"
                    />
                    <div className={styles.navTitle}>
                        {t('Header.Nav.Lend')}
                    </div>
                </NavLink>
                <NavLink
                    exact
                    activeClassName={styles.active}
                    className={styles.headerLink}
                    to="/staking"
                >
                    <img
                        src={staking}
                        width="30"
                        height="auto"
                        className="d-inline-block align-top"
                        alt="Staking"
                    />
                    <div className={styles.navTitle}>
                        {t('Header.Nav.Stake')}
                    </div>
                </NavLink>
                <NavLink
                    exact
                    activeClassName={styles.active}
                    className={styles.headerLink}
                    to="/vote"
                >
                    <img
                        src={vote}
                        width="30"
                        height="auto"
                        className="d-inline-block align-top"
                        alt="Vote"
                    />
                    <div className={styles.navTitle}>
                        {t('Header.Nav.Vote')}
                    </div>
                </NavLink>
                {/* <NavLink exact activeClassName={styles.active} className={styles.headerLink} to="/dashboard">
            <img
                src={dashboard}
                width="30"
                height="auto"
                className="d-inline-block align-top"
                alt="Dashboard"
                />
            <div className={styles.navTitle}>{t('Header.Nav.Dashboard')}</div>
            </NavLink> */}
            </Nav>
        )
    }

    const renderConnectedLogo = () => {
        if (walletType === "metamask")
            return (<img src={metamask} className={styles.connectedLogo}/>);
        else if (walletType === "walletconnect")
            return (<img src={walletconnectlogo} className={styles.connectedLogo}/>);
    }

    const renderBtn = () => {
        return hide_Nav_Btn() ? '' : (
            <div className={styles.headerControls}>
                {
                    /* connectedAddress ? "": */
                    <div>
                        <Button variant="secondary" onClick={handleShow} >
                            {
                                connectedAddress && connectedAddress !== '0x0000000000000000000000000000000000000000'
                                 ? t('Header.ConnectedTo', {
                                        address: truncateMiddle(
                                            connectedAddress,
                                            4,
                                            3,
                                            '...'
                                        ),
                                    })
                                    : t('Header.ConnectYourWallet')
                            }
                        </Button>
                        {renderConnectedLogo()}
                    </div>
                }
            </div>
        )
    }

    const headerClass = classNames({
        [styles.header]: true,
        [styles.header_aboutUs]: hide_Nav_Btn()
    })

    return (
        <div className={headerClass}>
            {renderConnectAddress()}
            <Container className={styles.headerMenu}>
                <a href="/">
                    <img
                        src={logo}
                        width="160"
                        height="auto"
                        className="d-inline-block align-top"
                        alt="Filda Logo"
                    />
                </a>
                {renderNav()}
                {renderBtn()}
            </Container>
            <Modal
                show={show}
                onHide={handleClose}
                aria-labelledby="contained-modal-title-vcenter"
                centered
                animation={false}
            >
                <Modal.Header closeButton>
                    <img
                        src={logo}
                        width="auto"
                        height="20px"
                        className="d-inline-block align-top"
                        alt="Filda Logo"
                    />
                    <Modal.Title>{t('Header.ConnectYourWallet')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Container>
                        <Row>
                            <Col sm={6}>
                                <Button
                                    variant="tiles"
                                    className={styles.connectTile}
                                    onClick={handleMetaMask}
                                >
                                    <img
                                        src={metamask}
                                        width="auto"
                                        height="50px"
                                        className="d-inline-block align-top"
                                        alt="Metamask Logo"
                                    />
                                    <div className={styles.connectTitle}>
                                        MetaMask
                                    </div>
                                </Button>
                            </Col>
                            {/*<Col sm={6}>*/}
                            {/*    <Button*/}
                            {/*        variant="tiles"*/}
                            {/*        className={styles.connectTile}*/}
                            {/*        onClick={handleWalletConnect}*/}
                            {/*    >*/}
                            {/*        <img*/}
                            {/*            src={walletconnectlogo}*/}
                            {/*            width="auto"*/}
                            {/*            height="50px"*/}
                            {/*            className="d-inline-block align-top"*/}
                            {/*            alt="Wallet Connect Logo"*/}
                            {/*        />*/}
                            {/*        <div className={styles.connectTitle}>*/}
                            {/*            Wallet Connect*/}
                            {/*        </div>*/}
                            {/*    </Button>*/}
                            {/*</Col>*/}
                            {/* <Col sm={6}>
                  <Button variant="tiles" className={styles.connectTile}>
                    <img
                      src={ledger}
                      width="auto"
                      height="50px"
                      className="d-inline-block align-top"
                      alt="Ledger Logo"
                      />
                    <div className={styles.connectTitle}>Ledger</div>
                    <div className={styles.connectTag}>Elastos</div>
                  </Button>
                </Col> */}
                        </Row>
                    </Container>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="link" onClick={handleClose}>
                        {t('Header.Later')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export default Header
