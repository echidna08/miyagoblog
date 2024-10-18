const express = require("express");
const session = require('express-session');
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const connectDb = require("./config/db");
const cookieParser = require("cookie-parser");
const methodOverride = require('method-override');
const jmt = require("jsonwebtoken");
const jmtSecret = process.env.JMT_SECRET;
const { requireAuth, checkUser } = require('./middleware/authMiddleware');

const app = express();

// 미들웨어 순서 조정
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));

// 세션 미들웨어 설정
app.use(session({
    secret: process.env.SESSION_SECRET || 'jmtSecret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));




// 모든 라우트에 대해 checkUser 미들웨어 적용
app.use(checkUser);

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Express-ejs-layouts setup
app.use(expressLayouts);

// 정적 파일 설정
app.use(express.static("public"));

// 라우트 설정
const mainRoutes = require("./routes/main");
const adminRoutes = require("./routes/admin");

app.use("/", mainRoutes);
app.use("/admin", adminRoutes);
app.get("/login", (req, res) => {
    res.redirect("/admin/login");
});

// 서버 시작
const PORT = process.env.PORT || 3000;

connectDb();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));