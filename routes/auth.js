const { Router } = require('express');
const router = Router();
const userDAO = require('../doas/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SECRET_KEY = 'My@Special&Secret#Key'

router.post('/signup', async (req, res, next) => {
    const { password } = req.body;
    if (!password || password === '') {
        res.sendStatus(400);
    } else {
        const user = await userDAO.createUser(req.body);
        if (user) {
            res.json(user);
        } else {
            res.sendStatus(409);
        }
    }
})

router.post('/login', async (req, res, next) => {
    const { password, email } = req.body;
    if (!password) {
        res.sendStatus(400)
    } else {
        const user = await userDAO.getUser(email);
        if (user) {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                const data = { '_id': user._id.toString(), email: user.email,  admin: user.admin };
                const token = jwt.sign(data, SECRET_KEY);
                res.json({token: token});
            } else {
                res.sendStatus(401);
            }
        } else {
            res.sendStatus(401);
        }
    }
})

router.use(async (req, res, next) => {
    let token = req.headers.authorization;
    if (!token) {
        res.sendStatus(401)
    } else {
        try {
            token = token.split(' ')[1];
            const decodedToken = jwt.decode(token);
            req.userid = decodedToken._id;
            next();
        } catch (error) {
            res.sendStatus(401);
        }
    }
})

router.put('/password', async (req, res, next) => {
    const { password } = req.body;
    if (password == '') {
        res.sendStatus(400);
    } else {
        const update = await userDAO.updateUserPassword(req.userid, password);
        res.json(update);
    }
})

module.exports = router;