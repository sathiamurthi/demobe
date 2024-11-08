// projects-upload/index.js
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

// Utility function to convert empty fields to null
const emptyToNull = (value) => (value === '' || value === 'NULL' ? null : value);

// Allowed Project Statuses
const allowedProjectStatuses = ['Completed', 'In Progress', 'On Hold'];

module.exports = async function (context, req) {
  // Check if request body exists and is an array
  if (!req.body || !Array.isArray(req.body)) {
    context.res = {
      status: 400,
      body: "Please provide an array of project details.",
    };
    return;
  }

  const projects = req.body;
  const requiredFields = ['ProjectID', 'ProjectName', 'ClientID', 'ProjectStatus', 'ProjectManagerID', 'ProjectStartDate'];

  // Validate each project record
  const invalidRecords = projects.filter(project => 
    !requiredFields.every(field => project.hasOwnProperty(field) && project[field] !== undefined && project[field] !== null)
  );

  if (invalidRecords.length > 0) {
    context.res = {
      status: 400,
      body: {
        message: "Some project records are missing required fields.",
        missingFields: requiredFields,
        invalidRecordsCount: invalidRecords.length,
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

      for (const [index, project] of projects.entries()) {
        try {
          // Extract project details and convert empty values to null
          const ProjectID = emptyToNull(project.ProjectID);
          const ProjectName = emptyToNull(project.ProjectName);
          const ClientID = emptyToNull(project.ClientID);
          const ProjectStatus = emptyToNull(project.ProjectStatus);
          const ProjectCategory = emptyToNull(project.ProjectCategory);
          const ProjectManagerID = emptyToNull(project.ProjectManagerID);
          const ProjectStartDate = emptyToNull(project.ProjectStartDate);
          const ProjectEndDate = emptyToNull(project.ProjectEndDate);

          // Validate ProjectStatus
          if (!allowedProjectStatuses.includes(ProjectStatus)) {
            throw new Error(`Invalid ProjectStatus: ${ProjectStatus}. Allowed values are ${allowedProjectStatuses.join(', ')}.`);
          }

          // Check if ClientID exists
          const [existingClient] = await connection.query(
            'SELECT ClientID FROM Clients WHERE ClientID = ?',
            [ClientID]
          );

          if (existingClient.length === 0) {
            throw new Error(`ClientID ${ClientID} does not exist in Clients table.`);
          }

          // Check if ProjectManagerID exists and fetch EmployeeName
          const [existingEmployee] = await connection.query(
            'SELECT EmployeeName FROM Employees WHERE EmployeeId = ?',
            [ProjectManagerID]
          );

          if (existingEmployee.length === 0) {
            throw new Error(`ProjectManagerID ${ProjectManagerID} does not exist in Employees table.`);
          }

          const ProjectManager = existingEmployee[0].EmployeeName;

          // Check if ProjectID exists
          const [existingProject] = await connection.query(
            'SELECT ProjectID FROM Projects WHERE ProjectID = ?',
            [ProjectID]
          );

          if (existingProject.length > 0) {
            // Update existing project
            const updateQuery = `
              UPDATE Projects 
              SET 
                ProjectName = ?,
                ClientID = ?,
                ProjectStatus = ?,
                ProjectCategory = ?,
                ProjectManagerID = ?,
                ProjectManager = ?,
                ProjectStartDate = ?,
                ProjectEndDate = ?
              WHERE ProjectID = ?
            `;

            const updateParams = [
              ProjectName,
              ClientID,
              ProjectStatus,
              ProjectCategory,
              ProjectManagerID,
              ProjectManager,
              formatDate(ProjectStartDate),
              formatDate(ProjectEndDate),
              ProjectID
            ];

            const [updateResult] = await connection.query(updateQuery, updateParams);

            // Check if the update was successful
            if (updateResult.affectedRows === 0) {
              throw new Error(`No rows affected for ProjectID: ${ProjectID}.`);
            }
          } else {
            // Insert new project
            const insertQuery = `
              INSERT INTO Projects (
                ProjectID,
                ProjectName,
                ClientID,
                ProjectStatus,
                ProjectCategory,
                ProjectManagerID,
                ProjectManager,
                ProjectStartDate,
                ProjectEndDate
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const insertParams = [
              ProjectID,
              ProjectName,
              ClientID,
              ProjectStatus,
              ProjectCategory,
              ProjectManagerID,
              ProjectManager,
              formatDate(ProjectStartDate),
              formatDate(ProjectEndDate)
            ];

            await connection.query(insertQuery, insertParams);
          }

          processedRecords += 1;
          successes.push(ProjectID);
        } catch (error) {
          console.error(`Error processing ProjectID "${project.ProjectID}":`, error);
          failures.push({
            ProjectID: project.ProjectID,
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
          totalRecords: projects.length,
          failedRecords: failures.length,
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

// Helper function to format dates to MySQL DATE format (YYYY-MM-DD)
function formatDate(dateString) {
  if (!dateString) return null;
  // Handle various date formats, e.g., "15/01/24", "01/08/25", "NULL"
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = (`0${date.getMonth() + 1}`).slice(-2); // Months are zero-based
  const day = (`0${date.getDate()}`).slice(-2);
  return `${year}-${month}-${day}`;
}
