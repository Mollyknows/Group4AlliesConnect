import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Table, Tabs, Tab, Card } from 'react-bootstrap';
import axios from 'axios';
import '../App.css';

function Admin() {
  const [pendingProviders, setPendingProviders] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    fetchPendingProviders();
    fetchLogs();
  }, []);

  const fetchPendingProviders = async () => {
    try {
      const res = await axios.get('/api/admin/pending-providers');
      setPendingProviders(res.data);
    } catch (err) {
      console.error("Error fetching providers:", err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/admin/logs');
      setAuditLogs(res.data);
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  };

  const handleApprove = async (providerId) => {
    try {
      await axios.patch(`/api/admin/providers/${providerId}/approve`);
      fetchPendingProviders(); // Refresh list
      fetchLogs(); // Refresh logs to show the approval action
    } catch (err) {
      alert("Failed to approve provider.");
    }
  };

  return (
    <Container className="home-container">
      <div className="text-container mb-5">
        <h1>Admin Dashboard</h1>
        <p>System moderation and integrity management console.</p>
      </div>

      <Tabs defaultActiveKey="providers" className="mb-4 custom-tabs">
        {/* Tab 1: Provider Approvals */}
        <Tab eventKey="providers" title="Pending Approvals">
          <Card className="feature-box border-0 shadow-sm mt-3">
            <h3>Organization Requests</h3>
            <Table responsive hover className="mt-3">
              <thead>
                <tr>
                  <th>Organization Name</th>
                  <th>Contact</th>
                  <th>Verification</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingProviders.map(provider => (
                  <tr key={provider.provider_id}>
                    <td>{provider.name}</td>
                    <td>{provider.contact_email}</td>
                    <td>{provider.verification_method || 'Manual'}</td>
                    <td>
                      <Button 
                        className="btn-gold btn-sm w-auto px-3" 
                        onClick={() => handleApprove(provider.provider_id)}
                      >
                        Approve
                      </Button>
                    </td>
                  </tr>
                ))}
                {pendingProviders.length === 0 && (
                  <tr><td colSpan="4" className="text-center">No pending requests.</td></tr>
                )}
              </tbody>
            </Table>
          </Card>
        </Tab>

        {/* Tab 2: System Audit Logs */}
        <Tab eventKey="logs" title="System Logs">
          <Card className="feature-box border-0 shadow-sm mt-3">
            <h3>Recent Activity</h3>
            <Table responsive striped hover className="mt-3">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>User ID</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.log_id}>
                    <td>{new Date(log.occured_at).toLocaleString()}</td>
                    <td><strong>{log.action}</strong></td>
                    <td>{log.entity_type} (#{log.entity_id})</td>
                    <td>{log.actor_user_id}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
}

export default Admin;