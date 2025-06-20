const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
});

const cacheSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
});

const filesSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: "" },
    caseID: { type: String, required: true },
    case: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
    cid: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    txhash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    password: { type: String },
    history: [{
        timestamp: { type: Date, default: Date.now },
        cid: { type: String, required: true },
    }]
});

const caseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    caseID: { type: String, required: true, unique: true },
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Files' }],
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Cache = mongoose.model("Cache", cacheSchema);
const Files = mongoose.model("Files", filesSchema);
const Case = mongoose.model("Case", caseSchema);

module.exports = { User, Cache, Files, Case };