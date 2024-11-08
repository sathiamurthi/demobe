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
    // Define the queries
    const clientsQuery = `SELECT ClientID, ClientName FROM Clients`;
    const projectsQuery = `SELECT ProjectID, ProjectName, ClientID, ProjectManager, ProjectManagerID FROM Projects WHERE ProjectStatus = 'In Progress'`;
    const employeesQuery = `SELECT EmployeeID, EmployeeName FROM Employees WHERE EmployeeKekaStatus = 'Active'`;
    const timeSheetApproversQuery = `
      SELECT DISTINCT EmployeeID, EmployeeName AS Name
      FROM Employees
      WHERE EmployeeRole = 'Project Manager'
      UNION
      SELECT DISTINCT ProjectManagerID AS EmployeeID, ProjectManager AS Name
      FROM Projects
      WHERE ProjectManagerID IS NOT NULL
    `;

    // Perform the queries in parallel
    const [clientsResult, projectsResult, employeesResult, timeSheetApproversResult] = await Promise.all([
      pool.query(clientsQuery),
      pool.query(projectsQuery),
      pool.query(employeesQuery),
      pool.query(timeSheetApproversQuery),
    ]);

    // Extract the results from the query responses
    const clients = clientsResult[0];
    const projects = projectsResult[0];
    const employees = employeesResult[0];
    const timeSheetApprovers = timeSheetApproversResult[0];

    // Return the results in the response
    context.res = {
      status: 200,
      body: {
        clients,
        projects,
        employees,
        timeSheetApprovers
      }
    };
  } catch (err) {
    // Handle any errors during the query execution
    context.log('Error fetching modal data:', err);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error' }
    };
  }
};
