const Workout = require('../models/workout')
const User = require('../models/user');
module.exports = {};

module.exports.isAdmin = async (userid) => {
    const user = await User.findOne({ _id: userid });
    let isAdmin = false;
    if (user.admin) {
        isAdmin = true;
    }
    
    return isAdmin;
}

module.exports.createWorkout= async (obj) => {
    return await Workout.create(obj);
}

module.exports.updateWorkout = async (workoutid, obj) => {
    return await Workout.updateOne({ _id: workoutid }, obj);
}

module.exports.getOneWorkout = async (workoutid) => {
    return await Workout.findOne({ _id: workoutid });
}

module.exports.getAllWorkouts = async () => {
    return await Workout.find();
}