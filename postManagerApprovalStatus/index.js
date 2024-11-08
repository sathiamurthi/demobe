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
 * Approval Status Mapping:
 * 2 - Approved
 * 3 - Rejected
 * 0 - Resubmission
 */

module.exports = async function (context, req) {
  if (req.method !== 'POST') {
    context.res = {
      status: 405,
      body: { error: 'Method Not Allowed. Use POST.' },
    };
    return;
  }

  const { action, guidIds, comments } = req.body;

  if (!action || !guidIds || !Array.isArray(guidIds) || guidIds.length === 0) {
    context.res = {
      status: 400,
      body: { error: 'Invalid request. Action and guidIds are required.' },
    };
    return;
  }

  // Validate action
  const validActions = ['Approve', 'Reject', 'Resubmit'];
  if (!validActions.includes(action)) {
    context.res = {
      status: 400,
      body: { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
    };
    return;
  }

  // Map action to ApprovalStatus
  const actionStatusMap = {
    'Approve': 2,
    'Reject': 3,
    'Resubmit': 0,
  };

  const approvalStatus = actionStatusMap[action];

  // Default comments based on action
  const defaultComments = {
    'Approve': 'Your timesheet for the date has been Approved.',
    'Reject': 'Your timesheet for the date has been Rejected.',
    'Resubmit': 'Your timesheet should be Resubmitted for the date.',
  };

  // Start transaction
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Prepare update queries
    const updatePromises = guidIds.map(async (guidId) => {
      const comment = comments && comments[guidId] ? comments[guidId] : defaultComments[action];

      const updateQuery = `
        UPDATE timesheet_allocation_hours
        SET ApprovalStatus = ?, TimesheetApproverComments = ?
        WHERE GUIDID = ?
      `;

      await connection.execute(updateQuery, [approvalStatus, comment, guidId]);
    });

    await Promise.all(updatePromises);

    // Commit transaction
    await connection.commit();

    context.res = {
      status: 200,
      body: { status: true, message: 'Timesheet statuses updated successfully.' },
    };
  } catch (error) {
    // Rollback transaction in case of error
    await connection.rollback();
    context.log('Error updating timesheet statuses:', error);
    context.res = {
      status: 500,
      body: { status: false, error: 'Internal Server Error', message: error.message },
    };
  } finally {
    connection.release();
  }
};
