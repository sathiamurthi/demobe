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
  // SQL query to fetch client details along with number of projects and headcount
  const query = `
    SELECT 
      c.ClientID, 
      c.ClientName, 
      c.ClientCountry, 
      c.ClientLogo,
      c.ClientPartner,
      COUNT(DISTINCT p.ProjectID) AS NoOfProjects,
      COUNT(DISTINCT a.EmployeeID) AS Headcount
    FROM 
      Clients c
    LEFT JOIN 
      Allocations a ON c.ClientID = a.ClientID
        AND a.AllocationStartDate <= CURRENT_DATE()
        AND (a.AllocationEndDate >= CURRENT_DATE() OR a.AllocationEndDate IS NULL)
    LEFT JOIN 
      Projects p ON c.ClientID = p.ClientID
    LEFT JOIN 
      Employees e ON a.EmployeeID = e.EmployeeId
    GROUP BY 
      c.ClientID, c.ClientName, c.ClientCountry, c.ClientPartner, c.ClientLogo
  `;

  try {
    // Execute the SQL query using the connection pool
    const [results] = await pool.query(query);

    // Return the results as a JSON response
    context.res = {
      status: 200,
      body: results
    };
  } catch (err) {
    // Handle any errors during query execution
    context.log('Error executing client query:', err);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error' }
    };
  }
};
