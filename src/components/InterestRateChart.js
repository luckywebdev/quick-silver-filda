import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { line, curveLinear } from 'd3-shape';

function InterestRateChart(props) {
    const { market } = props

    const { t } = useTranslation()
    const currentUtilRate = parseFloat((market.utilRate || 0).toFixed(2))

    const [curRate, setCurRate] = useState(currentUtilRate)

    const ethMantissa = 1e18;
    const BaseRatePerBlock = parseInt(market.baseRatePerBlock)
    const MultiplierPerBlock = parseInt(market.multiplierPerBlock)
    const JumpMultiplierPerBlock = parseInt(market.jumpMultiplierPerBlock)
    const Kink = market.kink / ethMantissa
    const reserveFactor = market.reserveFactor

    const WIDTH = 1000 // viewBox WIDTH
    const HEIGHT = 500 // viewBox HEIGHT
    const VPADDING = 8 // in percentage
    const HPADDING = 50 // viewBox unit
    const colors = {
        util: "white",
        borrow: "#FB7777",
        supply: "#4FDAB8",
        background: "#0D1119"
    }
    const fontSize = "1.5em"
    const contentHeight = 70 // supply, borrow rate graph HEIGHT in percentage

    const annual = (val) => {
        const blocksPerDay = 20 * 60 * 24;
        const daysPerYear = 365;
        return (((Math.pow((val / ethMantissa * blocksPerDay) + 1, daysPerYear - 1))) - 1) * 100.0
    }

    const borrowRate = (util) => {
        return annual(borrowRatePerBlock(util / 100.0))
    }
    const borrowRatePerBlock = (utilRate) => {
        if (utilRate <= Kink)
            return BaseRatePerBlock + utilRate * MultiplierPerBlock
        return BaseRatePerBlock + utilRate * MultiplierPerBlock + (utilRate - Kink) * JumpMultiplierPerBlock
    }

    const supplyRate = (util) => {
        return annual(supplyRatePerBlock(util / 100.0))
    }
    const supplyRatePerBlock = (utilRate) => {
        const _borrowRatePerBlock = borrowRatePerBlock(utilRate)
        return _borrowRatePerBlock * utilRate * (1 - reserveFactor)
    }

    const mapToPoint = (pt) => {
        const x = HPADDING + pt[0] * (WIDTH - HPADDING * 2) / 100.0
        const y = pt[1] * HEIGHT / 100.0
        return [x, y]
    }

    const utilRates = []
    const borrowRates = []
    const supplyRates = []

    // generate points
    for (let i=0; i<=100; i++) {
        utilRates.push([i, VPADDING])
        borrowRates.push([i, borrowRate(i)])
        supplyRates.push([i, supplyRate(i)])
        if (i <= currentUtilRate && currentUtilRate < i + 1) {
            utilRates.push([currentUtilRate, VPADDING])
            borrowRates.push([currentUtilRate, borrowRate(currentUtilRate)])
            supplyRates.push([currentUtilRate, supplyRate(currentUtilRate)])
        }
    }

    // fit supply, borrow rate between 10% and 90%
    const maxY = Math.max(...[...borrowRates, ...supplyRates].map(e => e[1]))
    const revertYValue = (y) => (100 - (y * contentHeight / maxY + VPADDING))
    for (let i=0; i<borrowRates.length; i++) {
        borrowRates[i][1] = revertYValue(borrowRates[i][1])
        supplyRates[i][1] = revertYValue(supplyRates[i][1])
    }

  
    // map to real points
    const uPath = line().curve(curveLinear)(utilRates.map(mapToPoint)) || '';
    const bPath = line().curve(curveLinear)(borrowRates.map(mapToPoint)) || '';
    const sPath = line().curve(curveLinear)(supplyRates.map(mapToPoint)) || '';

    const lines = (
        <g>
            <path d={uPath} stroke={colors.util} strokeWidth="5" fill="transparent" />
            <path d={bPath} stroke={colors.borrow} strokeWidth="5" fill="transparent" />
            <path d={sPath} stroke={colors.supply} strokeWidth="5" fill="transparent" />
        </g>
    )

    // show comments
    const commentsX = WIDTH * 1 / 10
    const commentsY = HEIGHT * 1 / 3
    const comments = (
        <g>
            <rect x={commentsX} y={commentsY} width={15} height={15} fill={colors.util}/>
            <text x={commentsX + 20} y={commentsY + 15} textAnchor="start" fill={colors.util} fontSize={fontSize} >{t('MarketDetail.UtilRate')}</text>

            <rect x={commentsX} y={commentsY + 30} width={15} height={15} fill={colors.borrow}/>
            <text x={commentsX + 20} y={commentsY + 45} textAnchor="start" fill={colors.borrow} fontSize={fontSize} >{t('MarketDetail.BorrowRate')}</text>

            <rect x={commentsX} y={commentsY + 60} width={15} height={15} fill={colors.supply}/>
            <text x={commentsX + 20} y={commentsY + 75} textAnchor="start" fill={colors.supply} fontSize={fontSize} >{t('MarketDetail.SupplyRate')}</text>
        </g>
    )

    // show current util rate
    const curIndStart = mapToPoint([currentUtilRate, VPADDING + 1])
    const curIndEnd = mapToPoint([currentUtilRate, VPADDING + 6])

    const currentUtilValue = (
        <g>
            <line x1={curIndStart[0]} y1={curIndStart[1]} x2={curIndEnd[0]} y2={curIndEnd[1]} stroke="white" strokeWidth="2" fill="transparent" />
            <text x={curIndEnd[0]} y={curIndEnd[1] + 20} textAnchor="middle" fill="white" fontSize={fontSize}>{t('MarketDetail.Current')}</text>
        </g>
    )

    // show current pointer
    const curUPoint = mapToPoint([curRate, VPADDING])
    const curBPoint = mapToPoint([curRate, revertYValue(borrowRate(curRate))])
    const curSPoint = mapToPoint([curRate, revertYValue(supplyRate(curRate))])

    const points = (
        <g>
            <line x1={curUPoint[0]} y1={curUPoint[1]} x2={curSPoint[0]} y2={curSPoint[1]} stroke="grey" strokeWidth="1" fill="transparent" strokeDasharray="2"/>

            <circle cx={curUPoint[0]} cy={curUPoint[1]} r="6" fill={colors.util} stroke={colors.background} strokeWidth="3" />
            <text x={curUPoint[0]} y={curUPoint[1] - 15} textAnchor="middle" fill="white" fontSize={fontSize} >{curRate}%</text>

            <circle cx={curBPoint[0]} cy={curBPoint[1]} r="6" fill={colors.borrow} stroke={colors.background} strokeWidth="3" />
            <rect x={curBPoint[0] - 50} y={curBPoint[1] - 40} width={100} height={30} fill={colors.background}/>
            <text x={curBPoint[0]} y={curBPoint[1] - 15} textAnchor="middle" fill="white" fontSize={fontSize} >{borrowRate(curRate).toFixed(2)}%</text>

            <circle cx={curSPoint[0]} cy={curSPoint[1]} r="6" fill={colors.supply} stroke={colors.background} strokeWidth="3" />
            <rect x={curSPoint[0] - 50} y={curSPoint[1] + 10} width={100} height={30} fill={colors.background}/>
            <text x={curSPoint[0]} y={curSPoint[1] + 35} textAnchor="middle" fill="white" fontSize={fontSize} >{supplyRate(curRate).toFixed(2)}%</text>
        </g>
    )

    // click area
    const clickBoxWidth = WIDTH - HPADDING * 2
    const clickBoxStartX = utilRates[0][0] + HPADDING
    const onPosChange = (evt) => {
        if (evt.buttons < 1) return
        let dim = evt.target.getBoundingClientRect();
        let x = evt.clientX - dim.left;
        const value = x / dim.width * 100
        const rate = [Math.floor(value), Math.ceil(value), currentUtilRate].reduce((a, b) => {
            return Math.abs(b - value) < Math.abs(a - value) ? b : a;
        });
        setCurRate(rate)
    }

    return (
        <svg width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} xmlns="http://www.w3.org/2000/svg">
            <rect x={clickBoxStartX} y="0" width={clickBoxWidth} height={HEIGHT} fill="transparent" onMouseDown={onPosChange} onMouseMove={onPosChange} />
            {lines}
            {points}
            {currentUtilValue}
            {comments}
        </svg>
    )
}

export default InterestRateChart
