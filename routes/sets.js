const { Router } = require('express');
const router = Router();
const jwt = require('jsonwebtoken');
const setDAO = require('../doas/set');

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

router.post('/', async (req, res, next) => {
    const set = await setDAO.createSet(req.userid, req.body);
    if (!set) {
        res.sendStatus(400);
    } else {
        res.json(set);
    }
})

router.get('/', async (req, res, next) => {
    const sets = await setDAO.getAllSets(req.userid);
    res.json(sets);
})

router.get('/:id', async (req, res, next) => {
    const set = await setDAO.getOneSet(req.userid, req.params.id);
    if (!set) {
        res.sendStatus(404);
    } else {
        res.json(set);
    }
})

module.exports = router
