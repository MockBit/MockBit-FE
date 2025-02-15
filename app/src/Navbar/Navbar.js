import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Github } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/users/status', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          setIsLoggedIn(false);
          return;
        }

        const data = await response.json();
        setIsLoggedIn(data.isLoggedIn);
      } catch (error) {
        console.error("로그인 상태 확인 오류:", error);
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8080/api/users/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setIsLoggedIn(false);
      navigate('/');
      window.location.reload();
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
    }
  };

  return (
    <header className="header">
      <h1 className="logo" onClick={() => navigate('/')}>MockBit</h1>
      <nav className="nav">
        <Link to="/exchange" className="nav-link">거래소</Link>
        <Link to="#" className="nav-link">투자내역</Link>
        <Link to="#" className="nav-link">랭킹</Link>

        {isLoggedIn ? (
          <button className="nav-link" onClick={handleLogout}>로그아웃</button>
        ) : (
          <Link to="/login" className="nav-link">로그인</Link>
        )}

        <motion.a 
          href="https://github.com/MockBit"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Github size={24} />
        </motion.a>
      </nav>
    </header>
  );
};

export default Navbar;
