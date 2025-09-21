import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button } from 'react-bootstrap';
import { getFloors, getRooms } from '../utils/api';
import { DEPARTMENTS, DAYS_OF_WEEK, DEFAULT_HORIZON_DAYS } from '../constants/departments';

function AdminRow({ row, rowIndex, buildings, onUpdate, onRemove, canRemove }) {
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Load floors when building changes
  useEffect(() => {
    if (row.building) {
      loadFloors();
    } else {
      setFloors([]);
      setRooms([]);
    }
  }, [row.building]);

  // Load rooms when floor changes
  useEffect(() => {
    if (row.floor) {
      loadRooms();
    } else {
      setRooms([]);
    }
  }, [row.floor]);

  const loadFloors = async () => {
    setLoadingFloors(true);
    try {
      const floorsData = await getFloors(row.building);
      setFloors(floorsData || []);
      
      // Reset floor and room if current selections are invalid
      if (row.floor && !floorsData?.find(f => f._id === row.floor)) {
        onUpdate('floor', '');
        onUpdate('room', '');
      }
    } catch (error) {
      console.error('Error loading floors:', error);
      setFloors([]);
    } finally {
      setLoadingFloors(false);
    }
  };

  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      // Get available rooms for the floor (using a sample date/time for structure)
      const roomsData = await getRooms(row.floor, '2024-01-01', '09:00', '10:00');
      setRooms(roomsData || []);
      
      // Reset room if current selection is invalid
      if (row.room && !roomsData?.find(r => r._id === row.room)) {
        onUpdate('room', '');
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  return (
    <div className="border rounded p-3 mb-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">Booking Row {rowIndex + 1}</h6>
        {canRemove && (
          <Button variant="outline-danger" size="sm" onClick={onRemove}>
            Remove
          </Button>
        )}
      </div>

      <Row>
        {/* Building Selection */}
        <Col md={3}>
          <Form.Group className="mb-2">
            <Form.Label>Building</Form.Label>
            <Form.Select
              value={row.building}
              onChange={(e) => onUpdate('building', e.target.value)}
            >
              <option value="">Select Building</option>
              {buildings.map(building => (
                <option key={building._id} value={building._id}>
                  {building.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        {/* Floor Selection */}
        <Col md={3}>
          <Form.Group className="mb-2">
            <Form.Label>Floor</Form.Label>
            <Form.Select
              value={row.floor}
              onChange={(e) => onUpdate('floor', e.target.value)}
              disabled={!row.building || loadingFloors}
            >
              <option value="">Select Floor</option>
              {floors.map(floor => (
                <option key={floor._id} value={floor._id}>
                  Floor {floor.number}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        {/* Room Selection */}
        <Col md={3}>
          <Form.Group className="mb-2">
            <Form.Label>Room</Form.Label>
            <Form.Select
              value={row.room}
              onChange={(e) => onUpdate('room', e.target.value)}
              disabled={!row.floor || loadingRooms}
            >
              <option value="">All Rooms</option>
              {rooms.map(room => (
                <option key={room._id} value={room._id}>
                  Room {room.number}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        {/* Day of Week */}
        <Col md={3}>
          <Form.Group className="mb-2">
            <Form.Label>Day of Week</Form.Label>
            <Form.Select
              value={row.dayOfWeek}
              onChange={(e) => onUpdate('dayOfWeek', parseInt(e.target.value))}
            >
              {DAYS_OF_WEEK.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        {/* Start Time */}
        <Col md={2}>
          <Form.Group className="mb-2">
            <Form.Label>Start Time</Form.Label>
            <Form.Control
              type="time"
              value={row.startTime}
              onChange={(e) => onUpdate('startTime', e.target.value)}
            />
          </Form.Group>
        </Col>

        {/* End Time */}
        <Col md={2}>
          <Form.Group className="mb-2">
            <Form.Label>End Time</Form.Label>
            <Form.Control
              type="time"
              value={row.endTime}
              onChange={(e) => onUpdate('endTime', e.target.value)}
            />
          </Form.Group>
        </Col>

        {/* Department */}
        <Col md={2}>
          <Form.Group className="mb-2">
            <Form.Label>Department</Form.Label>
            <Form.Select
              value={row.department}
              onChange={(e) => onUpdate('department', e.target.value)}
            >
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        {/* Subject */}
        <Col md={3}>
          <Form.Group className="mb-2">
            <Form.Label>Subject</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Data Structures"
              value={row.subject}
              onChange={(e) => onUpdate('subject', e.target.value)}
            />
          </Form.Group>
        </Col>

        {/* Teacher */}
        <Col md={3}>
          <Form.Group className="mb-2">
            <Form.Label>Teacher</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Dr. Smith"
              value={row.teacher}
              onChange={(e) => onUpdate('teacher', e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        {/* Horizon Days */}
        <Col md={3}>
          <Form.Group className="mb-2">
            <Form.Label>Horizon Days</Form.Label>
            <Form.Control
              type="number"
              min="1"
              max="365"
              value={row.horizonDays}
              onChange={(e) => onUpdate('horizonDays', parseInt(e.target.value) || DEFAULT_HORIZON_DAYS)}
            />
            <Form.Text className="text-muted">
              Days to look ahead (1-365)
            </Form.Text>
          </Form.Group>
        </Col>

        {/* Force Override */}
        <Col md={3}>
          <Form.Group className="mb-2">
            <Form.Label>&nbsp;</Form.Label>
            <Form.Check
              type="checkbox"
              label="Force Override"
              checked={row.forceOverride}
              onChange={(e) => onUpdate('forceOverride', e.target.checked)}
            />
            <Form.Text className="text-muted">
              Delete conflicting bookings
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>
    </div>
  );
}

export default AdminRow;