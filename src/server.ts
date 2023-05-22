import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createAdmin, createOrganization, createUser } from '../lib/mutations/create';
import { getChats, getFile, getOrgFiles, getOrgUsers, getOrganization, getSingleChat, getUser, getUserPreferences, getUserProfile } from '../lib/queries/get';
import { acceptPotential, promoteMember, rejectPotential, removeMember, requestJoin } from '../lib/mutations/orgmanage';
import login from '../lib/mutations/login';
import logout from '../lib/mutations/logout';
import run from '../lib/mutations/run';
import { updateUserPreferences, updateUserProfile } from '../lib/mutations/update';
import { verifyUserInOrg, verifyUserInOrgBySessionId } from '../lib/queries/verify';
import prisma from '../prisma/seed';
import { Configuration, OpenAIApi } from "openai";
import { getFileText, getTextFromEmbedding, s3uploadMultiple } from './aws';
import { getPineconeInfo, getSimilarEmbeddings, uploadFileEmbeddings } from './pinecone';
import { generateEmbeddings, generateResponse } from './ai';
import { addMessageToChat, createChat, deleteChat } from '../lib/mutations/chat';

const port = Number(process.env.PORT) || 3000;
const app = express();

app.use(cors({ origin: true }));
app.use(express.json());


app.get("/", (req, res) => {
    getPineconeInfo();
    res.status(200).json({ message: "Welcome to server" });
});



// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'src/uploads/');
//     },
//     filename: function (req, file, cb) {
//         const extension = path.extname(file.originalname);
//         cb(null, Date.now() + extension);
//     }
// });
const storage = multer.memoryStorage();
const uploads = multer({ storage });
app.post("/uploads", uploads.array("files"), async (req, res) => {
    const { sessionId, orgId } = req.body;
    if (!sessionId || !orgId) {
        res.status(404).json({ message: "Not found" });
        return;
    }
    const files = req.files;
    const user = await getUser(sessionId);
    if (user) {
        const status = verifyUserInOrg(user, orgId);
        if (status) {
            //@ts-ignore

            //add to s3
            const results = await s3uploadMultiple(files);

            //add s3 info to MySQL
            for (let i = 0; i < results.length; i++) {
                continue; // REMOVE!!
                const file = files[i];
                const result = results[i];
                const fileRef = await prisma.file.create({
                    data: {
                        name: file.originalname,
                        type: file.mimetype,
                        key: result.Key,
                        url: result.Location,
                        uploadedBy: {
                            connect: {
                                id: user.id
                            }
                        },
                        organization: {
                            connect: {
                                id: orgId
                            }
                        }
                    }
                });
            }
            //now generate embeddings and add to vector db;
            for (let i = 0; i < results.length; i++) {
                const file = files[i];
                const result = results[i];
                uploadFileEmbeddings(file, result.Key, orgId).then(status => console.log(status));
            }
            res.status(200).json({ success: "success" });
            return;
        }
    }
    res.status(404).json({ message: "not found" });
});

app.post("/retrieve", async (req, res) => {
    const { sessionId, orgId, key } = req.body;
    if (!sessionId || !orgId) {
        res.status(403).json({ message: "Invalid" });
        return;
    }
    const file = await getFile(sessionId, orgId, key);
    console.log(file);
    if (file) {
        res.status(200).json(file);
    } else {
        res.status(500).json({ message: "error" });
    }
});

app.post("/retrieveall", async (req, res) => {

});
app.delete("/uploads", async (req, res) => {
    throw new Error("Not Implemented!!");
    const { sessionId, filename } = req.body;
});
app.post("/gpt", async (req, res) => {
    const { query, history, sessionId, orgId, id } = req.body;
    try {
        console.log({ query, history, sessionId, orgId, id });
        if (!query || !sessionId || !orgId || !id) {
            res.status(403).send("Invalid Parameters");
        } else {
            const status = await verifyUserInOrgBySessionId(sessionId, orgId);
            if (status) {
                const queryEmbeddings = await generateEmbeddings(query);
                const similarEmbeddings = await getSimilarEmbeddings(queryEmbeddings, 5, orgId);
                let envString = '';
                for (const embedding of similarEmbeddings) {
                    const text = await getTextFromEmbedding(embedding);
                    envString += text + " ";
                }
                const response = await generateResponse(query, history, envString);
                const statusQuery = await addMessageToChat([query, "user"], id);
                const statusResponse = await addMessageToChat(response.response, id);
                res.status(200).json(response);
            } else {
                res.status(404).json({ message: "nope" });
            }
        }
    } catch (e) {
        console.log("errored");
        res.status(500).send("Internal server error");
    }
});

app.post("/admin", async (req, res) => {
    try {
        if (req.method === "POST") {
            const { username, password, sessionId } = req.body;

            //normally should check if user is an admin first
            const admin = await createAdmin(username, password);
            res.status(200).send(admin);
        } else {
            res.status(404).send("Not found");
        }
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal server error");
    }
});
app.post("/createChat", async (req, res) => {
    try {
        const { sessionId, orgId } = req.body;
        if (!sessionId || !orgId) {
            res.status(403).json({ message: "Invalid parameters" });
        } else {
            const title = "New Chat";
            const id: string = await createChat(sessionId, orgId, title);
            if (id) {
                res.status(200).json({ id, title });
            } else {
                res.status(500).json({ message: "Chat could not be created" });
            }
        }
    } catch (e) {
        res.status(500).json({ message: "Internal server error" });
    }
});
app.delete("/deleteChat", async (req, res) => {
    try {
        const { sessionId, orgId, id } = req.body;
        const status = await deleteChat(sessionId, orgId, id);
        console.log(status);
        if (status) {
            res.status(200).send("Success");
        } else {
            res.status(500).send("Failure");
        }
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal server error");
    }
});
app.post("/create", async (req, res) => {
    if (req.method === "POST") {
        try {
            const { name, sessionId } = req.body;
            if (!name || !sessionId) {
                res.status(404).send("Internal server error");
            } else {
                const success = await createOrganization(name, sessionId);
                if (success) {
                    res.status(200).send("Creation successful");
                } else {
                    res.status(500).send("Internal server error");
                }
            }
        } catch (e) {
            res.status(500).send("Internal server error");
        }
    } else {
        res.status(400).send("Internal server error");
    }
});

app.post("/get", async (req, res) => {
    try {
        if (req.method === 'POST') {
            const { target } = req.body;
            if (target === "UserProfile") {
                const { sessionId } = req.body;
                const profile = await getUserProfile(sessionId);
                res.status(200).json(profile);
            } else if (target === "UserPreferences") {
                const { sessionId } = req.body;
                const preferences = await getUserPreferences(sessionId);
                res.status(200).json(preferences);
            } else if (target === "ProfilePreferences") {
                const { sessionId } = req.body;
                const preferencesPromise = getUserPreferences(sessionId);
                const profilePromise = getUserProfile(sessionId);
                const [preferences, profile] = await Promise.all([preferencesPromise, profilePromise]);
                res.status(200).json({ preferences, profile });
            } else if (target === "Organization") {
                const { sessionId } = req.body;
                const org = await getOrganization(sessionId);
                res.status(200).json(org);
            } else if (target === "OrganizationUsers") {
                const { sessionId, organizationId } = req.body;
                const orgusers = await getOrgUsers(sessionId, organizationId);
                res.status(200).json(orgusers);
            } else if (target === "File") {
                res.status(500).send("Not implemented");
            } else if (target === "Chat") {
                const { sessionId, orgId } = req.body;
                if (!sessionId || !orgId) {
                    res.status(500).json({ message: "Invalid parameters" });
                } else {
                    const chats = await getChats(sessionId, orgId);
                    res.status(200).json(chats);
                }
            } else if (target === "SingleChat") {
                const { sessionId, orgId, id } = req.body;
                if (!sessionId || !orgId || !id) {
                    res.status(500).json({ message: "Invalid parameters" });
                } else {
                    const chatData = await getSingleChat(sessionId, orgId, id);
                    res.status(200).json(chatData);
                }
            } else {
                res.status(404).send("Not found");
            }
        } else {
            res.status(405).send("Invalid method");
        }
    } catch (e) {
        res.status(500).send("Internal server error");
    }
});

app.post("/getuser", async (req, res) => {
    try {
        const { sessionId } = req.body;
        const user = await getUser(sessionId);
        if (user) {
            user.password = "";
            res.status(200).json(user);
        } else {
            res.status(404).send("Internal server error");
        }
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal server error");
    }
});
app.post("/join", async (req, res) => {
    try {
        if (req.method === "POST") {
            const { sessionId, code } = req.body;
            const success = await requestJoin(sessionId, code);
            if (success) {
                res.status(200).send("Success");
            } else {
                res.status(404).send("Not found");
            }
        } else {
            res.status(405).send("Invalid method");
        }
    } catch (e) {
        res.status(500).send("Internal server error");
    }
});
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const sessionId: string = await login(username, password);
        res.status(500).json({ sessionId });
    } catch (e) {
        console.error(e);
        res.status(500).json({ sessionId: "" });
    }
});
app.post("/logout", async (req, res) => {
    try {
        const { sessionId } = req.body;
        const success = await logout(sessionId);
        res.status(200).json({ success });
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal server error");
    }
});


app.post("/run", async (req, res) => {
    if (req.method == "POST") {
        const { sql, sessionId } = req.body;
        //should check for correct user permissions
        const response = await run(sql);
        if (response) {
            res.status(200).json(response);
        } else {
            res.status(200).json("No response");
        }
    } else {
        res.status(400).send("Invalid method");
    }
});

app.post("/update", async (req, res) => {
    try {
        if (req.method === 'POST') {
            const { targets, sessionId } = req.body;
            if (!targets || !sessionId) {
                res.status(400).send("error");
                return;
            }
            for (const target of targets) {
                if (target === "Preferences") {
                    const { emailUpdates, fileUploadNotifications } = req.body;
                    const result = updateUserPreferences(sessionId, emailUpdates, fileUploadNotifications);
                } else if (target === "Profile") {
                    const { bio, name, location, team } = req.body;
                    const result = updateUserProfile(sessionId, bio, name, location, team);
                } else if (target === "DeletePotential") {
                    const { sessionId, orgId, email } = req.body;
                    const result = rejectPotential(sessionId, orgId, email);
                } else if (target === "AcceptPotential") {
                    const { sessionId, orgId, email } = req.body;
                    const result = acceptPotential(sessionId, orgId, email);
                } else if (target === "PromoteMember") {
                    const { sessionId, orgId, email } = req.body;
                    const result = promoteMember(sessionId, orgId, email);
                } else if (target === "RemoveMember") {
                    const { sessionId, orgId, email } = req.body;
                    const result = removeMember(sessionId, orgId, email);
                }
            }
            res.status(200).send("Success");
        } else {
            res.status(405).send("Invalid method");
        }
    } catch (e) {
        res.status(500).send("Internal server error");
    }
});
app.post("/users", async (req, res) => {
    if (req.method == "POST") {
        try {
            const { username, password, orgCode } = req.body;
            if (!username || !password) res.status(404).send("Not found");
            const result = await createUser(username, password, orgCode);
            res.status(200).json(result);
        } catch (e) {
            console.error(e);
            res.status(500).send("Internal server error");
        }
    } else {
        res.status(400).send("Internal server error");
    }
});
app.listen(port, `0.0.0.0`, () => {
    console.log(`Ready on port ${port}`);
});