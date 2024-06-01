const { Router } = require("express");
const router = Router();

router.use("/auth", require("./auth"));
router.use("/workouts", require("./workouts"));
// router.use("/sets", require("./sets"));

module.exports = router;
