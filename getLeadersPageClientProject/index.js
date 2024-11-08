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
  const clientId = req.params.clientId;  // Get the clientId from the URL parameters
  const currentDate = new Date().toISOString().split('T')[0];  // Get current date in YYYY-MM-DD format

  const query = `
    SELECT
      p.ProjectID,
      p.ProjectName,
      p.ProjectStatus,
      p.ProjectCategory,
      p.ProjectManager,
      p.ProjectStartDate,
      p.ProjectEndDate,
      c.ClientName,
      COUNT(DISTINCT a.EmployeeID) AS Headcount
    FROM
      Projects p
    JOIN
      Clients c ON p.ClientID = c.ClientID
    LEFT JOIN
      Allocations a ON p.ProjectID = a.ProjectID
        AND a.AllocationStartDate <= ?
        AND (a.AllocationEndDate >= ? OR a.AllocationEndDate IS NULL)
    WHERE
      p.ClientID = ?
    GROUP BY
      p.ProjectID, p.ProjectName, p.ProjectStatus, p.ProjectCategory, p.ProjectManager, p.ProjectStartDate, p.ProjectEndDate, c.ClientName
  `;

  try {
    // Execute the query with the current date and clientId as parameters
    const [projects] = await pool.query(query, [currentDate, currentDate, clientId]);

    // Check if no projects were found
    if (projects.length === 0) {
      context.res = {
        status: 404,
        body: { message: 'No projects found for this client' }
      };
      return;
    }

    // Send the project details as the response
    context.res = {
      status: 200,
      body: projects
    };
  } catch (err) {
    // Log the error and return a 500 status
    context.log('Error executing query:', err);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error' }
    };
  }
};
