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
const emptyToNull = (value) => (value === '' ? null : value);

module.exports = async function (context, req) {
  // Check if request body exists and is an array
  if (!req.body || !Array.isArray(req.body)) {
    context.res = {
      status: 400,
      body: "Please provide an array of client details.",
    };
    return;
  }

  const clients = req.body;
  const requiredFields = ['ClientName'];

  // Validate each client record
  const invalidRecords = clients.filter(client => 
    !requiredFields.every(field => client.hasOwnProperty(field) && client[field])
  );

  if (invalidRecords.length > 0) {
    context.res = {
      status: 400,
      body: {
        message: "Some client records are missing required fields.",
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

      for (const [index, client] of clients.entries()) {
        try {
          // Extract client details and convert empty values to null
          const ClientName = emptyToNull(client.ClientName);
          const ClientCountry = emptyToNull(client.ClientCountry);
          const ClientPartner = emptyToNull(client.ClientPartner);
          const ClientLogo = emptyToNull(client.ClientLogo);

          // Check if client exists based on ClientName
          const [existingClient] = await connection.query(
            'SELECT ClientID FROM Clients WHERE ClientName = ?',
            [ClientName]
          );

          if (existingClient.length > 0) {
            // Update existing client
            const updateQuery = `
              UPDATE Clients 
              SET 
                ClientCountry = ?,
                ClientPartner = ?,
                ClientLogo = ?
              WHERE ClientName = ?
            `;

            const updateParams = [
              ClientCountry,
              ClientPartner,
              ClientLogo,
              ClientName
            ];

            const [updateResult] = await connection.query(updateQuery, updateParams);

            // Check if the update was successful
            if (updateResult.affectedRows === 0) {
              throw new Error(`No rows affected for ClientName: ${ClientName}.`);
            }
          } else {
            // Insert new client
            const insertQuery = `
              INSERT INTO Clients (
                ClientName,
                ClientCountry,
                ClientPartner,
                ClientLogo
              ) VALUES (?, ?, ?, ?)
            `;

            const insertParams = [
              ClientName,
              ClientCountry,
              ClientPartner,
              ClientLogo
            ];

            await connection.query(insertQuery, insertParams);
          }

          processedRecords += 1;
          successes.push(ClientName);
        } catch (error) {
          console.error(`Error processing ClientName "${client.ClientName}":`, error);
          failures.push({
            ClientName: client.ClientName,
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
          totalRecords: clients.length,
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
