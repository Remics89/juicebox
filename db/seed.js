// grab our client with destructuring from the export in index.js
const { client, getAllUsers, createUser } = require('./index');

async function createInitialUsers() {
  try {
    console.log("Creating users......")

    const albert = await createUser({ username: 'albert', password: 'bertie99' })
    const sandra = await createUser({ username: 'sandra', password: '2sandy4me' })
    const glamgal = await createUser({ username: 'glamgal', password: 'soglam' })
    console.log(albert, sandra, glamgal);

    console.log("Users created.....")
  } catch (error) {
    console.error("Error: Could not create users");
    throw error;
  }
}

async function testDB() {
  try {
    console.log('Testing the DB.....')

    const users = await getAllUsers();
    console.log('getAllUsers:', users)

    console.log('Tests succeeded......');
  } catch (error) {
    console.error('Error: Could not test DB');
    throw error;
  }
}


// this function should call a query which drops all tables from our database
async function dropTables() {
  try {
    console.log('Dropping Tables......')

    await client.query(`
      DROP TABLE IF EXISTS users
    `);

    console.log('Tables dropped....')
  } catch (error) {
    console.error('Error: Could not drop tables')
    throw error; // we pass the error up to the function that calls dropTables
  }
}

// this function should call a query which creates all tables for our database 
async function createTables() {
  try {
    console.log('Building tables.....')

    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username varchar(255) UNIQUE NOT NULL,
        password varchar(255) NOT NULL
      );
    `);

    console.log('Tables built.....')
  } catch (error) {
    console.error('Error: Could not build tables')
    throw error; // we pass the error up to the function that calls createTables
  }
}

async function rebuildDB() {
  try {
    client.connect();

    await dropTables();
    await createTables();
    await createInitialUsers();
  } catch (error) {
    throw (error);
  }
}

rebuildDB()
.then(testDB)
.catch(console.error)
.finally(() => client.end());