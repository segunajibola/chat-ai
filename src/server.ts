import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express(); //initialise express app

//middlewares
app.use(cors());
app.use(express.json()); //when we send request, we want to be able to send req in the body
app.use(express.urlencoded({ extended: false })); //to send formdata as request
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
