import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import '../App.css';

function Provider({ user }) {
    const handleExport = () => {
        // Utilizes the organization
        window.open(`/api/organizations/signups/export/all`, '_blank');
    };

    return (
        <Container className="home-container">
            <h1 className="mb-4">Organization Portal</h1>

            {/* Events Section */}
            <section className="mb-5">
                <h3 className="border-bottom pb-2">Events</h3>
                <Row className="mt-3 g-2">
                    <Col md="auto"><Button className="btn-gold px-5">Create Event</Button></Col>
                    <Col md="auto"><Button variant="outline-warning" className="px-5 py-3">Edit Events</Button></Col>
                </Row>
            </section>

            {/* Resources Section */}
            <section className="mb-5">
                <h3 className="border-bottom pb-2">Resources</h3>
                <Row className="mt-3 g-2">
                    <Col md="auto"><Button className="btn-gold px-4">Create Resources</Button></Col>
                    <Col md="auto"><Button variant="outline-warning" className="px-4 py-3">Edit Resources</Button></Col>
                    <Col md="auto"><Button variant="outline-warning" className="px-4 py-3">Volunteer Shift Management</Button></Col>
                </Row>
            </section>

            {/* Reporting Section */}
            <section>
                <h3 className="border-bottom pb-2">Reporting</h3>
                <div className="mt-3" style={{maxWidth: '300px'}}>
                    <Button className="btn-gold" onClick={handleExport}>
                        Export Volunteer Signup Data
                    </Button>
                </div>
            </section>
        </Container>
    );
}
export default Provider;