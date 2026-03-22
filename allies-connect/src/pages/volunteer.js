import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Table, Card } from 'react-bootstrap';
import axios from 'axios';
import '../App.css';

function Volunteer({ userId }) {
  const [mySignups, setMySignups] = useState([]);

  useEffect(() => {
    axios.get(`/api/users/profile/${userId}`)
      .then(res => setMySignups(res.data.signups || []))
      .catch(err => console.error(err));
  }, [userId]);

  const handleCancel = (signupId) => {
    axios.delete(`/api/volunteer-signups/${signupId}`)
      .then(() => setMySignups(mySignups.filter(s => s.signup_id !== signupId)));
  };

  return (
    <Container className="home-container">
      <div className="text-container mb-4">
        <h1>Volunteer Dashboard</h1>
        <p>Manage your active commitments and track your hours.</p>
      </div>

      <Row>
        <Col md={12}>
          <Card className="feature-box">
            <h3>My Upcoming Shifts</h3>
            <Table responsive hover className="mt-3">
              <thead>
                <tr>
                  <th>Opportunity</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mySignups.map(signup => (
                  <tr key={signup.signup_id}>
                    <td>{signup.title}</td>
                    <td>{new Date(signup.start_datetime).toLocaleString()}</td>
                    <td><span className="badge bg-success">{signup.status}</span></td>
                    <td>
                      <Button variant="danger" size="sm" onClick={() => handleCancel(signup.signup_id)}>
                        Cancel
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Volunteer;