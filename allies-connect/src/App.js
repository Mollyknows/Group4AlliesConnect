import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import MyNavbar from "./components/navbar";
import Events from "./pages/events";
import Home from "./pages/home";
import Login from "./pages/login";
import Maps from "./pages/maps";

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <BrowserRouter>
        <MyNavbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/maps" element={<Maps />} />
          <Route path="/login" element={<Login />} />
          <Route path="/events" element={<Events />} />
        </Routes>
      </BrowserRouter>
    </LocalizationProvider>
  );
}

export default App;
