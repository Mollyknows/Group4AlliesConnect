import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import MyNavbar from "./components/navbar";
import Events from "./pages/events";
import Home from "./pages/home";
import Login from "./pages/login";
import Maps from "./pages/maps";
import Register from "./pages/register";
import Provider from "./pages/provider";
import Volunteer from "./pages/volunteer";
import Admin from "./pages/admin";

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const [role, setRole] = useState(() => {
    const storedRole = localStorage.getItem("role");
    return storedRole ? JSON.parse(storedRole) : "";
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <BrowserRouter>
        <MyNavbar user={user} setUser={setUser} role={role} setRole={setRole} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/maps" element={<Maps />} />
          <Route path="/login" element={<Login setUser={setUser} setRole={setRole} />} />
          <Route path="/events" element={<Events />} />
          <Route path="/register" element={<Register />} />
          <Route path="/provider" element={<Provider />} />
          <Route path="/volunteer" element={<Volunteer />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </LocalizationProvider>
  );
}

export default App;