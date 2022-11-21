// grab our client with destructuring from the export in index.js
const { client, getAllUsers, createUser, updateUser, createPost, getAllPosts, getUserById, updatePost, createTags, addTagsToPost } = require("./index");

async function createPostsTable() {
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

async function createTagsTable(){ 
    try {
        console.log("Building tags table....");

        await client.query(`
            CREATE TABLE tags (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL
            )
        `);

        console.log("TAGS TABLE BUILT....")
    } catch (error) {
        console.error("TAGS TABLE COULD NOT BE BUILT....")
        throw error;
    }
}

async function createPostTagsTable(){
    try {
        console.log("Building Post Tags Table....")

        await client.query(`
            CREATE TABLE post_tags (
                "postId" INTEGER REFERENCES posts(id) UNIQUE,
                "tagId" INTEGER REFERENCES tags(id) UNIQUE
            )
        `)

        console.log("Post Tags Table built....")
    } catch (error) {
        console.error("Post Tags table could not be built")
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

async function createInitialPosts() {
    try {
        console.log("Creating Posts....")

        const [albert, sandra, glamgal] = await getAllUsers();

        await createPost({
            authorId: albert.id, 
            title: "First Post", 
            content: "This is my first post. I hope I love writing blogs as much as I love writing them."
        });

        await createPost({
            authorId: sandra.id,
            title: "My first post",
            content: "This is my first post. I am excited to keep posting new blogs."
        });

        await createPost({
            authorId: glamgal.id,
            title: "My first post",
            content: "This is my first post. I am excited to keep posting new blogs."
        });

        console.log("Initial posts created.....")
    } catch (error) {
        throw error
    }
}

async function createInitialTags() {
    try {
        console.log('Creating Tags....');
        
        const [happy, sad, inspo, catman] = await createTags([
            '#happy',
            '#worst-day-ever',
            '#youcandoanything',
            '#catmandoeverything'
        ]);
        console.log("pass1")

        const [postOne, postTwo, postThree] = await getAllPosts();
        console.log("pass2")

        await addTagsToPost(postOne.id, [happy, inspo]);
        console.log("pass3")
        await addTagsToPost(postTwo.id, [sad, inspo]);
        console.log("pass4")
        await addTagsToPost(postThree.id, [happy, catman, inspo]);
        console.log("pass5")

        console.log("Finished creating tags!");
    } catch (error) {
        console.log("Error: Could not create tags.");
        throw error;
    }
}

async function testDB() {
    try {
        console.log("Testing the DB.....");
        const users = await getAllUsers();
        console.log("getAllUsers:", users);

        console.log("Updating user 0....");
        const updateResult = await updateUser(users[0].id, {
            name: "new name",
            location: "new location",
        });
        console.log("User Update Result: ", updateResult)

        console.log("Getting All Posts")
        const posts = await getAllPosts();
        console.log("getAllPosts:", posts)

        console.log("Updating Posts on posts[0]");
        const updatePostResult = await updatePost(posts[0].authorId, {
            title: "New Title",
            content: "Updated Content"
        });
        console.log('Posts Update Result: ', updatePostResult);

        console.log("Getting User By ID 1");
        const albert = await getUserById(1);
        console.log("User ID Result: ", albert); 

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
        DROP TABLE IF EXISTS post_tags;
        DROP TABLE IF EXISTS tags;
        DROP TABLE IF EXISTS posts;
        DROP TABLE IF EXISTS users;
    `);

        console.log("Tables dropped....");
    } catch (error) {
        console.error("Error: Could not drop tables");
        throw error; // we pass the error up to the function that calls dropTables
    }
}

// this function should call a query which creates all tables for our database
async function createUsersTable() {
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
        await createUsersTable();
        await createPostsTable();
        await createTagsTable();
        await createPostTagsTable();
        await createInitialUsers();
        await createInitialPosts();
        await createInitialTags();
        
    } catch (error) {
        throw error;
    }
}

rebuildDB()
    .then(testDB)
    .catch(console.error)
    .finally(() => client.end());
