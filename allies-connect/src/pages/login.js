import { Container, Row, Col, Button, Form } from "react-bootstrap";
import '../App.css';

function Login() {
    return (
        <Container className="login-container">
            <div className="text-container mb-5">
                <h1>Welcome Back!</h1>
            </div>
            <div className="feature-box">
                <div className="text-container mb-5">
                    <h2>Login</h2>
                </div>
                <Form className="mb-5">
                    <Row className="text-start mb-3">
                        <Col md={3} className="d-flex align-items-center">
                            <h5>Username:</h5>
                        </Col>
                        <Col className="d-flex flex-column">
                            <Form.Control type="text" placeholder="Enter username" />
                        </Col>
                    </Row>
                    <Row className="text-start">
                        <Col md={3} className="d-flex align-items-center">
                            <h5>Password:</h5>
                        </Col>
                        <Col className="d-flex flex-column">
                            <Form.Control type="password" placeholder="Enter password" />
                        </Col>
                    </Row>
                </Form>
                <Row className="justify-content-between">
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