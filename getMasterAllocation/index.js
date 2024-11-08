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
  try {
    const { startDate, endDate } = req.query;

    // Base query with necessary joins
    let query = `
      SELECT 
        a.AllocationID, a.EmployeeID, 
        e.EmployeeName, e.EmployeeLocation, e.EmployeeContractType,
        e.EmployeeJoiningDate, e.EmployeeEndingDate, e.EmployeeStudio,
        e.EmployeeSubStudio, e.EmployeeRole, e.EmployeeTYOE, e.EmployeeKekaStatus,
        a.ClientID, c.ClientName, c.ClientPartner,
        a.ProjectID, p.ProjectName, p.ProjectManager,
        a.AllocationStatus, a.AllocationPercent, a.AllocationBillingType,
        a.AllocationBilledCheck, a.AllocationBillingRate, a.AllocationTimeSheetApprover,
        a.AllocationTimeSheetApproverID,
        a.AllocationStartDate, a.AllocationEndDate, a.ModifiedBy, a.ModifiedAt
      FROM 
        Allocations a
      LEFT JOIN 
        Employees e ON a.EmployeeID = e.EmployeeId
      LEFT JOIN 
        Clients c ON a.ClientID = c.ClientID
      LEFT JOIN 
        Projects p ON a.ProjectID = p.ProjectID
    `;

    // Modified WHERE clause to check for overlapping date ranges
    const conditions = [];
    const values = [];

    if (startDate && endDate) {
      // This condition will check if:
      // 1. Allocation starts within the date range OR
      // 2. Allocation ends within the date range OR
      // 3. Allocation spans the entire date range
      conditions.push(`(
        (a.AllocationStartDate BETWEEN ? AND ?) OR
        (a.AllocationEndDate BETWEEN ? AND ?) OR
        (a.AllocationStartDate <= ? AND a.AllocationEndDate >= ?)
      )`);
      values.push(startDate, endDate, startDate, endDate, startDate, endDate);
    } else if (startDate) {
      conditions.push(`a.AllocationEndDate >= ?`);
      values.push(startDate);
    } else if (endDate) {
      conditions.push(`a.AllocationStartDate <= ?`);
      values.push(endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Add LIMIT to prevent overwhelming results
    query += ' ORDER BY a.AllocationStartDate DESC LIMIT 1000;';

    // Execute the query
    const [results] = await pool.query(query, values);

    // Return the results
    context.res = {
      status: 200,
      body: { masterAllocations: results }
    };
  } catch (err) {
    // Handle errors and send an error response
    context.log('Error fetching master allocations:', err);
    context.res = {
      status: 500,
      body: { message: 'Internal Server Error' }
    };
  }
};