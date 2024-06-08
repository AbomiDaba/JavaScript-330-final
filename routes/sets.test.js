const request = require("supertest");

const server = require("../server");
const testUtils = require("../test.utils");

const User = require("../models/user");
const Workout = require("../models/workout");
const Set = require("../models/set");

describe("/set", () => {
    beforeAll(testUtils.connectDB);
    afterAll(testUtils.stopDB);

    afterEach(testUtils.clearDB);

    const workout0 = { name: "Workout One", reps: 10 };
    const workout1 = { name: "Second Workout", reps: 12 };
    let workouts;

    beforeEach(async () => {
        workouts = (await Workout.insertMany([workout0, workout1])).map((i) => i.toJSON());
    });

    describe("Before login", () => {
        describe("POST /", () => {
        it("should send 401 without a token", async () => {
            const res = await request(server).post("/sets").send(workout0);
            expect(res.statusCode).toEqual(401);
        });
        it("should send 401 with a bad token", async () => {
            const res = await request(server)
            .post("/sets")
            .set("Authorization", "Bearer BAD")
            .send(workout0);
            expect(res.statusCode).toEqual(401);
        });
        });
        describe("GET /", () => {
        it("should send 401 without a token", async () => {
            const res = await request(server).get("/sets").send(workout0);
            expect(res.statusCode).toEqual(401);
        });
        it("should send 401 with a bad token", async () => {
            const res = await request(server)
            .get("/sets")
            .set("Authorization", "Bearer BAD")
            .send();
            expect(res.statusCode).toEqual(401);
        });
        });
        describe("GET /:id", () => {
        it("should send 401 without a token", async () => {
            const res = await request(server).get("/sets/123").send(workout0);
            expect(res.statusCode).toEqual(401);
        });
        it("should send 401 with a bad token", async () => {
            const res = await request(server)
            .get("/sets/456")
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
            { admin: true },
        );
        const res1 = await request(server).post("/auth/login").send(user1);
        adminToken = res1.body.token;
        });
        describe("POST /", () => {
        it("should send 200 to normal user and create set", async () => {
            const res = await request(server)
            .post("/sets")
            .set("Authorization", "Bearer " + token0)
            .send(workouts.map((w) => w._id));
            expect(res.statusCode).toEqual(200);
            const storedSet = await Set.findOne().lean();
            expect(storedSet).toMatchObject({
            workouts: workouts.map((w) => w._id),
            userId: (await User.findOne({ email: user0.email }).lean())._id,
            totalReps: 22,
            });
        });
        it("should send 200 to admin user and create set with repeat workouts", async () => {
            const res = await request(server)
            .post("/sets")
            .set("Authorization", "Bearer " + adminToken)
            .send([workouts[1], workouts[1], workouts[0]].map((w) => w._id));
            expect(res.statusCode).toEqual(200);
            const storedSet = await Set.findOne().lean();
            expect(storedSet).toMatchObject({
            workouts: [workouts[1]._id, workouts[1]._id, workouts[0]._id],
            userId: (await User.findOne({ email: user1.email }))._id,
            totalReps: 34,
            });
        });
        it("should send 400 with a bad workout _id", async () => {
            const res = await request(server)
            .post("/sets")
            .set("Authorization", "Bearer " + adminToken)
            .send([workouts[1], "5f1b8d9ca0ef055e6e5a1f6b"].map((w) => w._id));
            expect(res.statusCode).toEqual(400);
            const storedSet = await Set.findOne().lean();
            expect(storedSet).toBeNull();
        });
        });
        describe("GET /:id", () => {
        let set0Id, set1Id;
        beforeEach(async () => {
            const res0 = await request(server)
            .post("/sets")
            .set("Authorization", "Bearer " + token0)
            .send([workouts[0], workouts[1], workouts[1]].map((w) => w._id));
            set0Id = res0.body._id;
            const res1 = await request(server)
            .post("/sets")
            .set("Authorization", "Bearer " + adminToken)
            .send([workouts[1]].map((w) => w._id));
            set1Id = res1.body._id;
        });
        it("should send 200 to normal user with their set", async () => {
            const res = await request(server)
            .get("/sets/" + set0Id)
            .set("Authorization", "Bearer " + token0)
            .send();
            expect(res.statusCode).toEqual(200);
            expect(res.body).toMatchObject({
            workouts: [workout0, workout1, workout1],
            userId: (await User.findOne({ email: user0.email }))._id.toString(),
            totalReps: 34,
            });
        });
        it("should send 404 to normal user with someone else's set", async () => {
            const res = await request(server)
            .get("/sets/" + set1Id)
            .set("Authorization", "Bearer " + token0)
            .send();
            expect(res.statusCode).toEqual(404);
        });
        it("should send 200 to admin user with their set", async () => {
            const res = await request(server)
            .get("/sets/" + set1Id)
            .set("Authorization", "Bearer " + adminToken)
            .send();
            expect(res.statusCode).toEqual(200);
            expect(res.body).toMatchObject({
            workouts: [workout1],
            userId: (await User.findOne({ email: user1.email }))._id.toString(),
            totalReps: 12,
            });
        });
        it("should send 200 to admin user with someone else's set", async () => {
            const res = await request(server)
            .get("/sets/" + set0Id)
            .set("Authorization", "Bearer " + adminToken)
            .send();
            expect(res.statusCode).toEqual(200);
            expect(res.body).toMatchObject({
            workouts: [workout0, workout1, workout1],
            userId: (await User.findOne({ email: user0.email }))._id.toString(),
            totalReps: 34,
            });
        });
        });
        describe("GET /", () => {
        let set0Id, set1Id;
        beforeEach(async () => {
            const res0 = await request(server)
            .post("/sets")
            .set("Authorization", "Bearer " + token0)
            .send(workouts.map((i) => i._id));
            set0Id = res0.body._id;
            const res1 = await request(server)
            .post("/sets")
            .set("Authorization", "Bearer " + adminToken)
            .send([workouts[1]].map((w) => w._id));
            set1Id = res1.body._id;
        });
        it("should send 200 to normal user with their one set", async () => {
            const res = await request(server)
            .get("/sets")
            .set("Authorization", "Bearer " + token0)
            .send();
            expect(res.statusCode).toEqual(200);
            expect(res.body).toMatchObject([
            {
                totalReps: 22,
                userId: (await User.findOne({ email: user0.email }))._id.toString(),
                workouts: [workouts[0]._id.toString(), workouts[1]._id.toString()],
            },
            ]);
        });
        it("should send 200 to admin user all sets", async () => {
            const res = await request(server)
            .get("/sets")
            .set("Authorization", "Bearer " + adminToken)
            .send();
            expect(res.statusCode).toEqual(200);
            expect(res.body).toMatchObject([
            {
                workouts: [workouts[0]._id.toString(), workouts[1]._id.toString()],
                userId: (await User.findOne({ email: user0.email }))._id.toString(),
                totalReps: 22,
            },
            {
                workouts: [workouts[1]._id.toString()],
                userId: (await User.findOne({ email: user1.email }))._id.toString(),
                totalReps: 12,
            },
            ]);
        });
        });
    });
});
