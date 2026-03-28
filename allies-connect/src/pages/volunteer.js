import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Modal, Table, Form } from 'react-bootstrap';
import axios from 'axios';
import '../App.css';

function Volunteer({ user }) {
    const [showAvailability, setShowAvailability] = useState(false);
    const [signups, setSignups] = useState([]);

    useEffect(() => {
        // Retrieve user profile and signups
        if (user) {
            axios.get(`/api/users/profile/${user.user_id}`)
                .then(res => setSignups(res.data.signups || []))
                .catch(err => console.error(err));
        }
    }, [user]);

    return (
        <Container className="home-container">
            <h1 className="mb-4">{user?.first_name} {user?.last_name}</h1>

            {/* Manage Volunteer Status Section */}
            <section className="mb-5">
                <h3 className="border-bottom pb-2">Manage Volunteer Status</h3>
                <Row className="mt-3 g-3">
                    <Col md={4}><Button className="btn-gold">Manage Subscribed Organizations</Button></Col>
                    <Col md={4}><Button variant="outline-warning" className="w-100 py-3" onClick={() => setShowAvailability(true)}>Edit Availability</Button></Col>
                    <Col md={4}><Button variant="outline-warning" className="w-100 py-3">Edit Contact Information</Button></Col>
                </Row>
            </section>

            {/* Signup Management Section */}
            <section className="mb-5">
                <h3 className="border-bottom pb-2">Signup Management</h3>
                <Row className="mt-3 g-3">
                    <Col md="auto"><Button className="btn-gold px-4">Review Event Signups</Button></Col>
                    <Col md="auto"><Button className="btn-gold px-4">View Shifts</Button></Col>
                </Row>
            </section>

            {/* Export Section */}
            <section>
                <h3 className="border-bottom pb-2">Export Volunteer Data</h3>
                <div className="mt-3" style={{maxWidth: '300px'}}>
                    <Button className="btn-gold">Export Volunteer Hours</Button>
                </div>
            </section>

            {/* Availability Modal Based on Design */}
            <Modal show={showAvailability} onHide={() => setShowAvailability(false)} centered size="lg">
                <Modal.Header closeButton><Modal.Title>Manage Availability</Modal.Title></Modal.Header>
                <Modal.Body>
                    <p className="text-muted">Update your availability to fill shifts.</p>
                    <div className="d-flex gap-2 mb-4">
                        <Form.Select><option>Select Weekday</option></Form.Select>
                        <Form.Control type="time" />
                        <Form.Control type="time" />
                        <Button variant="success" className="rounded-circle">+</Button>
                    </div>
                    <Table borderless hover>
                        <thead><tr><th>Weekday</th><th>Hours</th><th>Action</th></tr></thead>
                        <tbody>
                            <tr><td>Monday</td><td>5:00 am to 7:00 pm</td>
                                <td><Button variant="danger" size="sm">Delete Availability</Button></td>
                            </tr>
                        </tbody>
                    </Table>
                </Modal.Body>
            </Modal>
        </Container>
    );
}
export default Volunteer;