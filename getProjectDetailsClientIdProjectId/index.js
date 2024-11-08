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
  const { clientId, projectId } = req.params;
  const filter = req.query.filter ? req.query.filter.toLowerCase() : 'all'; // Default to 'all' if not provided

  // Validate that Client ID and Project ID are provided
  if (!clientId || !projectId) {
    context.res = {
      status: 400,
      body: 'Client ID and Project ID are required',
    };
    return;
  }

  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Fetch client and project names
  const nameQuery = `
    SELECT c.ClientName, p.ProjectName
    FROM Clients c
    INNER JOIN Projects p ON c.ClientID = p.ClientID
    WHERE c.ClientID = ? AND p.ProjectID = ?
    LIMIT 1
  `;

  try {
    // Execute the name query using the connection pool
    const [nameResults] = await pool.query(nameQuery, [clientId, projectId]);

    if (nameResults.length === 0) {
      context.res = {
        status: 404,
        body: 'Project not found',
      };
      return;
    }

    const clientName = nameResults[0].ClientName;
    const projectName = nameResults[0].ProjectName;

    // Define query based on filter
    let allocationQuery = '';
    let queryParams = [];

    switch (filter) {
      case 'active':
        allocationQuery = `
          SELECT a.*, e.EmployeeName, e.EmployeeRole
          FROM Allocations a
          INNER JOIN Employees e ON a.EmployeeID = e.EmployeeID
          WHERE a.ClientID = ? AND a.ProjectID = ?
            AND a.AllocationStatus IN ('Client Unallocated', 'Project Unallocated', 'Allocated')
            AND a.AllocationStartDate <= ?
            AND (a.AllocationEndDate >= ? OR a.AllocationEndDate IS NULL)
        `;
        queryParams = [clientId, projectId, currentDate, currentDate];
        break;
      case 'closed':
        allocationQuery = `
          SELECT a.*, e.EmployeeName, e.EmployeeRole
          FROM Allocations a
          INNER JOIN Employees e ON a.EmployeeID = e.EmployeeID
          WHERE a.ClientID = ? AND a.ProjectID = ?
            AND (a.AllocationStatus = 'Closed' OR a.AllocationEndDate < ?)
        `;
        queryParams = [clientId, projectId, currentDate];
        break;
      case 'all':
        allocationQuery = `
          SELECT a.*, e.EmployeeName, e.EmployeeRole
          FROM Allocations a
          INNER JOIN Employees e ON a.EmployeeID = e.EmployeeID
          WHERE a.ClientID = ? AND a.ProjectID = ?
        `;
        queryParams = [clientId, projectId];
        break;
      default:
        context.res = {
          status: 400,
          body: 'Invalid filter',
        };
        return;
    }

    // Execute the allocation query using the connection pool
    const [allocResults] = await pool.query(allocationQuery, queryParams);

    // Return the response with the client, project name, and allocations
    context.res = {
      status: 200,
      body: {
        clientName,
        projectName,
        allocations: allocResults,
      },
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
