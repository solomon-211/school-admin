/**
 * ============================================================================
 * DATABASE CONNECTION CONFIGURATION
 * ============================================================================
 * 
 * Establishes connection to MongoDB database.
 * Uses Mongoose as the ODM (Object Document Mapper).
 * 
 * Connection Details:
 * - URI: Loaded from MONGO_URI environment variable
 * - Automatic retry on connection failure with process exit
 * - Logs connection host on successful connection
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * 
 * Behavior:
 * - Attempts connection using MONGO_URI from environment
 * - Logs success message with host information
 * - Exits process on connection failure (critical resource)
 * 
 * @async
 * @returns {Promise<void>}
 * @throws {Error} Connection error details
 */
const connectDB = async () => {
  try {
    // Establish MongoDB connection
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    // Log error and exit if connection fails
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
