const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const messageRoute = require("./routes/messagesRoute");
const app = express();
const path = require('path');
const socket = require("socket.io");
//require('dotenv').config({ path: path.resolve(__dirname, './.env') });

var port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

//use userRoutes for api calling
app.use("/api/auth",userRoutes);

//for message routing
app.use("/api/messages",messageRoute);

mongoose.connect("mongodb+srv://admin-umesh:test123@cluster0.7lqoe.mongodb.net/server",{
    useNewUrlParser:true,
    useUnifiedTopology: true,
})
.then(() =>{
    console.log("DB Connection Successfully"); 
})
.catch((err)=>{
    console.log(err.message);
});

const server = app.listen(port, ()=>{
    console.log("Server Started on Port");
});

if(process.env.NODE_ENV === "production"){
    app.use(express.static({path: path.resolve(__dirname, './.env')}));
    app.get('/',(req, res) => {
       req.sendFile(path.resolve(__dirname, 'build', 'index.html'));
       res.write("server is started");
       res.end();
    });
}

app.get('/',(req, res) => {
    res.write("server is started");
    res.end();
 });

//setup socket server
const io = socket(server, {
    cors: {
        origin: "http://localhost:3000",
        Credentials: true,
    },
});

global.onlineUsers = new Map();

io.on("connection", (socket) => {
    global.chatSocket = socket;
    socket.on("add-user", (userId) =>{
        onlineUsers.set(userId, socket.id);
    });

    //in this case if receiver is also online it emit the message and store in database
    // else store it in the database
    socket.on("send-msg", (data)=>{
        const sendUserSocket = onlineUsers.get(data.to);
        if(sendUserSocket){
            socket.to(sendUserSocket).emit("msg-receive", data.message);
        }
        // console.log(data.message);
    });
});

