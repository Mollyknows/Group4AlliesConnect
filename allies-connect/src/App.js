import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import AuthRoute from "./components/AuthRoute";
import Footer from "./components/Footer";
import MyNavbar from "./components/navbar";
import AdminInviteRegister from "./pages/adminInviteRegister";
import Admin from "./pages/adminPage";
import Events from "./pages/events";
import ForgotPassword from "./pages/forgotPassword";
import Home from "./pages/home";
import InviteRegister from "./pages/inviteRegister";
import Login from "./pages/login";
import Maps from "./pages/maps";
import Provider from "./pages/provider";
import ProviderApplication from "./pages/providerApplication";
import Register from "./pages/register";
import ResetPassword from "./pages/resetPassword";
import Volunteer from "./pages/volunteer";

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
          <Route
            path="/login"
            element={<Login setUser={setUser} setRole={setRole} />}
          />
          <Route path="/events" element={<Events />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/invite/:token" element={<InviteRegister />} />
          <Route
            path="/admin-invite/:token"
            element={<AdminInviteRegister />}
          />
          <Route
            path="/provider"
            element={
              <AuthRoute user={user} role={role} requiredRole="provider">
                <Provider
                  user={user}
                  setUser={setUser}
                  role={role}
                  setRole={setRole}
                />
              </AuthRoute>
            }
          />
          <Route
            path="/volunteer"
            element={
              <AuthRoute user={user} role={role} requiredRole="volunteer">
                <Volunteer
                  user={user}
                  setUser={setUser}
                  role={role}
                  setRole={setRole}
                />
              </AuthRoute>
            }
          />
          <Route
            path="/provider-application"
            element={<ProviderApplication />}
          />
          <Route
            path="/admin"
            element={
              <AuthRoute user={user} role={role} requiredRole="admin">
                <Admin />
              </AuthRoute>
            }
          />
        </Routes>
        <Footer user={user} setUser={setUser} role={role} setRole={setRole} />
      </BrowserRouter>
    </LocalizationProvider>
  );
}

export default App;
