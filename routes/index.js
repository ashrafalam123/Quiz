const express = require("express");
const router = express.Router();
const userRouter = require("./user");
const questionRouter = require("./question"); // Include the question router

router.use('/user', userRouter);
router.use('/question', questionRouter); // Use the question router

module.exports = router;
