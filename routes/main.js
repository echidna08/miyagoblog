const express = require("express");
const router = express.Router();
const Post = require('../models/Post');
const mainLayout = "../views/layouts/main.ejs";
const { checkUser } = require('../middleware/authMiddleware');
const asyncHandler = require("express-async-handler");

// 모든 라우트에 checkUser 미들웨어 적용
router.use(checkUser);

// 홈 페이지
router.get(["/", "/home"], asyncHandler(async (req, res) => {
    const locals = {
        title: "Home"
    };
    console.log("Home route - Authentication status:", res.locals.isAuthenticated);
    console.log("Home route - User:", res.locals.user);
    res.render("index", { locals, layout: mainLayout });
}));

// 게시물 목록 페이지
router.get("/posts", asyncHandler(async (req, res) => {
    const locals = {
        title: "Posts"
    };
    const data = await Post.find().sort({ createdAt: -1 }); // 최신 글 순으로 정렬
    res.render("posts", { locals, data, layout: mainLayout });
}));

// About 페이지
router.get("/about", (req, res) => {
    const locals = {
        title: "About Us"
    };
    res.render("about", { locals, layout: mainLayout });
});

// 게시물 상세 보기
router.get(["/post/:id", "/posts/:id"], asyncHandler(async (req, res) => {
    try {
        const data = await Post.findById(req.params.id);
        if (!data) {
            return res.status(404).render("error", { 
                message: "게시물을 찾을 수 없습니다.",
                layout: mainLayout 
            });
        }
        const locals = {
            title: data.title
        };
        res.render("postid", { locals, data, layout: mainLayout });
    } catch (error) {
        console.error("Error fetching post:", error);
        res.status(500).render("error", { 
            message: "게시물을 불러오는 중 오류가 발생했습니다.",
            layout: mainLayout
        });
    }
}));

module.exports = router;