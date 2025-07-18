const { MongoClient } = require('mongodb');

async function main() {
  /**
   * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
   * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
   */
  const uri = "mongodb+srv://healthcareapp:healthcarepassword@sandbox.j23em.mongodb.net/healthcare?retryWrites=true&w=majority";

  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    // Connect to the MongoDB cluster
    await client.connect();
    console.log("Connected to MongoDB Atlas successfully!");

    // List databases
    await listDatabases(client);

  } catch (e) {
    console.error("Connection error:", e);
  } finally {
    await client.close();
    console.log("Connection closed.");
  }
}

async function listDatabases(client) {
  const databasesList = await client.db().admin().listDatabases();
  console.log("Databases:");
  databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};

main().catch(console.error); 