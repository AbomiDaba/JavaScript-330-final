const request = require("supertest");

const server = require("../server");
const testUtils = require("../test.utils");

const User = require("../models/user");
const Workout = require("../models/workout");

describe("/workouts", () => {
    beforeAll(testUtils.connectDB);
    afterAll(testUtils.stopDB);

    afterEach(testUtils.clearDB);

    const workout0 = { name: "Workout One", reps: 10 };
    const workout1 = { name: "Second Workout", reps: 12 };

    describe("Before login", () => {
        describe("POST /", () => {
        it("should send 401 without a token", async () => {
            const res = await request(server).post("/workouts").send(workout0);
            expect(res.statusCode).toEqual(401);
        });
        it("should send 401 with a bad token", async () => {
            const res = await request(server)
            .post("/workouts")
            .set("Authorization", "Bearer BAD")
            .send(workout0);
            expect(res.statusCode).toEqual(401);
        });
        });
        describe("GET /", () => {
        it("should send 401 without a token", async () => {
            const res = await request(server).get("/workouts").send(workout0);
            expect(res.statusCode).toEqual(401);
        });
        it("should send 401 with a bad token", async () => {
            const res = await request(server)
            .get("/workouts")
            .set("Authorization", "Bearer BAD")
            .send();
            expect(res.statusCode).toEqual(401);
        });
        });
        describe("GET /:id", () => {
        it("should send 401 without a token", async () => {
            const res = await request(server).get("/workouts/123").send(workout0);
            expect(res.statusCode).toEqual(401);
        });
        it("should send 401 with a bad token", async () => {
            const res = await request(server)
            .get("/workouts/456")
            .set("Authorization", "Bearer BAD")
            .send();
            expect(res.statusCode).toEqual(401);
        });
        });
    });
    describe("after login", () => {
        const user0 = {
        email: "user0@mail.com",
        password: "123password",
        };
        const user1 = {
        email: "user1@mail.com",
        password: "456password",
        };
        let token0;
        let adminToken;
        beforeEach(async () => {
        await request(server).post("/auth/signup").send(user0);
        const res0 = await request(server).post("/auth/login").send(user0);
        token0 = res0.body.token;
        await request(server).post("/auth/signup").send(user1);
        await User.updateOne(
            { email: user1.email },
            { admin: true }
        );
        const res1 = await request(server).post("/auth/login").send(user1);
        adminToken = res1.body.token;
        });
        describe.each([workout0, workout1])("POST / workout %#", (workout) => {
        it("should send 403 to normal user and not store workout", async () => {
            const res = await request(server)
            .post("/workouts")
            .set("Authorization", "Bearer " + token0)
            .send(workout);
            expect(res.statusCode).toEqual(403);
            expect(await Workout.countDocuments()).toEqual(0);
        });
        it("should send 200 to admin user and store workout", async () => {
            const res = await request(server)
            .post("/workouts")
            .set("Authorization", "Bearer " + adminToken)
            .send(workout);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toMatchObject(workout);
            const savedWorkout = await Workout.findOne({ _id: res.body._id }).lean();
            expect(savedWorkout).toMatchObject(workout);
        });
        });
        describe.each([workout0, workout1])("PUT / workout %#", (workout) => {
        let originalWorkout;
        beforeEach(async () => {
            const res = await request(server)
            .post("/workouts")
            .set("Authorization", "Bearer " + adminToken)
            .send(workout);
            originalWorkout = res.body;
        });
        it("should send 403 to normal user and not update workout", async () => {
            const res = await request(server)
            .put("/workouts/" + originalWorkout._id)
            .set("Authorization", "Bearer " + token0)
            .send({ ...workout, reps: workout.reps + 1 });
            expect(res.statusCode).toEqual(403);
            const newWorkout = await Workout.findById(originalWorkout._id).lean();
            newWorkout._id = newWorkout._id.toString();
            expect(newWorkout).toMatchObject(originalWorkout);
        });
        it("should send 200 to admin user and update workout", async () => {
            const res = await request(server)
            .put("/workouts/" + originalWorkout._id)
            .set("Authorization", "Bearer " + adminToken)
            .send({ ...workout, reps: workout.reps + 1 });
            expect(res.statusCode).toEqual(200);
            const newWorkout = await Workout.findById(originalWorkout._id).lean();
            newWorkout._id = newWorkout._id.toString();
            expect(newWorkout).toMatchObject({
            ...originalWorkout,
            reps: originalWorkout.reps + 1,
            });
        });
        });
        describe.each([workout0, workout1])("GET /:id workout %#", (workout) => {
        let originalWorkout;
        beforeEach(async () => {
            const res = await request(server)
            .post("/workouts")
            .set("Authorization", "Bearer " + adminToken)
            .send(workout);
            originalWorkout = res.body;
        });
        it("should send 200 to normal user and return workout", async () => {
            const res = await request(server)
            .get("/workouts/" + originalWorkout._id)
            .set("Authorization", "Bearer " + token0)
            .send();
            expect(res.statusCode).toEqual(200);
            expect(res.body).toMatchObject(originalWorkout);
        });
        it("should send 200 to admin user and return workout", async () => {
            const res = await request(server)
            .get("/workouts/" + originalWorkout._id)
            .set("Authorization", "Bearer " + adminToken)
            .send();
            expect(res.statusCode).toEqual(200);
            expect(res.body).toMatchObject(originalWorkout);
        });
        });
        describe("GET /", () => {
        let workouts;
        beforeEach(async () => {
            workouts = (await Workout.insertMany([workout0, workout1])).map((i) => i.toJSON());
            workouts.forEach((i) => (i._id = i._id.toString()));
        });
        it("should send 200 to normal user and return all workouts", async () => {
            const res = await request(server)
            .get("/workouts/")
            .set("Authorization", "Bearer " + token0)
            .send();
            expect(res.statusCode).toEqual(200);
            expect(res.body).toMatchObject(workouts);
        });
        it("should send 200 to admin user and return all workouts", async () => {
            const res = await request(server)
            .get("/workouts/")
            .set("Authorization", "Bearer " + adminToken)
            .send();
            expect(res.statusCode).toEqual(200);
            expect(res.body).toMatchObject(workouts);
        });
        });
    });
});
