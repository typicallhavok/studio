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
    cid: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    txhash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Cache = mongoose.model("Cache", cacheSchema);
const Files = mongoose.model("Files", filesSchema);

module.exports = { User, Cache, Files };