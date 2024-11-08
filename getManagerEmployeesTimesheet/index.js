// timesheetApproverView.js
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Innover@2024',
  database: process.env.DB_SCHEMA_RMS || 'rms',
  ssl: {
    rejectUnauthorized: false // Use an appropriate certificate authority if required
  },
};

const pool = mysql.createPool(dbConfig);

module.exports = async function (context, req) {
  try {
    const employeeId = context.bindingData.employeeId;
    const projectId = context.bindingData.projectId;
    const weekOffset = parseInt(req.query.weekOffset || '0');

    if (!employeeId || !projectId) {
      context.res = {
        status: 400,
        body: { error: 'EmployeeId and ProjectId are required parameters' }
      };
      return;
    }

    // Get week dates
    const today = new Date();
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
    
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

    const startDate = firstDayOfWeek.toISOString().split('T')[0];
    const endDate = lastDayOfWeek.toISOString().split('T')[0];

    // Modified query to include week range filter
    const query = `
      SELECT
        e.EmployeeId,
        e.EmployeeName,
        e.EmployeeEmail,
        e.EmployeeRole,
        e.EmployeeKekaStatus,
        e.EmployeeContractType,
        tah.GUIDID,
        tah.AllocationID,
        DATE_FORMAT(tah.TimesheetDate, '%Y-%m-%d') as TimesheetDate,
        tah.AllocationHours,
        CAST(COALESCE(tah.TimesheetHours, 0) AS DECIMAL(5,2)) as TimesheetHours,
        tah.ApprovalStatus,
        tah.OnHoliday,
        tah.OnLeave,
        tah.TimesheetApproverComments,
        tah.AllocationPercent as AllocationPercentage,
        tah.AllocationStatus
      FROM Employees e
      INNER JOIN timesheet_allocation_hours tah ON e.EmployeeId = tah.EmployeeID
      INNER JOIN Allocations a ON tah.AllocationID = a.AllocationID
      WHERE a.ProjectID = ?
      AND a.AllocationTimeSheetApproverID = ?
      AND tah.TimesheetDate BETWEEN ? AND ?
      ORDER BY e.EmployeeId, TimesheetDate;
    `;

    const [results] = await pool.query(query, [projectId, employeeId, startDate, endDate]);

    if (results.length === 0) {
      context.res = {
        status: 200,
        body: {
          weekRange: {
            startDate,
            endDate
          },
          employees: []
        }
      };
      return;
    }

    // Transform the data
    const employeeMap = new Map();

    results.forEach(row => {
      if (!employeeMap.has(row.EmployeeId)) {
        employeeMap.set(row.EmployeeId, {
          EmployeeId: row.EmployeeId,
          EmployeeName: row.EmployeeName,
          EmployeeEmail: row.EmployeeEmail,
          EmployeeRole: row.EmployeeRole,
          EmployeeKekaStatus: row.EmployeeKekaStatus,
          EmployeeContractType: row.EmployeeContractType,
          allocatedHours: 0,
          workedHours: 0,
          holidays: 0,
          leaves: 0,
          timesheet: []
        });
      }

      const employee = employeeMap.get(row.EmployeeId);

      const timesheetHours = parseFloat(row.TimesheetHours) || 0;
      const allocationHours = parseInt(row.AllocationHours) || 0;

      const timesheetEntry = {
        guidId: row.GUIDID,
        AllocationID: row.AllocationID,
        TimesheetDate: row.TimesheetDate,
        AllocationHours: allocationHours,
        TimesheetHours: timesheetHours.toFixed(2),
        ApprovalStatus: row.ApprovalStatus,
        OnHoliday: row.OnHoliday,
        OnLeave: row.OnLeave,
        TimesheetApproverComments: row.TimesheetApproverComments,
        AllocationPercentage: row.AllocationPercentage,
        AllocationStatus: row.AllocationStatus
      };

      employee.allocatedHours += allocationHours;
      employee.workedHours += timesheetHours;
      employee.holidays += row.OnHoliday ? 1 : 0;
      employee.leaves += row.OnLeave ? 1 : 0;
      employee.timesheet.push(timesheetEntry);
    });

    const response = {
      weekRange: {
        startDate,
        endDate
      },
      employees: Array.from(employeeMap.values()).map(employee => ({
        ...employee,
        workedHours: parseFloat(employee.workedHours.toFixed(2)),
        workedPercentage: employee.allocatedHours > 0 
          ? Math.round((employee.workedHours / employee.allocatedHours) * 100)
          : 0
      }))
    };

    context.res = {
      status: 200,
      body: response
    };
  } catch (error) {
    context.log('Error processing timesheet data:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error', details: error.message }
    };
  }
};