import React from "react";
import { Card, Col, Row, Table, Badge } from "react-bootstrap";
import AnalyticsChart from "../../components/AnalyticsChart";
import "../../styles/FarmerDashboard.css";

const Admin = () => {
  const overview = [
    { label: "Total users", value: "2,486", trend: "+8%" },
    { label: "Total rentals", value: "4,120", trend: "+12%" },
    { label: "Active equipment", value: "1,324", trend: "+4%" },
    { label: "Revenue (MTD)", value: "₹ 8.4L", trend: "+10%" },
  ];

  const users = [
    { name: "Kumar", role: "Owner", status: "Verified" },
    { name: "Priya", role: "Farmer", status: "Active" },
    { name: "Arun", role: "Delivery", status: "Onboarded" },
    { name: "Sara", role: "Owner", status: "Pending" },
  ];

  const equipmentVerifications = [
    { id: "EQ-201", item: "Harvester X2", owner: "Kumar", status: "Pending" },
    { id: "EQ-204", item: "Tractor 40HP", owner: "Shyam", status: "Approved" },
  ];

  const disputes = [
    { id: "DIS-12", issue: "Damage claim", status: "Open" },
    { id: "DIS-18", issue: "Late return fee", status: "In Review" },
  ];

  const heatmap = new Array(35).fill(0).map((_, index) => (index * 13) % 100);

  return (
    <div className="agr-page admin-dashboard motion-page">
      <div className="admin-title">Admin Command Center</div>
      <div className="admin-subtitle">Monitor platform performance, resolve disputes, and validate equipment listings.</div>

      <Row className="g-3 mt-2">
        {overview.map((card) => (
          <Col md={6} lg={3} key={card.label}>
            <Card className="admin-card shadow-sm h-100">
              <Card.Body>
                <div className="text-muted small">{card.label}</div>
                <div className="fs-4 fw-bold mt-2">{card.value}</div>
                <div className="text-success small">{card.trend} this month</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-3 mt-1">
        <Col lg={7}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="h6">User Management</Card.Title>
              <Table responsive className="admin-table mt-3">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.name}>
                      <td>{user.name}</td>
                      <td>{user.role}</td>
                      <td>
                        <Badge bg={user.status === "Pending" ? "warning" : "success"}>{user.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="h6">Equipment Verification</Card.Title>
              <div className="admin-list mt-3">
                {equipmentVerifications.map((item) => (
                  <div key={item.id} className="admin-list-item">
                    <div>
                      <div className="fw-semibold">{item.item}</div>
                      <div className="text-muted small">{item.owner}</div>
                    </div>
                    <Badge bg={item.status === "Pending" ? "warning" : "success"}>{item.status}</Badge>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mt-1">
        <Col lg={7}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="h6">Rental Monitoring</Card.Title>
              <div className="admin-list mt-3">
                <div className="admin-list-item">
                  <div>
                    <div className="fw-semibold">Rental #R-2040</div>
                    <div className="text-muted small">Harvester • Coimbatore</div>
                  </div>
                    <Badge bg="info">In Transit</Badge>
                </div>
                <div className="admin-list-item">
                  <div>
                    <div className="fw-semibold">Rental #R-2032</div>
                    <div className="text-muted small">Tractor 35HP • Salem</div>
                  </div>
                    <Badge bg="success">Active</Badge>
                </div>
                <div className="admin-list-item">
                  <div>
                    <div className="fw-semibold">Rental #R-2018</div>
                    <div className="text-muted small">Sprayer 450L • Namakkal</div>
                  </div>
                    <Badge bg="secondary">Completed</Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="h6">Dispute Resolution</Card.Title>
              <div className="admin-list mt-3">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="admin-list-item">
                    <div>
                      <div className="fw-semibold">{dispute.issue}</div>
                      <div className="text-muted small">{dispute.id}</div>
                    </div>
                    <Badge bg={dispute.status === "Open" ? "danger" : "warning"}>{dispute.status}</Badge>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mt-1">
        <Col lg={4}>
          <AnalyticsChart title="Demand by Category" data={[{ label: "Tractor", value: 68 }, { label: "Harvester", value: 52 }, { label: "Sprayer", value: 44 }, { label: "Pump", value: 38 }]} />
        </Col>
        <Col lg={4}>
          <AnalyticsChart title="Activity by Region" data={[{ label: "Coimbatore", value: 72 }, { label: "Salem", value: 55 }, { label: "Erode", value: 48 }, { label: "Madurai", value: 41 }]} />
        </Col>
        <Col lg={4}>
          <AnalyticsChart title="Seasonal Trends" data={[{ label: "Pre-monsoon", value: 65 }, { label: "Monsoon", value: 78 }, { label: "Post-monsoon", value: 54 }, { label: "Dry season", value: 39 }]} />
        </Col>
      </Row>

      <Card className="shadow-sm mt-3">
        <Card.Body>
          <Card.Title className="h6">Rental Activity Heatmap</Card.Title>
          <div className="heatmap-grid mt-3">
            {heatmap.map((value, index) => (
              <div key={`heat-${index}`} className="heatmap-cell" style={{ opacity: 0.2 + value / 120 }} />
            ))}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Admin;
