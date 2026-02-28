const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Report = require('../models/Report');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const checkIndexes = async () => {
    await connectDB();
    const headers = await Report.collection.indexes();
    console.log('Indexes:', JSON.stringify(headers, null, 2));
    mongoose.connection.close();
};

checkIndexes();
