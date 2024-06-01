const Set = require('../models/set');
const Workout = require('../models/workout');
const User = require('../models/user');

module.exports = {};

module.exports.createSet = async (userid, workouts) => {
    let total = 0;
    for (let workout = 0; workout < workouts.length; workout++) {
        const currentWorkout = await Workout.findOne({ _id: workouts[workout] });
        if (!currentWorkout) {
            return null;
        }
        
        total += currentWorkout.reps;
    }
    return await Set.create({ userId: userid, workouts: workouts, totalReps: total });
    
}

module.exports.getAllSets = async (userid) => {
    const user = await User.findOne({ _id: userid });
    let isAdmin = false;
    if (user.admin) {
        isAdmin = true;
    }

    if (isAdmin) {
        return await Set.find();
    } else {
        return await Set.find({ userId:userid });
        
    }
}

module.exports.getOneSet = async (userid, setid) => {
    const user = await User.findOne({ _id: userid });
    let isAdmin = false;
    if (user.admin) {
        isAdmin = true;
    }
    
    const set = await Set.findOne({ _id: setid });
    let workouts = [];
    for (let workout = 0; workout < set.workouts.length; workout++) {
        let currentWorkout = await Workout.findOne({ _id: set.workouts[workout] });
        workouts.push(currentWorkout);
    }

    if (isAdmin) {
        return { workouts: workouts, userId: set.userId.toString(), totalReps: set.totalReps };
    }
    
    if (set.userId.equals(user._id)) {
        return { workouts: workouts, userId: set.userId.toString(), totalReps: set.totalReps }
    } else {
        return null;
    }
}