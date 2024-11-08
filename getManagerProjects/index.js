// managerClientsProjects.js
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

// Helper function to get week start and end dates
function getWeekDates(weekOffset = 0) {
  const today = new Date();
  const firstDayOfWeek = new Date(today);
  firstDayOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
  
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
  
  return {
    startDate: firstDayOfWeek.toISOString().split('T')[0],
    endDate: lastDayOfWeek.toISOString().split('T')[0]
  };
}

module.exports = async function (context, req) {
  try {
    // Get email and weekOffset from query parameters
    const email = context.bindingData.email;
    const weekOffset = parseInt(req.query.weekOffset || '0');

    if (!email) {
      context.res = {
        status: 400,
        body: {
          status: false,
          message: 'Email parameter is required',
          data: null
        }
      };
      return;
    }

    // Get week dates based on offset
    const { startDate, endDate } = getWeekDates(weekOffset);

    // Convert the employee email to lowercase for case-insensitive comparison
    const lowerCaseEmail = email.toLowerCase();
    
    // First, get the employee details
    const employeeQuery = `
      SELECT 
        EmployeeId,
        EmployeeName,
        EmployeeRole,
        EmployeeEmail
      FROM Employees
      WHERE LOWER(EmployeeEmail) = ?
    `;

    const [employeeResults] = await pool.query(employeeQuery, [lowerCaseEmail]);

    if (employeeResults.length === 0) {
      context.res = {
        status: 404,
        body: {
          status: false,
          message: 'Employee not found',
          data: null
        }
      };
      return;
    }

    const employeeId = employeeResults[0].EmployeeId;

    // Modified query to include week-based filtering
    const clientProjectsQuery = `
      SELECT DISTINCT
        c.ClientID,
        c.ClientName,
        p.ProjectID,
        p.ProjectName,
        p.ProjectStartDate,
        p.ProjectEndDate,
        p.ProjectStatus,
        p.ProjectManager,
        p.ProjectManagerID,
        (
          SELECT COUNT(DISTINCT a2.EmployeeID)
          FROM Allocations a2
          JOIN timesheet_allocation_hours tah ON a2.AllocationID = tah.AllocationID
          WHERE a2.ProjectID = p.ProjectID
          AND a2.AllocationStatus = 'Allocated'
          AND tah.TimesheetDate BETWEEN ? AND ?
        ) AS Headcount
      FROM Clients c
      JOIN Projects p ON c.ClientID = p.ClientID
      JOIN Allocations a ON p.ProjectID = a.ProjectID
      JOIN timesheet_allocation_hours tah ON a.AllocationID = tah.AllocationID
      WHERE (p.ProjectManagerID = ? OR a.AllocationTimeSheetApproverID = ?)
      AND tah.TimesheetDate BETWEEN ? AND ?
      GROUP BY c.ClientID, p.ProjectID
      ORDER BY c.ClientName, p.ProjectName
    `;

    // Execute the client-projects query with week range
    const [projectResults] = await pool.query(
      clientProjectsQuery, 
      [startDate, endDate, employeeId, employeeId, startDate, endDate]
    );

    // Organize projects by client
    const clientsMap = new Map();

    projectResults.forEach(project => {
      const { ClientID, ClientName, ...projectDetails } = project;
      
      if (!clientsMap.has(ClientID)) {
        clientsMap.set(ClientID, {
          ClientID,
          ClientName,
          Projects: []
        });
      }
      
      clientsMap.get(ClientID).Projects.push({
        ...projectDetails,
        weekRange: {
          startDate,
          endDate
        }
      });
    });

    // Convert map to array and sort by ClientName
    const clientsArray = Array.from(clientsMap.values())
      .sort((a, b) => a.ClientName.localeCompare(b.ClientName));

    // Prepare the response
    const response = {
      status: true,
      message: 'Data retrieved successfully',
      data: {
        employeeDetails: employeeResults[0],
        weekRange: {
          startDate,
          endDate
        },
        clients: clientsArray
      }
    };

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: response
    };

  } catch (err) {
    context.log('Error executing query:', err);
    context.res = {
      status: 500,
      body: {
        status: false,
        message: 'Internal Server Error',
        data: null,
        error: err.message
      }
    };
  }
};

