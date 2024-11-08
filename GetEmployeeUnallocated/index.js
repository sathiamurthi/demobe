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
  // SQL query to fetch unallocated employees
  const query = `
    SELECT
      e.EmployeeId AS EmployeeID,
      e.EmployeeName,
      e.EmployeeRole,
      e.EmployeeContractType,
      GROUP_CONCAT(DISTINCT p.ProjectName SEPARATOR ', ') AS Projects,
      COALESCE(SUM(a.AllocationPercent), 0) AS Current_Allocation
    FROM
      Employees e
    LEFT JOIN
      Allocations a ON e.EmployeeId = a.EmployeeID
        AND a.AllocationStatus IN ('Client Unallocated', 'Project Unallocated', 'Allocated')
        AND CURRENT_DATE() BETWEEN a.AllocationStartDate AND a.AllocationEndDate
    LEFT JOIN
      Projects p ON a.ProjectID = p.ProjectID
    WHERE
      e.EmployeeKekaStatus = 'Active'
    GROUP BY
      e.EmployeeId, e.EmployeeName, e.EmployeeRole, e.EmployeeContractType
    HAVING
      Projects IS NULL AND Current_Allocation = 0
    ORDER BY
      e.EmployeeName ASC;
  `;

  try {
    // Execute the SQL query using the connection pool
    const [results] = await pool.query(query);

    // Since Projects is NULL and Current_Allocation is 0, Projects array should be empty
    const formattedResults = results.map(employee => ({
      EmployeeID: employee.EmployeeID,
      EmployeeName: employee.EmployeeName,
      EmployeeRole: employee.EmployeeRole,
      EmployeeContractType: employee.EmployeeContractType,
      Projects: [], // Explicitly set to empty array as Projects is NULL
      Current_Allocation: 0
    }));

    // Return the formatted results as a JSON response
    context.res = {
      status: 200,
      body: formattedResults
    };
  } catch (err) {
    // Handle any errors during query execution
    context.log('Error executing unallocated query:', err);
    context.res = {
      status: 500,
      body: 'Internal Server Error'
    };
  }
};