// grab our client with destructuring from the export in index.js
const { client, getAllUsers, createUser, updateUser, createPost, getAllPosts, getUserById } = require("./index");

async function createPosts() {
    try {
        console.log("Building Posts.....");

        await client.query(`
      CREATE TABLE posts(
        id SERIAL PRIMARY KEY,
        "authorId" INTEGER REFERENCES users(id) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        active BOOLEAN DEFAULT true
      )
    `);

        console.log("Posts table built.....");
    } catch (error) {
        console.error("Failed to build posts table");
        throw error;
    }
}

async function createInitialUsers() {
    try {
        console.log("Creating users......");

        await createUser({
            username: "albert",
            password: "bertie99",
            name: "Albert",
            location: "U.S.",
        });
        await createUser({
            username: "sandra",
            password: "2sandy4me",
            name: "Sandra",
            location: "U.S.",
        });
        await createUser({
            username: "glamgal",
            password: "soglam",
            name: "glam",
            location: "U.S.",
        });

        console.log("Users created.....");
    } catch (error) {
        console.error("Error: Could not create users");
        throw error;
    }
}

async function testDB() {
    try {
        console.log("Testing the DB.....");

        const users = await getAllUsers();
        console.log("getAllUsers:", users);

        const posts = await getAllPosts();
        console.log("getAllPosts:", posts)

        console.log("Updating user 0....");
        const updateResult = await updateUser(users[0].id, {
            name: "new name",
            location: "new location",
        });
        console.log("Update result: ", updateResult);

        console.log("Tests succeeded......");
    } catch (error) {
        console.error("Error: Could not test DB");
        throw error;
    }
}

// this function should call a query which drops all tables from our database
async function dropTables() {
    try {
        console.log("Dropping Tables......");

        await client.query(`
        DROP TABLE IF EXISTS posts;
      DROP TABLE IF EXISTS users
    `);

        console.log("Tables dropped....");
    } catch (error) {
        console.error("Error: Could not drop tables");
        throw error; // we pass the error up to the function that calls dropTables
    }
}

// this function should call a query which creates all tables for our database
async function createTables() {
    try {
        console.log("Building tables.....");

        await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username varchar(255) UNIQUE NOT NULL,
        password varchar(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        active BOOLEAN DEFAULT true
      );
    `);

        console.log("Tables built.....");
    } catch (error) {
        console.error("Error: Could not build tables");
        throw error; // we pass the error up to the function that calls createTables
    }
}

async function rebuildDB() {
    try {
        client.connect();

        await dropTables();
        await createTables();
        await createInitialUsers();
        await createPosts();
        const userData = await getUserById(0);
        console.log("userData: ", userData);
    } catch (error) {
        throw error;
    }
}

rebuildDB()
    .then(testDB)
    .catch(console.error)
    .finally(() => client.end());
