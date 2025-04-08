import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { init, dispose } from 'klinecharts';
import { AuthContext } from '../Login/AuthContext';
import './Exchange.css';

const Exchange = () => {
    const navigate = useNavigate();
    const [chart, setChart] = useState(null);
    const [timeframe, setTimeframe] = useState('1440');
    const [socket, setSocket] = useState(null);
    const [profitSocket, setProfitSocket] = useState(null);
    const [orderType, setOrderType] = useState('limit');
    const [position, setPosition] = useState('LONG');
    const [price, setPrice] = useState('');
    const [orderPrice, setOrderPrice] = useState('');
    const [leverage, setLeverage] = useState(1);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [currentPositions, setCurrentPositions] = useState([]);
    const { isLoggedIn, userId } = useContext(AuthContext);
    const [balance, setBalance] = useState(null);
    const [activeTab, setActiveTab] = useState('positions');
    const [btcPrice, setBtcPrice] = useState('');
    const [profitData, setProfitData] = useState({
        profitAmount: 0,
        profitRate: 0,
        position: null,
    });

    useEffect(() => {
        const newChart = init('kline-chart');
        setChart(newChart);
        fetchChartData(timeframe, newChart);
        fetchBalance();
        fetchPendingOrders();

        newChart.subscribeAction('scroll', async () => {
            const dataList = newChart.getDataList();
            if (dataList.length > 0) {
                const firstTimestamp = dataList[0].timestamp;
                await fetchMoreChartData(timeframe, newChart, firstTimestamp);
            }
        });

        return () => {
            dispose('kline-chart');
        };
    }, [timeframe]);

    useEffect(() => {
        if (chart) {
            if (socket) socket.close();
            setupWebSocket(timeframe, chart);
        }
    }, [chart, timeframe]);

    useEffect(() => {
        if (!isLoggedIn || !userId) return;
        console.log("User ID:", userId);

        const ws = new WebSocket(`ws://localhost:8080/ws/profit?userId=${userId}`);

        ws.onopen = () => {
            console.log('수익 웹소켓 연결 성공');
        };

        ws.onmessage = (event) => {
            console.log("수신된 데이터:", event.data)
            const data = JSON.parse(event.data);
            setProfitData({
                profitAmount: Number(data.profitAmount),
                profitRate: Number(data.profitRate),
                position: data.position,
            });

            setCurrentPositions((prev) =>
                prev.map((pos) =>
                    pos.type === data.position
                        ? { ...pos, profitAmount: data.profitAmount, profitRate: data.profitRate }
                        : pos
                )
            );
        };

        ws.onerror = (error) => {
            console.error('수익 웹소켓 오류:', error);
        };

        ws.onclose = () => {return;};

        setProfitSocket(ws);

        return () => {
            if (ws) ws.close();
        };
    }, [isLoggedIn, userId]);

    const fetchBalance = async () => {
        if (!isLoggedIn) {
            setBalance(0);
            return;
        }
        try {
            const response = await fetch('http://localhost:8080/api/accounts/balance', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            if (!response.ok) throw new Error('잔액 조회 실패');
            const data = await response.json();
            setBalance(data.balance);
        } catch (error) {
            console.error('잔액 조회 오류:', error);
        }
    };

    const fetchPendingOrders = async () => {
        if (!isLoggedIn) return;
        try {
            const response = await fetch('http://localhost:8080/api/limit/orders/pending/orders', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            if (response.status === 204) {
                setPendingOrders([]);
                return;
            }
            if (!response.ok) throw new Error('미체결 주문 조회 실패');
            const data = await response.json();
            setPendingOrders(data);
        } catch (error) {
            console.error('미체결 주문 조회 오류:', error);
        }
    };

    const fetchChartData = async (unit, chartInstance) => {
        try {
            const endpoint = unit === '1440' ? 'candles/days' : `candles/minutes/${unit}`;
            const response = await fetch(`https://api.upbit.com/v1/${endpoint}?market=KRW-BTC&count=200`);
            const data = await response.json();

            const formattedData = data.map((item) => ({
                open: item.opening_price,
                close: item.trade_price,
                high: item.high_price,
                low: item.low_price,
                volume: item.candle_acc_trade_volume,
                timestamp: item.timestamp,
            })).reverse();

            chartInstance.applyNewData(formattedData);
        } catch (error) {
            console.error("차트 데이터 오류:", error);
        }
    };

    const fetchMoreChartData = async (unit, chartInstance, firstTimestamp) => {
        try {
            const endpoint = unit === '1440' ? 'candles/days' : `candles/minutes/${unit}`;
            const date = new Date(firstTimestamp - unit * 60 * 1000);
            const to = new Intl.DateTimeFormat('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).format(date).replace(/\./g, '').replace(/ /g, '-').replace(',', '');
            
            const response = await fetch(`https://api.upbit.com/v1/${endpoint}?market=KRW-BTC&count=200&to=${encodeURIComponent(to)}`);
            const data = await response.json();

            const formattedData = data.map((item) => ({
                open: item.opening_price,
                close: item.trade_price,
                high: item.high_price,
                low: item.low_price,
                volume: item.candle_acc_trade_volume,
                timestamp: item.timestamp,
            })).reverse();

            chartInstance.applyMoreData(formattedData);
        } catch (error) {
            console.error("추가 차트 데이터 오류:", error);
        }
    };

    const setupWebSocket = (unit, chartInstance) => {
        const ws = new WebSocket("wss://api.upbit.com/websocket/v1");

        ws.onopen = () => {
            ws.send(JSON.stringify([
                { ticket: "test" },
                { type: "trade", codes: ["KRW-BTC"] }
            ]));
        };

        ws.onmessage = async (event) => {
            const reader = new FileReader();
            reader.onload = () => {
                const text = reader.result;
                try {
                    const jsonData = JSON.parse(text.toString());
                    const newTrade = {
                        open: jsonData.opening_price,
                        close: jsonData.trade_price,
                        high: jsonData.high_price,
                        low: jsonData.low_price,
                        volume: jsonData.acc_trade_volume,
                        timestamp: jsonData.timestamp,
                    };
                    setBtcPrice(jsonData.trade_price.toString());
                    updateCandle(unit, newTrade, chartInstance);
                } catch (error) {
                    console.error("데이터 파싱 오류:", error);
                }
            };
            reader.readAsText(event.data);
        };

        ws.onerror = (error) => console.error("WebSocket 오류:", error);
        ws.onclose = () => console.log("WebSocket 연결 종료");
        setSocket(ws);
    };

    const updateCandle = (unit, tradeData, chartInstance) => {
        if (!chartInstance || !tradeData) return;
        let timestamp = tradeData.timestamp;
        if (!timestamp || isNaN(timestamp)) return;
        if (timestamp.toString().length === 10) timestamp *= 1000;

        const interval = unit * 60 * 1000;
        const dataList = chartInstance.getDataList();
        if (!dataList || dataList.length === 0) return;

        const lastCandle = dataList[dataList.length - 1];
        const lastTimestamp = lastCandle ? lastCandle.timestamp : 0;
        const tradePrice = parseFloat(tradeData.close);

        const newCandle = {
            timestamp: timestamp,
            open: lastCandle.close || tradePrice,
            close: tradePrice,
            high: Math.max(lastCandle.high, tradePrice),
            low: Math.min(lastCandle.low, tradePrice),
            volume: (lastCandle.volume || 0) + parseFloat(tradeData.volume || 0),
        };

        if (unit === "1" || unit !== "1440") {
            if (timestamp - lastTimestamp >= interval) {
                chartInstance.applyNewData([...dataList, newCandle]);
            } else {
                lastCandle.close = newCandle.close;
                lastCandle.high = Math.max(lastCandle.high, tradePrice);
                lastCandle.low = Math.min(lastCandle.low, tradePrice);
                lastCandle.volume += newCandle.volume;
                chartInstance.updateData(lastCandle);
            }
        } else {
            const lastDate = new Date(lastTimestamp).toDateString();
            const newDate = new Date(timestamp).toDateString();
            if (lastDate !== newDate) {
                chartInstance.applyNewData([...dataList, newCandle]);
            } else {
                lastCandle.close = newCandle.close;
                lastCandle.high = Math.max(lastCandle.high, tradePrice);
                lastCandle.low = Math.min(lastCandle.low, tradePrice);
                lastCandle.volume += newCandle.volume;
                chartInstance.updateData(lastCandle);
            }
        }
    };

    const executeLimitOrder = async (type) => {
        if (!isLoggedIn) {
            alert("로그인이 필요한 서비스입니다.");
            navigate('/login');
            return;
        }
        try {
            const response = await fetch('http://localhost:8080/api/limit/orders/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    price: price,
                    btcPrice: btcPrice,
                    orderPrice: orderPrice,
                    leverage: Number(leverage),
                    position: position,
                    sellOrBuy: type
                }),
                credentials: 'include',
            });

            if (!response.ok) throw new Error("주문 실패");
            fetchBalance();
            fetchPendingOrders();
            alert(`${position.toUpperCase()} 지정가 주문이 실행되었습니다!`);
        } catch (error) {
            console.error("주문 오류:", error);
            alert("주문 처리 중 오류 발생");
        }
    };

    const executeMarketOrder = async (type) => {
        if (!isLoggedIn) {
            alert("로그인이 필요한 서비스입니다.");
            navigate('/login');
            return;
        }
        if (!orderPrice || orderPrice.trim() === "") {
            alert("수량을 입력해주세요.");
            return;
        }
        try {
            const response = await fetch('http://localhost:8080/api/market/orders/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderPrice: orderPrice,
                    leverage: Number(leverage),
                    position: position,
                    sellOrBuy: type
                }),
                credentials: 'include',
            });

            if (!response.ok) throw new Error("주문 실패");
            fetchBalance();
            alert(`${position.toUpperCase()} 시장가 주문이 실행되었습니다!`);
        } catch (error) {
            console.error("주문 오류:", error);
            alert("주문 처리 중 오류 발생");
        }
    };

    const handleEditOrder = (orderId) => {
        // 주문 수정 로직 구현
        console.log('주문 수정:', orderId);
    };

    const handleCancelOrder = (orderId) => {
        setPendingOrders(pendingOrders.filter(order => order.id !== orderId));
    };

    const handleSellPosition = (positionId) => {
        setCurrentPositions(currentPositions.filter(pos => pos.id !== positionId));
        // 실제 판매 로직 추가 가능
    };

    return (
        <div className="container">
            <div className="left-section">
                <div className="chart-section">
                    <motion.div
                        className="chart-box"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h3>비트코인 실시간 차트</h3>
                        <div className="timeframe-selector">
                            <button className={timeframe === '1440' ? 'active' : ''} onClick={() => setTimeframe('1440')}>일</button>
                            <button className={timeframe === '1' ? 'active' : ''} onClick={() => setTimeframe('1')}>1분</button>
                            <button className={timeframe === '30' ? 'active' : ''} onClick={() => setTimeframe('30')}>30분</button>
                            <button className={timeframe === '60' ? 'active' : ''} onClick={() => setTimeframe('60')}>1시간</button>
                        </div>
                        <div id="kline-chart" className="kline-chart"></div>
                    </motion.div>
                </div>

                <div className="position-orders-section">
                    <div className="tab-container">
                        <button
                            className={`tab-button ${activeTab === 'positions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('positions')}
                        >
                            현재 포지션
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
                            onClick={() => setActiveTab('orders')}
                        >
                            미체결 주문
                        </button>
                    </div>
                    <div className="tab-content">
                        {profitData.position != null ? (
                            profitData.length > 0 ? (
                                currentPositions.map((position) => (
                                    <div key={position.id} className="position-item">
                                        <div>
                                            <span className={`order-type-tag ${position.type}`}>
                                                {position.type.toUpperCase()}
                                            </span>
                                            <div>가격: ₩{Number(position.price).toLocaleString()}</div>
                                            <div>수량: {position.amount} BTC</div>
                                            <div>수익 금액: ₩{Number(profitData.profitAmount || 0).toLocaleString()}</div>
                                            <div>수익률: {(profitData.profitRate || 0).toFixed(2)}%</div>
                                            <div>포지션: {profitData.position}</div>
                                        </div>
                                        <button className="sell-button" onClick={() => handleSellPosition(position.id)}>
                                            판매
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p>진입 중인 포지션이 없습니다.</p>
                            )
                        ) : (
                            pendingOrders.length > 0 ? (
                                pendingOrders.map((order) => (
                                    <div key={order.id} className="order-item">
                                        <div className="order-item-header">
                                            <span className={`order-type-tag ${order.type}`}>
                                                {order.type.toUpperCase()}
                                            </span>
                                            <span>{new Date(order.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="order-details">
                                            <div>가격: ₩{Number(order.price).toLocaleString()}</div>
                                            <div>수량: {order.amount} BTC</div>
                                        </div>
                                        <div className="order-actions">
                                            <button className="edit-button" onClick={() => handleEditOrder(order.id)}>수정</button>
                                            <button className="cancel-button" onClick={() => handleCancelOrder(order.id)}>취소</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>미채결 거래가 없습니다.</p>
                            )
                        )}
                    </div>
                </div>
            </div>

            <motion.div
                className="order-section"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
            >
                <h3>거래 주문</h3>
                <div className="balance-info">
                    <label>주문가능</label>
                    <span>{balance !== null ? `${Number(balance).toLocaleString()} KRW` : '0'}</span>
                </div>

                <div className="order-type">
                    <button className={orderType === 'limit' ? 'active' : ''} onClick={() => setOrderType('limit')}>
                        지정가
                    </button>
                    <button className={orderType === 'market' ? 'active' : ''} onClick={() => setOrderType('market')}>
                        시장가
                    </button>
                </div>

                <div className="input-group">
                    <label>주문 가격(KRW)</label>
                    <input
                        type="number"
                        placeholder="주문 금액을 입력하세요"
                        value={orderPrice}
                        onChange={(e) => setOrderPrice(e.target.value)}
                    />
                </div>

                {orderType === 'limit' && (
                    <div className="input-group">
                        <label>BTC 가격(KRW)</label>
                        <input
                            type="number"
                            placeholder="구매하려는 BTC 가격을 입력하세요"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </div>
                )}

                <div className="leverage-slider">
                    <div className="leverage-display">
                        <label>레버리지</label>
                        <div className="leverage-value">
                            <input
                                type="number"
                                className="leverage-input"
                                value={leverage}
                                onChange={(e) => {
                                    const value = Number(e.target.value);
                                    if (value >= 1 && value <= 100) setLeverage(value);
                                }}
                                min="1"
                                max="100"
                            />
                            <span>x</span>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={leverage}
                        onChange={(e) => setLeverage(Number(e.target.value))}
                    />
                </div>

                <div className="trade-buttons">
                    <button
                        className="buy-button"
                        onClick={() => {
                            orderType === 'limit' ? executeLimitOrder('BUY') : executeMarketOrder('BUY');
                            setPosition('LONG');
                        }}
                    >
                        매수(Long)
                    </button>
                    <button
                        className="sell-button"
                        onClick={() => {
                            orderType === 'limit' ? executeLimitOrder('BUY') : executeMarketOrder('BUY');
                            setPosition('SHORT');
                        }}
                    >
                        매도(Short)
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Exchange;