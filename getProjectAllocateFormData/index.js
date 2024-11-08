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
  const { employeeName, employeeId, startDate, endDate } = req.query;

  // Validate input parameters
  if ((!employeeName && !employeeId) || !startDate || !endDate) {
    context.res = {
      status: 400,
      body: { message: 'employeeName or employeeId, startDate, and endDate are required.' }
    };
    return;
  }

  try {
    let employee;

    // Fetch employee by name if provided
    if (employeeName) {
      const nameQuery = `SELECT EmployeeId, EmployeeName FROM Employees WHERE EmployeeName = ? AND EmployeeKekaStatus = 'Active' LIMIT 1`;
      const [nameResult] = await pool.query(nameQuery, [employeeName]);

      if (nameResult.length === 0) {
        context.res = {
          status: 404,
          body: { message: 'Employee not found with the provided name.' }
        };
        return;
      }

      employee = nameResult[0];
    } 
    // Fetch employee by ID if provided
    else if (employeeId) {
      const idQuery = `SELECT EmployeeId, EmployeeName FROM Employees WHERE EmployeeId = ? AND EmployeeKekaStatus = 'Active' LIMIT 1`;
      const [idResult] = await pool.query(idQuery, [employeeId]);

      if (idResult.length === 0) {
        context.res = {
          status: 404,
          body: { message: 'Employee not found with the provided ID.' }
        };
        return;
      }

      employee = idResult[0];
    }

    // Fetch allocation data for the employee within the date range
    const allocationQuery = `
      SELECT 
        AllocationPercent 
      FROM Allocations 
      WHERE EmployeeID = ? 
        AND (
          (AllocationStartDate <= ? AND (AllocationEndDate >= ? OR AllocationEndDate IS NULL))
        )
        AND AllocationStatus IN ('Client Unallocated', 'Project Unallocated', 'Allocated')
    `;
    const [allocationResults] = await pool.query(allocationQuery, [employee.EmployeeId, endDate, startDate]);

    // Calculate total allocation
    const totalAllocation = allocationResults.reduce((sum, alloc) => sum + alloc.AllocationPercent, 0);

    // Send the result as the response
    context.res = {
      status: 200,
      body: {
        employeeId: employee.EmployeeId,
        employeeName: employee.EmployeeName,
        allocationData: {
          allocated: totalAllocation,
          unallocated: 100 - totalAllocation,
        },
      }
    };
  } catch (error) {
    context.log('Error in /project-allocate/form/data:', error);
    context.res = {
      status: 500,
      body: { message: 'Internal Server Error' }
    };
  }
};
