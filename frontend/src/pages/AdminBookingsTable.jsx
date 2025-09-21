import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Alert, Modal, Badge } from 'react-bootstrap';
import { getAdminBookings, cancelBooking } from '../utils/api';
import { DEPARTMENTS } from '../constants/departments';
import AdminBookingPanel from '../components/AdminBookingPanel';

function AdminBookingsTable({ buildings, currentUser, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    date: '',
    department: '',
    source: '',
    teacher: ''
  });
  const [pagination, setPagination] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchBookings();
    }
  }, [filters, currentUser]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await getAdminBookings(filters);
      setBookings(response.bookings || []);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error('Error fetching admin bookings:', error);
      alert('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;
    
    try {
      await cancelBooking(bookingToDelete._id);
      alert('Booking deleted successfully');
      fetchBookings();
      setShowDeleteModal(false);
      setBookingToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
      alert(error?.response?.data?.message || 'Failed to delete booking');
    }
  };

  const confirmDelete = (booking) => {
    setBookingToDelete(booking);
    setShowDeleteModal(true);
  };

  const getSourceBadge = (source) => {
    const variants = {
      'user': 'primary',
      'admin': 'warning',
      'template': 'info'
    };
    return <Badge bg={variants[source] || 'secondary'}>{source}</Badge>;
  };

  if (currentUser?.role !== 'admin') {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="text-primary">Admin Booking Management</h2>
            <div>
              <Button 
                variant="success" 
                className="me-2"
                onClick={() => setShowPanel(!showPanel)}
              >
                {showPanel ? 'Hide' : 'Show'} Bulk Booking Panel
              </Button>
              <Button variant="outline-danger" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {showPanel && (
        <AdminBookingPanel
          buildings={buildings}
          currentUser={currentUser}
          onBookingCreated={fetchBookings}
        />
      )}

      {/* Filters */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Filters</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-2">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.date}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-2">
                <Form.Label>Department</Form.Label>
                <Form.Select
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                >
                  <option value="">All Departments</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-2">
                <Form.Label>Source</Form.Label>
                <Form.Select
                  value={filters.source}
                  onChange={(e) => handleFilterChange('source', e.target.value)}
                >
                  <option value="">All Sources</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="template">Template</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-2">
                <Form.Label>Teacher</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search teacher name"
                  value={filters.teacher}
                  onChange={(e) => handleFilterChange('teacher', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Bookings Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">
            Bookings 
            {pagination.total && (
              <span className="text-muted"> ({pagination.total} total)</span>
            )}
          </h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <>
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Room</th>
                    <th>Purpose</th>
                    <th>Teacher</th>
                    <th>Subject</th>
                    <th>Department</th>
                    <th>Booked By</th>
                    <th>Source</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center py-4">
                        No bookings found
                      </td>
                    </tr>
                  ) : (
                    bookings.map(booking => (
                      <tr key={booking._id}>
                        <td>{booking.date}</td>
                        <td>{booking.startTime} - {booking.endTime}</td>
                        <td>
                          {booking.building?.name || 'N/A'} - Floor {booking.floor?.number || 'N/A'} - Room {booking.room?.number || 'N/A'}
                        </td>
                        <td>{booking.purpose}</td>
                        <td>{booking.teacher || '-'}</td>
                        <td>{booking.subject || '-'}</td>
                        <td>{booking.department || '-'}</td>
                        <td>{booking.bookedBy?.name || booking.bookedByName || 'Unknown'}</td>
                        <td>{getSourceBadge(booking.source)}</td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => confirmDelete(booking)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <Button
                    variant="outline-primary"
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="me-2"
                  >
                    Previous
                  </Button>
                  <span className="align-self-center mx-2">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline-primary"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {bookingToDelete && (
            <div>
              <p><strong>Are you sure you want to delete this booking?</strong></p>
              <ul>
                <li><strong>Date:</strong> {bookingToDelete.date}</li>
                <li><strong>Time:</strong> {bookingToDelete.startTime} - {bookingToDelete.endTime}</li>
                <li><strong>Purpose:</strong> {bookingToDelete.purpose}</li>
                <li><strong>Booked by:</strong> {bookingToDelete.bookedBy?.name || bookingToDelete.bookedByName}</li>
              </ul>
              <Alert variant="warning">
                This action cannot be undone and will be logged in the audit trail.
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteBooking}>
            Delete Booking
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default AdminBookingsTable;