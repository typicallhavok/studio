const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });


const express = require("express");
const next = require("next");
const argon2 = require("argon2");
// const path = require("path");
const cookieParser = require("cookie-parser");
const { getToken } = require('next-auth/jwt');
const { generateEncryptionKey } = require("./utils");
const { insertUser, findUser, insertFile, insertCase, getFilesByUserId, getCasesByUserId, getFilesByCaseId, logAction, getFileByFileName, getLogDetails, getFileById } = require("./mongo");
const { get } = require("http");

const dev = process.env.NODE_ENV !== "production";
const app = next({
    dev,
    dir: "./",
});
const handle = app.getRequestHandler();

app.prepare()
    .then(() => {
        const server = express();

        server.use(express.json());
        server.use(cookieParser());

        server.use(
            "/_next",
            express.static(path.join(__dirname, "../src/.next"))
        );

        server.get("/_next/*", (req, res) => {
            return handle(req, res);
        });

        server.get("/api/health", (req, res) => {
            res.status(200).json({ status: "ok" });
        });

        server.post("/api/register", async (req, res) => {
            const { username, email, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ error: "Username and password are required" });
            }
            try {
                await insertUser(username, email, password);
                res.status(201).json({ message: "User registered successfully" });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Internal server error" });
            }
        });

        server.post("/api/login", async (req, res) => {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ error: "Username and password are required" });
            }
            try {
                const user = await findUser({ username });
                if (!user || !(await argon2.verify(user.password, password))) {
                    return res.status(401).json({ error: "Invalid credentials" });
                }
                return res.status(200).json({
                    id: user._id,
                    username: user.username,
                });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Internal server error" });
            }
        });

        server.get("/api/logout", (req, res) => {
            res.clearCookie("token").status(200).json({ message: "Logged out successfully" });
        });

        server.get("/api/user", async (req, res) => {
            const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
            if (!token) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            try {
                const id = token.id;
                const user = await findUser({ id });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                res.status(200).json(user);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Internal server error" });
            }
        });

        server.post("/api/encryptionkey", async (req, res) => {
            const {filePassword, fileName} = req.body;
            const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
            if (!token) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            try {
                const id = token.id;
                const user = await findUser({ id });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                const encryptionKey = await generateEncryptionKey(user.username, user.password, filePassword || "");
                if (!encryptionKey) {
                    return res.status(500).json({ error: "Failed to generate encryption key" });
                } 
                else {
                    const file = await getFileByFileName(user._id, fileName)
                    await logAction("access",`Generated encryption key for user ${user.username} for the file ${fileName}`, user._id, file && file._id||null);
                }
                res.status(200).json({ key: encryptionKey });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Internal server error" });
            }
        });

        server.post("api/log", async (req, res) => {
            const { action, fileName, timestamp } = req.body;
            console.log("action", action);
            const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
            if (!token) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            try {
                const id = token.id;
                const user = await findUser({ id });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                const file = getFileByFileName(user._id, fileName);
                if (!file) {
                    return res.status(404).json({ error: "File not found" });
                }
                await logAction(action,`user with ${user._id} and name ${user.name} completed the action: ${action} for the file: ${fileName}`, user._id, file._id);
                res.status(200).json({ message: "Log recorded successfully" });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Internal server error" });
            }
        });

        server.post("/api/indexFile", async (req, res) => {
            const { fileName, cid, txhash, caseID, description, password } = req.body;
            const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
            if (!token) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            try {
                const id = token.id;
                const user = await findUser({ id });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                const inserted = await insertFile(user._id, fileName, caseID, cid, txhash, password, description);
                if (!inserted) {
                    return res.status(500).json({ error: "Failed to index file" });
                }
                await logAction(`${(inserted.history.length > 0)?"modified":"created"}`,`File ${fileName} ${(inserted.history.length > 0)?"modified":"created"} by ${token.name}`, user._id, inserted._id);

                res.status(200).json({ message: "File indexed successfully", fileName });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Internal server error" });
            }
        });

        server.post("/api/indexcase", async (req, res) => {
            const { name, caseID } = req.body;
            const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
            if (!token) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            try {
                const id = token.id;
                const user = await findUser({ id });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                await insertCase(user._id, name, caseID);
                res.status(200).json({ message: "Case indexed successfully", caseID });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Internal server error" });
            }
        });

        server.get("/api/files", async (req, res) => {
            const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
            if (!token) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            const caseID = req.query.caseID;
            try {
                const id = token.id;
                const user = await findUser({ id });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                const files = caseID?(await getFilesByCaseId(caseID)): await getFilesByUserId(user._id, caseID);
                files.forEach(file => {
                    file.password = !!file.password;
                });
                res.status(200).json(files);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Internal server error" });
            }
        });

        server.get("/api/cases", async (req, res) => {
            const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
            if (!token) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            try {
                const id = token.id;
                const user = await findUser({ id });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                const cases = await getCasesByUserId(user._id);
                res.status(200).json(cases);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Internal server error" });
            }
        });

        server.get("/api/logs", async (req, res) => {
            const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
            if (!token) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            try {
                const id = token.id;
                const user = await findUser({ id });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                const logs = await getLogDetails(user._id);
                res.status(200).json(logs);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Internal server error" });
            }
        });

        server.post("/api/file", async (req, res) => {
            const { fileID } = req.body;
            const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
            if (!token) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            try {
                const id = token.id;
                const user = await findUser({ id });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                const file = await getFileById(fileID);
                if (!file) {
                    return res.status(404).json({ error: "File not found" });
                }
                res.status(200).json(file);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Internal server error" });
            }
        });

        server.all("*", (req, res) => {
            return handle(req, res);
        });

        const port = process.env.PORT || 3000;
        server.listen(port, (err) => {
            if (err) throw err;
            console.log(`> Ready on http://localhost:${port}`);
        });
    })