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
  const { employeeId } = req.params;
  const { startDate, endDate } = req.query;

  // Validate the presence of startDate and endDate
  if (!startDate || !endDate) {
    context.res = {
      status: 400,
      body: { error: 'startDate and endDate are required.' }
    };
    return;
  }

  // Ensure startDate is before or equal to endDate
  if (new Date(startDate) > new Date(endDate)) {
    context.res = {
      status: 400,
      body: { error: 'startDate cannot be after endDate.' }
    };
    return;
  }

  try {
    // SQL query to calculate total allocation within the date range
    const allocationQuery = `
      SELECT 
        IFNULL(SUM(AllocationPercent), 0) AS totalAllocation 
      FROM Allocations 
      WHERE 
        EmployeeID = ? AND 
        AllocationStatus IN ('Active', 'Allocated') AND
        (
          (AllocationStartDate <= ? AND (AllocationEndDate >= ? OR AllocationEndDate IS NULL))
        )
    `;

    // SQL query to calculate staged additions within the date range
    const stagedAdditionsQuery = `
      SELECT IFNULL(SUM(AllocationPercent), 0) AS stagedAdditions 
      FROM Allocations 
      WHERE 
        EmployeeID = ? AND 
        AllocationStatus = 'Staged' AND
        (
          (AllocationStartDate <= ? AND (AllocationEndDate >= ? OR AllocationEndDate IS NULL))
        )
    `;

    // Execute both queries in parallel using Promise.all
    const [[allocationResult], [stagedResult]] = await Promise.all([
      pool.query(allocationQuery, [employeeId, endDate, startDate]),
      pool.query(stagedAdditionsQuery, [employeeId, endDate, startDate])
    ]);

    // Extract the results
    const totalAllocation = allocationResult[0].totalAllocation;
    const stagedAdditions = stagedResult[0].stagedAdditions;
    const remainingAllocation = 100 - totalAllocation - stagedAdditions;

    // Ensure remainingAllocation doesn't go below 0
    const adjustedRemaining = remainingAllocation >= 0 ? remainingAllocation : 0;

    // Send the result as the response
    context.res = {
      status: 200,
      body: { 
        totalAllocation, 
        stagedAdditions, 
        remainingAllocation: adjustedRemaining 
      }
    };
  } catch (err) {
    context.log('Error fetching allocation data:', err);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error' }
    };
  }
};
