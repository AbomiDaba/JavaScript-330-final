const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema({
    name: { type: String, required: true },
    reps: { type: Number, required: true },
});

module.exports = mongoose.model("workouts", workoutSchema);