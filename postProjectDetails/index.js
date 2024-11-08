const mysql = require('mysql2/promise');
const { getDbConfig } = require('../dbConfig');

const pool = mysql.createPool(getDbConfig());

const emptyToNull = (value) => (value === '' || value === 'NULL' ? null : value);
const allowedProjectStatuses = ['Completed', 'In Progress', 'On Hold'];

module.exports = async function (context, req) {
  if (!req.body || !Array.isArray(req.body)) {
    context.res = {
      status: 400,
      body: "Please provide an array of project details.",
    };
    return;
  }

  const projects = req.body;
  const requiredFields = [
    'ProjectID',
    'ProjectName',
    'ClientID',
    'ProjectStatus',
    'ProjectManagerID',
    'ProjectStartDate',
    'PlannedHeadcount',
  ];

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

      for (const project of projects) {
        try {
          const ProjectID = emptyToNull(project.ProjectID);
          const ProjectName = emptyToNull(project.ProjectName);
          const ClientID = emptyToNull(project.ClientID);
          const ProjectStatus = emptyToNull(project.ProjectStatus);
          const ProjectCategory = emptyToNull(project.ProjectCategory);
          const ProjectManagerID = emptyToNull(project.ProjectManagerID);
          const ProjectStartDate = emptyToNull(project.ProjectStartDate);
          const ProjectEndDate = emptyToNull(project.ProjectEndDate);
          const ProjectStudio = emptyToNull(project.ProjectStudio);
          const ProjectSubStudio = emptyToNull(project.ProjectSubStudio);
          const PlannedHeadcount = emptyToNull(project.PlannedHeadcount);

          if (!allowedProjectStatuses.includes(ProjectStatus)) {
            throw new Error(`Invalid ProjectStatus: ${ProjectStatus}. Allowed values are ${allowedProjectStatuses.join(', ')}.`);
          }

          if (PlannedHeadcount !== null && (!Number.isInteger(PlannedHeadcount) || PlannedHeadcount < 0)) {
            throw new Error(`Invalid PlannedHeadcount: ${PlannedHeadcount}. It must be a non-negative integer.`);
          }

          const [existingClient] = await connection.query(
            'SELECT ClientID FROM Clients WHERE ClientID = ?',
            [ClientID]
          );

          if (existingClient.length === 0) {
            throw new Error(`ClientID ${ClientID} does not exist in Clients table.`);
          }

          const [existingEmployee] = await connection.query(
            'SELECT EmployeeName FROM Employees WHERE EmployeeId = ?',
            [ProjectManagerID]
          );

          if (existingEmployee.length === 0) {
            throw new Error(`ProjectManagerID ${ProjectManagerID} does not exist in Employees table.`);
          }

          const ProjectManager = existingEmployee[0].EmployeeName;

          const [existingProject] = await connection.query(
            'SELECT ProjectID FROM Projects WHERE ProjectID = ?',
            [ProjectID]
          );

          if (existingProject.length > 0) {
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
                ProjectEndDate = ?,
                ProjectStudio = ?,
                ProjectSubStudio = ?,
                PlannedHeadcount = ?
              WHERE ProjectID = ?
            `;

            const [updateResult] = await connection.query(updateQuery, [
              ProjectName,
              ClientID,
              ProjectStatus,
              ProjectCategory,
              ProjectManagerID,
              ProjectManager,
              formatDate(ProjectStartDate),
              formatDate(ProjectEndDate),
              ProjectStudio,
              ProjectSubStudio,
              PlannedHeadcount,
              ProjectID
            ]);

            if (updateResult.affectedRows === 0) {
              throw new Error(`No rows affected for ProjectID: ${ProjectID}.`);
            }
          } else {
            // Fixed INSERT query with correct number of placeholders
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
                ProjectEndDate,
                ProjectStudio,
                ProjectSubStudio,
                PlannedHeadcount
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            await connection.query(insertQuery, [
              ProjectID,
              ProjectName,
              ClientID,
              ProjectStatus,
              ProjectCategory,
              ProjectManagerID,
              ProjectManager,
              formatDate(ProjectStartDate),
              formatDate(ProjectEndDate),
              ProjectStudio,
              ProjectSubStudio,
              PlannedHeadcount
            ]);
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

function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = (`0${date.getMonth() + 1}`).slice(-2);
  const day = (`0${date.getDate()}`).slice(-2);
  return `${year}-${month}-${day}`;
}