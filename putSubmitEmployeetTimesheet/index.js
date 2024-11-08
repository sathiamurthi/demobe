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
      // Validate request body
      if (!req.body || !Array.isArray(req.body.entries)) {
          context.res = {
              status: 400,
              body: "Please provide an array of timesheet entries in the request body."
          };
          return;
      }
  
      try {
          const connection = await mysql.createConnection(dbConfig);
  
          // Process each timesheet entry
          const results = [];
          for (const entry of req.body.entries) {
              const {
                  employeeId,
                  projectId,
                  date,
                  hours,
                  status, // Optional: 'Normal', 'Holiday', or 'Leave'
                  timesheetApproverComments // Optional
              } = entry;
  
              // Validate required fields for identifying the record
              if (!employeeId || !projectId || !date) {
                  results.push({
                      date,
                      projectId,
                      success: false,
                      error: "Missing required fields: employeeId, projectId, and date are mandatory"
                  });
                  continue;
              }
  
              try {
                  // Build the update query dynamically based on provided fields
                  const updateFields = [];
                  const params = [];
  
                  // Always set ApprovalStatus to 1 for submission
                  updateFields.push('ApprovalStatus = 1');
  
                  if (hours !== undefined) {
                      updateFields.push('TimesheetHours = ?');
                      params.push(hours);
                  }
  
                  if (status !== undefined) {
                      const onHoliday = status === 'Holiday' ? 1 : 0;
                      const onLeave = status === 'Leave' ? 1 : 0;
                      updateFields.push('OnHoliday = ?');
                      updateFields.push('OnLeave = ?');
                      params.push(onHoliday, onLeave);
                  }
  
                  if (timesheetApproverComments !== undefined) {
                      updateFields.push('TimesheetApproverComments = ?');
                      params.push(timesheetApproverComments);
                  }
  
                  // Add the WHERE clause parameters
                  params.push(employeeId, projectId, date);
  
                  // Construct and execute the update query
                  const query = `
                      UPDATE timesheet_allocation_hours 
                      SET ${updateFields.join(', ')}
                      WHERE EmployeeID = ? 
                      AND ProjectID = ? 
                      AND TimesheetDate = ?`;
  
                  const [result] = await connection.execute(query, params);
  
                  if (result.affectedRows === 0) {
                      results.push({
                          date,
                          projectId,
                          success: false,
                          error: "No matching timesheet entry found"
                      });
                  } else {
                      results.push({
                          date,
                          projectId,
                          success: true,
                          message: "Timesheet entry updated successfully"
                      });
                  }
              } catch (error) {
                  results.push({
                      date,
                      projectId,
                      success: false,
                      error: error.message
                  });
              }
          }
  
          await connection.end();
  
          context.res = {
              status: 200,
              body: {
                  message: "Timesheet updates processed",
                  results: results
              }
          };
      } catch (error) {
          context.log("Error updating timesheet:", error);
          context.res = {
              status: 500,
              body: "Internal Server Error"
          };
      }
  };