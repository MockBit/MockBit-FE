import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Github } from 'lucide-react';
import './Navbar.css';
import { AuthContext } from '../Login/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const { isLoggedIn, setIsLoggedIn } = authContext;

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
