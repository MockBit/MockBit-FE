import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './SignUp.css';
import '../Home.css';

const Signup = () => {
  const [userid, setUserid] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [useridAvailable, setUseridAvailable] = useState(null);
  const [nicknameAvailable, setNicknameAvailable] = useState(null);
  const [useridChecked, setUseridChecked] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [showUseridMessage, setShowUseridMessage] = useState(false);
  const [showPasswordMessage, setShowPasswordMessage] = useState(false);
  const [showNicknameMessage, setShowNicknameMessage] = useState(false);
  const navigate = useNavigate();

  const validateUserid = async () => {
    if (userid.length < 8 || userid.length > 14) {
      alert('아이디는 8~14자여야 합니다.');
      return;
    }
    try {
      const response = await fetch(`http://localhost:8080/api/users/check-id?userid=${userid}`);
      const data = await response.json();
      setUseridAvailable(data.available);
      setUseridChecked(true);
    } catch (error) {
      alert('아이디 중복 확인 중 오류가 발생했습니다.');
    }
  };

  const validateNickname = async () => {
    if (nickname.length < 2 || nickname.length > 14) {
      alert('닉네임은 2~14자여야 합니다.');
      return;
    }
    try {
      const response = await fetch(`http://localhost:8080/api/users/check-nickname?nickname=${nickname}`);
      const data = await response.json();
      setNicknameAvailable(data.available);
      setNicknameChecked(true);
    } catch (error) {
      alert('닉네임 중복 확인 중 오류가 발생했습니다.');
    }
  };

  const validatePassword = () => {
    const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,14}$/;
    return regex.test(password);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!useridChecked || !nicknameChecked || !useridAvailable || !nicknameAvailable || !validatePassword()) {
      alert('입력 조건을 충족하지 않았습니다.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid, password, nickname }),
      });

      if (response.ok) {
        alert('회원가입이 완료되었습니다.');
        navigate('/');
      } else {
        alert('회원가입 실패. 다시 시도해주세요.');
      }
    } catch (error) {
      alert('회원가입 요청 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="signup-container">
      <motion.div 
        className="signup-box"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="signup-title">회원가입</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="userid">아이디 (8~14자)</label>
            <div className="input-wrapper">
              <input 
                type="text" 
                id="userid" 
                value={userid} 
                onChange={(e) => { setUserid(e.target.value); setShowUseridMessage(true); setUseridAvailable(null); setUseridChecked(false); }}
                required 
              />
              <button 
                type="button" 
                onClick={validateUserid} 
                className="check-button"
                disabled={userid.length < 8 || userid.length > 14}
              >
                중복 확인
              </button>
            </div>
            {showUseridMessage && (
              <p className={userid.length >= 8 && userid.length <= 14 ? 'success-text' : 'error-text'}>
                {userid.length < 8 || userid.length > 14 ? '아이디는 8~14자여야 합니다.' : '올바른 형식입니다.'}
              </p>
            )}
            {useridChecked && (
              <p className={useridAvailable ? 'success-text' : 'error-text'}>
                {useridAvailable ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.'}
              </p>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="password">비밀번호 (8~14자, 숫자 및 특수문자 필수)</label>
            <input 
              type="password" 
              id="password" 
              value={password} 
              onChange={(e) => { setPassword(e.target.value); setShowPasswordMessage(true); }}
              required 
            />
            {showPasswordMessage && (
              <p className={validatePassword() ? 'success-text' : 'error-text'}>
                {validatePassword() ? '올바른 비밀번호 형식입니다.' : '비밀번호는 8~14자이며 숫자와 특수문자를 포함해야 합니다.'}
              </p>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="nickname">닉네임 (2~14자)</label>
            <div className="input-wrapper">
              <input 
                type="text" 
                id="nickname" 
                value={nickname} 
                onChange={(e) => { setNickname(e.target.value); setShowNicknameMessage(true); setNicknameAvailable(null); setNicknameChecked(false); }}
                required 
              />
              <button 
                type="button" 
                onClick={validateNickname} 
                className="check-button"
                disabled={nickname.length < 2 || nickname.length > 14}
              >
                중복 확인
              </button>
            </div>
            {showNicknameMessage && (
              <p className={nickname.length >= 2 && nickname.length <= 14 ? 'success-text' : 'error-text'}>
                {nickname.length < 2 || nickname.length > 14 ? '닉네임은 2~14자여야 합니다.' : '올바른 형식입니다.'}
              </p>
            )}
            {nicknameChecked && (
              <p className={nicknameAvailable ? 'success-text' : 'error-text'}>
                {nicknameAvailable ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.'}
              </p>
            )}
          </div>

          <motion.button 
            className="signup-button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!useridChecked || !nicknameChecked || !useridAvailable || !nicknameAvailable || !validatePassword()}
          >
            회원가입
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default Signup;
