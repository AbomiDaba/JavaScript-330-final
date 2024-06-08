const mongoose = require("mongoose");
const Workouts = require("./workout");


const setSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        index:true
    },
    workouts: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: Workouts }],
        required: true,
    },
    totalReps: { type: Number, required: true },
});

module.exports = mongoose.model("sets", setSchema);
