const mongoose = require("mongoose");
const dotenv = require("dotenv");
const socket = require("socket.io");

const trendingServices = require("./services/trendingServices");

process.on("uncaughtException", (err) => {
    console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.log(err.name, err.message, err.stack);
    process.exit(1);
});

dotenv.config({ path: "./config.env" });
const app = require("./app");

const DB = process.env.DATABASE.replace(
    "<password>",
    process.env.DATABASE_PASSWORD
);

mongoose
    .connect(DB, {
        useNewUrlParser: true,
    })
    .then(() => {
        console.log("DB connection successful!");
    });

const conSuccess = mongoose.connection;
conSuccess.once("open", () => {
    //run this every certain time after database connection successfully
    setInterval(trendingServices.determineTrendingHashtags, 60000);
    setInterval(trendingServices.determineTrendingPosts, 600000);
});
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

const io = socket(server, {
    cors: {
        origin: [
            "http://localhost:3000",
            "https://beegin-app.vercel.app",
            "https://beegin.vercel.app",
        ],
        credentials: true,
    },
});

process.on("unhandledRejection", (err) => {
    console.log("UNHANDLED REJECTION! 💥 Shutting down...");
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
