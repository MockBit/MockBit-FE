import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, ArrowUpRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [btcPrice, setBtcPrice] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const ws = new WebSocket('wss://api.upbit.com/websocket/v1');
    ws.onopen = () => {
      ws.send(JSON.stringify([{ ticket: "test" }, { type: "ticker", codes: ["KRW-BTC"] }]));
    };
    ws.onmessage = (event) => {
      const reader = new FileReader();
      reader.onload = () => {
        const data = JSON.parse(reader.result);
        setBtcPrice(data.trade_price.toLocaleString('ko-KR'));
      };
      reader.readAsText(event.data);
    };
    return () => ws.close();
  }, []);

  return (
    <div className="container">
      <main className="main-content">
        <motion.h3
            className="title"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            비트코인 선물거래<br />모의투자의 새로운 기준
        </motion.h3>
        <motion.p className="description"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
        >
            MockBit는 실시간 데이터를 기반으로 한 안전한 모의투자 플랫폼입니다.
            <br></br>
            실전과 동일한 환경에서 리스크 없이 투자 전략을 실험해보세요.
        </motion.p>
        <motion.button 
          className="cta-button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          모의투자 시작하기 <ArrowUpRight size={20} />
        </motion.button>

        <motion.div 
          className="price-display small"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3>현재 비트코인 가격</h3>
          <div className="price-value">{btcPrice ? `₩${btcPrice}` : "Loading..."}</div>
        </motion.div>
      </main>
    </div>
  );
};

export default Home;
