import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { Col, Container, Form, Row } from "react-bootstrap";

import "../App.css";

function Events() {
  return (
    <Container className="event-container">
      <Form>
        <Row className="mb-3">
          <Col md={4}>
            <Form.Group controlId="eventDate">
              <DateCalendar />
            </Form.Group>
          </Col>
          <Col md={2}>
            <h3>Filter Events</h3>
            <Form.Group controlId="eventName">
              <Form.Label>Event Name</Form.Label>
              <Form.Control type="text" placeholder="Search by event name" />
            </Form.Group>
            <Form.Group controlId="eventType">
              <Form.Label className="mt-2">Event Type</Form.Label>
              <Form.Select>
                <option>All Types</option>
                <option>Food Distribution</option>
                <option>Community Clean-Up</option>
                <option>Educational Workshop</option>
                <option>Health Clinic</option>
              </Form.Select>
            </Form.Group>
            {/* In future, this could be dynamically called from user's Location */}
            <Form.Group controlId="eventLocation">
              <Form.Label className="mt-2">Location</Form.Label>
              <Form.Select>
                <option>All Locations</option>
                <option>Atlanta</option>
                <option>Savannah</option>
                <option>Augusta</option>
                <option>Columbus</option>
              </Form.Select>
            </Form.Group>
            <Form.Group controlId="eventOrgName">
              <Form.Label className="mt-2">Organization Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Search by organization name"
              />
            </Form.Group>
            <Form.Group controlId="eventAcceptingVolunteers">
              <Form.Check
                className="mt-2"
                type="checkbox"
                label="Events Accepting Volunteers"
              />
            </Form.Group>
            <Form.Group controlId="eventVolunteerOptions">
              <Form.Check
                className="mt-2"
                type="checkbox"
                label="Volunteer-Only Opportunities Available"
              />
            </Form.Group>
          </Col>
          <Col className="ms-4" md={4}>
            <h3>Upcoming Events</h3>
            <p>No events found. Please adjust your search criteria.</p>
          </Col>
        </Row>
      </Form>
    </Container>
  );
}

export default Events;
