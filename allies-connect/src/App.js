import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import MyNavbar from './components/navbar';
import Home from './pages/home';

function App() {
  return (
    <BrowserRouter>
      <MyNavbar />
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
