// require('dotenv').config({path:'./env'})
import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import connectDB from "./db/index.js";
import dotenv from 'dotenv';
import {app} from './app.js'
dotenv.config({path:'./.env'})
connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`app is listen at port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("DB connection error ",err);
})

































/* first approach
import express from 'express';
const app = express(); 
(async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
         app.on("error",(e)=>{
            console.log("error",e);
            throw e;
         })
         app.listen(process.env.PORT,()=>{
            console.log(`app is listening on port ${process.env.PORT}`);
         })
    }catch(error)
    {
        console.log(error);
        throw error;
    }
})() */