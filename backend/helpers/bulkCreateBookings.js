const Booking = require('../models/booking');
const Room = require('../models/Room');
const Audit = require('../models/Audit');

/**
 * Convert time string (HH:mm) to minutes since midnight
 * @param {string} timeStr - Time in "HH:mm" format
 * @returns {number} Minutes since midnight
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if two time ranges overlap
 * @param {string} startA - Start time of range A
 * @param {string} endA - End time of range A
 * @param {string} startB - Start time of range B
 * @param {string} endB - End time of range B
 * @returns {boolean} True if ranges overlap
 */
function timeRangesOverlap(startA, endA, startB, endB) {
  const startAMinutes = timeToMinutes(startA);
  const endAMinutes = timeToMinutes(endA);
  const startBMinutes = timeToMinutes(startB);
  const endBMinutes = timeToMinutes(endB);
  
  return startAMinutes < endBMinutes && endAMinutes > startBMinutes;
}

/**
 * Generate dates for the next N days that fall on a specific day of week
 * @param {number} dayOfWeek - Day of week (0=Sunday, 1=Monday, etc.)
 * @param {number} horizonDays - Number of days to look ahead
 * @returns {string[]} Array of date strings in YYYY-MM-DD format
 */
function generateDatesForDayOfWeek(dayOfWeek, horizonDays) {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < horizonDays; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    if (date.getDay() === dayOfWeek) {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      dates.push(dateStr);
    }
  }
  
  return dates;
}

/**
 * Bulk create bookings with conflict detection and override handling
 * @param {Object} params - Bulk booking parameters
 * @returns {Object} Results summary
 */
async function bulkCreateBookings(params) {
  const {
    building,
    floor,
    room, // null means all rooms on the floor
    dayOfWeek,
    startTime,
    endTime,
    department,
    subject,
    teacher,
    horizonDays,
    forceOverride,
    adminUser
  } = params;

  const results = {
    created: 0,
    skipped: 0,
    conflicts: 0,
    deleted: 0,
    affectedDates: [],
    errors: []
  };

  try {
    // Get target rooms
    let targetRooms;
    if (room) {
      // Single room specified
      targetRooms = [{ _id: room }];
    } else {
      // All rooms on the floor
      targetRooms = await Room.find({ floor: floor }).select('_id');
    }

    if (!targetRooms || targetRooms.length === 0) {
      throw new Error('No rooms found for the specified criteria');
    }

    // Generate target dates
    const targetDates = generateDatesForDayOfWeek(dayOfWeek, horizonDays);
    
    if (targetDates.length === 0) {
      throw new Error(`No dates found for day of week ${dayOfWeek} in the next ${horizonDays} days`);
    }

    console.log(`Generating bookings for ${targetRooms.length} room(s) across ${targetDates.length} date(s)`);

    // Process in chunks to avoid overwhelming the database
    const CHUNK_SIZE = 100;
    const operations = [];

    for (const targetRoom of targetRooms) {
      for (const targetDate of targetDates) {
        // Check for conflicts
        const conflicts = await Booking.find({
          room: targetRoom._id,
          date: targetDate,
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }).populate('bookedBy', '_id name');

        if (conflicts.length > 0) {
          results.conflicts++;
          
          if (forceOverride) {
            // Check if we can delete all conflicting bookings
            let canDeleteAll = true;
            const conflictsToDelete = [];
            
            for (const conflict of conflicts) {
              const canDelete = conflict.source !== 'admin' || conflict.overrideAllowed;
              if (canDelete) {
                conflictsToDelete.push(conflict);
              } else {
                canDeleteAll = false;
                console.log(`Cannot delete protected admin booking ${conflict._id}`);
              }
            }
            
            if (canDeleteAll && conflictsToDelete.length > 0) {
              // Delete all conflicting bookings
              for (const conflict of conflictsToDelete) {
                // Create audit record before deletion
                try {
                  await Audit.create({
                    action: 'override',
                    performedBy: adminUser.id,
                    affectedUser: conflict.bookedBy._id || conflict.bookedBy,
                    bookingSnapshot: conflict.toClient ? conflict.toClient() : conflict.toJSON(),
                    reason: `Force override for bulk booking: ${department} - ${subject}`,
                    metadata: {
                      newBooking: {
                        teacher,
                        subject,
                        department,
                        startTime,
                        endTime,
                        date: targetDate
                      },
                      roomId: targetRoom._id
                    },
                    ipAddress: null, // Will be set by calling route
                    userAgent: null
                  });
                } catch (auditErr) {
                  console.error('Failed to create audit record for override:', auditErr);
                }

                // Delete the conflicting booking
                await conflict.deleteOne();
                results.deleted++;
                
                console.log(`Deleted conflicting booking ${conflict._id} for override`);
              }
            } else {
              // Cannot delete all conflicts, skip this booking
              results.skipped++;
              continue;
            }
          } else {
            // Skip this booking due to conflicts
            results.skipped++;
            continue;
          }
        }

        // Prepare new booking for batch creation
        operations.push({
          insertOne: {
            document: {
              building,
              floor,
              room: targetRoom._id,
              date: targetDate,
              startTime,
              endTime,
              purpose: `${subject} - ${department}`,
              bookedBy: adminUser.id,
              bookedByName: adminUser.name,
              source: 'admin',
              teacher,
              subject,
              department,
              overrideAllowed: false,
              createdByAdmin: adminUser.id,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        });

        if (!results.affectedDates.includes(targetDate)) {
          results.affectedDates.push(targetDate);
        }
      }
    }

    // Execute bulk operations in chunks
    if (operations.length > 0) {
      for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
        const chunk = operations.slice(i, i + CHUNK_SIZE);
        
        try {
          const result = await Booking.bulkWrite(chunk, { ordered: false });
          results.created += result.insertedCount;
        } catch (bulkErr) {
          console.error('Bulk write error for chunk:', bulkErr);
          results.errors.push(`Chunk ${i}-${i + chunk.length}: ${bulkErr.message}`);
        }
      }
    }

    console.log(`Bulk operation completed: ${results.created} created, ${results.skipped} skipped, ${results.deleted} deleted`);
    
  } catch (error) {
    console.error('Bulk booking operation failed:', error);
    throw error;
  }

  return results;
}

module.exports = bulkCreateBookings;