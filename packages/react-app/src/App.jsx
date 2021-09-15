/* eslint-disable jsx-a11y/img-redundant-alt */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-unused-vars */
/* eslint-disable jsx-a11y/alt-text */
import WalletConnectProvider from "@walletconnect/web3-provider";
import { Alert, Button, Col, Menu, Row, Image, PageHeader, Drawer } from "antd";
import "antd/dist/antd.css";
import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import Media from "react-media";
import { Faq, Footer, MentionsBar, BannerBottom, BannerTop, StatueDisplay, NftForSale } from "./components";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor } from "./helpers";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useEventListener,
  useExchangePrice,
  useGasPrice,
  useOnBlock,
  useUserSigner,
} from "./hooks";
import { Store } from "./views/Gallery";

// These assets will be used. Code using this is commented out
import introbackground from "./assets/introbackground.svg";
import anonvsmolochlogo from "./assets/anonvsmolochlogo.svg";
import ethbotbegins from "./assets/ethbotbegins.svg";
import rectangle9221x from "./assets/rectangle-922@1x.svg";
import introBackground from "./assets/intro-background.png";
import group339272x from "./assets/group-33927@2x.svg";
import group339702x from "./assets/group-33970@2x.svg";
import group339281x from "./assets/group-33928@1x.svg";
import group3395712x from "./assets/group-33957-1@2x.svg";
import bg1x from "./assets/bg@1x.svg";
import fasfainfocircle12x from "./assets/-fas-fa-info-circle-1@2x.svg";
import group339661x from "./assets/group-33966@1x.svg";
import star32x from "./assets/star-3@2x.svg";
import star22x from "./assets/star-2@2x.svg";
import layer212x from "./assets/layer-2-1@2x.png";
import group3392712x from "./assets/group-33927-1@2x.svg";
import frame144361x from "./assets/frame-14436@1x.svg";
import burgerMenuIcon from "./assets/burgerMenuIcon.svg";
import vector12x from "./assets/vector-1@2x.svg";

const { SubMenu } = Menu;
const { ethers } = require("ethers");

/// 📡 What chain are your contracts deployed to?
const targetNetwork = process.env.REACT_APP_NETWORK ? NETWORKS[process.env.REACT_APP_NETWORK] : NETWORKS.localhost; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true;
const NETWORKCHECK = true;

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
// const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
//
// attempt to connect to our own scaffold eth rpc and if that fails fall back to infura...
// Using StaticJsonRpcProvider as the chainId won't change see https://github.com/ethers-io/ethers.js/issues/901
const scaffoldEthProvider = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544")
  : null;
const mainnetInfura = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID)
  : null;
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_I

// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrlFromEnv);

// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

/*
	Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  // network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: INFURA_ID,
      },
    },
  },
});

const logoutOfWeb3Modal = async () => {
  await web3Modal.clearCachedProvider();
  setTimeout(() => {
    window.location.reload();
  }, 1);
};

function App(props) {
  const mainnetProvider = scaffoldEthProvider && scaffoldEthProvider._network ? scaffoldEthProvider : mainnetInfura;

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangePrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userSigner = useUserSigner(injectedProvider, localProvider);

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // Faucet Tx can be used to send funds from the faucet
  //const faucetTx = Transactor(localProvider, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, { chainId: localChainId });

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider);

  // If you want to call a function on a new block
  useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });

  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader(mainnetContracts, "DAI", "balanceOf", [
    "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  ]);


  /*
	const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
	console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
	*/

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  // useEffect(() => {
  //   if (
  //     DEBUG &&
  //     mainnetProvider &&
  //     address &&
  //     selectedChainId &&
  //     yourLocalBalance &&
  //     yourMainnetBalance &&
  //     readContracts &&
  //     writeContracts &&
  //     mainnetContracts
  //   ) {
  //     console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
  //     console.log("🌎 mainnetProvider", mainnetProvider);
  //     console.log("🏠 localChainId", localChainId);
  //     console.log("👩‍💼 selected address:", address);
  //     console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
  //     console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
  //     console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
  //     console.log("📝 readContracts", readContracts);
  //     console.log("🌍 DAI contract on mainnet:", mainnetContracts);
  //     console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
  //     console.log("🔐 writeContracts", writeContracts);
  //   }
  // }, [
  //   mainnetProvider,
  //   address,
  //   selectedChainId,
  //   yourLocalBalance,
  //   yourMainnetBalance,
  //   readContracts,
  //   writeContracts,
  //   mainnetContracts,
  //   localChainId,
  //   myMainnetDAIBalance,
  // ]);

  let networkDisplay = "";
  if (NETWORKCHECK && localChainId && selectedChainId && localChainId !== selectedChainId) {
    const networkSelected = NETWORK(selectedChainId);
    const networkLocal = NETWORK(localChainId);
    if (selectedChainId === 1337 && localChainId === 31337) {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network ID"
            description={
              <div>
                You have <b>chain id 1337</b> for localhost and you need to change it to <b>31337</b> to work with
                HardHat.
                <div>(MetaMask -&gt; Settings -&gt; Networks -&gt; Chain ID -&gt; 31337)</div>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    } else {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network"
            description={
              <div>
                You have <b>{networkSelected && networkSelected.name}</b> selected and you need to be on{" "}
                <Button
                  onClick={async () => {
                    const ethereum = window.ethereum;
                    const data = [
                      {
                        chainId: "0x" + targetNetwork.chainId.toString(16),
                        chainName: targetNetwork.name,
                        nativeCurrency: targetNetwork.nativeCurrency,
                        rpcUrls: [targetNetwork.rpcUrl],
                        blockExplorerUrls: [targetNetwork.blockExplorer],
                      },
                    ];
                    console.log("data", data);
                    const tx = await ethereum.request({ method: "wallet_addEthereumChain", params: data }).catch();
                    if (tx) {
                      console.log(tx);
                    }
                  }}
                >
                  <b>{networkLocal && networkLocal.name}</b>
                </Button>
                .
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    }
  } else {
    networkDisplay = (
      <div style={{ zIndex: -1, position: "absolute", right: 154, top: 28, padding: 16, color: targetNetwork.color }}>
        {targetNetwork.name}
      </div>
    );
  }

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  const [navVisible, setNavVisible] = useState(false);

  const onClose = () => {
    setNavVisible(false);
  };
  const showDrawer = () => {
    setNavVisible(true);
  };

  return (
    <body style={{ margin: 0, background: "#000000" }}>
      <input type="hidden" id="anPageName" name="page" value="v2" />
      <div className="container-center-horizontal">
        <div className="v2 screen">
          <div className="overlap-group8">
            <div className="overlap-group-1">
              <img alt="background image cover nav" className="min-w-full" src={rectangle9221x} />
              <img alt="background image nav" className="v2 introBackground" src={introBackground} />
              <div className="rectangle-923 min-w-full" />
            </div>
            <PageHeader
              extra={[
                <div key="navbar">
                  <Media
                    queries={{
                      small: "(max-width: 699px)",
                      medium: "(min-width: 700px) and (max-width: 1199px)",
                      large: "(min-width: 1200px)",
                    }}
                  >
                    {matches => (
                      <>
                        {matches.large || matches.medium ? (
                          <div>
                            <Image className="largeHeadLargeMedium" src={group339272x} />
                            <Row className="menu-items spacemono-normal-green-sheen-16px" gutter={16}>
                              <Col className="gutter-row" span={6}>
                                <Image className="group-33970" src={group339702x} />
                              </Col>
                              <Col className="gutter-row" span={6}>
                                <div className="top-navbar">Explore Editions</div>
                              </Col>
                              <Col className="gutter-row" span={6}>
                                <div className="top-navbar">How It Works</div>
                              </Col>
                              <Col className="gutter-row" span={6}>
                                <div className="top-navbar">About</div>
                              </Col>
                            </Row>
                          </div>
                        ) : (
                          <div>
                            <Image className="largeHeadSmall" src={group339272x} />
                            <a onClick={showDrawer}>
                              <Image className="menuIconSmall" src={burgerMenuIcon} />
                            </a>
                            <Drawer
                              placement="bottom"
                              closable
                              onClose={onClose}
                              visible={navVisible}
                              width="100vh"
                              height="100vh"
                            >
                              <div className="v2">
                                <div className="overlap-group8-nav">
                                  <div className="overlap-group-1-nav">
                                    <img
                                      className="v2 introBackgroundCover-nav"
                                      src={rectangle9221x}
                                      alt="rectangle background"
                                    />
                                    <img
                                      className="v2 introBackground-nav"
                                      src={introBackground}
                                      alt="intro background"
                                    />
                                    <div className="rectangle-923-nav" />
                                  </div>
                                  <div>
                                    <Image className="largeHeadSmall infront" src={group339272x} />
                                    <a onClick={onClose}>
                                      <Image className="menuIconSmall infront" src={burgerMenuIcon} />
                                    </a>
                                    <div className="nav-view-slider">
                                      <Row gutter={16}>
                                        <Col span={8} offset={4}>
                                          <Image
                                            className="infront-bottom nav-gitcoin-margin"
                                            src={group339702x}
                                            width={150}
                                            height={100}
                                          />
                                        </Col>
                                      </Row>
                                      <Row gutter={16}>
                                        <Col span={8} offset={4}>
                                          <h1 className="top-navbar-text-style infront-bottom nav-text-margin">
                                            Explore Editions
                                          </h1>
                                        </Col>
                                      </Row>
                                      <Row gutter={16}>
                                        <Col span={8} offset={4}>
                                          <h1 className="top-navbar-text-style infront-bottom nav-text-margin">
                                            How It Works
                                          </h1>
                                        </Col>
                                      </Row>
                                      <Row gutter={16}>
                                        <Col span={8} offset={4}>
                                          <h1 className="top-navbar-text-style infront-bottom nav-text-margin">
                                            About
                                          </h1>
                                        </Col>
                                      </Row>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Drawer>
                          </div>
                        )}
                      </>
                    )}
                  </Media>
                </div>,
              ]}
            />
            <Image className="group-33927" src={group339272x} />

            {/* <Navbar /> */}
            <h1 className="text-4">The Greatest Larp has Begun</h1>
            <div className="text-1-2">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry.Lorem Ipsum is simply dummy text
              .
            </div>
            <div className="x16d-10h-16m spacemono-normal-green-sheen-32px">16d 10h 16m</div>
            <Button className="twitter-follow-btn">
              <img className="vector" src={vector12x} />
              <div className="follow">Follow</div>
            </Button>
            {/* Comic Book */}
            <img className="group-33928 -mt-8" src={group339281x} />
          </div>
          <StatueDisplay />
          <BannerTop />

          <div className="overlap-group9">
            <NftForSale />
            <MentionsBar />
            <BannerBottom />
          </div>

          <Faq
            sectionTitle="FAQ’S !?"
            faqs={[
              { title: "What is Lorem Ipsum?", description: "Lorem Ipsum has been the industry" },
              { title: "What is Lorem Ipsum?", description: "Lorem Ipsum has been the industry" },
              { title: "What is Lorem Ipsum?", description: "Lorem Ipsum has been the industry" },
              { title: "What is Lorem Ipsum?", description: "Lorem Ipsum has been the industry" },
            ]}
          />
          <Footer />
        </div>
      </div>
    </body>
  );
}

export default App;
