import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/users/status', {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                });
                const data = await response.json();
                setIsLoggedIn(data.isLoggedIn);
                setUserId(data.userId || null);
            } catch (error) {
                console.error('로그인 상태 확인 오류:', error);
                setIsLoggedIn(false);
                setUserId(null);
            }
        };
        checkLoginStatus();
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, userId, setUserId }}>
            {children}
        </AuthContext.Provider>
    );
};