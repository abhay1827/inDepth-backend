//require('dotenv').config({path : './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import {app} from './app.js'

dotenv.config({
    path: './.env'
})


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`server is running at : ${process.env.PORT} `);
    } )
    
}) 
.catch((error)=>{
    console.log("MONGO DB Connection failed !!!!",error);
})
















// import express from 'express'
// const app = expres()

// ;(async () =>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

//         app.on("error",(error)=>{
//             console.log("DB is facing issue in connecting with server",error);
//             throw error
//         })

//         app.listen(process.env.PORT ,()=>{
//             console.log(`App is listening on port:${process.env.PORT}`);
//         })
//     } catch (error) {
//         console.log("ERROR :",error)
//         throw error;
//     }
// })()