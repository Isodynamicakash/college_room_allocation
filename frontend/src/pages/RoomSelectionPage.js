import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert } from 'react-bootstrap';
import { useTranslation } from '../contexts/LanguageContext';
import { socket } from '../utils/socket';
import { getRooms, bookRoom, cancelBooking } from '../utils/api';
import { DEPARTMENTS } from '../constants/departments';

function RoomSelectionPage({ building, floor, onBack, currentUser }) {
  const { t } = useTranslation();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [filterStartTime, setFilterStartTime] = useState('08:00');
  const [filterEndTime, setFilterEndTime] = useState('16:00');
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [form, setForm] = useState({ purpose: '', startTime: '', endTime: '', department: 'CSE CORE' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchRooms = async () => {
    if (filterStartTime >= filterEndTime) {
      alert(t('endTimeLaterError'));
      return;
    }
    try {
      const data = await getRooms(floor._id, date, filterStartTime, filterEndTime);
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setRooms([]);
    }
  };

  useEffect(() => {
    fetchRooms();

    const bookingUpdateHandler = ({ date: updateDate }) => {
      if (!updateDate || updateDate === date) fetchRooms();
    };

    socket.on('bookingUpdate', bookingUpdateHandler);
    return () => socket.off('bookingUpdate', bookingUpdateHandler);
  }, [floor?._id, date, filterStartTime, filterEndTime]);

  // Normalize a booking into consistent shape: { _id, startTime, endTime, purpose, bookedBy: { _id, name } | null, bookedByName }
  const normalizeBooking = (b) => {
    if (!b) return null;

    let bookedByObj = null;

    // case: backend sent populated object { _id, name }
    if (b.bookedBy && typeof b.bookedBy === 'object' && (b.bookedBy._id || b.bookedBy.id || b.bookedBy.name)) {
      bookedByObj = {
        _id: String(b.bookedBy._id || b.bookedBy.id),
        name: b.bookedBy.name || b.bookedByName || null
      };
    } else if (b.bookedBy) {
      // case: bookedBy is id (ObjectId or string)
      const idStr = b.bookedBy.toString ? b.bookedBy.toString() : String(b.bookedBy);
      bookedByObj = { _id: idStr, name: b.bookedByName || null };
    } else if (b.bookedByName) {
      // legacy: only name available
      bookedByObj = { _id: null, name: b.bookedByName };
    }

    return {
      _id: b._id ? String(b._id) : null,
      startTime: b.startTime,
      endTime: b.endTime,
      purpose: b.purpose || null,
      bookedBy: bookedByObj,
      bookedByName: b.bookedByName || (bookedByObj && bookedByObj.name) || null
    };
  };

  const handleRoomClick = (room) => {
    const normalized = {
      ...room,
      bookings: Array.isArray(room.bookings) ? room.bookings.map(normalizeBooking) : []
    };
    setSelectedRoom(normalized);
    setShowModal(true);
    setError('');
    setForm({ purpose: '', startTime: '', endTime: '' });
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBookRoom = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { purpose, startTime, endTime } = form;
      if (!purpose || !startTime || !endTime) {
        setError('All fields are required.');
        setLoading(false);
        return;
      }
      if (startTime >= endTime) {
        setError('Start time must be earlier than end time.');
        setLoading(false);
        return;
      }

      if (!selectedRoom?._id) {
        setError('Room ID missing. Cannot book.');
        setLoading(false);
        return;
      }

      const payload = {
        building: building._id,
        floor: floor._id,
        room: selectedRoom._id,
        date,
        startTime,
        endTime,
        purpose,
        department: form.department
      };

      await bookRoom(payload);
      setShowModal(false);
      setForm({ purpose: '', startTime: '', endTime: '', department: 'CSE CORE' });
      fetchRooms();
    } catch (err) {
      console.error('Booking error:', err);
      setError(err?.response?.data?.message || 'Booking failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!bookingId) return;
    const ok = window.confirm('Cancel this booking?');
    if (!ok) return;
    setLoading(true);
    try {
      await cancelBooking(bookingId);
      fetchRooms();
      setShowModal(false);
    } catch (err) {
      console.error('Cancellation error:', err);
      alert(err?.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setLoading(false);
    }
  };
    return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f3f6fb]">
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Button variant="link" className="text-primary" onClick={onBack}>
            &larr; {t('backToFloors')}
          </Button>
          
          {currentUser?.role === 'admin' && (
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => window.open('/admin/bookings', '_blank')}
            >
              📋 Admin Booking Panel
            </Button>
          )}
        </div>

        <h2 className="text-2xl font-bold text-primary text-center mb-2">
          {building?.name} - Floor {floor?.number}
        </h2>
        <p className="text-center text-gray-600 mb-4">Room availability overview</p>

        <Form.Group className="mb-4 text-center">
          <Form.Label>{t('date')}</Form.Label>
          <Form.Control
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mx-auto"
            style={{ maxWidth: '200px' }}
          />
        </Form.Group>

        <Row className="mb-4 justify-content-center">
          <Col xs={6} md={3}>
            <Form.Group>
              <Form.Label>Start Time</Form.Label>
              <Form.Control
                type="time"
                value={filterStartTime}
                onChange={(e) => setFilterStartTime(e.target.value)}
              />
            </Form.Group>
          </Col>

          <Col xs={6} md={3}>
            <Form.Group>
              <Form.Label>End Time</Form.Label>
              <Form.Control
                type="time"
                value={filterEndTime}
                onChange={(e) => setFilterEndTime(e.target.value)}
              />
            </Form.Group>
          </Col>

          <Col xs={12} md={2} className="d-flex align-items-end">
            <Button variant="primary" onClick={fetchRooms} disabled={filterStartTime >= filterEndTime}>
              Check Availability
            </Button>
          </Col>
        </Row>

        <Row className="justify-content-center">
          {rooms.map((room) => (
            <Col key={room._id} xs={6} sm={4} md={2} className="mb-3 d-flex justify-content-center">
              <Card
                className="shadow rounded-lg border-0 cursor-pointer"
                style={{ width: '6rem', background: room.status === 'available' ? '#e6fbe6' : '#fffbe6' }}
                onClick={() => handleRoomClick(room)}
              >
                <Card.Body className="d-flex flex-column align-items-center p-2">
                  <div
                    className="rounded-full p-2 mb-1"
                    style={{ background: room.status === 'available' ? '#22c55e33' : '#facc1533' }}
                  >
                    <svg width="24" height="24" fill={room.status === 'available' ? '#22c55e' : '#facc15'} viewBox="0 0 24 24">
                      <path d="M3 21V3h18v18H3zm2-2h14V5H5v14zm2-2h10v-2H7v2zm0-4h10v-2H7v2zm0-4h10V7H7v2z" />
                    </svg>
                  </div>
                  <Card.Title className="text-md font-semibold text-center">{room.number}</Card.Title>
                  <Card.Text className="text-xs text-center" style={{ color: room.status === 'available' ? '#22c55e' : '#facc15' }}>
                    {room.status === 'available' ? 'Available' : 'Booked'}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Room {selectedRoom?.number}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {selectedRoom?.bookings && Array.isArray(selectedRoom.bookings) && selectedRoom.bookings.length > 0 ? (
              <div
                style={{
                  backgroundColor: '#fff',
                  padding: '1rem',
                  borderRadius: '8px',
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  boxShadow: '0 0 10px rgba(0,0,0,0.1)'
                }}
              >
                <h5 className="mb-3">Bookings for {date}</h5>

                {selectedRoom.bookings.map((b, i) => {
                  // --- Corrected defensive extraction and ownership logic ---
                  const bookedByRaw = b && b.bookedBy ? b.bookedBy : null;

                  let bookedById = null;
                  let bookedByName = null;

                  if (bookedByRaw && typeof bookedByRaw === 'object') {
                    bookedById = bookedByRaw._id || bookedByRaw.id || null;
                    bookedByName = bookedByRaw.name || b.bookedByName || null;
                  } else if (typeof bookedByRaw === 'string') {
                    if (/^[0-9a-fA-F]{24}$/.test(bookedByRaw)) {
                      bookedById = bookedByRaw;
                      bookedByName = b.bookedByName || null;
                    } else {
                      bookedByName = bookedByRaw;
                    }
                  } else {
                    bookedByName = b.bookedByName || null;
                  }

                  const currentUserId = currentUser && (currentUser.id || currentUser._id) ? String(currentUser.id || currentUser._id) : null;
                  const currentUserName = currentUser && (currentUser.name || currentUser.fullName || currentUser.displayName) ? String(currentUser.name || currentUser.fullName || currentUser.displayName) : null;

                  const isOwner = bookedById
                    ? (currentUserId && String(bookedById) === currentUserId)
                    : (currentUserName && bookedByName && String(bookedByName) === currentUserName);
                  // --- end corrected block ---

                  const displayName = bookedByName || 'Unknown';

                  return (
                    <div
                      key={b._id || i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #eee',
                        paddingBottom: '0.5rem',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <div>
                        <strong>Booking {i + 1}</strong><br />
                        <span><strong>By:</strong> {displayName}</span><br />
                        <span><strong>Purpose:</strong> {b?.purpose || '-'}</span><br />
                        {b?.teacher && <span><strong>Teacher:</strong> {b.teacher}</span>}<br />
                        {b?.subject && <span><strong>Subject:</strong> {b.subject}</span>}<br />
                        {b?.department && <span><strong>Department:</strong> {b.department}</span>}<br />
                        <span><strong>Time:</strong> {b?.startTime} – {b?.endTime}</span>
                        {b?.source && <span className="badge bg-secondary ms-2">{b.source}</span>}
                      </div>

                      <div>
                        {/* Owner can cancel their own bookings */}
                        {isOwner && (
                          <Button variant="danger" size="sm" onClick={() => handleCancelBooking(b._id)} className="me-1">
                            Cancel
                          </Button>
                        )}
                        {/* Admin can delete any booking */}
                        {currentUser?.role === 'admin' && !isOwner && (
                          <Button variant="outline-danger" size="sm" onClick={() => handleCancelBooking(b._id)}>
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Form onSubmit={handleBookRoom}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('subjectPurpose')}</Form.Label>
                  <Form.Control
                    type="text"
                    name="purpose"
                    value={form.purpose}
                    onChange={handleFormChange}
                    placeholder={t('enterPurpose')}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('department')}</Form.Label>
                  <Form.Select
                    name="department"
                    value={form.department}
                    onChange={handleFormChange}
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('startTime')}</Form.Label>
                  <Form.Control type="time" name="startTime" value={form.startTime} onChange={handleFormChange} />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('endTime')}</Form.Label>
                  <Form.Control type="time" name="endTime" value={form.endTime} onChange={handleFormChange} />
                </Form.Group>

                <div className="text-xs text-gray-500 mb-2">College hours: 08:00 – 18:00</div>

                {error && <Alert variant="danger">{error}</Alert>}

                <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                  {loading ? 'Booking...' : 'Book Room'}
                </Button>
              </Form>
            )}
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
}

export default RoomSelectionPage;