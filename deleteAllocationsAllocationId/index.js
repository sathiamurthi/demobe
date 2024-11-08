const mysql = require('mysql2/promise');

// Configure MySQL connection using environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Innover@2024',
  database: process.env.DB_SCHEMA_RMS || 'rms',
  ssl: {
    rejectUnauthorized: false // Use an appropriate certificate authority if required
  },
};

// Create a MySQL connection pool
const pool = mysql.createPool(dbConfig);

module.exports = async function (context, req) {
  const { allocationId } = req.params;

  // Validate if allocationId is provided
  if (!allocationId) {
    context.res = {
      status: 400,
      body: { error: 'allocationId parameter is required.' }
    };
    return;
  }

  try {
    // Establish a connection and start a transaction
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Delete the allocation
      const deleteQuery = `DELETE FROM Allocations WHERE AllocationID = ?`;
      const [result] = await connection.execute(deleteQuery, [allocationId]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        context.res = {
          status: 404,
          body: { error: 'Allocation not found' }
        };
        return;
      }

      // Since timesheet_allocation_hours has ON DELETE CASCADE, related entries are automatically deleted

      // Commit the transaction
      await connection.commit();
      connection.release();

      // Return success message if the deletion was successful
      context.res = {
        status: 200,
        body: { message: 'Allocation deleted successfully' }
      };
    } catch (transactionError) {
      // Rollback the transaction in case of error
      await connection.rollback();
      connection.release();
      context.log('Transaction Error:', transactionError);
      context.res = {
        status: 500,
        body: { error: 'Internal Server Error', message: transactionError.message }
      };
    }
  } catch (err) {
    // Log the error and return a 500 status code
    context.log('Error deleting allocation:', err);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error', message: err.message }
    };
  }
};
