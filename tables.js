const { Client } = require("pg");

const client = new Client({
    connectionString: ""
});

async function createTables() {
    try {
        await client.connect();

        const createUserTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        const createQuestionTableQuery = `
            CREATE TABLE IF NOT EXISTS questions (
                id SERIAL PRIMARY KEY,
                question VARCHAR(500) UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        const createOptionsTableQuery = `
            CREATE TABLE IF NOT EXISTS options (
                id SERIAL PRIMARY KEY,
                option VARCHAR(500),
                question_id INTEGER,
                FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
            );
        `;

        const createUserQuestionAnswers = `
        CREATE TABLE IF NOT EXISTS user_qn_ans (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            question_id INTEGER,
            option_id INTEGER,
            is_right BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
            FOREIGN KEY (option_id) REFERENCES options(id)
            )`

        // await client.query(createUserTableQuery);
        // await client.query(createQuestionTableQuery);
        // await client.query(createOptionsTableQuery);
        await client.query(createUserQuestionAnswers);

        console.log("Tables created successfully.");
    } catch (err) {
        console.error("Error creating tables:", err);
    } finally {
        await client.end();
    }
}

async function updateTable() {
    try {
        await client.connect();
        // const updateOptionQuery = `
        //     ALTER TABLE options ADD COLUMN IF NOT EXISTS is_true BOOLEAN DEFAULT FALSE;
        // `;
        const updateOptionQuery = `
        ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(50)`;
        await client.query(updateOptionQuery);
        console.log("Column has been added");
    } catch (e) {
        console.error("Error updating table:", e);
    } finally {
        await client.end();
    }
}

createTables();