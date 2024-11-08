const mysql = require('mysql2/promise');

// Configure MySQL connection using environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Innover@2024',
  database: process.env.DB_SCHEMA_RMS || 'rms',
  ssl: {
    rejectUnauthorized: false
  },
};

// Create a MySQL connection pool
const pool = mysql.createPool(dbConfig);

module.exports = async function (context, req) {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    context.res = {
      status: 400,
      body: { error: 'Both startDate and endDate parameters are required' }
    };
    return;
  }

  const query = `
    WITH RECURSIVE dates AS (
      SELECT ? as date
      UNION ALL
      SELECT DATE_ADD(date, INTERVAL 1 DAY)
      FROM dates
      WHERE date < ?
    ),
    daily_counts AS (
      SELECT 
        d.date,
        COUNT(DISTINCT CASE 
          WHEN COALESCE(SUM_ALLOC.total_allocation, 0) = 100 
          AND COALESCE(client_alloc.has_client_allocation, 0) = 1
          THEN e.EmployeeId 
          END) as Allocated,
        COUNT(DISTINCT CASE 
          WHEN COALESCE(bench_alloc.bench_allocation, 0) > 0 
          THEN e.EmployeeId 
          END) as Bench,
        COUNT(DISTINCT CASE 
          WHEN COALESCE(SUM_ALLOC.total_allocation, 0) > 0 
          AND COALESCE(SUM_ALLOC.total_allocation, 0) < 100 
          THEN e.EmployeeId 
          END) as Draft,
        COUNT(DISTINCT CASE 
          WHEN COALESCE(SUM_ALLOC.total_allocation, 0) = 0 
          OR SUM_ALLOC.total_allocation IS NULL 
          THEN e.EmployeeId 
          END) as Unallocated
      FROM dates d
      CROSS JOIN Employees e
      LEFT JOIN (
        SELECT 
          EmployeeID,
          date,
          SUM(AllocationPercent) as total_allocation
        FROM dates d
        CROSS JOIN Allocations a
        WHERE d.date BETWEEN a.AllocationStartDate AND a.AllocationEndDate
        AND a.AllocationStatus IN ('Client Unallocated', 'Project Unallocated', 'Allocated')
        GROUP BY EmployeeID, date
      ) SUM_ALLOC ON e.EmployeeId = SUM_ALLOC.EmployeeID AND d.date = SUM_ALLOC.date
      LEFT JOIN (
        SELECT 
          EmployeeID,
          date,
          1 as has_client_allocation
        FROM dates d
        CROSS JOIN Allocations a
        WHERE d.date BETWEEN a.AllocationStartDate AND a.AllocationEndDate
        AND a.AllocationStatus IN ('Client Unallocated', 'Project Unallocated', 'Allocated')
        AND a.ClientID != 1
        GROUP BY EmployeeID, date
      ) client_alloc ON e.EmployeeId = client_alloc.EmployeeID AND d.date = client_alloc.date
      LEFT JOIN (
        SELECT 
          EmployeeID,
          date,
          SUM(AllocationPercent) as bench_allocation
        FROM dates d
        CROSS JOIN Allocations a
        WHERE d.date BETWEEN a.AllocationStartDate AND a.AllocationEndDate
        AND a.AllocationStatus IN ('Client Unallocated', 'Project Unallocated', 'Allocated')
        AND a.ClientID = 1
        GROUP BY EmployeeID, date
      ) bench_alloc ON e.EmployeeId = bench_alloc.EmployeeID AND d.date = bench_alloc.date
      WHERE e.EmployeeKekaStatus = 'Active'
      GROUP BY d.date
    )
    SELECT 
      DATE_FORMAT(date, '%Y-%m-%d') as date,
      Allocated,
      Bench,
      Draft,
      Unallocated
    FROM daily_counts
    ORDER BY date;
  `;

  try {
    const [results] = await pool.query(query, [startDate, endDate]);
    
    context.res = {
      status: 200,
      body: results
    };
  } catch (err) {
    context.log('Error executing allocations query:', err);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error', details: err.message }
    };
  }
};