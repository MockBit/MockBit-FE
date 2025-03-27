import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { init, dispose } from 'klinecharts';
import { Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Exchange.css';

const Exchange = () => {
    const navigate = useNavigate();
    const [chart, setChart] = useState(null);
    const [timeframe, setTimeframe] = useState('1440');
    const [socket, setSocket] = useState(null);
    const [orderType, setOrderType] = useState('limit');
    const [position, setPosition] = useState('long');
    const [price, setPrice] = useState('');
    const [orderPrice, setOrderPrice] = useState('');
    const [leverage, setLeverage] = useState(1);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [balance, setBalance] = useState(null);

    useEffect(() => {
        const newChart = init('kline-chart');
        setChart(newChart);
        fetchChartData(timeframe, newChart);
        fetchBalance();

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
    
          if (!response.ok) {
            throw new Error('잔액 조회 실패');
          }
    
          const data = await response.json();
          setBalance(data.balance);
        } catch (error) {
          console.error('잔액 조회 오류:', error);
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
            console.error("차트 데이터를 불러오는 중 오류 발생:", error);
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
            console.error("추가 차트 데이터를 불러오는 중 오류 발생:", error);
        }
    };

    const setupWebSocket = (unit, chartInstance) => {
        const ws = new WebSocket("wss://api.upbit.com/websocket/v1");

        ws.onopen = () => {
        console.log("WebSocket 연결됨");
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
    
        if (timestamp.toString().length === 10) {
            timestamp = timestamp * 1000;
        }
    
        const interval = unit * 60 * 1000; 
        const dataList = chartInstance.getDataList();
    
        if (!dataList || dataList.length === 0) {
            return;
        }
    
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
    
        if (unit === "1") {
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
            if (unit === "1440") {
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
            } else {
                if (timestamp - lastTimestamp >= interval) {
                    chartInstance.applyNewData([...dataList, newCandle]);
                } else {
                    lastCandle.close = newCandle.close;
                    lastCandle.high = Math.max(lastCandle.high, tradePrice);
                    lastCandle.low = Math.min(lastCandle.low, tradePrice);
                    lastCandle.volume += newCandle.volume;
            
                    chartInstance.updateData(lastCandle);
                }
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
                    price: Number(price),
                    btcPrice: orderPrice, // upbit websocket으로부터 전달되는 현재 btc 가격(추후 수정 요망)
                    orderPrice: orderPrice,
                    leverage: Number(leverage),
                    position: position,
                    sellOrBuy: type
                }),
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error("주문 실패! 다시 시도하세요.");
            }

            fetchBalance();
            alert(`${position.toUpperCase()} ${orderType.toUpperCase()} 주문이 실행되었습니다!`);
        } catch (error) {
            console.error("주문 오류:", error);
            alert("주문을 처리하는 중 오류가 발생했습니다.");
        }
    };
  
    const executeMarketOrder = async (type) => {
        if (!isLoggedIn) {
            alert("로그인이 필요한 서비스입니다.");
            navigate('/login');
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/market/orders/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderPrice: price,
                    leverage: Number(leverage),
                    position: position,
                    sellOrBuy: type
                }),
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error("주문 실패! 다시 시도하세요.");
            }

            fetchBalance();
            alert(`${position.toUpperCase()} ${orderType.toUpperCase()} 주문이 실행되었습니다!`);
        } catch (error) {
            console.error("주문 오류:", error);
            alert("주문을 처리하는 중 오류가 발생했습니다.");
        }
    };

    const handleEditOrder = (orderId) => {
        // 주문 수정 로직 구현
        console.log('주문 수정:', orderId);
    };

    const handleCancelOrder = (orderId) => {
        setPendingOrders(pendingOrders.filter(order => order.id !== orderId));
    };

    return (
        <div className="container">
        <div className="chart-section">
            <motion.div 
                className="chart-box"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
            <h2 className="chart-title">비트코인 실시간 차트</h2>
            <div className="timeframe-selector">
                <button className={timeframe === '1440' ? 'active' : ''} onClick={() => setTimeframe('1440')}>일</button>
                <button className={timeframe === '1' ? 'active' : ''} onClick={() => setTimeframe('1')}>1분</button>
                <button className={timeframe === '30' ? 'active' : ''} onClick={() => setTimeframe('30')}>30분</button>
                <button className={timeframe === '60' ? 'active' : ''} onClick={() => setTimeframe('60')}>1시간</button>
            </div>
            <div id="kline-chart" className="kline-chart"></div>
            </motion.div>
        </div>

        <motion.div 
            className="order-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
        >
            <h2 className="chart-title">거래 주문</h2>

            <div className="balance-info">
                <label>주문가능</label>
                <span>
                    {balance !== null
                    ? `${Number(balance).toLocaleString()} KRW`
                    : isLoggedIn
                    ? '0'
                    : '0'}
                </span>
            </div>
    
            <div className="order-type">
            <button 
                className={orderType === 'limit' ? 'active' : ''} 
                onClick={() => setOrderType('limit')}
            >
                지정가
            </button>
            <button 
                className={orderType === 'market' ? 'active' : ''} 
                onClick={() => setOrderType('market')}
            >
                시장가
            </button>
            </div>
    
            <div className="input-group">
                <label>수량(BTC)</label>
                <input 
                    type="number" 
                    placeholder="수량을 입력하세요" 
                    value={orderPrice} 
                    onChange={(e) => setOrderPrice(e.target.value)}
                />
            </div>

            {orderType === 'limit' && (
                <div className="input-group">
                    <label>가격(KRW)</label>
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
                    if (value >= 1 && value <= 100) {
                        setLeverage(value);
                    }
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
                    }}
                >
                    매수(Long)
                </button>
                <button 
                    className="sell-button" 
                    onClick={() => {
                        orderType === 'limit' ? executeLimitOrder('BUY') : executeMarketOrder('BUY');
                    }}
                >
                    매도(Short)
                </button>
            </div>

            <div className="pending-orders">
            <h4>미체결 주문</h4>
            <div className="order-list">
                {pendingOrders.map((order) => (
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
                    <button 
                        className="edit-button"
                        onClick={() => handleEditOrder(order.id)}
                    >
                        수정
                    </button>
                    <button 
                        className="cancel-button"
                        onClick={() => handleCancelOrder(order.id)}
                    >
                        취소
                    </button>
                    </div>
                </div>
                ))}
            </div>
            </div>
        </motion.div>
        </div>
    );
}  

export default Exchange;