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
  // Check if request body exists and is an array
  if (!req.body || !Array.isArray(req.body)) {
    context.res = {
      status: 400,
      body: "Please provide an array of employee details.",
    };
    return;
  }

  const employees = req.body;
  const requiredFields = ['EmployeeId', 'EmployeeName', 'EmployeeEmail', 'EmployeeJoiningDate'];

  // Validate each employee record
  const invalidRecords = employees.filter(emp =>
    !requiredFields.every(field => emp.hasOwnProperty(field))
  );

  if (invalidRecords.length > 0) {
    context.res = {
      status: 400,
      body: {
        message: "Some employee records are missing required fields.",
        missingFields: requiredFields,
      },
    };
    return;
  }

  try {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      let processedRecords = 0;
      const successes = [];
      const failures = [];
      const overwrittenRecords = [];

      for (const [index, emp] of employees.entries()) {
        try {
          // Helper function to convert dates to MySQL format
          const formatDate = (date) => {
            if (!date) return null;
            const parsedDate = new Date(date);
            return isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString().split('T')[0];
          };

          // Format the date values
          const formattedJoiningDate = formatDate(emp.EmployeeJoiningDate);
          const formattedEndingDate = formatDate(emp.EmployeeEndingDate);

          // Check if employee exists
          const [existingEmployee] = await connection.query('SELECT * FROM Employees WHERE EmployeeId = ?', [emp.EmployeeId]);

          if (existingEmployee.length > 0) {
            // Log the details of the employee being overwritten
            overwrittenRecords.push({
              EmployeeId: emp.EmployeeId,
              EmployeeName: existingEmployee[0].EmployeeName,
              EmployeeEmail: existingEmployee[0].EmployeeEmail,
            });

            // Update existing employee
            const updateQuery = `
              UPDATE Employees 
              SET 
                EmployeeName = ?,
                EmployeeRole = ?,
                EmployeeEmail = ?,
                EmployeeStudio = ?,
                EmployeeSubStudio = ?,
                EmployeeLocation = ?,
                EmployeeJoiningDate = ?,
                EmployeeEndingDate = ?,
                EmployeeSkills = ?,
                EmployeeKekaStatus = ?,
                EmployeeContractType = ?,
                EmployeeTYOE = ?,
                EmployeePhotoDetails = ?
              WHERE EmployeeId = ?
            `;

            const updateParams = [
              emp.EmployeeName,
              emp.EmployeeRole || null,
              emp.EmployeeEmail,
              emp.EmployeeStudio || null,
              emp.EmployeeSubStudio || null,
              emp.EmployeeLocation || null,
              formattedJoiningDate,
              formattedEndingDate,
              emp.EmployeeSkills || null,
              emp.EmployeeKekaStatus || null,
              emp.EmployeeContractType || null,
              emp.EmployeeTYOE || null,
              emp.EmployeePhotoDetails || null,
              emp.EmployeeId
            ];

            const [updateResult] = await connection.query(updateQuery, updateParams);

            if (updateResult.affectedRows === 0) {
              throw new Error(`No rows affected for EmployeeId: ${emp.EmployeeId}.`);
            }
          } else {
            // Insert new employee
            const insertQuery = `
              INSERT INTO Employees (
                EmployeeId,
                EmployeeName,
                EmployeeRole,
                EmployeeEmail,
                EmployeeStudio,
                EmployeeSubStudio,
                EmployeeLocation,
                EmployeeJoiningDate,
                EmployeeEndingDate,
                EmployeeSkills,
                EmployeeKekaStatus,
                EmployeeContractType,
                EmployeeTYOE,
                EmployeePhotoDetails
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const insertParams = [
              emp.EmployeeId,
              emp.EmployeeName,
              emp.EmployeeRole || null,
              emp.EmployeeEmail,
              emp.EmployeeStudio || null,
              emp.EmployeeSubStudio || null,
              emp.EmployeeLocation || null,
              formattedJoiningDate,
              formattedEndingDate,
              emp.EmployeeSkills || null,
              emp.EmployeeKekaStatus || null,
              emp.EmployeeContractType || null,
              emp.EmployeeTYOE || null,
              emp.EmployeePhotoDetails || null
            ];

            await connection.query(insertQuery, insertParams);
          }

          processedRecords += 1;
          successes.push(emp.EmployeeId);
        } catch (error) {
          console.error(`Error processing EmployeeId ${emp.EmployeeId}:`, error);
          failures.push({
            EmployeeId: emp.EmployeeId,
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
          totalRecords: employees.length,
          failedRecords: failures.length,
          overwrittenRecords,
          successes,
          failures
        },
      };
    } catch (error) {
      await connection.rollback();
      console.error('Error during bulk operation:', error);
      context.res = {
        status: 500,
        body: "Internal server error occurred while processing your request.",
      };
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Database connection error:', error);
    context.res = {
      status: 500,
      body: "Internal server error occurred while connecting to the database.",
    };
  }
};
