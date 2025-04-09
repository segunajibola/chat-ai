import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { StreamChat } from "stream-chat";
import OpenAI from "openai";

dotenv.config();

const app = express(); //initialise express app

//middlewares
app.use(cors());
app.use(express.json()); //when we send request, we want to be able to send req in the body
app.use(express.urlencoded({ extended: false })); //to send formdata as request
//Initialise streamchat
const chatClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY!,
  process.env.STREAM_API_SECRET!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

//registeruser with stream chat
app.post(
  "/register-user",
  async (req: Request, res: Response): Promise<any> => {
    if (!req.body) {
      return res.status(400).json({ error: "Missing request body" });
    }

    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    try {
      //create userId from the email
      const userId = email.replace(/[^a-zA-Z0-9_-]/g, "_");

      //Checkif user exists
      const userResponse = await chatClient.queryUsers({ id: { $eq: userId } });
      console.log(userResponse);

      //if no user, create a new user
      if (!userResponse.users.length) {
        await chatClient.upsertUser({ id: userId, name, email, role: "user" });
      }
      return res.status(200).json({ message: "Success", userId, name, email });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);
app.post("/chat", async (req: Request, res: Response): Promise<any> => {
  if (!req.body) {
    return res.status(400).json({ error: "Missing request body" });
  }
  const { message, userId, email } = req.body;

  if (!message || !userId) {
    res.status(400).json({ userId, error: "Message and user required" });
  }
  try {
    // verify user exists
    const userResponse = await chatClient.queryUsers({ id: userId });
    if (!userResponse.users.length) {
      return res
        .status(404)
        .json({ error: "user not found, please register first" });
    }
    // return res.status(200).json({ message, userId, email, success: "success" });
    // Send message to OpenAI GPT-4
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: message }],
    });
    console.log(response);
  } catch (error) {
    return res.status(500).json({ error: "Intesrnal Server Error" });
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
