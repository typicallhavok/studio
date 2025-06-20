const mongoose = require("mongoose");
const argon2 = require("argon2");
const { User, Cache, Files, Case } = require("./models");
const { get } = require("http");

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

const findUser = async ({ id = null, username = null }) => {
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

const insertFile = async (userid, name, caseID, cid, txhash, password, description) => {
    try {
        const hashedPassword = password ? await argon2.hash(password) : null;

        const update = {
            $set: {
                cid: cid,
                caseID: caseID,
                txhash: txhash,
                description: description,
                createdAt: new Date(),
            },
            $push: {
                history: {
                    timestamp: new Date(),
                    cid: cid,
                },
            }
        };

        if (hashedPassword) {
            update.$set.password = hashedPassword;
        }

        const result = await Files.findOneAndUpdate(
            { user: userid, name: name },
            update,
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        // return result;
    } catch (error) {
        console.error("Error inserting/updating file:", error);
    }
};

const getCasesByUserId = async (userId) => {
    try {
        const cases = await Case.find({ user: userId }, { files: 0 })
            .sort({ createdAt: -1 });
        return cases;
    } catch (error) {
        console.error("Error fetching cases:", error);
        return [];
    }
};

getFilesByCaseId = async ( caseID ) => {
    try {
        console.log("Fetching files for case ID:", caseID);
        const files = await Files.find({ caseID: caseID }).sort({ createdAt: -1 });
        return files;
    } catch (error) {
        console.error("Error fetching files by case ID:", error);
        return [];
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

const insertCase = async (userId, name, caseID) => {
    try {
        const newCase = new Case({
            name: name,
            caseID: caseID,
            user: userId,
        });

        const result = await newCase.save();
        return result;
    } catch (error) {
        console.error("Error inserting case:", error);
    }
};

module.exports = {
    insertUser,
    findUser,
    insertFile,
    insertCase,
    getFilesByUserId,
    getCasesByUserId,
    getFilesByCaseId,
    User,
    Cache,
    Files,
};
