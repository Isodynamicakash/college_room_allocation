import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Modal } from 'react-bootstrap';
import { createAdminBatch } from '../utils/api';
import { DEPARTMENTS, DAYS_OF_WEEK, DEFAULT_HORIZON_DAYS } from '../constants/departments';
import AdminRow from './AdminRow';

function AdminBookingPanel({ buildings, currentUser, onBookingCreated }) {
  const [rows, setRows] = useState([createEmptyRow()]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function createEmptyRow() {
    return {
      id: Date.now() + Math.random(),
      building: '',
      floor: '',
      room: '', // Empty means all rooms
      dayOfWeek: 1, // Monday
      startTime: '09:00',
      endTime: '10:00',
      department: 'CSE CORE',
      subject: '',
      teacher: '',
      horizonDays: DEFAULT_HORIZON_DAYS,
      forceOverride: false
    };
  }

  const addRow = () => {
    setRows([...rows, createEmptyRow()]);
  };

  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const validateRow = (row) => {
    const errors = [];
    if (!row.building) errors.push('Building is required');
    if (!row.floor) errors.push('Floor is required');
    if (!row.subject) errors.push('Subject is required');
    if (!row.teacher) errors.push('Teacher is required');
    if (!row.startTime || !row.endTime) errors.push('Start and end times are required');
    
    // Time validation
    if (row.startTime && row.endTime && row.startTime >= row.endTime) {
      errors.push('End time must be after start time');
    }

    return errors;
  };

  const handleBulkBook = async () => {
    const validRows = [];
    const allErrors = [];

    rows.forEach((row, index) => {
      const errors = validateRow(row);
      if (errors.length > 0) {
        allErrors.push(`Row ${index + 1}: ${errors.join(', ')}`);
      } else {
        validRows.push(row);
      }
    });

    if (allErrors.length > 0) {
      alert('Please fix the following errors:\n' + allErrors.join('\n'));
      return;
    }

    if (validRows.length === 0) {
      alert('No valid rows to process');
      return;
    }

    // Show preview modal
    setPreviewData(validRows);
    setShowPreview(true);
  };

  const confirmBooking = async () => {
    setIsSubmitting(true);
    const results = [];
    
    try {
      for (const row of previewData) {
        try {
          const result = await createAdminBatch(row);
          results.push({ row, result, success: true });
        } catch (error) {
          results.push({ 
            row, 
            error: error.response?.data?.message || error.message, 
            success: false 
          });
        }
      }

      // Show results
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => r.success === false).length;
      
      let message = `Bulk booking completed:\n${successful} successful, ${failed} failed`;
      
      if (failed > 0) {
        const errorDetails = results
          .filter(r => !r.success)
          .map(r => `${r.row.subject}: ${r.error}`)
          .join('\n');
        message += '\n\nErrors:\n' + errorDetails;
      }

      alert(message);

      // Clear successful rows
      const failedRowIds = results
        .filter(r => !r.success)
        .map(r => r.row.id);
      
      if (failedRowIds.length === 0) {
        // All succeeded, reset form
        setRows([createEmptyRow()]);
      } else {
        // Keep only failed rows
        setRows(rows.filter(row => failedRowIds.includes(row.id)));
      }

      if (onBookingCreated) {
        onBookingCreated();
      }
    } catch (error) {
      console.error('Bulk booking error:', error);
      alert('Error during bulk booking operation');
    } finally {
      setIsSubmitting(false);
      setShowPreview(false);
      setPreviewData(null);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">📅 Admin Bulk Booking</h5>
      </Card.Header>
      <Card.Body>
        <Alert variant="info" className="mb-3">
          <strong>Instructions:</strong> Create recurring bookings for specific days of the week. 
          Leave "Room" empty to book all rooms on the selected floor.
        </Alert>

        {rows.map((row, index) => (
          <AdminRow
            key={row.id}
            row={row}
            rowIndex={index}
            buildings={buildings}
            onUpdate={(field, value) => updateRow(row.id, field, value)}
            onRemove={() => removeRow(row.id)}
            canRemove={rows.length > 1}
          />
        ))}

        <Row className="mt-3">
          <Col md={6}>
            <Button variant="outline-primary" onClick={addRow}>
              + Add Row
            </Button>
          </Col>
          <Col md={6} className="text-end">
            <Button 
              variant="success" 
              onClick={handleBulkBook}
              disabled={rows.length === 0}
            >
              📋 Preview & Book
            </Button>
          </Col>
        </Row>

        {/* Preview Modal */}
        <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Booking Preview</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="warning">
              <strong>Please review before confirming:</strong>
            </Alert>
            
            {previewData?.map((row, index) => (
              <Card key={index} className="mb-2">
                <Card.Body className="py-2">
                  <small>
                    <strong>{row.subject}</strong> by {row.teacher} ({row.department})<br />
                    {DAYS_OF_WEEK.find(d => d.value === row.dayOfWeek)?.label} 
                    {' '}{row.startTime} - {row.endTime}<br />
                    Next {row.horizonDays} days
                    {row.forceOverride && ' (Force Override: YES)'}
                    {!row.room && ' (All rooms on floor)'}
                  </small>
                </Card.Body>
              </Card>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPreview(false)}>
              Cancel
            </Button>
            <Button 
              variant="success" 
              onClick={confirmBooking}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Confirm & Create Bookings'}
            </Button>
          </Modal.Footer>
        </Modal>
      </Card.Body>
    </Card>
  );
}

export default AdminBookingPanel;