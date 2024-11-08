const mysql = require('mysql2/promise');

// Configure MySQL connection using environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Innover@2024',
  database: process.env.DB_SCHEMA_RMS|| 'rms',
  ssl: {
    rejectUnauthorized: false // Use an appropriate certificate authority if required
  },
  
};

// Create a MySQL connection pool
const pool = mysql.createPool(dbConfig);

module.exports = async function (context, req) {
  const { allocationId } = req.params;

  if (!allocationId) {
    context.res = {
      status: 400,
      body: { error: 'allocationId parameter is required.' }
    };
    return;
  }

  try {
    const allocationDetailsQuery = `
      SELECT a.*, 
             e.EmployeeName, 
             p.ProjectName, 
             c.ClientName
      FROM Allocations a
      JOIN Employees e ON a.EmployeeID = e.EmployeeId
      JOIN Projects p ON a.ProjectID = p.ProjectID
      JOIN Clients c ON a.ClientID = c.ClientID
      WHERE a.AllocationID = ?
    `;

    // Execute the query
    const [results] = await pool.query(allocationDetailsQuery, [allocationId]);

    if (results.length === 0) {
      context.res = {
        status: 404,
        body: { error: 'Allocation not found' }
      };
      return;
    }

    // Return the first result as the response
    context.res = {
      status: 200,
      body: results[0]
    };
  } catch (err) {
    // Log the error and send an internal server error response
    context.log('Error fetching allocation details:', err);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error' }
    };
  }
};
