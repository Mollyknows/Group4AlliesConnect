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
                    <Col md={4} className="mb-4 d-flex flex-column align-items-center">
                        <BsGeoAlt className="feature-icon" />
                        <h3 className="text-center flex-grow-1">Find Local Resources</h3>
                        <p className="text-center flex-grow-1">View a map-directory of local community resources for food security, housing assistance, and more.</p>
                        <Button className="btn-gold">Resources</Button>
                    </Col>
                    <Col md={4} className="mb-4 d-flex flex-column align-items-center">
                        <BsCalendar className="feature-icon" />
                        <h3 className="text-center flex-grow-1">Browse Upcoming Events</h3>
                        <p className="text-center flex-grow-1">View a calendar of upcoming not-for-profit community events in your area.</p>
                        <Button className="btn-gold">Events</Button>
                    </Col>
                    <Col md={4} className="mb-4 d-flex flex-column align-items-center">
                        <BsPerson className="feature-icon" />
                        <h3 className="text-center flex-grow-1">Volunteer Today!</h3>
                        <p className="text-center flex-grow-1">Sign up to help volunteer with events and local not-for-profit groups.</p>
                        <Button className="btn-gold">Volunteer</Button>
                    </Col>
                </Row>
            </div>
        </Container>
    );
}

export default Home;