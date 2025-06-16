require("dotenv").config({ path: '../.env' });

const express = require("express");
const next = require("next");
const argon2 = require("argon2");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { getToken } = require('next-auth/jwt');
const { generateEncryptionKey } = require("./utils");
const { insertUser, findUser, insertFile, getFilesByUserId } = require("./mongo");

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
                const user = await findUser({id});
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                res.status(200).json(user);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Internal server error" });
            }
        }
        );

        server.post("/api/encryptionkey", async (req, res) => {
            const filePassword = req.body.filePassword;
            const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
            if (!token) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            try {
                const id = token.id;
                const user = await findUser({id});
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                const encryptionKey = await generateEncryptionKey(user.username, user.password, filePassword || "");
                console.log("Generated encryption key:", encryptionKey);
                res.status(200).json({ key: encryptionKey });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Internal server error" });
            }
        });

        server.post("/api/indexFile", async (req, res) => {
            console.log("Indexing file:", req.body);
            const { fileName, cid, txhash } = req.body;
            const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
            if (!token) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            try {
                const id = token.id;
                const user = await findUser({id});
                if (!user) {
                    console.log(id)
                    return res.status(404).json({ error: "User not found" });
                }
                console.log(user, fileName, cid, txhash);
                await insertFile(user._id, fileName, cid, txhash);
                res.status(200).json({ message: "File indexed successfully", fileName });
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
            try {
                const id = token.id;
                const user = await findUser({id});
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                const files = await getFilesByUserId(user._id);
                res.status(200).json(files);
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