const mongoose = require("mongoose");
const argon2 = require("argon2");
const { User, Cache, Files } = require("./models");

const uri = "mongodb://localhost:27017/test";

mongoose.connect(uri);

const insertUser = async (username, email, insertPassword) => {
    try {
        let user;
        user = new User({
            username: username,
            password: await argon2.hash(insertPassword),
            email: email,
        });

        const result = await user.save();
        return result;
    } catch (error) {
        console.error("Error inserting user:", error);
    }
};

const findUser = async ({ id=null, username = null }) => {
    let userRequest;
    try {
        if (username) {
            userRequest = { username: username };
        } else {
            userRequest = { _id: id };
        }
        const res = await User.findOne(userRequest);
        return res || false;
    } catch (error) {
        console.error("Error reading from database:", error);
    }
};

const insertFile = async (userid, name, cid, txhash) => {
    try {
        const file = new Files({
            user: userid,
            name: name,
            cid: cid,
            txhash: txhash,
            createdAt: new Date(),
        });

        const result = await file.save();
        // return result;
    }
    catch (error) {
        console.error("Error inserting file:", error);
    }
};

const getFilesByUserId = async (userId) => {
    try {
        const files = await Files.find({ user: userId }).sort({ createdAt: -1 });
        return files;
    } catch (error) {
        console.error("Error fetching files:", error);
        return [];
    }
};

module.exports = {
    insertUser,
    findUser,
    insertFile,
    getFilesByUserId,
    User,
    Cache,
    Files,
};
