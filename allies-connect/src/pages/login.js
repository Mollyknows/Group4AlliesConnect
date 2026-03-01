import { Container, Row, Col, Button } from "react-bootstrap";
import '../App.css';
import { Form } from 'react-bootstrap';

function Login() {
    return (
        <Container className="login-container">
            <div className="text-container mb-5">
                <h1>Welcome Back!</h1>
            </div>
            <div className="feature-box">
                <Row className="text-start mb-3">
                    <Col md={3} className="d-flex flex-column">
                        <h3>Username:</h3>
                    </Col>
                    <Col className="d-flex flex-column">
                        <Form.Control type="text" placeholder="Enter username" />
                    </Col>
                </Row>
                <Row className="text-start">
                    <Col md={3} className="d-flex flex-column">
                        <h3>Password:</h3>
                    </Col>
                    <Col className="d-flex flex-column">
                        <Form.Control type="password" placeholder="Enter password" />
                    </Col>
                </Row>
                <Row className="mt-4 justify-content-between">
                    <Col md={4}>
                        <Button variant="link">Forgot password?</Button>
                    </Col>
                    <Col md={3}>
                        <Button className="btn-gold">Login</Button>
                    </Col>
                </Row>
            </div>
        </Container>
    );
}

export default Login;