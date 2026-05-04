import { Button, Col, Container, Row } from "react-bootstrap";
import { BsCalendar, BsGeoAlt, BsPerson } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { Helmet } from 'react-helmet';
import "../App.css";

function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const role = JSON.parse(localStorage.getItem("role"));
  const isVolunteer = !!user && role === "volunteer";

  return (
    <>
      <Helmet><title>Home | Allies Connect</title></Helmet>
      <Container className="home-container">
        <div className="text-container mb-5">
          <h1>Georgia's Community Resource</h1>
          <p className="lead">
            Allies Connect links residents with essential resurces, events, and
            volunteer opportunities across the state of Georgia.
          </p>
        </div>
        <div className="feature-box">
          <Row className="text-center">
            <Col md={4} className="mb-4 d-flex flex-column align-items-center">
              <BsGeoAlt className="feature-icon" aria-hidden="true" />
              <h3 className="text-center flex-grow-1">Find Local Resources</h3>
              <p className="text-center flex-grow-1">
                View a map-directory of local community resources for food
                security, housing assistance, and more.
              </p>
              <Button className="btn-gold" onClick={() => navigate("/maps")}>
                Resources
              </Button>
            </Col>
            <Col md={4} className="mb-4 d-flex flex-column align-items-center">
              <BsCalendar className="feature-icon" aria-hidden="true" />
              <h3 className="text-center flex-grow-1">Browse Upcoming Events</h3>
              <p className="text-center flex-grow-1">
                View a calendar of upcoming not-for-profit community events in
                your area.
              </p>
              <Button className="btn-gold" onClick={() => navigate("/events")}>
                Events
              </Button>
            </Col>
            <Col md={4} className="mb-4 d-flex flex-column align-items-center">
              <BsPerson className="feature-icon" aria-hidden="true" />
              <h3 className="text-center flex-grow-1">Volunteer Today!</h3>
              <p className="text-center flex-grow-1">
                Sign up to help volunteer with events and local not-for-profit
                groups.
              </p>
              <Button
                className="btn-gold"
                onClick={() => navigate(isVolunteer ? "/volunteer" : "/register")}
              >
                Volunteer
              </Button>
            </Col>
          </Row>
        </div>
      </Container>
    </>
  );
}

export default Home;