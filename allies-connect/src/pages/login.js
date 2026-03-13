import { Container, Row, Col, Button, Form } from "react-bootstrap";
import "../App.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login({ setUser , setRole }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [userRole, setUserRole] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:5000/api/auth/login", {
                email,
                password
            });
            console.log("Login successful:", response.data);

            if (!response.data.roles.includes(userRole)) {
                throw new Error("User role does not match selected role");
            }

            const profileResponse = await axios.get(`http://localhost:5000/api/users/profile/${response.data.user_id}`);

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
            setError("Invalid username, password, or role. Please try again.");
        }
    };

    return (
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
                            <Form.Control name="username" value={email} type="text" placeholder="Enter username" onChange={(e) => setEmail(e.target.value)} />
                        </Col>
                    </Row>
                    <Row className="text-start mb-3 ">
                        <Col md={3} className="d-flex align-items-center">
                            <h5>Password:</h5>
                        </Col>
                        <Col className="d-flex flex-column">
                            <Form.Control name="password" value={password} type="password" placeholder="Enter password"  onChange={(e) => setPassword(e.target.value)} />
                        </Col>
                    </Row>
                    <Row className="text-start">
                        <Col md={3} className="d-flex align-items-center">
                            <h5>Role:</h5>
                        </Col>
                        <Col className="d-flex flex-column">
                            <Form.Select defaultValue="" onChange={(e) => setUserRole(e.target.value)}>
                                <option value="" disabled>Select role</option>
                                <option value="volunteer">Volunteer</option>
                                <option value="provider">Provider</option>
                                <option value="admin">Admin</option>
                            </Form.Select>
                        </Col>
                    </Row>
                </Form>
                <Row className="justify-content-between">
                    <Col md={4}>
                        <Button variant="link">Forgot password?</Button>
                    </Col>
                    <Col md={3}>
                        <Button className="btn-gold" onClick={handleLogin}>Login</Button>
                    </Col>
                </Row>
            </div>
        </Container>
    );
}

export default Login;