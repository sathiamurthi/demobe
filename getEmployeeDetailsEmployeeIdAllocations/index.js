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
  const employeeId = req.params.employeeId;
  const filter = req.query.filter ? req.query.filter.toLowerCase() : 'all'; // Default to 'all' if not provided

  // Validate that Employee ID is provided
  if (!employeeId) {
    context.res = {
      status: 400,
      body: { message: 'Employee ID is required' },
    };
    return;
  }

  try {
    // Base query to retrieve allocations for the specified EmployeeID with ClientName and ProjectName
    let allocationsQuery = `
      SELECT 
        a.AllocationID, 
        a.ClientID, 
        c.ClientName,
        a.ProjectID, 
        p.ProjectName,
        a.AllocationStatus, 
        a.AllocationPercent, 
        a.AllocationBillingType, 
        a.AllocationBilledCheck, 
        a.AllocationBillingRate,
        a.AllocationTimeSheetApproverID,
        a.AllocationTimeSheetApprover, 
        a.AllocationStartDate, 
        a.AllocationEndDate, 
        a.ModifiedBy, 
        a.ModifiedAt
      FROM Allocations a
      LEFT JOIN Clients c ON a.ClientID = c.ClientID
      LEFT JOIN Projects p ON a.ProjectID = p.ProjectID
      WHERE a.EmployeeID = ?
    `;

    // Modify the query based on the filter
    if (filter === 'active') {
      allocationsQuery += `
        AND a.AllocationStatus IN ('Client Unallocated', 'Project Unallocated', 'Allocated')
        AND CURRENT_DATE() >= a.AllocationStartDate
        AND (a.AllocationEndDate IS NULL OR CURRENT_DATE() <= a.AllocationEndDate)
      `;
    } else if (filter === 'closed') {
      allocationsQuery += `
        AND (a.AllocationStatus = 'Closed' OR CURRENT_DATE() > a.AllocationEndDate)
      `;
    }

    // Execute the allocations query
    const [allocationsResults] = await pool.query(allocationsQuery, [employeeId]);

    // Query to compute the current allocation percentage (based on active allocations)
    const currentAllocationQuery = `
      SELECT 
        COALESCE(SUM(a.AllocationPercent), 0) AS Current_Allocation
      FROM Allocations a
      WHERE a.EmployeeID = ?
        AND a.AllocationStatus IN ('Client Unallocated', 'Project Unallocated', 'Allocated')
        AND CURRENT_DATE() >= a.AllocationStartDate
        AND (a.AllocationEndDate IS NULL OR CURRENT_DATE() <= a.AllocationEndDate)
    `;

    // Execute the current allocation query
    const [currentAllocationResults] = await pool.query(currentAllocationQuery, [employeeId]);

    // Extract the current allocation percentage
    const currentAllocation = currentAllocationResults[0].Current_Allocation;

    // Respond with both allocations and current allocation percentage
    context.res = {
      status: 200,
      body: {
        allocations: allocationsResults,
        currentAllocation: currentAllocation,
      },
    };
  } catch (err) {
    // Log and return the error
    context.log('Error executing allocation queries:', err);
    context.res = {
      status: 500,
      body: { message: 'Internal Server Error' },
    };
  }
};
