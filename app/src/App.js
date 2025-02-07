import { Route, Routes } from 'react-router-dom';
import Home from './Home';
import Login from './Login/Login';
import Signup from './SignUp/SignUp';
import Exchange from './Exchange/Exchange';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/exchange" element={<Exchange />} />
    </Routes>
  );
}

export default App;