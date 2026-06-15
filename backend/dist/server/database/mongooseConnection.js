import mongoose from "mongoose";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hellowordexample";
export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI);
        console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};
