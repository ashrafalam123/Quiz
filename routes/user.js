const express = require("express");
const router = express.Router();
const zod = require("zod");
const { Client } = require("pg");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

const client = new Client({
    connectionString: ""
})

const signupBody = zod.object({
    username: zod.string().min(5),
    password: zod.string().min(5) 
});

client.connect();

router.post('/signup',async (req,res) => {
    const { success } = signupBody.safeParse(req.body);
    if(!success){
        res.status(400).json({
            msg: "Invalid signup body sent"
        })
    }
    try{
    const insertQuery = `
    INSERT INTO users (username,password) VALUES ($1,$2) RETURNING id`;
    const values = [req.body.username,req.body.password];
    const response = await client.query(insertQuery,values);
    const id = response.rows[0].id
    const token = jwt.sign({id},JWT_SECRET);
    res.json({
        token: token,
        msg: "successfully signed up"
    })
    }catch(e){
        if(e.code === '23505'){
            res.status(400).send("The username already exists")
        }else{
        res.status(500).send("Error during signing up");}
        console.error(e);
    }
})

router.post('/signin',async (req,res) => {
    const { success } = signupBody.safeParse(req.body);
    if(!success){
        res.status(400).json({
            msg: "Invalid signin body sent"
        })
    }
    try{
    const getQuery = `
        SELECT * FROM users WHERE username = $1 AND password = $2
    `;
    const values = [req.body.username, req.body.password];
    const response = await client.query(getQuery, values);
    if (response.rows.length > 0) {
        const id = response.rows[0].id;
        const token = jwt.sign({ id }, JWT_SECRET);
        res.json({
            token: token,
            msg: "Successfully signed in"
        });
    } else {
        res.status(404).send("No user found, please sign up");
    }
    }catch(e){
        res.status(500).send("Error during signing in");
        console.error(e);
    }
})

module.exports = router;