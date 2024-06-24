const express = require('express');
const { Client } = require("pg");
const zod = require("zod");
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require("../config")

const router = express.Router();

const client = new Client({
    connectionString: ""
})

const questionPostingBody = zod.object({
    question: zod.string(),
    option1: zod.string(),
    option2: zod.string(),
    option3: zod.string(),
    option4: zod.string(),
    correct_ans: zod.number().min(1).max(4),
})

client.connect();

async function authMiddeWare(req,res,next){
    try{
        const token = req.headers.authorization;
        if(!token){
            return res.status(403).send('Unauthorised user, please signup')
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const findUserQuery =  `
        SELECT * FROM users WHERE id = $1`;
        const response = await client.query(findUserQuery,[userId]);
        if(response.rows.length === 0){
            return res.status(403).send('Unauthorised user, please signup')    
        }else{
            next();
        }
    }catch(e){
        res.status(403).send('Unauthorised user, please signup')
    }
    
}

router.post('/submit', authMiddeWare,async (req, res) => {
    const { success } = questionPostingBody.safeParse(req.body);
    if (!success) {
        return res.status(400).json({
            msg: "Invalid signup body sent"
        });
    }
    try {
        await client.query("BEGIN");
        const insertQuestionQuery = `
            INSERT INTO questions (question) VALUES ($1) RETURNING id`;
        const questionValues = [req.body.question];
        const questionResponse = await client.query(insertQuestionQuery, questionValues);
        const questionId = questionResponse.rows[0].id;

        const options = [req.body.option1, req.body.option2, req.body.option3, req.body.option4];
        const correctIndex = req.body.correct_ans - 1; 

        for (let i = 0; i < options.length; i++) {
            const optionInsertQuery = `
                INSERT INTO options (option, question_id, is_true) VALUES ($1, $2, $3)`;
            const values = [options[i], questionId, i === correctIndex];
            await client.query(optionInsertQuery, values);
        }
        await client.query("COMMIT");
        res.json({
            question_id: questionId,
            msg: "Question submitted successfully"
        });
    } catch (e) {
        console.error(e);
        await client.query("ROLLBACK");
        res.status(500).send("Unable to post the question");
    }
});

router.get('/qn/:id',authMiddeWare, async (req, res) => {
    const id = req.params.id;
    try {
        const getQuestionQuery = `
        SELECT * FROM questions WHERE id = $1`;
        const questionResponse = await client.query(getQuestionQuery, [id]);

        if (questionResponse.rows.length === 0) {
            return res.status(404).send("No such question exists");
        }

        const question = questionResponse.rows[0].question;

        const getOptionQuery = `
        SELECT * FROM options WHERE question_id = $1`;
        const optionResponse = await client.query(getOptionQuery, [id]);

        const questionOptions = optionResponse.rows.map(row => ({
            option: row.option,
            option_id: row.id,
            is_true: row.is_true,
        }));

        res.status(200).json({
            "question": question,
            "options": questionOptions
        });
    } catch (e) {
        console.error(e);
        res.status(500).send("Unable to find the question");
    }
});

router.post('/check', authMiddeWare, async (req, res) => {
    try{
        const query = `
        SELECT * FROM options WHERE id = $1`;
        const questionId = req.body.question_id;
        const optionId = req.body.option_id;
        const token = req.headers.authorization;
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const response = await client.query(query, [optionId]);
        if (response.rows.length === 0) {
            return res.status(404).send('Option not found');
        }

        const isCorrect = response.rows[0].is_true;
        const insertQuery = `
            INSERT INTO user_qn_ans (user_id, question_id, option_id, is_right) VALUES ($1, $2, $3, $4)`;
        await client.query(insertQuery, [userId, questionId, optionId, isCorrect]);

        if (isCorrect) {
            res.status(200).send('Hurray your answer is correct!');
        } else {
            res.status(200).send('Ooops, your answer is wrong');
        }
    }catch(e){
        console.error(e);
        res.status(500).send("Unable to submit your answer")
    }
})

module.exports = router;
