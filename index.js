const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(
    "mongodb+srv://freecodecampuser:p9BqH2aDZxL1MXs6@superuser.1wnan.mongodb.net/freecodecamp?retryWrites=true&w=majority",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
);

const user = new mongoose.Schema({
    username: String,
    count: Number,
    log: [
        {
            date: String,
            duration: Number,
            description: String,
        },
    ],
});

const User = mongoose.model("user", user);

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
    const username = req.body.username;
    const doc = new User({
        username: username,
    });
    try {
        const { _id, username } = await doc.save();
        res.send({ _id, username });
    } catch (error) {
        res.send({ error: error });
    }
});

app.get("/api/users", async (req, res) => {
    const usersList = [];
    try {
        const docs = await User.find({}, { log: false });
        res.send(docs);
    } catch (error) {
        console.log(error);
        res.send({ error: error });
    }
});

app.post("/api/users/:id/exercises", async (req, res) => {
    const uid = req.params.id;
    const description = req.body.description;
    const duration = +req.body.duration;
    const date = req.body.date
        ? new Date(req.body.date).toDateString()
        : new Date().toDateString();
    console.log(uid, description, duration, date);
    try {
        const doc = await User.findByIdAndUpdate(uid, {
            $push: { log: { date, duration, description } },
        });
        res.send({
            _id: uid,
            username: doc.username,
            date: date,
            duration: duration,
            description: description,
        });
    } catch (error) {
        console.log(error);
        res.send({ error: error });
    }
});

app.get("/api/users/:id/logs", async (req, res) => {
    const { from, to, limit } = req.query;

    const uid = req.params.id;
    const user = await User.findById(uid);

    let log = [];

    if (from && to) {
        const fromDate = new Date(from).getTime();
        const toDate = new Date(to).getTime();
        log = user.log.filter((item) => {
            return (
                fromDate <= new Date(item.date).getTime() &&
                toDate >= new Date(item.date).getTime()
            );
        });
    } else if (from) {
        log = user.log.filter((item) => {
            return new Date(from).getTime() <= new Date(item.date).getTime();
        });

    } else if (to) {
        log = user.log.filter((item) => {
            return new Date(to).getTime() >= new Date(item.date).getTime();
        });

    }
    if (limit) log = user.log.slice(limit);

    const superNewUser = {
        _id:uid,
        username:user.username,
        log,
        count:log.length
    }
    console.log(superNewUser);
    res.send(superNewUser);
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
});
