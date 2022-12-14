const { Client } = require("pg"); // imports the pg module

const { DATABASE_URL = "postgres://localhost:5432/juicebox-dev"} = process.env;

// supply the db name and location of the database
const client = new Client({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {rejectUnauthorized:  false } : undefined
});

async function getAllUsers() {
    const { rows } = await client.query(`SELECT id, username, name, location, active FROM users;`);
    return rows;
}

async function getAllPosts() {
    const { rows } = await client.query(`SELECT "authorId", title, content FROM posts;`);
    return rows;
}

async function getAllTags() {
    const { rows } = await client.query(`SELECT * FROM tags;`);
    return rows;
}

async function getUserById(userID) {
    try {
        const { rows } = await client.query(`
          SELECT id, username, name, location, active
          FROM users
          WHERE id=${userID};
        `);

        if (rows[0] === undefined) {
            return null;
        } else {
            delete rows[0].password;
            const posts = await getPostsByUser(rows[0].id);
            rows[0].posts = posts.rows;
            return rows[0];
        }
    } catch (error) {
        throw error;
    }
}

async function getPostsByUser(userID) {
    try {
        const userPosts = await client.query(`
    SELECT * FROM posts
    WHERE "authorId"=${userID}
  `);
        return userPosts;
    } catch (error) {
        throw error;
    }
}

async function getPostById(postId) {
    try {
        const {
            rows: [post],
        } = await client.query(
            `
            SELECT * FROM posts WHERE id=$1
        `,
            [postId]
        );

        const { rows: tags } = await client.query(
            `
            SELECT tags.* FROM tags
            JOIN post_tags ON tags.id=post_tags."tagId"
            WHERE post_tags."postId"=$1;
        `,
            [postId]
        );

        const {
            rows: [author],
        } = await client.query(
            `
            SELECT id, username, name, location FROM users
            WHERE id=$1;
        `,
            [post.authorId]
        );

        post.tags = tags;
        post.author = author;

        delete post.authorId;

        return post;
    } catch (error) {
        throw error;
    }
}

async function createUser({ username, password, name, location }) {
    try {
        const {
            rows: [user],
        } = await client.query(
            `
      INSERT INTO users (username, password, name, location) VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO NOTHING
      RETURNING *;
    `,
            [username, password, name, location]
        );
        return user;
    } catch (error) {
        throw error;
    }
}

async function createPostTag(postId, tagId) {
    try {
        await client.query(
            `
            INSERT INTO post_tags ("postId", "tagId") VALUES ($1, $2) ON CONFLICT ("postId", "tagId") DO NOTHING;
        `,
            [postId, tagId]
        );
    } catch (error) {
        throw error;
    }
}

async function addTagsToPost(postId, tagList) {
    try {
        const createPostTagPromises = tagList.map((tag) => createPostTag(postId, tag.id));

        await Promise.all(createPostTagPromises);

        return await getPostById(postId);
    } catch (error) {
        throw error;
    }
}

async function createTags(tagList) {
    if (tagList.length === 0) {
        return;
    }

    console.log('TAGLIST:', tagList)

    const insertValues = tagList.map((_, index) => `$${index + 1}`).join('), (');

    console.log("mapped insert vals:", insertValues)

    const selectValues = tagList.map((_, index) => `$${index + 1}`).join(', ');

    console.log("mapped select vals:", selectValues)

    try {
        await client.query(
            `
            INSERT INTO tags (name) 
            VALUES (${insertValues})
            ON CONFLICT (name) DO NOTHING;
        `, [tagList]
        );

        const rows = await client.query(
            `
            SELECT * FROM tags 
            WHERE name 
            IN (${selectValues});
        `, [tagList]
        );

        return rows;
    } catch (error) {
        throw error;
    }
}

async function updateUser(id, fields = {}) {
    const setString = Object.keys(fields)
        .map((key, index) => `"${key}"=$${index + 1}`)
        .join(", ");

    if (setString.length === 0) {
        return;
    }

    try {
        const {
            rows: [user],
        } = await client.query(
            `
        UPDATE users
        SET ${setString}
        WHERE id=${id}
        RETURNING *;
      `,
            Object.values(fields)
        );

        return user;
    } catch (error) {
        throw error;
    }
}

async function createPost({ authorId, title, content }) {
    try {
        const {
            rows: [post],
        } = await client.query(
            `
        INSERT INTO posts ("authorId", title, content) VALUES ($1, $2, $3) RETURNING *;
      `,
            [authorId, title, content]
        );
        return post;
    } catch (error) {
        throw error;
    }
}

async function updatePost(id, fields = {}) {
    const setString = Object.keys(fields)
        .map((key, index) => `"${key}"=$${index + 1}`)
        .join(", ");

    if (setString.length === 0) {
        return;
    }
    try {
        const {
            rows: [post],
        } = await client.query(
            `
      UPDATE posts
      SET ${setString}
      WHERE id=${id}
      RETURNING *;
    `,
            Object.values(fields)
        );

        return post;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    client,
    getAllUsers,
    createUser,
    updateUser,
    createPost,
    updatePost,
    getAllPosts,
    getUserById,
    createTags,
    getAllTags,
    addTagsToPost,
};
