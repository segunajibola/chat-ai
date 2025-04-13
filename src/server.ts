import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { StreamChat } from "stream-chat";
import OpenAI from "openai";
import { db } from "./config/database.js";
import { chats, users } from "./db/schema.js";
import { eq } from "drizzle-orm";
import { ChatCompletionMessageParam } from "openai/resources";

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

//register user with stream chat
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
      // Check for existing user in database
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.userId, userId));

      if (!existingUser.length) {
        console.log(
          `User ${userId} does not exist in the database. Adding them...`
        );
        await db.insert(users).values({ userId, name, email });
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
    return res.status(400).json({ userId, error: "Message and user required" });
  }
  try {
    // verify user exists.
    const userResponse = await chatClient.queryUsers({ id: userId });
    if (!userResponse.users.length) {
      return res
        .status(404)
        .json({ error: "user not found, please register first" });
    }
    // return res.status(200).json({ message, userId, email, success: "success" });
    // Send message to OpenAI GPT-4
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    });

    const aiMessage: string =
      response.choices[0].message?.content ?? "No response from AI";

    //Create or get channel
    const channel = chatClient.channel("messaging", `chat-${userId}`, {
      name: "AI Chat",
      created_by_id: "ai_bot",
    });
    await channel.create();
    await channel.sendMessage({ text: aiMessage, user_id: "ai_bot" });
    console.log("response", response);
    res.status(200).json({ reply: aiMessage });

    // const models = await openai.models.list();
    // console.log(
    //   "models",
    //   models.data.map((m) => console.log(m.id))
    // );
    // const reply = response.choices[0]?.message?.content || "No response";
    // return res.status(200).json({ reply });
  } catch (error) {
    console.log("Error generating AI response", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

// git commit --date="2025-04-09T12:00:00" -m "Your commit message here"
