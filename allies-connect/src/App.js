import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import MyNavbar from './components/navbar';
import Home from './pages/home';
import Maps from './pages/maps';
import Login from './pages/login';
import Register from './pages/register';

function App() {
  return (
    <BrowserRouter>
      <MyNavbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/maps" element={<Maps />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
