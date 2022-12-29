import dotenv from "dotenv"; //used to load env variables if having any

dotenv.config();

const MONGO_USERNAME = process.env.MONGO_USERNAME || "admin_track";
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || "cb236md9ukgw1p";
const MONGO_URL = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@buyerassist-track.czutj.mongodb.net/test`;
const SERVER_PORT = process.env.SERVER_port
  ? Number(process.env.SERVER_PORT)
  : 1337;

//now export this constants const config() FOR mongoDB connection
export const config = {
  mongo: {
    url: MONGO_URL,
  },
  server: {
    port: SERVER_PORT,
  },
};
