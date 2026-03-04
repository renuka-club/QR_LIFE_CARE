require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
    .then(() => require('./models/User').updateMany({}, { $set: { devices: [] } }))
    .then(res => { console.log('Fixed DB device array:', res); process.exit(); })
    .catch(console.error);
