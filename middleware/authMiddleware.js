const jmt = require('jsonwebtoken');
const jmtSecret = process.env.JMT_SECRET;

exports.requireAuth = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        jmt.verify(token, jmtSecret, (err, decodedToken) => {
            if (err) {
                console.log("Token verification failed:", err.message);
                res.redirect('/admin/login');
            } else {
                console.log("Token verified successfully:", decodedToken);
                req.user = decodedToken;
                res.locals.isAuthenticated = true;
                next();
            }
        });
    } else {
        console.log("No token found");
        res.redirect('/admin/login');
    }
};

exports.checkUser = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        jmt.verify(token, jmtSecret, (err, decodedToken) => {
            if (err) {
                console.log("Token check failed:", err.message);
                res.locals.user = null;
                res.locals.isAuthenticated = false;
                res.clearCookie('token'); // 유효하지 않은 토큰 제거
            } else {
                console.log("Token check successful:", decodedToken);
                res.locals.user = decodedToken.id;
                res.locals.isAuthenticated = true;
                // 토큰 갱신
                const newToken = jmt.sign({ id: decodedToken.id }, jmtSecret, { expiresIn: '1d' });
                res.cookie('token', newToken, { 
                    httpOnly: true, 
                    maxAge: 24 * 60 * 60 * 1000,
                    secure: process.env.NODE_ENV === 'production'
                });
            }
            next();
        });
    } else {
        console.log("No token found during check");
        res.locals.user = null;
        res.locals.isAuthenticated = false;
        next();
    }
};