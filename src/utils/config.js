import eth from '../images/markets/eth.svg'
import ela from '../images/markets/ela.svg'
import usdt from '../images/markets/usdt.svg'
import hfil from '../images/markets/hfil.svg'
import ht from '../images/markets/ht.svg'
import husd from '../images/markets/husd.svg'
import hbtc from '../images/markets/hbtc.svg'
import heth from '../images/markets/heth.svg'
import hdot from '../images/markets/hdot.svg'
import hbch from '../images/markets/hbch.svg'
import hltc from '../images/markets/hltc.svg'
import hbsv from '../images/markets/hbsv.svg'
import hxtz from '../images/markets/hxtz.svg'
import neo from '../images/markets/neo.svg'
import aave from '../images/markets/aave.svg'
import uni from '../images/markets/uni.svg'
import snx from '../images/markets/snx.svg'
import mdx from '../images/markets/mdx.png'
import link from '../images/markets/link.svg'
import contractABI from './contractABI.json'

const rpcUrls = {
    // TODO: add others
    20: "https://testnet.elastos.io/eth",           // Elastos mainnet
    21: "https://api-testnet.elastos.io/eth",       // Elastos testnet
    128: "https://heconode.ifoobar.com"             // HECO mainnet
}

const blockExplorers = {
    "main": "https://etherscan.io/tx/",
    "ropsten": "https://ropsten.etherscan.io/",
    "rinkeby": "https://rinkeby.etherscan.io/",
    "private": "https://explorer.elaeth.io/",
    "elamain": "https://explorer.elaeth.io/",
    "elatest": "https://testnet.elaeth.io/",
    "hecotest": "https://testnet.hecoinfo.com/",
    "heco": "https://hecoinfo.com/"
}

const mdexUrls = {
    'FHT': 'https://info.mdex.com/#/pair/0x55542f696a3fecae1c937bd2e777b130587cfd2d',
    'FHUSD': 'https://info.mdex.com/#/pair/0x7964e55bbdaecde48c2c8ef86e433ed47fecb519',
    'FELA': 'https://info.mdex.com/#/pair/0xa1c540cfa848928299cdf309a251ebbaf666ce64',
    'HMDX': 'https://info.mdex.com/#/pair/0x1c85dD9E5FeE4c40786bd6278255D977946A364b'
}

//Only include the networks that are supported.
//Example: COMP contract is not available for Rinkeby. So dont't include that in this list.
//Networks not included in this list are categorized as unsupported networks
const chainIdMap = {
    // "1": "main",
    // "3": "ropsten",
    "1337": "private",
    // "20": "elamain",
    "21": "elatest",
    "256": "hecotest",
    "128": "heco"
}

const markets = {
    "HUSDT": {
        "name": "USD Tether",
        "symbol": "USDT",
        "ABI": contractABI.ERC20,
        "network": {
            "main": {
                "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
            },
            "ropsten": {
                "address": "0x516de3a7A567d81737e3a46ec4FF9cFD1fcb0136"
            },
            "rinkeby": {
                "address": "0xD9BA894E0097f8cC2BBc9D24D308b98e36dc6D02"
            },
            "private": {
                "address": "0x3ca0ed169f474E431D5f5889C824DE1343D6ab7a"
            },
            "elatest": {
                "address": "0xa7daaf45ae0b2e567eb563fb57ea9cfffdfd73dd"
            },
            "hecotest": {
                "address": "0x9893efec0c06a5c82ed76a726d12ee469fe449d8"
            }
        },
        "logo": usdt,
        "qToken": {
            "name": "Filda USDT Tether",
            "symbol": "fUSDT",
            "contract": "QErc20",
            "ABI": contractABI.qERC20,
            "network": {
                "main": {
                    "address": "0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9"
                },
                "ropsten": {
                    "address": "0x135669c2dcBd63F639582b313883F101a4497F76"
                },
                "rinkeby": {
                    "address": "0x2fB298BDbeF468638AD6653FF8376575ea41e768"
                },
                "private": {
                    "address": "0x73372D41CE2936C8891C90B273613677968147FC"
                },
                "elatest": {
                    "address": "0x1551F44753147071c585169C621f45E0af920f31"
                },
                "hecotest": {
                    "address": "0x3CDd62735E3282D07f8bcD6bc3B1a55B5D28eddA"
                }
            }
        }
    },
    "USDT": {
        "name": "USDT on Huobi",
        "symbol": "USDT",
        "ABI": contractABI.ERC20,
        "network": {
            "heco": {
                "address": "0xa71edc38d189767582c38a3145b5873052c3e47a"
            }
        },
        "logo": usdt,
        "qToken": {
            "name": "Filda USDT on Heco",
            "symbol": "fUSDT",
            "contract": "QErc20",
            "ABI": contractABI.qERC20,
            "network": {
                "heco": {
                    "address": "0xAab0C9561D5703e84867670Ac78f6b5b4b40A7c1"
                }
            }
        }
    },
    "HUSD": {
        "name": "HUSD",
        "symbol": "HUSD",
        "ABI": contractABI.ERC20,
        "network": {
            "heco": {
                "address": "0x0298c2b32eae4da002a15f36fdf7615bea3da047"
            },
            "hecotest": {
                "address": "0x9893efec0c06a5c82ed76a726d12ee469fe449d8"
            }
        },
        "logo": husd,
        "qToken": {
            "name": "Filda HUSD",
            "symbol": "fHUSD",
            "contract": "QErc20",
            "ABI": contractABI.qERC20,
            "network": {
                "heco": {
                    "address": "0xB16Df14C53C4bcfF220F4314ebCe70183dD804c0"
                },
                "hecotest": {
                    "address": "0x3CDd62735E3282D07f8bcD6bc3B1a55B5D28eddA"
                }
            }
        }
    },
    "HT": {
        "name": "Huobi Token",
        "symbol": "HT",
        "logo": ht,
        "qToken": {
            "name": "Filda HT",
            "symbol": "fHT",
            "contract": "QHT",
            "ABI": contractABI.qETH,
            "network": {
                "hecotest": {
                    "address": "0x824151251B38056d54A15E56B73c54ba44811aF8"
                },
                "heco": {
                    "address": "0x824151251B38056d54A15E56B73c54ba44811aF8"
                }
            }
        }
    },
    "HBTC": {
        "name": "HBTC",
        "symbol": "HBTC",
        "ABI": contractABI.ERC20,
        "network": {
            "heco": {
                "address": "0x66a79d23e58475d2738179ca52cd0b41d73f0bea"
            }
        },
        "logo": hbtc,
        "qToken": {
            "name": "Filda HBTC on Heco",
            "symbol": "fHBTC",
            "contract": "QErc20",
            "ABI": contractABI.qERC20,
            "network": {
                "heco": {
                    "address": "0xF2a308d3Aea9bD16799A5984E20FDBfEf6c3F595"
                }
            }
        }
    },
    "HETH": {
        "name": "ETH on Huobi",
        "symbol": "HETH",
        "ABI": contractABI.ERC20,
        "network": {
            "heco": {
                "address": "0x64ff637fb478863b7468bc97d30a5bf3a428a1fd"
            }
        },
        "logo": heth,
        "qToken": {
            "name": "Filda ETH on Heco",
            "symbol": "fHETH",
            "contract": "QErc20",
            "ABI": contractABI.qERC20,
            "network": {
                "heco": {
                    "address": "0x033F8C30bb17B47f6f1f46F3A42Cc9771CCbCAAE"
                }
            }
        }
    },
    "ETH": {
        "name": "Ether",
        "symbol": "ETH",
        "logo": eth,
        "qToken": {
            "name": "Filda Ether",
            "symbol": "fETH",
            "contract": "QEther",
            "ABI": contractABI.qETH,
            "network": {
                "main": {
                    "address": "0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5"
                },
                "ropsten": {
                    "address": "0xBe839b6D93E3eA47eFFcCA1F27841C917a8794f3"
                },
                "rinkeby": {
                    "address": "0xd6801a1dffcd0a410336ef88def4320d6df1883e"
                }
            }
        }
    },
    "HFIL": {
        "name": "Huobi FIL",
        "symbol": "HFIL",
        "ABI": contractABI.ERC20,
        "network": {
            "private": {
                "address": "0xE2f2C6119cFeAd4BDdBA64E7f876487ee1300d9A"
            },
            "elatest": {
                "address": "0xd3f1be7f74d25f39184d2d0670966e2e837562e3"
            },
            "hecotest": {
                "address": "0x098050ed091521658f759f978469883d5bd8ea19"
            },
            "heco": {
                "address": "0xae3a768f9ab104c69a7cd6041fe16ffa235d1810"
            }
        },
        "logo": hfil,
        "qToken": {
            "name": "Filda HFIL on Elastos",
            "symbol": "fHFIL",
            "contract": "QErc20",
            "ABI": contractABI.qERC20,
            "network": {
                "private": {
                    "address": "0x35508edCEc4b0bdC11f15fdf360dfbf8624F69AE"
                },
                "elatest": {
                    "address": "0x33B1B094360E5b5a3a7649Bed8145fb230898DB2"
                },
                "hecotest": {
                    "address": "0x195A4dFE3a8F877c5f0f7Ca7baA36B4301113130"
                },
                "heco": {
                    "address": "0x043aFB65e93500CE5BCbf5Bbb41FC1fDcE2B7518"
                }
            }
        }
    },
    "HPT": {
        "name": "Huobi Pool Token",
        "symbol": "HPT",
        "ABI": contractABI.ERC20,
        "network": {
            "heco": {
                "address": "0xe499ef4616993730ced0f31fa2703b92b50bb536"
            }
        },
        "logo": ht,
        "qToken": {
            "name": "Filda HPT on Heco",
            "symbol": "fHPT",
            "contract": "QErc20",
            "ABI": contractABI.qERC20,
            "network": {
                "heco": {
                    "address": "0x749E0198f12559E7606987F8e7bD3AA1DE6d236E"
                }
            }
        }
    },
    "ELA": {
        "name": "Elastos",
        "symbol": "ELA",
        "logo": ela,
        "qToken": {
            "name": "Filda Elastos",
            "symbol": "fELA",
            "contract": "QElastos",
            "ABI": contractABI.qETH,
            "network": {
                "private": {
                    "address": "0x7b37C836A439661ce212Ac2EC096aE2582C52233"
                },
                "elatest": {
                    "address": "0x7eBEeAcaf6Dec5C85D992E4d15f18227E3695d97"
                }
            }
        }
    },
    "elaETH": {
        "name": "ETH on Elastos",
        "symbol": "elaETH",
        "ABI": contractABI.ERC20,
        "network": {
            "elatest": {
                "address": "0x23f1528e61d0af04faa7cff8c7ce9046d9130789"
            }
        },
        "logo": eth,
        "qToken": {
            "name": "Filda elaETH",
            "symbol": "felaETH",
            "contract": "QErc20",
            "ABI": contractABI.qERC20,
            "network": {
                "elatest": {
                    "address": "0x403AB093EB21Ae2C73bc1Eb23CCDB5a7c0bb1C80"
                }
            }
        }
    },
    "HDOT": {
        "name": "HDOT",
        "symbol": "HDOT",
        "ABI": contractABI.ERC20,
        "network": {
            "heco": {
                "address": "0xa2c49cee16a5e5bdefde931107dc1fae9f7773e3"
            }
        },
        "logo": hdot,
        "qToken": {
            "name": "Filda HDOT on Heco",
            "symbol": "fHDOT",
            "contract": "QErc20",
            "ABI": contractABI.qERC20,
            "network": {
                "heco": {
                    "address": "0xCca471B0d49c0d4835a5172Fd97ddDEA5C979100"
                }
            }
        }
    },
    "HBCH": {
        "name": "HBCH",
        "symbol": "HBCH",
        "ABI": contractABI.ERC20,
        "network": {
            "heco": {
                "address": "0xef3cebd77e0c52cb6f60875d9306397b5caca375"
            }
        },
        "logo": hbch,
        "qToken": {
            "name": "Filda HBCH on Heco",
            "symbol": "fHBCH",
            "contract": "QErc20",
            "ABI": contractABI.qERC20,
            "network": {
                "heco": {
                    "address": "0x09e3d97A7CFbB116B416Dae284f119c1eC3Bd5ea"
                }
            }
        }
    },
    "HLTC": {
        "name": "HLTC",
        "symbol": "HLTC",
        "ABI": contractABI.ERC20,
        "network": {
            "heco": {
                "address": "0xecb56cf772b5c9a6907fb7d32387da2fcbfb63b4"
            }
        },
        "logo": hltc,
        "qToken": {
            "name": "Filda HLTC on Heco",
            "symbol": "fHLTC",
            "contract": "QErc20",
            "ABI": contractABI.qERC20,
            "network": {
                "heco": {
                    "address": "0x4937A83Dc1Fa982e435aeB0dB33C90937d54E424"
                }
            }
        }
    },
    "htELA": {
        "name": "ELA on Huobi",
        "symbol": "htELA",
        "ABI": contractABI.ERC20,
        "network": {
            "hecotest": {
                "address": "0x874f0618315fafd23f500b3a80a8a72148936f8e"
            },
            "heco": {
                "address": "0xa1ecfc2bec06e4b43ddd423b94fef84d0dbc8f5c"
            }
        },
        "logo": ela,
        "qToken": {
            "name": "Filda ELA",
            "symbol": "fELA",
            "contract": "QErc20",
            "ABI": contractABI.qERC20,
            "network": {
                "hecotest": {
                    "address": "0xb6B9B25C18a7fa951379538a988605478B5C0940"
                },
                "heco": {
                    "address": "0x0AD0bee939E00C54f57f21FBec0fBa3cDA7DEF58"
                }
            }
        }
    },
    "NEO": {
        "name": "NEO",
        "symbol": "NEO",
        "ABI": contractABI.ERC20,
        "network": {
            "heco": {
                "address": "0x6514a5ebff7944099591ae3e8a5c0979c83b2571"
            }
        },
        "logo": neo,
        "qToken": {
            "name": "Filda PNEO on Heco",
            "symbol": "fPNEO",
            "contract": "QErc20",
            "ABI": contractABI.qERC20,
            "network": {
                "heco": {
                    "address": "0x92701DA6A28Ca70aA5Dfca2B8Ae2b4B8a22a0C11"
                }
            }
        }
    },
    "HBSV": {
        "name": "HBSV",
        "symbol": "HBSV",
        "ABI": contractABI.ERC20,
        "network": {
            "heco": {
                "address": "0xc2cb6b5357ccce1b99cd22232942d9a225ea4eb1"
            }
        },
        "logo": hbsv,
        "qToken": {
            "name": "Filda HBSV on Heco",
            "symbol": "fHBSV",
            "contract": "QErc20",
            "ABI": contractABI.qERC20,
            "network": {
                "heco": {
                    "address": "0x74F8D9B701bD4d8ee4ec812AF82C71EB67B9Ec75"
                }
            }
        }
    },
    "HXTZ": {
        "name": "HXTZ",
        "symbol": "HXTZ",
        "ABI": contractABI.ERC20,
        "network": {
            "heco": {
                "address": "0x45e97dad828ad735af1df0473fc2735f0fd5330c"
            }
        },
        "logo": hxtz,
        "qToken": {
            "name": "Filda HXTZ on Heco",
            "symbol": "fHXTZ",
            "contract": "QErc20",
            "ABI": contractABI.qERC20,
            "network": {
                "heco": {
                    "address": "0xfEA846A1284554036aC3191B5dFd786C0F4Db611"
                }
            }
        }
    },
    "AAVE": {
        "name": "AAVE",
        "symbol": "AAVE",
        "ABI": contractABI.ERC20,
        "network": {
            "heco": {
                "address": "0x202b4936fe1a82a4965220860ae46d7d3939bb25"
            }
        },
        "logo": aave,
        "qToken": {
            "name": "Filda AAVE on Heco",
            "symbol": "fAAVE",
            "contract": "QErc20",
            "ABI": contractABI.qERC20,
            "network": {
                "heco": {
                    "address": "0x73Fa2931e060F7d43eE554fd1De7F61115fE1751"
                }
            }
        }
    },
    "UNI": {
        "name": "UNI",
        "symbol": "UNI",
        "ABI": contractABI.ERC20,
        "network": {
            "heco": {
                "address": "0x22c54ce8321a4015740ee1109d9cbc25815c46e6"
            }
        },
        "logo": uni,
        "qToken": {
            "name": "Filda UNI on Heco",
            "symbol": "fUNI",
            "contract": "QErc20",
            "ABI": contractABI.qERC20,
            "network": {
                "heco": {
                    "address": "0xAc9E3AE0C188eb583785246Fef37AEF9ea159fb7"
                }
            }
        }
    },
    "SNX": {
        "name": "SNX",
        "symbol": "SNX",
        "ABI": contractABI.ERC20,
        "network": {
            "heco": {
                "address": "0x777850281719d5a96c29812ab72f822e0e09f3da"
            }
        },
        "logo": snx,
        "qToken": {
            "name": "Filda SNX on Heco",
            "symbol": "fSNX",
            "contract": "QErc20",
            "ABI": contractABI.qERC20,
            "network": {
                "heco": {
                    "address": "0x88962975FDE8C7805fE0f38b7c91C18f4d55bb40"
                }
            }
        }
    },
    "MDX": {
        "name": "MDX",
        "symbol": "MDX",
        "ABI": contractABI.ERC20,
        "network": {
            "heco": {
                "address": "0x25d2e80cb6b86881fd7e07dd263fb79f4abe033c"
            }
        },
        "logo": mdx,
        "qToken": {
            "name": "Filda MDX on Heco",
            "symbol": "fMDX",
            "contract": "QErc20",
            "ABI": contractABI.qERC20,
            "network": {
                "heco": {
                    "address": "0x5788C014D41cA706DE03969E283eE7b93827B7B1"
                }
            }
        }
    },
    "LINK": {
        "name": "LINK",
        "symbol": "LINK",
        "ABI": contractABI.ERC20,
        "network": {
            "heco": {
                "address": "0x9e004545c59d359f6b7bfb06a26390b087717b42"
            }
        },
        "logo": link,
        "qToken": {
            "name": "Filda LINK on Heco",
            "symbol": "qLINK",
            "contract": "QErc20",
            "ABI": contractABI.qERC20,
            "network": {
                "heco": {
                    "address": "0x9E6f8357bae44C01ae69df807208c3f5E435BbeD"
                }
            }
        }
    }
}

//price feed contract not deployed on rinkeby
//We will be using an arbitrary price value
const priceOracle = {
    "ABI": contractABI.PriceOracle,
    "network": {
        "main": {
            "address": "0x922018674c12a7F0D394ebEEf9B58F186CdE13c1"
        },
        "ropsten": {
            "address": "0xe23874df0276AdA49D58751E8d6E088581121f1B"
        },
        "rinkeby": {
            "address": "0x5722A3F60fa4F0EC5120DCD6C386289A4758D1b2"
        },
        "private": {
            "address": "0xb833Cc1B7222022e473af358e35fcf339533d20B"
        },
        "elatest": {
            "address": "0x916dAbC2544287E6b1145DEe7976CF085E5EEa5b"
        },
        "hecotest": {
            "address": "0x0a6a06003417dA7BCF1C2bdc27e2A30C38EfF4Ad"
        },
        "heco": {
            "address": "0xA7042D87b25b18875cD1d2b1CE535C5488bc4Fd0"
            //"address": "0xcaffe113e75efe0e12ac7a15d90b170726241b61" // The price oracle without link
        }
    }
}

const comptroller = {
    "ABI": contractABI.Comptroller,
    "network": {
        "main": {
            "address": "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B"
        },
        "ropsten": {
            "address": "0x54188bBeDD7b68228fa89CbDDa5e3e930459C6c6"
        },
        "rinkeby": {
            "address": "0x2EAa9D77AE4D8f9cdD9FAAcd44016E746485bddb"
        },
        "private": {
            "address": "0x0866c12B85AD8fca53f0f0918B5AA30286d39D62"
        },
        "elatest": {
            "address": "0x9bCDf73B28F9214f51f8722a32Bd96bfe4f16Fa6"
        },
        "hecotest": {
            "address": "0xb74633f2022452f377403B638167b0A135DB096d"
        },
        "heco": {
            "address": "0xb74633f2022452f377403B638167b0A135DB096d"
        }
    }
}

const COMP = {
    "ABI": contractABI.COMP,
    "network": {
        "main": {
            "address": "0xc00e94Cb662C3520282E6f5717214004A7f26888"
        },
        "ropsten": {
            "address": "0x1fe16de955718cfab7a44605458ab023838c2793"
        },
        "private": {
            "address": "0x6d335bC74cE06722445eD534A1C5E63ed0dA8A6e"
        },
        "elatest": {
            "address": "0xd9e18828f29ac768ab3e1eebd3c3037efdef9e92"
        },
        "hecotest": {
            "address": "0x9d81f4554e717f7054c1bfbb2f7c323389b116a5"
        },
        "heco": {
            "address": "0xE36FFD17B2661EB57144cEaEf942D95295E637F0"
        }
    }
}

const governorAlpha = {
    "ABI": contractABI.GovernorAlpha,
    "network": {
        "main": {
            "address": "0xc0dA01a04C3f3E0be433606045bB7017A7323E38"
        },
        "ropsten": {
            "address": "0x93ACbA9ecaCeC21BFA09b0C4650Be3596713d747"
        }
    }
}

const compoundLens = {
    "ABI": contractABI.CompoundLens,
    "network": {
        "elatest": {
            "address": "0xFe6a82ddAfb400d734ccf57D5d7D1866fd97601f"
        },
        "hecotest": {
            "address": "0x46F27679e96CABEcb6d20A0332F6Aab19685E733"
        },
        "heco": {
            "address": "0x824522f5a2584dCa56b1f05e6b41C584b3FDA4a3"
        }
    }
}

const maximillion = {
    "ABI": contractABI.Maximillion,
    "network": {
        "ropsten": {
            "address": "0xE0a38ab2951B6525C33f20D5E637Ab24DFEF9bcB"
        },
        "elatest": {
            "address": "0x39BB80913D2aeB0b1402A5566BdB6811217D4Fd1"
        },
        "hecotest": {
            "address": "0x32fbB9c822ABd1fD9e4655bfA55A45285Fb8992d"
        },
        "heco": {
            "address": "0x32fbB9c822ABd1fD9e4655bfA55A45285Fb8992d"
        }
    }
}

const poolManager = {
    "ABI": contractABI.PoolManager,
    "network": {
        "elatest": {
            "address": "0x4cE5B72361262F852b434C8257EE079E7dD10bC7"
        },
        "heco": {
            "address": "0x0492E6060e71F5bED30B35D5238934066e31Bfc9"
        }
    }
}

const noMintRewardPool = {
    "ABI": contractABI.NoMintRewardPool
}

const interestRateModel = {
    "ABI": contractABI.InterestRateModel
}

const mdex = {
    "ABI": contractABI.hecoPool,
    "address": "0xFB03e11D93632D97a8981158A632Dd5986F5E909",
    "factory": "0xb0b670fc1f7724119963018db0bfa86adb22d941",
    "hecoPoolPair": contractABI.hecoPoolPair,
    "reward": {
        "name": "MDX Token",
        "symbol": "MDX",
        "address": "0x25d2e80cb6b86881fd7e07dd263fb79f4abe033c"
    }
}

const dogeSwap = {
    "ABI": contractABI.dogeSwapPool,
    "address": "0xff58c937343d4fcf65c9c1aaf25f49559d95488e",
    "factory": "",
    "hecoPoolPair": contractABI.hecoPoolPair,
}

const uniswapPair = {
    "ABI": contractABI.IUniswapV2Pair,
    "network": {
        "heco": {
            "address": "0x7964E55BBdAECdE48c2C8ef86E433eD47FEcB519"
        }
    }
}

const multiCall = {
    "network": {
        "heco": {
            "address": "0x6Bd3A85Dfc401e81D31717EFf0b67D7931c265d2"
        },
        "hecotest": {
            "address": "0x8065392FC4c02B2aBf883FdDeC5545cEd0dd5f5c"
        }
    }
}

const erc20 = {
    "ABI": contractABI.ERC20
}

//These are temporary testnet addresses. Ideally these lists should be fetched from pool manager
const pools = {
    "0x248e9080d1f0979b23b5ca5D8686B00eb0D88CfE": {
        "lpTokenName": "FilDA",
        "lpTokenSymbol": "Token",
        "lpTokenId": "FilDA",
        "airdropToken": "0xe36ffd17b2661eb57144ceaef942d95295e637f0",
        "isAirdrop": true
    },
    "0x73CB0A55Be009B30e63aD5830c85813414c66367": {
        "lpTokenName": "FilDA",
        "lpTokenSymbol": "Token",
        "lpTokenId": "FILDA",
        "hasLockPeriod": true
    },
    "0xBd0d0482B6a6c1783857fb6B9Db02932A100Ee10": {
        "pool": {
            "ABI": dogeSwap.ABI,
            "address": "0xff58c937343d4fcf65c9c1aaf25f49559d95488e"
        },
        "reward": {
            "name": "Dogeswap Token",
            "symbol": "DOG",
            "address": "0x099626783842d35C221E5d01694C2B928eB3B0AD"
        },
        "lpTokenName": "Earn DOG with DOG-FILDA",
        "lpTokenShortName": "DOG-FILDA",
        "lpTokenSymbol": "LP Token",
        "lpTokenId": "FILDOG",
        "indexOfPool": 60,
        "isShortcut": true,
        "coefficient": 18,
        "fromDogswap": "https://dogeswap.com/#/farm/lp/60/0xbd0d0482b6a6c1783857fb6b9db02932a100ee10"
    },
    "0x24239262E85f99fa38B17F14FA986455c883593D": {
        "pool": {
            "ABI": dogeSwap.ABI,
            "address": "0xff58c937343d4fcf65c9c1aaf25f49559d95488e"
        },
        "reward": {
            "name": "Dogeswap Token",
            "symbol": "DOG",
            "address": "0x099626783842d35C221E5d01694C2B928eB3B0AD"
        },
        "lpTokenName": "Earn DOG with WHT-FILDA",
        "lpTokenShortName": "WHT-FILDA",
        "lpTokenSymbol": "LP Token",
        "lpTokenId": "FILWHT",
        "indexOfPool": 47,
        "isShortcut": true,
        "coefficient": 18,
        "fromDogswap": "https://dogeswap.com/#/farm/lp/47/0x24239262e85f99fa38b17f14fa986455c883593d"
    },
    "0x7964E55BBdAECdE48c2C8ef86E433eD47FEcB519": {
        "pool": {
            "ABI": mdex.ABI,
            "address": "0xFB03e11D93632D97a8981158A632Dd5986F5E909"
        },
        "reward": {
            "name": "MDX Token",
            "symbol": "MDX",
            "address": "0x25d2e80cb6b86881fd7e07dd263fb79f4abe033c"
        },
        "lpTokenName": "Earn MDX with FilDA-HUSD",
        "lpTokenShortName": "FilDA-HUSD",
        "lpTokenSymbol": "LP Token",
        "lpTokenId": "FHUSD",
        "indexOfPool": 21,
        "isShortcut": true
    },
    "0xE1F2a76D1262a82bF3898c4ae72d9349eE58BACE": {
        "lpTokenName": "FilDA-MDX",
        "lpTokenSymbol": "LP Token",
        "lpTokenId": "MDXFILDA"
    },
    "0x2e9b38515c92A59C0d285b2213C474FE0eA33f33": {
        "lpTokenName": "FilDA-ELA for MDEX",
        "lpTokenSymbol": "LP Token",
        "lpTokenId": "FELA"
    },
    "0xB90CcE5307f0bE45ade28F45554e07A9a791A16F": {
        "lpTokenName": "FilDA-HUSD for MDEX",
        "lpTokenSymbol": "LP Token",
        "lpTokenId": "FHUSD"
    },
    "0xb0349442E12B6D8c91A3dB925F24e6E1f70E8d27": {
        "lpTokenName": "FilDA-HT for MDEX",
        "lpTokenSymbol": "LP Token",
        "lpTokenId": "FHT"
    }
}

const voteProposal = {
    "ABI": contractABI.voteProposal,
    "MultipleABI": contractABI.voteMultiProposal,
    "network": {
        "heco":
            [{ "address": "0x39EebeD78817Fad1fA891a5840FfC71619efFEF7" },
            { "address": "0x92d737DC7d6141416768949596a7ABBd2ae246Fd" },
            { "address": "0xaFfD84fb3C1B2e3eD88d07300F1b3bAF8D18906a" },
            { "address": "0x20771E1BC3bF598FEa8a6A992Bda817a9E8de8dB" },
            { "address": "0xcd5DEaaB1a75F6939E3e1E6E87A44b488ffd17B9" },
            {
                "address": "0x2Fab287f8F3e223e8440044Eb44d45452423cD5f",
                isMultiple: true
            },
                {"address": "0x758b49B5d7c7a58a6368a9f11A0aD8e804b81189"},
            ],
    }
}

const errorCodes = {
    "0": {
        "name": "NO_ERROR",
        "desc": "Not a failure."
    },
    "1": {
        "name": "UNAUTHORIZED",
        "desc": "The sender is not authorized to perform this action."
    },
    "2": {
        "name": "BAD_INPUT",
        "desc": "An invalid argument was supplied by the caller."
    },
    "3": {
        "name": "COMPTROLLER_REJECTION",
        "desc": "The action would violate the comptroller policy."
    },
    "4": {
        "name": "COMPTROLLER_CALCULATION_ERROR",
        "desc": "An internal calculation has failed in the comptroller."
    },
    "5": {
        "name": "INTEREST_RATE_MODEL_ERROR",
        "desc": "The interest rate model returned an invalid value."
    },
    "6": {
        "name": "INVALID_ACCOUNT_PAIR",
        "desc": "The specified combination of accounts is invalid."
    },
    "7": {
        "name": "INVALID_CLOSE_AMOUNT_REQUESTED",
        "desc": "The amount to liquidate is invalid."
    },
    "8": {
        "name": "INVALID_COLLATERAL_FACTOR",
        "desc": "The collateral factor is invalid."
    },
    "9": {
        "name": "MATH_ERROR",
        "desc": "A math calculation error occurred."
    },
    "10": {
        "name": "MARKET_NOT_FRESH",
        "desc": "Interest has not been properly accrued."
    },
    "11": {
        "name": "MARKET_NOT_LISTED",
        "desc": "The market is not currently listed by its comptroller."
    },
    "12": {
        "name": "TOKEN_INSUFFICIENT_ALLOWANCE",
        "desc": "ERC-20 contract must allow Money Market contract to call transferFrom. The current allowance is either 0 or less than the requested supply, repayBorrow or liquidate amount."
    },
    "13": {
        "name": "TOKEN_INSUFFICIENT_BALANCE",
        "desc": "Caller does not have sufficient balance in the ERC-20 contract to complete the desired action."
    },
    "14": {
        "name": "TOKEN_INSUFFICIENT_CASH",
        "desc": "The market does not have a sufficient cash balance to complete the transaction. You may attempt this transaction again later."
    },
    "15": {
        "name": "TOKEN_TRANSFER_IN_FAILED",
        "desc": "Failure in ERC-20 when transfering token into the market."
    },
    "16": {
        "name": "TOKEN_TRANSFER_OUT_FAILED",
        "desc": "Failure in ERC-20 when transfering token out of the market."
    }
}

const WHT = "0x5545153ccfca01fbd7dd11c0b23ba694d9509a6f"
const SwapRepayContract = "0xE1A3B85686920aa0450F36f06efBC21050d15C55"
const MDEXRouter = "0xED7d5F38C79115ca12fe6C0041abb22F0A06C300"

const LiquidateContract = "0x43b039d81d0DB5f570f5BC6dc9488a36Ef30C50E"

const apiUrls = {
    "allMarkets": "https://us.filda.io/data/heco/allmarkets.json",
    "accountsLiquidity": "https://lq.ifoobar.com/api/accountsliquidity?status=shortfall",
    "accountDetail": "https://lq.ifoobar.com/api/account"
}

export default {
    markets: markets,
    priceOracle: priceOracle,
    comptroller: comptroller,
    errorCodes: errorCodes,
    blockExplorers: blockExplorers,
    chainIdMap: chainIdMap,
    COMP: COMP,
    governorAlpha: governorAlpha,
    compoundLens: compoundLens,
    maximillion: maximillion,
    poolManager: poolManager,
    interestRateModel: interestRateModel,
    mdex: mdex,
    dogeSwap: dogeSwap,
    pools: pools,
    noMintRewardPool: noMintRewardPool,
    erc20: erc20,
    uniswapPair,
    voteProposal,
    mdexUrls,
    rpcUrls,
    apiUrls,
    WHT: WHT,
    SwapRepayContract: SwapRepayContract,
    MDEXRouter: MDEXRouter,
    LiquidateContract: LiquidateContract,
    multiCall,
}
