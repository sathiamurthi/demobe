const mysql = require('mysql2/promise');
const sgMail = require('@sendgrid/mail');

// Set up SendGrid API Key
sgMail.setApiKey("dummy");

// Set up Database Config
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Innover@2024',
  database: process.env.DB_SCHEMA_TIMESHEET|| 'timesheet',
  ssl: {
    rejectUnauthorized: false // Use an appropriate certificate authority if required
  },
  
};

module.exports = async function (context, req) {
  context.log('JavaScript HTTP trigger function processed a request.');

  // Establish database connection
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    context.log('Connected to the database.');
  } catch (error) {
    context.log('Failed to connect to the database: ', error);
    context.res = {
      status: 500,
      body: "Database connection failed.",
    };
    return;
  }

  try {
    // Query for projects with status 3
    const [projects] = await connection.execute(
      `SELECT p.ProjectID, p.Name, p.StartDate, p.EndDate, m.Email as ManagerEmail, m.Name as ManagerName 
       FROM project p 
       JOIN managerprojects mp ON p.ProjectID = mp.ProjectID 
       JOIN manager m ON mp.ManagerID = m.ManagerID 
       WHERE p.Status = 3`
    );

    if (projects.length === 0) {
      context.log('No projects found with status 3.');
      context.res = {
        status: 200,
        body: "No projects with status 3 found.",
      };
      return;
    }

    // Send emails to each project manager
    for (const project of projects) {
      const email = project.ManagerEmail || "uday.kumar@innoverdigital.com"; // Fallback to your email for testing
      const projectName = project.Name;
      const startDate = project.StartDate;
      const endDate = project.EndDate;
      const managerName = project.ManagerName;

      const msg = {
        to: email,
        from: 'no-reply@innoverdigital.com',
        subject: `Timesheet Submission Required for Project: ${projectName}`,
        html: `Hi ${managerName},<br><br>
               The project <strong>'${projectName}'</strong> (Date Range: <strong>${startDate} - ${endDate}</strong>) 
               requires timesheet submission. Please ensure that your team members have submitted their timesheets.`,
      };

      // Send Email
      try {
        await sgMail.send(msg);
        context.log(`Email sent successfully to ${email} for project: ${projectName}`);
      } catch (error) {
        context.log(`Failed to send email to ${email}: `, error);
      }
    }

    context.res = {
      status: 200,
      body: "Emails have been sent successfully.",
    };
  } catch (error) {
    context.log('Failed to execute database query: ', error);
    context.res = {
      status: 500,
      body: "Failed to execute database query.",
    };
  } finally {
    // Close database connection
    if (connection) {
      await connection.end();
    }
  }
};
