const { Router } = require('express');
const router = Router();
const jwt = require('jsonwebtoken');
const workoutDOA = require('../doas/workout');

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
    const isAdmin = await workoutDOA.isAdmin(req.userid);
    if (!isAdmin) {
        res.sendStatus(403);
    } else {
        const workout = await workoutDOA.createWorkout(req.body);
        res.json(workout);
    }
})

router.put('/:id', async (req, res, next) => {
    const isAdmin = await workoutDOA.isAdmin(req.userid);
    if (!isAdmin) {
        res.sendStatus(403);
    } else {
        const workout = await workoutDOA.updateWorkout(req.params.id, req.body);
        res.json(workout);
    }
})

router.get('/', async (req, res, next) => {
    const workouts = await workoutDOA.getAllWorkouts();
    res.json(workouts);
})

router.get('/:id', async (req, res, next) => {
    const workout = await workoutDOA.getOneWorkout(req.params.id);
    res.json(workout);
})

module.exports = router;