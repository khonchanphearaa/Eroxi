import 'dotenv/config';

const mogodbConfig = {
    uri: process.env.MONGODB_URI,

    /* MongoDB connection options */
    Option:{
        autoIndex: true,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
    }
}
export default mogodbConfig;

