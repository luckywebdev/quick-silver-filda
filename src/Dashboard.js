import React, {useContext, useEffect, useState} from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import styles from "./Dashboard.module.scss";
import moment from "moment";
import { useTranslation } from "react-i18next";
import Config from "./utils/config";
import CoreData from "./methods/CoreData";
import ContentLoader from "react-content-loader";
import LoadingIcon from "./images/savingsloading.svg";
import { NetworkTypeContext, WalletAddressContext, Web3Context } from './context'

function Dashboard(props) {
  const { connectedAddress } = useContext(WalletAddressContext)
  const { networkType } = useContext(NetworkTypeContext)
  const { web3 } = useContext(Web3Context)

  const { t } = useTranslation();

  const loadingColors = {
    background: "#111722",
    foreground: "#1A212D",
  };

  const [loading, setLoading] = useState(true);
  const [poolData, setPoolData] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [activeTxnsList, setActiveTxnsList] = useState([]);

  useEffect(() => {
    let timer = null;

    async function initialLoad() {
      let fetching = false;

      if (
        !fetching
        // && connectedAddress !== undefined &&
        // networkType !== undefined &&
        // networkType !== "unsupported" &&
        // web3 !== undefined
      ) {
        fetching = true;

        const markets = await fetch("/data/fildamarkets.json");
        const summaryData = await markets.json();

        // Code for issuance reduction after 4 weeks
        // const currentBlock = await web3.eth.getBlockNumber();
        // console.log(currentBlock);
        const blocksPerDay = 28800; // Heco chain 3s block time
        let dailyDistribution = summaryData.fildaSpeeds * blocksPerDay;
        // if (currentBlock - summaryData.firstBlock > 806400) { // If 4 weeks elapsed, issuance reduced to 12 per block
        //   let dailyDistribution = 12 * blocksPerDay;
        // }
        summaryData.dailyDistribution = dailyDistribution;

        let pools = [];
        let TVL = 0;
        const issuancePerBlock = (summaryData.fildaSpeeds * 0.4) / 2; // 40% issuance for borrowing and lending

        await Promise.all(
          summaryData.markets.map(async (pool) => {
            const market = await fetch(`/data/${pool}.json`);
            let token = await market.json();

            // Add token to TVL
            TVL += token.totalSupply * token.price;

            // Calc mining ratios for borrowing/lending
            const ratio =
              token.fildaSpeed / (issuancePerBlock * Math.pow(10, 18));
            token.miningRatio = ratio;

            // Calc daily and annual yields for borrowing/lending
            const fildaEarningsPerDay =
              issuancePerBlock * blocksPerDay * ratio * summaryData.fildaPrice;
            const tokenLendValue = token.totalSupply * token.price;
            const dailyLendYield = fildaEarningsPerDay / tokenLendValue;

            token.lendDPY = dailyLendYield;
            token.lendAPY = dailyLendYield * 365;
            // Borrowing
            const tokenBorrowValue = token.totalBorrows * token.price;
            const dailyBorrowYield = fildaEarningsPerDay / tokenBorrowValue;
            token.borrowDPY = dailyBorrowYield;
            token.borrowAPY = dailyBorrowYield * 365;

            // Interest APY Calcs
            //  const ethMantissa = 1e18;
            //  supplyRatePerBlock 839949557
            //  borrowRatePerBlock 5271175352
            // const borrowApy = (((Math.pow((borrowRatePerBlock / ethMantissa * blocksPerDay) + 1, 365 - 1))) - 1) * 100;
            // const supplyApy = (((Math.pow((supplyRatePerBlock / ethMantissa * blocksPerDay) + 1, 365 - 1))) - 1) * 100;

            pools.push(token);
            return;
          })
        );

        const lendList = [...pools].sort((a, b) => {
          return b.lendAPY - a.lendAPY;
        });
        const borrowList = [...pools].sort((a, b) => {
          return b.borrowAPY - a.borrowAPY;
        });

        summaryData.lendMarkets = lendList;
        summaryData.borrowMarkets = borrowList;
        summaryData.TVL = TVL;
        setSummaryData(summaryData);
        setLoading(false);
        fetching = false;
      }
    }
    initialLoad();
    setInterval(initialLoad, 10000);
    return () => {
      clearInterval(timer);
    };
  }, [connectedAddress]);

  const dataLoading = (
    <ContentLoader
      height={130}
      width={"100%"}
      speed={1}
      backgroundColor={loadingColors.background}
      foregroundColor={loadingColors.foreground}
    >
      {/* Only SVG shapes */}
      <rect x="0" y="20" rx="4" ry="4" width="100%" height="40" />
      <rect x="0" y="80" rx="4" ry="4" width="100%" height="40" />
    </ContentLoader>
  );

  const TVL = (
    <Container>
      <Row>
        <Col className={styles.TVLContainer}>
          <div className={styles.title}>Total Value Locked (TVL)</div>
          <div className={styles.value}>
            ${parseInt(summaryData.TVL).toLocaleString()}
          </div>
        </Col>
      </Row>
    </Container>
  );

  const tokenInfo = (
    <Container className={styles.tile}>
      <Row>
        <Col md={4} className={styles.itemContainer}>
          <div className={styles.label}>FILDA Price</div>
          <div className={styles.value}>${summaryData.fildaPrice}</div>
        </Col>
        <Col md={4} className={styles.itemContainer}>
          <div className={styles.label}>Daily Distribution</div>
          <div className={styles.value}>
            {Number(summaryData.dailyDistribution).toLocaleString({
              maximumSignificantDigits: 0,
            })}
          </div>
        </Col>
        <Col md={4} className={styles.itemContainer}>
          <div className={styles.label}>Circulating Market Cap</div>
          <div className={styles.value}>
            $
            {parseInt(
              summaryData.circulatingSupply * summaryData.fildaPrice
            ).toLocaleString()}
          </div>
        </Col>
      </Row>
    </Container>
  );

  // const liquidityPools = !loading ? (
  //   summaryData.pools.map((token, i) => {
  //     return <Row className={styles.poolItem} key={i}></Row>;
  //   })
  // ) : (
  //   <div>{dataLoading}</div>
  // );

  const liquidity = (
    <Col className={styles.poolContainer}>
      <div className={styles.tile}>
        <div className={styles.infoContainer}>
          <div className={`${styles.header} ${styles.yellow}`}>
            Liquidity Pool (LP) Staking
          </div>
          <div>
            <Row>
              <Col>
                <Row>
                  <Col className={styles.label}>LP Token</Col>
                  <Col className={styles.label}>TVL</Col>
                  <Col className={styles.label}>Mining Ratio</Col>
                  <Col className={styles.label}>Daily Yield</Col>
                  <Col className={styles.label}>Annual Yield</Col>
                </Row>
                {/* {liquidityPools} */}
              </Col>
            </Row>
          </div>
        </div>
      </div>
    </Col>
  );

  // const insurancePools = !loading ? (
  //   summaryData.pools.map((token, i) => {
  //     return <Row className={styles.poolItem} key={i}></Row>;
  //   })
  // ) : (
  //   <div>{dataLoading}</div>
  // );

  const insurance = (
    <Col className={styles.poolContainer}>
      <div className={styles.tile}>
        <div className={styles.infoContainer}>
          <div className={`${styles.header} ${styles.green}`}>
            Insurance Pool Staking
          </div>
          <div>
            <Row>
              <Col>
                <Row>
                  <Col className={styles.label}>Deposit</Col>
                  <Col className={styles.label}>TVL</Col>
                  {/* <Col className={styles.label}>Mining Ratio</Col> */}
                  <Col className={styles.label}>Daily Yield</Col>
                  <Col className={styles.label}>Annual Yield</Col>
                </Row>
                {/* {insurancePools} */}
              </Col>
            </Row>
          </div>
        </div>
      </div>
    </Col>
  );

  const borrowingMarkets = !loading ? (
    summaryData.borrowMarkets.map((token, i) => {
      return (
        <Row className={styles.poolItem} key={i}>
          <Col md={3}>
            <Row>
              <Col className={styles.value}>
                <div className={styles.tokenTitle}>
                  <img
                    src={`${Config.markets[token.name].logo}`}
                    className="d-inline-block align-top"
                    alt={token.name}
                  />
                  {token.name}
                </div>
              </Col>
            </Row>
          </Col>
          <Col md={9}>
            <Row>
              <Col xs={6} md={3}>
                <div className={styles.tokenParameterLabel}>TVL</div>
                <div className={styles.value}>
                  ${parseInt(token.totalBorrows * token.price).toLocaleString()}
                </div>
              </Col>
              {/* <Col xs={6} md={2} className={styles.value}>
                <div className={styles.tokenParameterLabel}>Mining Ratio</div>
                <div className={styles.value}>
                  {parseInt(token.miningRatio * 100)}%
                </div>
              </Col> */}
              <Col xs={6} md={3} className={styles.value}>
                <div className={styles.tokenParameterLabel}>Loan APY</div>
                <div className={styles.value}>
                  -{(token.borrowDPY * 100).toFixed(2)}%
                </div>
              </Col>
              <Col xs={6} md={3} className={styles.value}>
                <div className={styles.tokenParameterLabel}>FILDA APY</div>
                <div className={styles.value}>
                  {(token.borrowAPY * 100).toFixed(2)}%
                </div>
              </Col>
              <Col xs={6} md={3} className={styles.value}>
                <div className={styles.tokenParameterLabel}>Net APY</div>
                <div className={styles.value}>
                  {(token.borrowAPY * 100).toFixed(2)}%
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      );
    })
  ) : (
    <div>{dataLoading}</div>
  );

  const borrowing = (
    <Col className={styles.poolContainer}>
      <div className={styles.tile}>
        <div className={styles.infoContainer}>
          <div className={`${styles.header} ${styles.yellow}`}>
            Borrowing Mining
          </div>
          <div>
            <Row>
              <Col>
                <Row className={styles.sectionColumnHeaders}>
                  <Col md={3} className={styles.label}>
                    Asset
                  </Col>
                  <Col md={9}>
                    <Row>
                      <Col xs={6} md={3} className={styles.label}>
                        TVL
                      </Col>
                      {/* <Col xs={6} md={2} className={styles.label}>
                        Mining Ratio
                      </Col> */}
                      <Col xs={6} md={3} className={styles.label}>
                        Loan APY
                      </Col>
                      <Col xs={6} md={3} className={styles.label}>
                        FILDA APY
                      </Col>
                      <Col xs={6} md={3} className={styles.label}>
                        Net APY
                      </Col>
                    </Row>
                  </Col>
                </Row>
                {borrowingMarkets}
              </Col>
            </Row>
          </div>
        </div>
      </div>
    </Col>
  );

  const lendingMarkets = !loading ? (
    summaryData.lendMarkets.map((token, i) => {
      return (
        <Row className={styles.poolItem} key={i}>
          <Col md={3}>
            <Row>
              <Col className={styles.value}>
                <div className={styles.tokenTitle}>
                  <img
                    src={`${Config.markets[token.name].logo}`}
                    className="d-inline-block align-top"
                    alt={token.name}
                  />
                  {token.name}
                </div>
              </Col>
            </Row>
          </Col>
          <Col md={9}>
            <Row>
              <Col xs={6} md={3}>
                <div className={styles.tokenParameterLabel}>TVL</div>
                <div className={styles.value}>
                  ${parseInt(token.totalSupply * token.price).toLocaleString()}
                </div>
              </Col>
              {/* <Col xs={6} md={2} className={styles.value}>
                <div className={styles.tokenParameterLabel}>Mining Ratio</div>
                <div className={styles.value}>
                  {parseInt(token.miningRatio * 100)}%
                </div>
              </Col> */}
              <Col xs={6} md={3} className={styles.value}>
                <div className={styles.tokenParameterLabel}>Deposit APY</div>
                <div className={styles.value}>
                  {(token.lendDPY * 100).toFixed(2)}%
                </div>
              </Col>
              <Col xs={6} md={3} className={styles.value}>
                <div className={styles.tokenParameterLabel}>FILDA APY</div>
                <div className={styles.value}>
                  {(token.lendAPY * 100).toFixed(2)}%
                </div>
              </Col>
              <Col xs={6} md={3} className={styles.value}>
                <div className={styles.tokenParameterLabel}>Net APY</div>
                <div className={styles.value}>
                  {/* {(token.lendAPY * 100).toFixed(2)}% */}
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      );
    })
  ) : (
    <div>{dataLoading}</div>
  );

  const lending = (
    <Col className={styles.poolContainer}>
      <div className={styles.tile}>
        <div className={styles.infoContainer}>
          <div className={`${styles.header} ${styles.green}`}>
            Lending Mining
          </div>
          <div>
            <Row>
              <Col>
                <Row className={styles.sectionColumnHeaders}>
                  <Col md={3} className={styles.label}>
                    Asset
                  </Col>
                  <Col md={9}>
                    <Row>
                      <Col xs={6} md={3} className={styles.label}>
                        TVL
                      </Col>
                      {/* <Col xs={6} md={2} className={styles.label}>
                        Mining Ratio
                      </Col> */}
                      <Col xs={6} md={3} className={styles.label}>
                        Deposit APY
                      </Col>
                      <Col xs={6} md={3} className={styles.label}>
                        FILDA APY
                      </Col>
                      <Col xs={6} md={3} className={styles.label}>
                        Net APY
                      </Col>
                    </Row>
                  </Col>
                </Row>
                {lendingMarkets}
              </Col>
            </Row>
          </div>
        </div>
      </div>
    </Col>
  );

  return (
    <div className={styles.summary}>
      <div className={styles.introContainer}>{TVL}</div>
      <div className={styles.summaryContainer}>{tokenInfo}</div>
      <div className={styles.marketsContainer}>
        {/* <div className={styles.poolsContainer}>
          <Container>
            <Row>{liquidity}</Row>
          </Container>
        </div>
        <div className={styles.poolsContainer}>
          <Container>
            <Row>{insurance}</Row>
          </Container>
        </div> */}
        <div className={styles.poolsContainer}>
          <Container>
            <Row>{borrowing}</Row>
          </Container>
        </div>
        <div className={styles.poolsContainer}>
          <Container>
            <Row>{lending}</Row>
          </Container>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
