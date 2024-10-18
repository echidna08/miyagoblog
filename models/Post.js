//스키마와 모델링 

const mongoose = require("mongoose");

//관리자만 쓸수있게함


//포스트 스키마 정의 title,body,createat 
const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});



module.exports = mongoose.model("Post", PostSchema);
