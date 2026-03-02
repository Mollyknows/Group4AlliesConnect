import { Container, Tabs, Tab, Form, Button, Row, Col } from "react-bootstrap";
import '../App.css';

function Register() {
    return (
        <Container className="register-container">
            <div className="text-container mb-5">
                <h1>Create Your Account!</h1>
            </div>
            <div className="feature-box">
                <div className="text-container mb-5">
                    <h2>Register</h2>
                    <p>Select a tab to begin creating your desired account type.</p>
                </div>
                <Tabs defaultActiveKey="volunteer" className="mb-3">
                    <Tab eventKey="volunteer" title="Volunteer">
                        <Form>
                            <Row className="text-start mb-3">
                                <Col md={3} className="d-flex align-items-center">
                                    <h5>Username:</h5>
                                </Col>
                                <Col className="d-flex align-items-center">
                                    <Form.Control type="text" placeholder="Enter username" />
                                </Col>
                            </Row>
                            <Row className="text-start mb-3">
                                <Col md={3} className="d-flex align-items-center">
                                    <h5>Password:</h5>
                                </Col>
                                <Col className="d-flex align-items-center">
                                    <Form.Control type="password" placeholder="Enter password" />
                                </Col>
                            </Row>
                            <Row className="text-start mb-3">
                                <Col md={3} className="d-flex align-items-center">
                                    <h5>Confirm Password:</h5>
                                </Col>
                                <Col className="d-flex align-items-center">
                                    <Form.Control type="password" placeholder="Enter password" />
                                </Col>
                            </Row>
                            <Row className="text-start mb-3">
                                <Col md={3} className="d-flex align-items-center">
                                    <h5>Email:</h5>
                                </Col>
                                <Col className="d-flex align-items-center">
                                    <Form.Control type="email" placeholder="Enter email" />
                                </Col>
                            </Row>
                            <Row className="text-start mb-3">
                                <Col md={3} className="d-flex align-items-center">
                                    <h5>Confirm Email:</h5>
                                </Col>
                                <Col className="d-flex align-items-center">
                                    <Form.Control type="email" placeholder="Enter email" />
                                </Col>
                            </Row>
                            <Row className="text-start mb-3">
                                <Col md={3} className="d-flex align-items-center">
                                    <h5>Name:</h5>
                                </Col>
                                <Col className="d-flex align-items-center">
                                    <Form.Control type="text" placeholder="Enter name" />
                                </Col>
                            </Row>
                            <Row className="text-start mb-3">
                                <Col md={3} className="d-flex align-items-center">
                                    <h5>Phone Number:</h5>
                                </Col>
                                <Col className="d-flex align-items-center">
                                    <Form.Control type="tel" placeholder="Enter phone number" />
                                </Col>
                            </Row>
                        </Form>
                        <Row className="justify-content-end">
                            <Col md={4}>
                                <Button className="btn-gold">Register</Button>
                            </Col>
                        </Row>
                    </Tab>
                    <Tab eventKey="organization" title="Organization">
                        <Form>
                            <Row className="text-start mb-3">
                                <Col md={3} className="d-flex align-items-center">
                                    <h5>Username:</h5>
                                </Col>
                                <Col className="d-flex align-items-center">
                                    <Form.Control type="text" placeholder="Enter username" />
                                </Col>
                            </Row>
                            <Row className="text-start mb-3">
                                <Col md={3} className="d-flex align-items-center">
                                    <h5>Password:</h5>
                                </Col>
                                <Col className="d-flex align-items-center">
                                    <Form.Control type="password" placeholder="Enter password" />
                                </Col>
                            </Row>
                            <Row className="text-start mb-3">
                                <Col md={3} className="d-flex align-items-center">
                                    <h5>Confirm Password:</h5>
                                </Col>
                                <Col className="d-flex align-items-center">
                                    <Form.Control type="password" placeholder="Enter password" />
                                </Col>
                            </Row>
                            <Row className="text-start mb-3">
                                <Col md={3} className="d-flex align-items-center">
                                    <h5>Email:</h5>
                                </Col>
                                <Col className="d-flex align-items-center">
                                    <Form.Control type="email" placeholder="Enter email" />
                                </Col>
                            </Row>
                            <Row className="text-start mb-3">
                                <Col md={3} className="d-flex align-items-center">
                                    <h5>Confirm Email:</h5>
                                </Col>
                                <Col className="d-flex align-items-center">
                                    <Form.Control type="email" placeholder="Enter email" />
                                </Col>
                            </Row>
                            <Row className="text-start mb-3">
                                <Col md={3} className="d-flex align-items-center">
                                    <h5>Organization Name:</h5>
                                </Col>
                                <Col className="d-flex align-items-center">
                                    <Form.Control type="text" placeholder="Enter organization name" />
                                </Col>
                            </Row>
                            <Row className="text-start mb-3">
                                <Col md={3} className="d-flex align-items-center">
                                    <h5>Phone Number:</h5>
                                </Col>
                                <Col className="d-flex align-items-center">
                                    <Form.Control type="tel" placeholder="Enter phone number" />
                                </Col>
                            </Row>
                            <Row className="text-start mb-3">
                                <Col md={3} className="d-flex align-items-center">
                                    <h5>EIN Number:</h5>
                                </Col>
                                <Col className="d-flex align-items-center">
                                    <Form.Control type="tel" placeholder="Enter EIN number" />
                                </Col>
                            </Row>
                        </Form>
                        <Row className="justify-content-end">
                            <Col md={4}>
                                <Button className="btn-gold">Register</Button>
                            </Col>
                        </Row>
                    </Tab>
                </Tabs>
            </div>
        </Container>
    );
}

export default Register;