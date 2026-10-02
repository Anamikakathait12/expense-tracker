import  express from 'express';
import cors from "cors";
import cookieParser from 'cookie-parser';
import { success } from 'zod';

const app = express();

// allowing the react frontend to call this APi and send cookies
app.use(cors({
    origin:process.env.CLIENT_URL,
    credentials:true,
}));

app.use(express.json());// parses JSON reqeuest bodies into the req.body
app.use(cookieParser()); //parses cookies into req.cookies

// health check route, useful for testing and for deployment platforms
app.get("/api/health", (req,res)=>{
    res.json({success:true, message:"API is running"});
})

export default app;