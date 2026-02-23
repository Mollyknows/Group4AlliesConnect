import { Container, Row, Col, Button } from "react-bootstrap";
import { BsGeoAlt, BsCalendar, BsPerson } from "react-icons/bs";
import '../App.css';

function Home() {
    return (
        <Container className="home-container">
            <div className="text-container mb-5">
                <h1>Georgia's Community Resource</h1>
                <p className="lead">Allies Connect links residents with essential resurces, events, and volunteer opportunities across the state of Gerogia.</p>
            </div>
            <div className="feature-box">
                <Row className="text-center">
                    <Col md={4} className="mb-4">
                        <BsGeoAlt className="feature-icon" />
                    </Col>
                    <Col md={4} className="mb-4">
                        <BsCalendar className="feature-icon" />
                    </Col>
                    <Col md={4} className="mb-4">
                        <BsPerson className="feature-icon" />
                    </Col>
                </Row>
                <Row className="text-center align-items-center">
                    <Col md={4} className="mb-4">
                        <h3>Find Local Resources</h3>
                    </Col>
                    <Col md={4} className="mb-4">
                        <h3>Browse Upcoming Events</h3>
                    </Col>
                    <Col md={4} className="mb-4">
                        <h3>Volunteer Today!</h3>
                    </Col>
                </Row>
                <Row className="text-center">
                    <Col md={4} className="mb-4">
                        <p>View a map-directory of local community resources for food security, housing assistance, and more.</p>
                    </Col>
                    <Col md={4} className="mb-4">
                        <p>View a calendar of upcoming not-for-profit community events in your area.</p>
                    </Col>
                    <Col md={4} className="mb-4">
                        <p>Sign up to help volunteer with events and local not-for-profit groups.</p>
                    </Col>
                </Row>
                <Row className="text-center">
                    <Col md={4} className="mb-4">
                        <Button className="btn-gold">Resources</Button>
                    </Col>
                    <Col md={4} className="mb-4">
                        <Button className="btn-gold">Events</Button>
                    </Col>
                    <Col md={4} className="mb-4">
                        <Button className="btn-gold">Volunteer</Button>
                    </Col>
                </Row>
            </div>
        </Container>
    );
}

export default Home;