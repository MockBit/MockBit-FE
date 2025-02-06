import React from "react";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { motion } from "framer-motion";
import { ArrowRight, Github } from "lucide-react";

const Home = () => {
  return (
    <div className="container center">
      <a href="https://github.com/MockBit" target="_blank" rel="noopener noreferrer" className="github-button">
        <Github size={32} />
      </a>
      
      <motion.h1 
        className="title bitcoin-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        MockBit
      </motion.h1>
      <motion.p 
        className="description bitcoin-description"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        MockBit은 비트코인 선물 거래를 안전하게 모의투자로 경험할 수 있는 24시간 실시간 투자 시뮬레이션 서비스입니다.
        <br></br>
        수익 창출 목적 없이 레버리지 투자에 실전 감각을 키우고 싶은 분들을 위해 만들어졌습니다.
        <br></br>
        "연습은 실전처럼, 리스크는 없이!" MockBit에서 마음껏 투자 전략을 실험해보세요.
      </motion.p>
      
      <Card className="card-container bitcoin-card">
        <CardContent>
          <p className="card-text bitcoin-card-text">Start your simulated trading journey now!</p>
          <Button className="start-button bitcoin-button">
            Start Trading <ArrowRight size={24} />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
