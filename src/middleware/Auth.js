const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SECRET_KEY = process.env.SECRET_KEY ?? "frantic@hearzapp#6887";
async function Auth(req, res, next) {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).json({
            message: 'No Authorization Header'
        })
    }
    try {
        const token = authorization.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({
                message: 'Invalid Token Format'
            })
        }
        const decode = jwt.verify(token, SECRET_KEY);
        const ruser = decode.user;
        const user = await User.findOne({ _id: ruser._id });
        if (user?.is_deleted) {
            return res.status(404).json({ message: 'User Account deleted' });
        }
        // if (user.is_deleted || user.jwt_token !== token) {
        //     user.jwt_token = null;
        //     user.fcm_token = null;
        //     await user.save();
        //     return res.status(401).json({ message: 'Invalid token or user account deactivated' });
        // }
        req.user = user
        next()


    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                message: 'Session Expired',
                error: error.message,
            })
        }
        if (error instanceof jwt.JsonWebTokenError || error instanceof TokenError) {
            return res.status(401).json({
                message: 'Invalid Token',
                error: error.message,
            })
        }
        res.status(500).json({
            message: 'Internal server Error',
            error: error.message,
            stack: error.stack
        });
    }
}

module.exports = { Auth }