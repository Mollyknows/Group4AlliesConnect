import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Table, Card } from 'react-bootstrap';
import axios from 'axios';
import '../App.css';

function Provider({ providerId }) {
  const [opportunities, setOpportunities] = useState([]);

  useEffect(() => {
    axios.get(`/api/volunteer-opportunities?provider_id=${providerId}`)
      .then(res => setOpportunities(res.data));
  }, [providerId]);

  const exportRoster = (shiftId) => {
    window.open(`/api/organizations/signups/export/${shiftId}`, '_blank');
  };

  return (
    <Container className="home-container">
      <div className="text-container mb-4">
        <h1>Provider Management</h1>
        <p>Create opportunities and manage your volunteer rosters.</p>
        <Button className="btn-gold w-auto px-4">Create New Opportunity</Button>
      </div>

      <Row className="g-4">
        {opportunities.map(opp => (
          <Col md={6} key={opp.opportunity_id}>
            <Card className="h-100 shadow-sm border-0" style={{borderLeft: '5px solid var(--gold)'}}>
              <Card.Body>
                <Card.Title>{opp.title}</Card.Title>
                <Card.Text>Status: <strong>{opp.status}</strong></Card.Text>
                <div className="d-flex gap-2">
                  <Button variant="outline-dark" size="sm">Edit</Button>
                  <Button variant="info" size="sm" onClick={() => exportRoster(opp.shift_id)}>
                    Download Roster (CSV)
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default Provider;