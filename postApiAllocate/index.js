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

/**
 * Helper function to generate an array of dates between two dates (inclusive)
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Array<String>} Array of date strings in 'YYYY-MM-DD' format
 */
function getDateRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);
  const theEndDate = new Date(endDate);
  
  while (currentDate <= theEndDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Helper function to determine AllocationHours based on AllocationPercent
 * @param {Number} percent 
 * @returns {Number} AllocationHours
 */
function getAllocationHours(percent) {
  const mapping = {
    0: 0,
    25: 2,
    50: 4,
    75: 6,
    100: 8
  };
  return mapping[percent] !== undefined ? mapping[percent] : 0;
}

module.exports = async function (context, req) {
  const {
    EmployeeID,
    ClientID,
    ProjectID,
    AllocationStatus,
    AllocationPercent,
    AllocationStartDate,
    AllocationEndDate,
    AllocationTimeSheetApproverID,
    AllocationTimeSheetApprover,
    AllocationBillingRate,
    AllocationBillingType,
    AllocationBilledCheck,
    ModifiedBy,
  } = req.body;

  context.log('Received data:', req.body);

  // Validate required fields
  if (
    !EmployeeID ||
    !ClientID ||
    !ProjectID ||
    !AllocationStatus ||
    AllocationPercent === undefined ||
    !AllocationStartDate ||
    AllocationBillingRate === undefined ||
    !AllocationBillingType ||
    !AllocationTimeSheetApproverID ||
    !AllocationTimeSheetApprover ||
    !AllocationBilledCheck
  ) {
    context.res = {
      status: 400,
      body: { message: 'Required fields are missing' },
    };
    return;
  }

  try {
    // Validate AllocationStatus
    const validStatuses = ['Client Unallocated', 'Project Unallocated', 'Allocated', 'Closed'];
    if (!validStatuses.includes(AllocationStatus)) {
      context.res = { status: 400, body: { message: 'Invalid AllocationStatus value' } };
      return;
    }

    // Validate AllocationPercent
    if (AllocationPercent < 0 || AllocationPercent > 100) {
      context.res = { status: 400, body: { message: 'AllocationPercent must be between 0 and 100' } };
      return;
    }

    // Validate AllocationBillingType
    const validBillingTypes = ['T&M', 'Fix Price'];
    if (!validBillingTypes.includes(AllocationBillingType)) {
      context.res = { status: 400, body: { message: 'Invalid AllocationBillingType value' } };
      return;
    }

    // Validate AllocationBilledCheck
    const validBilledCheckValues = ['Yes', 'No'];
    if (!validBilledCheckValues.includes(AllocationBilledCheck)) {
      context.res = { status: 400, body: { message: 'Invalid AllocationBilledCheck value' } };
      return;
    }

    // Validate Start Date
    const startDate = new Date(AllocationStartDate);
    const minStartDate = new Date('2020-01-01');
    if (startDate < minStartDate) {
      context.res = { status: 400, body: { message: 'Start Date cannot be before January 1, 2020.' } };
      return;
    }

    // Establish a connection and start a transaction
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert into Allocations
      const insertAllocationQuery = `
        INSERT INTO Allocations (
          ClientID,
          ProjectID,
          EmployeeID,
          AllocationStatus,
          AllocationPercent,
          AllocationStartDate,
          AllocationEndDate,
          AllocationTimeSheetApproverID,
          AllocationTimeSheetApprover,
          AllocationBillingRate,
          AllocationBillingType,
          AllocationBilledCheck,
          ModifiedBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [allocationResult] = await connection.execute(
        insertAllocationQuery,
        [
          ClientID,
          ProjectID,
          EmployeeID,
          AllocationStatus,
          AllocationPercent,
          AllocationStartDate,
          AllocationEndDate || null,
          AllocationTimeSheetApproverID,
          AllocationTimeSheetApprover,
          AllocationBilledCheck === 'Yes' ? parseFloat(AllocationBillingRate) : 0.00,
          AllocationBillingType,
          AllocationBilledCheck,
          ModifiedBy,
        ]
      );

      const AllocationID = allocationResult.insertId;

      // Determine AllocationHours
      const AllocationHours = getAllocationHours(AllocationPercent);

      // Generate date range
      const endDate = AllocationEndDate ? new Date(AllocationEndDate) : new Date('9999-12-31');
      const dates = getDateRange(startDate, endDate);

      // Updated insert query to include AllocationStatus
      const insertTimesheetQuery = `
        INSERT INTO timesheet_allocation_hours (
          AllocationID,
          EmployeeID,
          ProjectID,
          ClientID,
          TimesheetApproverID,
          TimesheetApprover,
          TimesheetDate,
          TimesheetHours,
          AllocationHours,
          AllocationPercent,
          AllocationStatus,
          TimesheetApproverComments,
          ApprovalStatus,
          OnHoliday,
          OnLeave
        ) VALUES ?
      `;

      const timesheetValues = dates.map(date => [
        AllocationID,
        EmployeeID,
        ProjectID,
        ClientID,
        AllocationTimeSheetApproverID,
        AllocationTimeSheetApprover,
        date,
        0, // TimesheetHours
        AllocationHours,
        AllocationPercent,
        AllocationStatus, // Added AllocationStatus
        null, // TimesheetApproverComments
        '0', // ApprovalStatus
        false, // OnHoliday
        false, // OnLeave
      ]);

      if (timesheetValues.length > 0) {
        await connection.query(insertTimesheetQuery, [timesheetValues]);
      }

      // Commit the transaction
      await connection.commit();

      // Release the connection
      connection.release();

      context.res = {
        status: 201,
        body: { message: 'Allocation added successfully', AllocationID },
      };
    } catch (transactionError) {
      // Rollback the transaction in case of error
      await connection.rollback();
      connection.release();
      context.log('Transaction Error:', transactionError);
      context.res = { status: 500, body: { message: 'Internal Server Error', error: transactionError.message } };
    }
  } catch (err) {
    context.log('Error inserting allocation:', err);
    context.res = { status: 500, body: { message: 'Internal Server Error', error: err.message } };
  }
};