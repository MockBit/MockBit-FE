import { Route, Routes } from 'react-router-dom';
import Navbar from './Navbar/Navbar';
import Home from './Home';
import Login from './Login/Login';
import Signup from './SignUp/SignUp';
import Exchange from './Exchange/Exchange';
import { AuthProvider } from './Login/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/exchange" element={<Exchange />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
