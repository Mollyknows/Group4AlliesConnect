import axios from "axios";
import { useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { Helmet } from "react-helmet";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";
import { API_URL } from "../config";

function Login({ setUser, setRole }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password,
      });
      console.log("Login successful:", response.data);

      if (!response.data.roles.includes(userRole)) {
        throw new Error("User role does not match selected role");
      }

      const profileResponse = await axios.get(
        `${API_URL}/api/users/profile/${response.data.user_id}`,
      );

      setUser(profileResponse.data);
      setRole(userRole);
      localStorage.setItem("user", JSON.stringify(profileResponse.data));
      localStorage.setItem("role", JSON.stringify(userRole));

      console.log("Login successful:", profileResponse.data);
      if (userRole === "volunteer") {
        navigate("/volunteer");
      } else if (userRole === "provider") {
        navigate("/provider");
      } else if (userRole === "admin") {
        navigate("/admin");
      } else {
        console.warn("Unknown user role:", profileResponse.data.roles);
        navigate("/");
      }
    } catch (error) {
      console.error("Login failed:", error);
      if (
        error.response?.status === 403 &&
        error.response?.data?.error === "PROVIDER_PENDING"
      ) {
        setError(error.response.data.message);
      } else {
        setError("Invalid username, password, or role. Please try again.");
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Login | Allies Connect</title>
      </Helmet>
      <Container className="login-container">
        <div className="text-container mb-5">
          <h1>Welcome Back!</h1>
        </div>
        <div className="feature-box">
          <div className="text-container mb-5">
            <h2>Login</h2>
            {error && <p className="text-danger">{error}</p>}
          </div>
          <Form className="mb-5">
            <Row className="text-start mb-3">
              <Col md={3} className="d-flex align-items-center">
                <h5>Username:</h5>
              </Col>
              <Col className="d-flex flex-column">
                <Form.Control
                  name="username"
                  value={username}
                  type="text"
                  placeholder="Enter username"
                  autocComplete="username"
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Col>
            </Row>
            <Row className="text-start mb-3 ">
              <Col md={3} className="d-flex align-items-center">
                <h5>Password:</h5>
              </Col>
              <Col className="d-flex flex-column">
                <Form.Control
                  name="password"
                  value={password}
                  type="password"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Col>
            </Row>
            <Row className="text-start">
              <Col md={3} className="d-flex align-items-center">
                <h5>Role:</h5>
              </Col>
              <Col className="d-flex flex-column">
                <Form.Select
                  defaultValue=""
                  onChange={(e) => setUserRole(e.target.value)}
                >
                  <option value="" disabled>
                    Select role
                  </option>
                  <option value="volunteer">Volunteer</option>
                  <option value="provider">Provider</option>
                  <option value="admin">Admin</option>
                </Form.Select>
              </Col>
            </Row>
          </Form>
          <Row className="justify-content-between">
            <Col md={4}>
              <Link to="/forgot-password">Forgot password?</Link>
            </Col>
            <Col md={3}>
              <Button className="btn-gold" onClick={handleLogin}>
                Login
              </Button>
            </Col>
          </Row>
        </div>
      </Container>
    </>
  );
}

export default Login;
