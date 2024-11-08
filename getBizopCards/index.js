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
    // Define the queries to get the count of various data
    const totalEmployeesQuery = `
      SELECT COUNT(DISTINCT e.EmployeeId) AS totalEmployees
      FROM Employees e
      WHERE e.EmployeeKekaStatus = 'Active'
    `;
  
    const unallocatedEmployeesQuery = `
      SELECT COUNT(DISTINCT e.EmployeeId) AS unallocatedEmployees
      FROM Employees e
      LEFT JOIN Allocations a ON e.EmployeeId = a.EmployeeID
        AND a.AllocationStatus NOT IN ('Closed')
        AND CURRENT_DATE() BETWEEN a.AllocationStartDate AND IFNULL(a.AllocationEndDate, CURRENT_DATE())
      WHERE e.EmployeeKekaStatus = 'Active'
      AND a.AllocationID IS NULL -- No project for the current date
    `;
  
    const draftAllocationsQuery = `
      SELECT COUNT(DISTINCT e.EmployeeId) AS draftEmployees
      FROM Employees e
      LEFT JOIN (
        SELECT EmployeeID, SUM(AllocationPercent) AS current_allocation
        FROM Allocations
        WHERE CURRENT_DATE() BETWEEN AllocationStartDate AND IFNULL(AllocationEndDate, CURRENT_DATE())
        GROUP BY EmployeeID
      ) a ON e.EmployeeId = a.EmployeeID
      WHERE e.EmployeeKekaStatus = 'Active'
      AND a.current_allocation > 0
      AND a.current_allocation < 100
    `;
  
    const inProgressProjectsQuery = `
      SELECT COUNT(*) AS activeProjects
      FROM Projects
      WHERE ProjectStatus = 'In Progress'
    `;
  
    // Perform database queries in parallel
    const [totalEmployeesResult, unallocatedEmployeesResult, draftAllocationsResult, activeProjectsResult] = await Promise.all([
      pool.query(totalEmployeesQuery),
      pool.query(unallocatedEmployeesQuery),
      pool.query(draftAllocationsQuery),
      pool.query(inProgressProjectsQuery)
    ]);
  
    // Extract results from query responses
    const totalEmployees = totalEmployeesResult[0]?.[0]?.totalEmployees || 0;
    const unallocatedEmployees = unallocatedEmployeesResult[0]?.[0]?.unallocatedEmployees || 0;
    const draftEmployees = draftAllocationsResult[0]?.[0]?.draftEmployees || 0;
    const activeProjects = activeProjectsResult[0]?.[0]?.activeProjects || 0;
  
    // Send the response with counts
    context.res = {
      status: 200,
      body: {
        totalEmployees,
        unallocatedEmployees,
        draftEmployees,
        activeProjects,
      }
    };
  
  } catch (error) {
    // Handle any errors during the query execution
    context.log('Error fetching BizOps card data:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error' }
    };
  }
};
