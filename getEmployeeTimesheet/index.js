const mysql = require("mysql2/promise");

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Innover@2024',
  database: process.env.DB_SCHEMA_RMS || 'rms',
  ssl: {
    rejectUnauthorized: false // Use an appropriate certificate authority if required
  },
};

module.exports = async function (context, req) {
  const employeeId = req.query.employeeId;
  const dates = req.query.dates; // Expecting a comma-separated list of dates

  if (!employeeId || !dates) {
    context.res = {
      status: 400,
      body: "Please provide both employeeId and dates in the query parameters.",
    };
    return;
  }

  const dateArray = dates.split(',').map(date => date.trim());

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Use placeholders for each date in the IN clause
    const placeholders = dateArray.map(() => '?').join(',');
    const query = `
      SELECT t.EmployeeID, t.ProjectID, p.ProjectName, t.AllocationID,
             t.TimesheetApprover, t.TimesheetApproverID,
             JSON_OBJECTAGG(
               DATE_FORMAT(t.TimesheetDate, '%Y-%m-%d'),
               JSON_OBJECT(
                 'GUIDID', t.GUIDID,
                 'TimesheetHours', t.TimesheetHours,
                 'AllocationHours', t.AllocationHours,
                 'ApprovalStatus', t.ApprovalStatus,
                 'OnHoliday', t.OnHoliday,
                 'OnLeave', t.OnLeave,
                 'TimesheetApproverComments', t.TimesheetApproverComments
               )
             ) AS DailyDetails
      FROM timesheet_allocation_hours t
      LEFT JOIN Projects p ON t.ProjectID = p.ProjectID
      WHERE t.EmployeeID = ? AND t.TimesheetDate IN (${placeholders})
      GROUP BY t.EmployeeID, t.ProjectID, p.ProjectName, t.AllocationID, 
               t.TimesheetApprover, t.TimesheetApproverID
    `;

    // Spread the dateArray into the query parameters
    const [rows] = await connection.execute(query, [employeeId, ...dateArray]);

    await connection.end();

    // Transform the results
    const transformedRows = rows.map(row => ({
      EmployeeID: row.EmployeeID,
      ProjectID: row.ProjectID,
      ProjectName: row.ProjectName,
      AllocationID: row.AllocationID,
      TimesheetApprover: row.TimesheetApprover,
      TimesheetApproverID: row.TimesheetApproverID,
      DailyDetails: row.DailyDetails
    }));

    context.res = {
      status: 200,
      body: transformedRows,
    };
  } catch (error) {
    context.log("Error fetching employee timesheet:", error);
    context.res = {
      status: 500,
      body: "Internal Server Error",
    };
  }
};