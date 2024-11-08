// allocations-upload/index.js
const mysql = require('mysql2/promise');

// Configure MySQL connection using environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Innover@2024', // Replace with your actual password
  database: process.env.DB_SCHEMA_RMS || 'rms',
  ssl: {
    rejectUnauthorized: false // Use an appropriate certificate authority if required
  },
};

// Create a MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Utility function to convert empty fields to null
const emptyToNull = (value) => (value === '' || value === 'NULL' ? null : value);

// Allowed Allocation Statuses
const allowedAllocationStatuses = ['Client Unallocated', 'Project Unallocated', 'Allocated', 'Closed'];

// Allowed Allocation Billing Types
const allowedAllocationBillingTypes = ['T&M', 'Fix Price'];

// Allowed Allocation Billed Check Values
const allowedAllocationBilledCheckValues = ['Yes', 'No'];

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
  // Check if request body exists and is an array
  if (!req.body || !Array.isArray(req.body)) {
    context.res = {
      status: 400,
      body: "Please provide an array of allocation details.",
    };
    return;
  }

  const allocations = req.body;
  const requiredFields = [
    'ClientID',
    'ProjectID',
    'EmployeeID',
    'AllocationStatus',
    'AllocationPercent',
    'AllocationStartDate',
    'AllocationTimeSheetApproverID',
    'AllocationTimeSheetApprover',
    'AllocationBillingRate',
    'AllocationBillingType',
    'AllocationBilledCheck',
  ];

  // Validate each allocation record
  const invalidRecords = allocations.filter(allocation =>
    !requiredFields.every(field =>
      allocation.hasOwnProperty(field) &&
      allocation[field] !== undefined &&
      allocation[field] !== ''
    )
  );

  if (invalidRecords.length > 0) {
    context.res = {
      status: 400,
      body: {
        message: "Some allocation records are missing required fields.",
        missingFields: requiredFields,
        invalidRecordsCount: invalidRecords.length,
      },
    };
    return;
  }

  let connection;

  try {
    connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      let processedRecords = 0;
      const successes = [];
      const failures = [];

      for (const [index, allocation] of allocations.entries()) {
        try {
          // Extract allocation details and convert empty values to null
          const AllocationID = emptyToNull(allocation.AllocationID);
          const ClientID = parseInt(emptyToNull(allocation.ClientID), 10);
          const ProjectID = parseInt(emptyToNull(allocation.ProjectID), 10);
          const EmployeeID = emptyToNull(allocation.EmployeeID);
          const AllocationStatus = emptyToNull(allocation.AllocationStatus);
          const AllocationPercent = parseInt(allocation.AllocationPercent, 10);
          const AllocationStartDate = emptyToNull(allocation.AllocationStartDate);
          const AllocationEndDate = emptyToNull(allocation.AllocationEndDate);
          const AllocationTimeSheetApproverID = emptyToNull(allocation.AllocationTimeSheetApproverID);
          const AllocationTimeSheetApprover = emptyToNull(allocation.AllocationTimeSheetApprover);
          const AllocationBillingRate = parseFloat(allocation.AllocationBillingRate);
          const AllocationBillingType = emptyToNull(allocation.AllocationBillingType);
          const AllocationBilledCheck = emptyToNull(allocation.AllocationBilledCheck);
          const ModifiedBy = 'Uploaded From Excel';

          // Validate AllocationStatus
          if (!allowedAllocationStatuses.includes(AllocationStatus)) {
            throw new Error(`Invalid AllocationStatus: ${AllocationStatus}. Allowed values are ${allowedAllocationStatuses.join(', ')}.`);
          }

          // Validate AllocationBillingType
          if (!allowedAllocationBillingTypes.includes(AllocationBillingType)) {
            throw new Error(`Invalid AllocationBillingType: ${AllocationBillingType}. Allowed values are ${allowedAllocationBillingTypes.join(', ')}.`);
          }

          // Validate AllocationBilledCheck
          if (!allowedAllocationBilledCheckValues.includes(AllocationBilledCheck)) {
            throw new Error(`Invalid AllocationBilledCheck: ${AllocationBilledCheck}. Allowed values are ${allowedAllocationBilledCheckValues.join(', ')}.`);
          }

          // Validate AllocationPercent
          if (isNaN(AllocationPercent) || AllocationPercent < 0 || AllocationPercent > 100) {
            throw new Error(`Invalid AllocationPercent: ${allocation.AllocationPercent}. Must be between 0 and 100.`);
          }

          // Validate AllocationStartDate format (YYYY-MM-DD)
          if (!/^\d{4}-\d{2}-\d{2}$/.test(AllocationStartDate)) {
            throw new Error(`Invalid AllocationStartDate format: ${AllocationStartDate}. Expected format is YYYY-MM-DD.`);
          }

          // Validate AllocationEndDate format (YYYY-MM-DD) or null
          if (AllocationEndDate && !/^\d{4}-\d{2}-\d{2}$/.test(AllocationEndDate)) {
            throw new Error(`Invalid AllocationEndDate format: ${AllocationEndDate}. Expected format is YYYY-MM-DD.`);
          }

          // Validate ClientID exists
          const [clientRows] = await connection.query(
            'SELECT ClientID FROM Clients WHERE ClientID = ?',
            [ClientID]
          );
          if (clientRows.length === 0) {
            throw new Error(`ClientID ${ClientID} does not exist.`);
          }

          // Validate ProjectID exists and is mapped to the same ClientID
          const [projectRows] = await connection.query(
            'SELECT ProjectID, ClientID FROM Projects WHERE ProjectID = ?',
            [ProjectID]
          );
          if (projectRows.length === 0) {
            throw new Error(`ProjectID ${ProjectID} does not exist.`);
          }
          if (projectRows[0].ClientID !== ClientID) {
            throw new Error(`ProjectID ${ProjectID} is not mapped to ClientID ${ClientID}.`);
          }

          // Validate EmployeeID exists
          const [employeeRows] = await connection.query(
            'SELECT EmployeeId FROM Employees WHERE EmployeeId = ?',
            [EmployeeID]
          );
          if (employeeRows.length === 0) {
            throw new Error(`EmployeeID ${EmployeeID} does not exist.`);
          }

          // Validate AllocationTimeSheetApproverID exists
          const [approverRows] = await connection.query(
            'SELECT EmployeeName FROM Employees WHERE EmployeeId = ?',
            [AllocationTimeSheetApproverID]
          );
          if (approverRows.length === 0) {
            throw new Error(`AllocationTimeSheetApproverID ${AllocationTimeSheetApproverID} does not exist.`);
          }
          const AllocationTimeSheetApproverName = approverRows[0].EmployeeName;

          // AllocationHours based on AllocationPercent
          const AllocationHours = getAllocationHours(AllocationPercent);

          // Process allocation
          if (AllocationID) {
            // Update existing allocation
            const [existingAllocationRows] = await connection.query(
              'SELECT * FROM Allocations WHERE AllocationID = ?',
              [AllocationID]
            );

            if (existingAllocationRows.length === 0) {
              throw new Error(`AllocationID ${AllocationID} does not exist. To create a new allocation, omit AllocationID.`);
            }

            const existingAllocation = existingAllocationRows[0];

            // Check if the new combination exists in another allocation
            const [duplicateCheckRows] = await connection.query(
              'SELECT AllocationID FROM Allocations WHERE EmployeeID = ? AND ClientID = ? AND ProjectID = ? AND AllocationStartDate = ? AND IFNULL(AllocationEndDate, "9999-12-31") = IFNULL(?, "9999-12-31") AND AllocationID != ?',
              [EmployeeID, ClientID, ProjectID, AllocationStartDate, AllocationEndDate, AllocationID]
            );

            if (duplicateCheckRows.length > 0) {
              throw new Error(`An allocation with the same combination of EmployeeID, ClientID, ProjectID, AllocationStartDate, and AllocationEndDate already exists.`);
            }

            const updateQuery = `
              UPDATE Allocations 
              SET 
                ClientID = ?,
                ProjectID = ?,
                EmployeeID = ?,
                AllocationStatus = ?,
                AllocationPercent = ?,
                AllocationStartDate = ?,
                AllocationEndDate = ?,
                AllocationTimeSheetApproverID = ?,
                AllocationTimeSheetApprover = ?,
                AllocationBillingRate = ?,
                AllocationBillingType = ?,
                AllocationBilledCheck = ?,
                ModifiedBy = ?
              WHERE AllocationID = ?
            `;

            const updateParams = [
              ClientID,
              ProjectID,
              EmployeeID,
              AllocationStatus,
              AllocationPercent,
              AllocationStartDate,
              AllocationEndDate || null,
              AllocationTimeSheetApproverID,
              AllocationTimeSheetApproverName,
              AllocationBillingRate,
              AllocationBillingType,
              AllocationBilledCheck,
              ModifiedBy,
              AllocationID
            ];

            const [updateResult] = await connection.query(updateQuery, updateParams);

            if (updateResult.affectedRows === 0) {
              throw new Error(`No rows affected for AllocationID: ${AllocationID}.`);
            }

            // Update timesheet_allocation_hours
            await updateTimesheetAllocationHours(connection, existingAllocation, {
              AllocationID,
              ClientID,
              ProjectID,
              EmployeeID,
              AllocationStatus,
              AllocationPercent,
              AllocationStartDate,
              AllocationEndDate,
              AllocationTimeSheetApproverID,
              AllocationTimeSheetApprover: AllocationTimeSheetApproverName,
              AllocationHours,
            });

          } else {
            // Check if an allocation with the same combination exists
            const [existingAllocations] = await connection.query(
              'SELECT AllocationID FROM Allocations WHERE EmployeeID = ? AND ClientID = ? AND ProjectID = ? AND AllocationStartDate = ? AND IFNULL(AllocationEndDate, "9999-12-31") = IFNULL(?, "9999-12-31")',
              [EmployeeID, ClientID, ProjectID, AllocationStartDate, AllocationEndDate]
            );

            if (existingAllocations.length > 0) {
              // Allocation exists, skip insertion
              failures.push({
                AllocationID: 'N/A',
                message: `An allocation with the same combination of EmployeeID, ClientID, ProjectID, AllocationStartDate, and AllocationEndDate already exists.`,
              });
              continue; // Skip to the next allocation
            }

            // Insert new allocation
            const insertQuery = `
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

            const insertParams = [
              ClientID,
              ProjectID,
              EmployeeID,
              AllocationStatus,
              AllocationPercent,
              AllocationStartDate,
              AllocationEndDate || null,
              AllocationTimeSheetApproverID,
              AllocationTimeSheetApproverName,
              AllocationBillingRate,
              AllocationBillingType,
              AllocationBilledCheck,
              ModifiedBy
            ];

            const [insertResult] = await connection.query(insertQuery, insertParams);

            // Get the newly inserted AllocationID
            const newAllocationID = insertResult.insertId;
            allocation.AllocationID = newAllocationID; // Assign the new ID for tracking

            // Insert into timesheet_allocation_hours
            await insertTimesheetAllocationHours(connection, {
              AllocationID: newAllocationID,
              ClientID,
              ProjectID,
              EmployeeID,
              AllocationStatus,
              AllocationPercent,
              AllocationStartDate,
              AllocationEndDate,
              AllocationTimeSheetApproverID,
              AllocationTimeSheetApprover: AllocationTimeSheetApproverName,
              AllocationHours,
            });
          }

          // Record success
          processedRecords += 1;
          successes.push(allocation.AllocationID || 'N/A');
        } catch (error) {
          console.error(`Error processing Allocation at index ${index}:`, error);
          failures.push({
            AllocationID: allocation.AllocationID || 'N/A',
            message: error.message
          });
        }
      }

      await connection.commit();

      context.res = {
        status: 200,
        body: {
          message: "Bulk operation completed.",
          processedRecords,
          totalRecords: allocations.length,
          failedRecords: failures.length,
          successes,
          failures
        },
      };
    } catch (error) {
      await connection.rollback();
      console.error('Transaction error:', error);
      context.res = {
        status: 500,
        body: "An error occurred while processing the transaction.",
      };
    } finally {
      // Ensure the connection is released back to the pool
      if (connection && connection.release) connection.release();
    }
  } catch (err) {
    console.error('Database connection error:', err);
    context.res = { status: 500, body: { error: 'Internal Server Error', message: err.message } };
  }
};

/**
 * Function to insert timesheet allocation hours for a new allocation
 */
async function insertTimesheetAllocationHours(connection, allocationDetails) {
  const {
    AllocationID,
    ClientID,
    ProjectID,
    EmployeeID,
    AllocationStatus,
    AllocationPercent,
    AllocationStartDate,
    AllocationEndDate,
    AllocationTimeSheetApproverID,
    AllocationTimeSheetApprover,
    AllocationHours,
  } = allocationDetails;

  // Generate date range
  const startDate = new Date(AllocationStartDate);
  const endDate = AllocationEndDate ? new Date(AllocationEndDate) : new Date('9999-12-31');
  const dates = getDateRange(startDate, endDate);

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
    AllocationStatus,
    null, // TimesheetApproverComments
    '0', // ApprovalStatus
    false, // OnHoliday
    false, // OnLeave
  ]);

  if (timesheetValues.length > 0) {
    await connection.query(insertTimesheetQuery, [timesheetValues]);
  }
}

/**
 * Function to update timesheet allocation hours for an existing allocation
 */
async function updateTimesheetAllocationHours(connection, existingAllocation, allocationDetails) {
  const {
    AllocationID,
    ClientID,
    ProjectID,
    EmployeeID,
    AllocationStatus,
    AllocationPercent,
    AllocationStartDate,
    AllocationEndDate,
    AllocationTimeSheetApproverID,
    AllocationTimeSheetApprover,
    AllocationHours,
  } = allocationDetails;

  const numericAllocationPercent = AllocationPercent;
  const newAllocationHours = AllocationHours;

  const oldStartDate = new Date(existingAllocation.AllocationStartDate);
  const newStartDate = new Date(AllocationStartDate);
  const oldEndDate = existingAllocation.AllocationEndDate ? new Date(existingAllocation.AllocationEndDate) : new Date('9999-12-31');
  const newEndDate = AllocationEndDate ? new Date(AllocationEndDate) : new Date('9999-12-31');

  // Determine if timesheet entries need to be updated
  const needsTimesheetUpdate =
    ProjectID !== existingAllocation.ProjectID ||
    ClientID !== existingAllocation.ClientID ||
    numericAllocationPercent !== existingAllocation.AllocationPercent ||
    AllocationTimeSheetApproverID !== existingAllocation.AllocationTimeSheetApproverID ||
    AllocationTimeSheetApprover !== existingAllocation.AllocationTimeSheetApprover ||
    AllocationStartDate !== existingAllocation.AllocationStartDate ||
    AllocationEndDate !== existingAllocation.AllocationEndDate ||
    AllocationStatus !== existingAllocation.AllocationStatus;

  if (needsTimesheetUpdate) {
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
        AllocationStatus = ?,
        TimesheetApproverComments = CASE
          WHEN ? != ? OR ? != ? THEN NULL
          ELSE TimesheetApproverComments
        END,
        ApprovalStatus = CASE
          WHEN ? != ? OR ? != ? OR ? != ? OR ? != ? THEN '0'
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
      AllocationStatus,
      // Parameters for TimesheetApproverComments CASE
      AllocationTimeSheetApproverID, existingAllocation.AllocationTimeSheetApproverID,
      AllocationTimeSheetApprover, existingAllocation.AllocationTimeSheetApprover,
      // Parameters for ApprovalStatus CASE
      numericAllocationPercent, existingAllocation.AllocationPercent,
      AllocationTimeSheetApproverID, existingAllocation.AllocationTimeSheetApproverID,
      AllocationTimeSheetApprover, existingAllocation.AllocationTimeSheetApprover,
      AllocationStatus, existingAllocation.AllocationStatus,
      AllocationID,
      AllocationStartDate,
      newEndDate < oldEndDate ? newEndDate.toISOString().split('T')[0] : oldEndDate.toISOString().split('T')[0]
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
        AllocationID,
        AllocationStartDate,
        AllocationEndDate ? AllocationEndDate : '9999-12-31'
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
      let currentDate = newStartDate < oldStartDate ? newStartDate : oldEndDate;
      const lastDate = newEndDate > oldEndDate ? newEndDate : oldStartDate;

      while (currentDate <= lastDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        if (currentDate < oldStartDate || currentDate > oldEndDate) {
          newEntries.push([
            AllocationID,
            EmployeeID,
            ProjectID,
            ClientID,
            AllocationTimeSheetApproverID,
            AllocationTimeSheetApprover,
            dateString,
            0,  // TimesheetHours
            newAllocationHours,
            numericAllocationPercent,
            AllocationStatus,
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
}
