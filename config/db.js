//env 파일에 저장된 uri 를 불러와서 접속 


const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
require("dotenv").config();


const connectDb = asyncHandler(async ()=>{
    const connect = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`db connected: ${connect.connection.host}`);
});

module.exports = connectDb;
