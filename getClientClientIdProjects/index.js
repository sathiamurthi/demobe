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
  const clientId = req.params.clientId;

  if (!clientId) {
    context.res = {
      status: 400,
      body: { error: 'Client ID parameter is required.' }
    };
    return;
  }

  // Get current date in YYYY-MM-DD format
  const currentDate = new Date().toISOString().split('T')[0];

  // SQL query to fetch projects for a specific client ID
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
    // Execute the SQL query using the connection pool
    const [projects] = await pool.query(query, [currentDate, currentDate, clientId]);

    if (projects.length === 0) {
      context.res = {
        status: 404,
        body: { message: 'No projects found for this client' }
      };
      return;
    }

    // Return the list of projects as a JSON response
    context.res = {
      status: 200,
      body: projects
    };
  } catch (err) {
    // Handle any errors during query execution
    context.log('Error executing project query:', err);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error' }
    };
  }
};
