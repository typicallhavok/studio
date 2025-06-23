const mongoose = require("mongoose");
const argon2 = require("argon2");
const { User, Cache, Files, Case, Logs } = require("./models");
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

        return result;
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

const getFilesByCaseId = async ( caseID ) => {
    try {
        console.log("Fetching files for case ID:", caseID);
        const files = await Files.find({ caseID: caseID }).sort({ createdAt: -1 });
        return files;
    } catch (error) {
        console.error("Error fetching files by case ID:", error);
        return [];
    }
};

const getFileById = async (fileId) => {
    try {
        const file = await Files.find({cid:fileId});
        return file;
    } catch (error) {
        console.error("Error fetching file by ID:", error);
        return null;
    }
};

const logAction = async (action, details, userId, file) => {
    try {
        const logEntry = new Logs({
            action: action,
            user: userId,
            file: file,
            details: details || "",
        });

        await logEntry.save();
    } catch (error) {
        console.error("Error logging action:", error.errors);
    }
};

const getFileByFileName = async (userId, fileName) => {
    try {
        const file = await Files.findOne({ user: userId, name: fileName });
        return file;
    } catch (error) {
        console.error("Error fetching file by name:", error);
        return null;
    }
};

const getLogDetails = async (userId) => {
    try {
        const logs = await Logs.find({ user: userId })
            .populate('user', 'username')
            .populate('file', 'name');
        return logs;
    } catch (error) {
        console.error("Error fetching logs:", error);
        return [];
    }
}

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
    logAction,
    getFileByFileName,
    getLogDetails,
    getFileById,
    User,
    Cache,
    Files,
    Case,
    Logs
};
