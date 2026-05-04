import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Collapse,
  Container,
  Form,
  Row,
} from "react-bootstrap";
import { Helmet } from "react-helmet";
import { useSearchParams } from "react-router-dom";

import "../App.css";
import EventDetailsModal from "../components/EventDetailsModal";
import { API_URL } from "../config";

function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventNameFilter, setEventNameFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [eventLocationFilter, setEventLocationFilter] = useState("");
  const [eventOrgNameFilter, setEventOrgNameFilter] = useState(
    searchParams.get("org") || "",
  );
  const [showInactiveEvents, setShowInactiveEvents] = useState(false);
  const [volunteerOnlyFilter, setVolunteerOnlyFilter] = useState(false);
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(!!searchParams.get("org"));
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const clearFilters = () => {
    setSelectedDate(null);
    setEventNameFilter("");
    setEventTypeFilter("");
    setEventLocationFilter("");
    setEventOrgNameFilter("");
    setShowInactiveEvents(false);
    setVolunteerOnlyFilter(false);
    setSearchParams({});
  };

  useEffect(() => {
    const userRole = JSON.parse(localStorage.getItem("role") || "null");
    const canSeeVolunteerOnly =
      userRole === "volunteer" ||
      userRole === "provider" ||
      userRole === "admin";

    Promise.all([
      fetch(`${API_URL}/api/categories`).then((r) => r.json()),
      fetch(`${API_URL}/api/events`).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch events");
        return r.json();
      }),
    ])
      .then(([categoryData, eventsData]) => {
        setCategories(
          Array.isArray(categoryData)
            ? categoryData
                .filter((c) => c.type === "event" || c.type === "both")
                .map((c) => c.name)
                .sort()
            : [],
        );
        const mappedEvents = eventsData
          .filter((event) => !event.volunteer_only || canSeeVolunteerOnly)
          .map((event) => ({
            id: event.event_id,
            title: event.title,
            date: event.event_date,
            startDatetime: event.start_datetime,
            endDatetime: event.end_datetime,
            type: event.category_name,
            location: `${event.city}, ${event.state}`,
            address: `${event.street_address_1}${event.street_address_2 ? ", " + event.street_address_2 : ""}, ${event.city}, ${event.state} ${event.zip}`,
            organization: event.provider_name,
            description: event.description,
            image_url: event.image_url,
            flyer_url: event.flyer_url,
            volunteer_only: !!event.volunteer_only,
            status: "Active",
          }));
        setEvents(mappedEvents);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching events:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Auto-open event details modal when navigated with eventId param
  useEffect(() => {
    const eventId = searchParams.get("eventId");
    if (eventId && events.length > 0) {
      const match = events.find((e) => String(e.id) === eventId);
      if (match) {
        setSelectedEvent(match);
        setShowEventModal(true);
      }
    }
  }, [events, searchParams]);

  const filteredEvents = events.filter((event) => {
    let matchesDate = true;
    if (selectedDate) {
      const selectedDay = dayjs(selectedDate).startOf("day");
      const startDay = dayjs(event.startDatetime).startOf("day");
      const endDay = dayjs(event.endDatetime).startOf("day");
      matchesDate = selectedDay.isBetween(startDay, endDay, "day", "[]");
    }
    const matchesName = event.title
      .toLowerCase()
      .includes(eventNameFilter.toLowerCase());
    const matchesType =
      eventTypeFilter === "" ||
      eventTypeFilter === "All Types" ||
      event.type === eventTypeFilter;
    const matchesLocation =
      eventLocationFilter === "" ||
      eventLocationFilter === "All Locations" ||
      event.location.includes(eventLocationFilter);
    const matchesOrgName = event.organization
      .toLowerCase()
      .includes(eventOrgNameFilter.toLowerCase());
    const isActive = dayjs(event.endDatetime).isAfter(dayjs());
    const matchesEventStatus = showInactiveEvents || isActive;
    const matchesVolunteerOnly = !volunteerOnlyFilter || event.volunteer_only;
    return (
      matchesDate &&
      matchesName &&
      matchesType &&
      matchesLocation &&
      matchesOrgName &&
      matchesEventStatus &&
      matchesVolunteerOnly
    );
  });

  const uniqueLocations = [
    ...new Set(events.map((event) => event.location)),
  ].sort();

  return (
    <>
      <Helmet>
        <title>Events | Allies Connect</title>
      </Helmet>
      <Container className="event-container">
        <Form>
          <Row className="mb-3">
            <Col md={4}>
              <h3>Filter Events</h3>
              <Button
                variant="outline-secondary"
                size="sm"
                className="w-100 mb-3"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
              <Collapse in={showFilters}>
                <div>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="w-100 mb-3"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                  <Form.Group controlId="eventDate">
                    <DateCalendar
                      value={selectedDate}
                      onChange={(date) => setSelectedDate(date)}
                    />
                  </Form.Group>
                  <Form.Group controlId="eventName">
                    <Form.Label>Event Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search by event name"
                      value={eventNameFilter}
                      onChange={(e) => setEventNameFilter(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group controlId="eventType">
                    <Form.Label className="mt-2">Event Type</Form.Label>
                    <Form.Select
                      value={eventTypeFilter}
                      onChange={(e) => setEventTypeFilter(e.target.value)}
                    >
                      <option value="">All Types</option>
                      {categories.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  {/* In future, this could be dynamically called from user's Location */}
                  <Form.Group controlId="eventLocation">
                    <Form.Label className="mt-2">Location</Form.Label>
                    <Form.Select
                      value={eventLocationFilter}
                      onChange={(e) => setEventLocationFilter(e.target.value)}
                    >
                      <option>All Locations</option>
                      {uniqueLocations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group controlId="eventOrgName">
                    <Form.Label className="mt-2">Organization Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search by organization name"
                      value={eventOrgNameFilter}
                      onChange={(e) => setEventOrgNameFilter(e.target.value)}
                    />
                  </Form.Group>
                  {JSON.parse(localStorage.getItem("role") || "null") &&
                    ["volunteer", "provider", "admin"].includes(
                      JSON.parse(localStorage.getItem("role") || "null"),
                    ) && (
                      <Form.Group controlId="volunteerOnlyFilter">
                        <Form.Check
                          className="mt-2"
                          type="checkbox"
                          label="Volunteer Only Events"
                          checked={volunteerOnlyFilter}
                          onChange={(e) =>
                            setVolunteerOnlyFilter(e.target.checked)
                          }
                        />
                      </Form.Group>
                    )}
                  <Form.Group controlId="showInactiveEvents">
                    <Form.Check
                      className="mt-2"
                      type="checkbox"
                      label="Show Inactive Events"
                      checked={showInactiveEvents}
                      onChange={(e) => setShowInactiveEvents(e.target.checked)}
                    />
                  </Form.Group>
                </div>
              </Collapse>
            </Col>
            <Col className="ms-4" md={6}>
              <h3>Upcoming Events</h3>
              {loading && <p>Loading events...</p>}
              {error && <p>Error: {error}</p>}
              <div className="event-list-scroll">
                {filteredEvents.length === 0 ? (
                  <p>No events found. Please adjust your search criteria.</p>
                ) : (
                  filteredEvents.map((event) => (
                    <Card
                      key={event.id}
                      className="mb-3"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEventModal(true);
                      }}
                    >
                      <Card.Body>
                        <Card.Title>{event.title}</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">
                          {event.type} • {event.location}
                        </Card.Subtitle>
                        <Card.Text>
                          Organization: {event.organization}
                          <br />
                          Start Date:{" "}
                          {dayjs(event.startDatetime).format(
                            "hh:mmA MM-DD-YYYY",
                          )}
                          <br />
                          End Date:{" "}
                          {dayjs(event.endDatetime).format("hh:mmA MM-DD-YYYY")}
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  ))
                )}
              </div>
            </Col>
          </Row>
        </Form>
        <EventDetailsModal
          show={showEventModal}
          onHide={() => setShowEventModal(false)}
          event={selectedEvent}
        />
      </Container>
    </>
  );
}

export default Events;
