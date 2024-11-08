// getUserRole/index.js
const mysql = require("mysql2/promise");

// Setup MySQL Connection (Adjust configuration based on your environment)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Innover@2024',
  database: process.env.DB_SCHEMA_RMS|| 'rms',
  ssl: {
    rejectUnauthorized: false // Use an appropriate certificate authority if required
  },
};

// Azure Function entry point
module.exports = async function (context, req) {
  // Extract email from path parameters
  const { email } = req.params;

  if (!email) {
    context.res = {
      status: 400,
      body: "Employee email is required.",
    };
    return;
  }

  try {
    // Create a new MySQL connection
    const connection = await mysql.createConnection(dbConfig);

    // Convert the employee email to lower case for the query
    const lowerCaseEmail = email.toLowerCase();

    // Query to fetch EmployeeRole based on EmployeeEmail (using lower case comparison)
    const [rows] = await connection.execute(
      "SELECT EmployeeRole FROM Employees WHERE LOWER(EmployeeEmail) = ?",
      [lowerCaseEmail]
    );

    // Close the database connection
    await connection.end();

    // If no matching employee is found, return a 404
    if (rows.length === 0) {
      context.res = {
        status: 404,
        body: "Employee not found.",
      };
      return;
    }

    // Extract the employee role from the result
    const employeeRole = rows[0].EmployeeRole;

    // Map the role to your predefined roles
    let userRole;
    switch (employeeRole.toUpperCase()) { // Ensure case-insensitive mapping
      case "LEADER":
        userRole = "LEADER";
        break;
      case "BIZOPS":
        userRole = "BIZOPS";
        break;
      case "PROJECT MANAGER":
        userRole = "MANAGER";
        break;
      case "EMPLOYEE":
        userRole = "EMPLOYEE";
        break;
      default:
        userRole = "EMPLOYEE"; // Default role if no match
    }

    // Return the user role
    context.res = {
      status: 200,
      body: { userRole },
    };
  } catch (error) {
    context.log("Error fetching user role:", error);
    context.res = {
      status: 500,
      body: "Internal Server Error",
    };
  }
};
