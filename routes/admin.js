const express = require("express");
const router = express.Router();
const Post = require("../models/Post");

const adminLayout = "../views/layouts/admin";
const adminLayout2 = "../views/layouts/admin-nologout";
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const bcrypt =require("bcrypt");
const jmt = require("jsonwebtoken");
const jmtSecret = process.env.JMT_SECRET;
const { isAdmin, requireAuth } = require("../middleware/authMiddleware");





/** check login  */

const checkLogin = (req,res ,next )=>{
    const token = req.cookies.token;
    if(!token){
        res.redirect("/admin");

    }else{
        try{
            const decoded = jmt.verify(token,jmtSecret);
            req.userId = decoded.userId;
            next();

        }catch(error){
            res.redirect("/admin");
        }
    }
}


/** admin get post  */
router.get("/post/:id", asyncHandler(async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).render("error", { message: "게시물을 찾을 수 없습니다." });
        }
        res.render("admin/postDetail", { 
            post, 
            layout: adminLayout,
            title: post.title
        });
    } catch (error) {
        console.error("Error fetching post:", error);
        res.status(500).render("error", { 
            message: "게시물을 불러오는 중 오류가 발생했습니다.",
            error: error
        });
    }
}));




router.get("/allPosts", checkLogin,requireAuth, asyncHandler(async (req, res) => {
    try {
        const locals = {
            title: "모든 게시물"
        };
        const data = await Post.find().sort({ createdAt: -1 }); // 최신 글 순으로 정렬
        console.log("Posts found:", data); // 디버깅을 위한 로그
        res.render("admin/allPosts", { 
            locals, 
            data, // 'posts' 대신 'data'로 변경
            layout: adminLayout 
        });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).render("error", { 
            message: "게시물을 불러오는 중 오류가 발생했습니다.",
            error: error
        });
    }
}));


router.get("/add", checkLogin ,(req, res) => {
    res.render("admin/add", { layout: adminLayout, title: "새 게시물 작성" });
});

router.post("/add", asyncHandler(async (req, res) => {
    try {
        const { title, body } = req.body;
        const newPost = new Post({ title, body });
        await newPost.save();
        res.status(201).json({ message: "게시물이 성공적으로 추가되었습니다." });
    } catch (error) {
        console.error("Error adding new post:", error);
        res.status(500).json({ message: "게시물 추가 중 오류가 발생했습니다.", error: error.message });
    }
}));


router.get("/edit/:id", asyncHandler(async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        res.render("admin/edit", { 
            layout: adminLayout, 
            post,
            title: "게시물 편집"
        });
    } catch (error) {
        console.error("Error fetching post for edit:", error);
        res.status(500).render("error", { 
            message: "게시물을 불러오는 중 오류가 발생했습니다.",
            error: error
        });
    }
}));

// 게시물 편집 처리
router.post("/edit/:id", asyncHandler(async (req, res) => {
    try {
        const { title, body } = req.body;
        await Post.findByIdAndUpdate(req.params.id, { title, body });
        res.redirect("/admin/allPosts");
    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).json({ message: "게시물 수정 중 오류가 발생했습니다.", error: error.message });
    }
}));

// 게시물 삭제
router.delete("/delete/:id", asyncHandler(async (req, res) => {
    try {
        const result = await Post.findByIdAndDelete(req.params.id);
        if (result) {
            res.json({ success: true, message: "게시물이 성공적으로 삭제되었습니다." });
        } else {
            res.status(404).json({ success: false, message: "게시물을 찾을 수 없습니다." });
        }
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ success: false, message: "게시물 삭제 중 오류가 발생했습니다.", error: error.message });
    }
}));

/** admin log out  */

router.get("/logout",(req,res)=>{
    res.clearCookie("token");
    res.redirect("/");

});


/**admin page  
 * get /admin
*/

router.get("/login", (req, res) => {
    const locals = {
        title: "관리자 로그인 페이지",
    };
    res.render("admin/index", { locals, layout: adminLayout2 });
});

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.render("admin/index", { 
                locals: { title: "관리자 로그인 페이지", error: "아이디 또는 비밀번호가 일치하지 않습니다." },
                layout: adminLayout2 
            });
        }
        
        const token = jmt.sign({ id: user._id }, jmtSecret, { expiresIn: '1d' });
        res.cookie("token", token, { 
            httpOnly: true, 
            maxAge: 24 * 60 * 60 * 1000,
            secure: process.env.NODE_ENV === 'production'
        });
        
        // 세션에 사용자 정보 저장
        req.session.userId = user._id;
        req.session.isAuthenticated = true;
        
        res.redirect("/admin/allPosts");
    } catch (error) {
        console.error("Login error:", error);
        res.render("admin/index", { 
            locals: { title: "관리자 로그인 페이지", error: "로그인 처리 중 오류가 발생했습니다." },
            layout: adminLayout2
        });
    }
});

/*
router.get("/", (req, res) => {
    const locals = {
        title: "관리자 페이지" ,
    };
       res.render("admin/index", { locals , layout: adminLayout2 });
   });
*/







/**view register form  */
router.get("/register",asyncHandler(async (req,res)=>{
    res.render("admin/index", {layout:adminLayout2});

}))
router.post(
    "/register",
    asyncHandler(async(req,res)=>{
        const hashedPassword = await bcrypt.hash(req.body.password,10);
        const user = await User.create({
            username:req.body.username,
            password: hashedPassword
        });
        res.json(`user created: ${user}`);
    })
)

module.exports = router ;
