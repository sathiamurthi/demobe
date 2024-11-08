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
  // Extract email from query parameters
  const email = req.query.email;

  // Check if the email parameter is provided
  if (!email) {
    context.res = {
      status: 400,
      body: 'Email is required',
    };
    return;
  }

  try {
    // Convert the employee email to lowercase for case-insensitive comparison
    const lowerCaseEmail = email.toLowerCase();
    console.log(lowerCaseEmail);
    // SQL query to fetch employee details by Email
    const query = `
      SELECT 
        EmployeeId,
        EmployeeName,
        EmployeeRole,
        EmployeeEmail,
        EmployeeStudio,
        EmployeeSubStudio,
        EmployeeLocation,
        EmployeeJoiningDate,
        EmployeeEndingDate,
        EmployeeSkills,
        EmployeeKekaStatus,
        EmployeeTYOE,
        EmployeePhotoDetails,
        EmployeeContractType
      FROM Employees
      WHERE LOWER(EmployeeEmail) = ?
    `;

    // Execute the SQL query using the connection pool
    const [results] = await pool.query(query, [lowerCaseEmail]);

    // If no matching employee is found, return a 404
    if (results.length === 0) {
      context.res = {
        status: 404,
        body: 'Employee not found',
      };
      return;
    }

    // Return the first (and should be only) result as a JSON response
    context.res = {
      status: 200,
      body: results[0],
    };

  } catch (err) {
    // Handle any errors during query execution
    context.log('Error executing query:', err);
    context.res = {
      status: 500,
      body: 'Internal Server Error',
    };
  }
};
