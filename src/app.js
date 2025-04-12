import express from "express"
import cors from 'cors'
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN, 
    Credentials : true
}))
// Real-life example:
// Agar tumhara frontend http://localhost:3000 pe chal raha hai aur backend http://localhost:8000 pe, toh CORS error aata hai agar backend allow na kare.

// So CORS_ORIGIN env variable mein likhte ho: http://localhost:3000, taaki backend bole:
// ➡️ "Haan bhai, is origin se request aane do."

// And credentials: true ka matlab: ➡️ "Haan bhai, cookies ya headers bhi allow karo is origin se."


app.use(express.json({limit: "16kb"}))
// Yeh line kehti hai: ➡️ "Agar koi request JSON data bhejti hai, toh usse accept karo — lekin maximum size 16 kilobytes tak hi."

// Real-life example:
// Agar koi user form fill karke data bhejta hai, like:

// json
// Copy
// Edit
// { "name": "Amit", "age": 23 }
// Toh yeh line kaam aayegi. Agar koi huge JSON bhej diya (e.g., 5MB ka), toh server mana kar dega.

// Safety aur performance ke liye limit rakhna achha hota hai.

app.use(express.urlencoded({extended :true,limit: "16kb"}))
// Breakdown:
// urlencoded → isse server form data ko samajhta hai.

// Jaise HTML form mein data bhejna:

// html
// Copy
// Edit
// <form method="POST">
//   <input name="username" />
//   <input name="email" />
// </form>
// extended: true → iska matlab hai:

// Nested objects ya complex data bhi handle kar sakte ho.

// Example:

// js
// Copy
// Edit
// user[name]=Amit&user[age]=23
// Ye data { user: { name: "Amit", age: 23 } } ban jata hai.

// limit: "16kb" → yeh batata hai ki:

// Server max 16 kilobytes tak ka form data accept karega.

// Zyada hua toh error throw karega for safety.

app.use(express.static("public"))//yeh batata yeh koi bhi file like 
// pdf me store krna chahta hu public me
app.use(cookieParser())


import userRouter from "./routes/user.routes.js"




//routes declaration
app.use("/api/v1/users",userRouter);


  
export {app} ;
