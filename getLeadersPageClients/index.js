const mysql = require('mysql2/promise');

// Configure MySQL connection using environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Innover@2024',
  database: process.env.DB_SCHEMA_RMS|| 'rms',
  ssl: {
    rejectUnauthorized: false // Use an appropriate certificate authority if required
  },
  
};

// Create a MySQL connection pool
const pool = mysql.createPool(dbConfig);

module.exports = async function (context, req) {
  try {
    // SQL query to fetch ClientID and ClientName from the Clients table
    const query = `
      SELECT ClientID, ClientName
      FROM Clients
      ORDER BY ClientName ASC
    `;

    // Execute the query
    const [results] = await pool.query(query);

    // Return the results as JSON
    context.res = {
      status: 200,
      body: results,
    };
  } catch (err) {
    // Handle any errors during the query execution
    context.log('Error fetching clients:', err);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error' },
    };
  }
};
