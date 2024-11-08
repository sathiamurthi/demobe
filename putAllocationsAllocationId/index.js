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
  const { allocationId } = req.params;
  const {
    ClientID,
    ProjectID,
    AllocationPercent,
    AllocationStatus,
    AllocationStartDate,
    AllocationEndDate,
    AllocationTimeSheetApproverID,
    AllocationTimeSheetApprover,
    AllocationBillingRate,
    AllocationBillingType,
    AllocationBilledCheck,
    ModifiedBy,
  } = req.body;

  context.log('Received data for update:', req.body);

  // Validate required fields
  if (
    !ClientID ||
    !ProjectID ||
    !AllocationStatus ||
    AllocationPercent === undefined ||
    !AllocationStartDate ||
    !AllocationBillingType ||
    !AllocationBilledCheck ||
    !AllocationTimeSheetApproverID ||
    !AllocationTimeSheetApprover
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

    // Validate AllocationPercent as a number
    const numericAllocationPercent = parseFloat(AllocationPercent);
    if (isNaN(numericAllocationPercent) || numericAllocationPercent < 0 || numericAllocationPercent > 100) {
      context.res = { status: 400, body: { message: 'AllocationPercent must be a valid number between 0 and 100' } };
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

      // Fetch existing Allocation
      const fetchAllocationQuery = `SELECT * FROM Allocations WHERE AllocationID = ?`;
      const [existingAllocationRows] = await connection.execute(fetchAllocationQuery, [allocationId]);

      if (existingAllocationRows.length === 0) {
        await connection.rollback();
        connection.release();
        context.res = { status: 404, body: { message: 'Allocation not found' } };
        return;
      }

      const existingAllocation = existingAllocationRows[0];

      // Update Allocations
      const updateAllocationQuery = `
        UPDATE Allocations SET
          ClientID = ?,
          ProjectID = ?,
          AllocationPercent = ?,
          AllocationStatus = ?,
          AllocationStartDate = ?,
          AllocationEndDate = ?,
          AllocationTimeSheetApproverID = ?,
          AllocationTimeSheetApprover = ?,
          AllocationBillingRate = ?,
          AllocationBillingType = ?,
          AllocationBilledCheck = ?,
          ModifiedBy = ?,
          ModifiedAt = CURRENT_TIMESTAMP
        WHERE AllocationID = ?
      `;
      await connection.execute(updateAllocationQuery, [
        ClientID,
        ProjectID,
        numericAllocationPercent,
        AllocationStatus,
        AllocationStartDate,
        AllocationEndDate || null,
        AllocationTimeSheetApproverID,
        AllocationTimeSheetApprover,
        AllocationBilledCheck === 'Yes' ? parseFloat(AllocationBillingRate) : 0.00,
        AllocationBillingType,
        AllocationBilledCheck,
        ModifiedBy,
        allocationId,
      ]);

      // Check if we need to update timesheet_allocation_hours
      const needsTimesheetUpdate = 
        ProjectID !== existingAllocation.ProjectID ||
        ClientID !== existingAllocation.ClientID ||
        numericAllocationPercent !== existingAllocation.AllocationPercent ||
        AllocationTimeSheetApproverID !== existingAllocation.AllocationTimeSheetApproverID ||
        AllocationTimeSheetApprover !== existingAllocation.AllocationTimeSheetApprover ||
        AllocationStartDate !== existingAllocation.AllocationStartDate ||
        AllocationEndDate !== existingAllocation.AllocationEndDate ||
        AllocationStatus !== existingAllocation.AllocationStatus;  // Added this condition

      if (needsTimesheetUpdate) {
        const newAllocationHours = getAllocationHours(numericAllocationPercent);
        const oldStartDate = new Date(existingAllocation.AllocationStartDate);
        const newStartDate = new Date(AllocationStartDate);
        const oldEndDate = existingAllocation.AllocationEndDate ? new Date(existingAllocation.AllocationEndDate) : new Date('9999-12-31');
        const newEndDate = AllocationEndDate ? new Date(AllocationEndDate) : new Date('9999-12-31');

        // Update existing entries
        const updateExistingQuery = `
          UPDATE timesheet_allocation_hours
          SET 
            ProjectID = ?,
            ClientID = ?,
            AllocationHours = ?,
            AllocationPercent = ?,
            TimesheetApproverID = ?,
            TimesheetApprover = ?,
            AllocationStatus = ?,  # Added AllocationStatus
            TimesheetApproverComments = CASE
              WHEN ? != ? OR ? != ? THEN NULL
              ELSE TimesheetApproverComments
            END,
            ApprovalStatus = CASE
              WHEN ? != ? OR ? != ? OR ? != ? OR ? != ? THEN '0'  # Added AllocationStatus check
              ELSE ApprovalStatus
            END
          WHERE 
            AllocationID = ? AND
            TimesheetDate >= ? AND
            TimesheetDate <= ?
        `;
        await connection.execute(updateExistingQuery, [
          ProjectID,
          ClientID,
          newAllocationHours,
          numericAllocationPercent,
          AllocationTimeSheetApproverID,
          AllocationTimeSheetApprover,
          AllocationStatus,  // Added AllocationStatus
          // Parameters for TimesheetApproverComments CASE
          AllocationTimeSheetApproverID, existingAllocation.AllocationTimeSheetApproverID,
          AllocationTimeSheetApprover, existingAllocation.AllocationTimeSheetApprover,
          // Parameters for ApprovalStatus CASE
          numericAllocationPercent, existingAllocation.AllocationPercent,
          AllocationTimeSheetApproverID, existingAllocation.AllocationTimeSheetApproverID,
          AllocationTimeSheetApprover, existingAllocation.AllocationTimeSheetApprover,
          AllocationStatus, existingAllocation.AllocationStatus,  // Added AllocationStatus check
          allocationId,
          oldStartDate.toISOString().split('T')[0],
          (newEndDate < oldEndDate ? newEndDate : oldEndDate).toISOString().split('T')[0]
        ]);

        // Remove entries outside the new date range
        if (newStartDate > oldStartDate || newEndDate < oldEndDate) {
          const deleteOutsideRangeQuery = `
            DELETE FROM timesheet_allocation_hours
            WHERE 
              AllocationID = ? AND
              (TimesheetDate < ? OR TimesheetDate > ?)
          `;
          await connection.execute(deleteOutsideRangeQuery, [
            allocationId,
            newStartDate.toISOString().split('T')[0],
            newEndDate.toISOString().split('T')[0]
          ]);
        }

        // Add new entries if the date range is extended
        if (newStartDate < oldStartDate || newEndDate > oldEndDate) {
          const insertNewEntriesQuery = `
            INSERT INTO timesheet_allocation_hours 
            (AllocationID, EmployeeID, ProjectID, ClientID, TimesheetApproverID, TimesheetApprover, 
             TimesheetDate, TimesheetHours, AllocationHours, AllocationPercent, AllocationStatus, ApprovalStatus, OnHoliday, OnLeave)
            VALUES ?
          `;
          
          const newEntries = [];
          let currentDate = new Date(Math.min(newStartDate, oldStartDate));
          const lastDate = new Date(Math.max(newEndDate, oldEndDate));
          
          while (currentDate <= lastDate) {
            const dateString = currentDate.toISOString().split('T')[0];
            if (currentDate < oldStartDate || currentDate > oldEndDate) {
              newEntries.push([
                allocationId,
                existingAllocation.EmployeeID,
                ProjectID,
                ClientID,
                AllocationTimeSheetApproverID,
                AllocationTimeSheetApprover,
                dateString,
                0,  // TimesheetHours
                newAllocationHours,
                numericAllocationPercent,
                AllocationStatus,  // Added AllocationStatus
                '0',  // ApprovalStatus
                false,  // OnHoliday
                false  // OnLeave
              ]);
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          if (newEntries.length > 0) {
            await connection.query(insertNewEntriesQuery, [newEntries]);
          }
        }
      }

      // Commit the transaction
      await connection.commit();
      connection.release();

      context.res = {
        status: 200,
        body: { message: 'Allocation updated successfully' },
      };
    } catch (transactionError) {
      // Rollback the transaction in case of error
      await connection.rollback();
      connection.release();
      context.log('Transaction Error:', transactionError);
      context.res = { status: 500, body: { message: 'Internal Server Error', error: transactionError.message } };
    }
  } catch (err) {
    context.log('Error updating allocation:', err);
    context.res = { status: 500, body: { error: 'Internal Server Error', message: err.message } };
  }
};