import mongoose from "mongoose";
import mongodbConfig from '../config/mongodb.js'
import logger from "../utils/logger.js";

const connectDB = async () =>{
    try {
        const conn = await mongoose.connect(mongodbConfig.uri, mongodbConfig.Option);
        logger.info(`MongoDB connected: ${conn.connection.host}`);

        mongoose.connection.on('error', (err)=>{
            logger.error(`MongoDB connection error: ${err}`);
        })
    } catch (error) {
        logger.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
}

export default connectDB;