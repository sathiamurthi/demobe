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
  try {
    // Retrieve the query parameter from the request
    const { query } = req.query;

    // Check if the query parameter is provided
    if (!query) {
      context.res = {
        status: 400,
        body: { message: 'Query parameter is required.' }
      };
      return;
    }

    // Define the search query using placeholders for LIKE expressions
    const searchQuery = `
      SELECT EmployeeId, EmployeeName
      FROM Employees
      WHERE (EmployeeName LIKE ? OR EmployeeId LIKE ?)
        AND EmployeeKekaStatus = 'Active'
      LIMIT 20;
    `;
    
    // Prepare the search parameter
    const likeQuery = `%${query}%`;

    // Execute the query with the provided parameters
    const [results] = await pool.query(searchQuery, [likeQuery, likeQuery]);

    // Send the results as the response
    context.res = {
      status: 200,
      body: { employees: results }
    };
  } catch (err) {
    // Handle any errors during the query execution
    context.log('Error searching employees:', err);
    context.res = {
      status: 500,
      body: { message: 'Internal Server Error' }
    };
  }
};
