const Booking = require('../models/booking');

/**
 * Delete all bookings that are in the past (before today's date)
 */
async function cleanupPastBookings() {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
    
    console.log(`[${new Date().toISOString()}] Starting cleanup of past bookings before ${today}`);
    
    // Find and delete all bookings with date less than today
    const result = await Booking.deleteMany({
      date: { $lt: today }
    });
    
    console.log(`[${new Date().toISOString()}] Cleanup completed: Deleted ${result.deletedCount} past bookings`);
    
    return {
      success: true,
      deletedCount: result.deletedCount,
      date: today
    };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error during past bookings cleanup:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = { cleanupPastBookings };