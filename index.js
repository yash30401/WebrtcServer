const http = require("http")
const Socket = require("websocket").server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server is running.');
  });

let PORT = process.env.PORT || 2000

server.listen(PORT,()=>{
    console.log("Server Started On Port 2000")
})

const webSocket = new Socket({httpServer:server})

const users = []

webSocket.on('request',(req)=>{
    const connection = req.accept()
   

    connection.on('message',(message)=>{
        const data = JSON.parse(message.utf8Data)
        console.log(data);
        const user = findUser(data.name)
       
        switch(data.type){
            case "STORE_USER":
                if(user !=null){
                    //our user exists
                    connection.send(JSON.stringify({
                        type:'user already exists'
                    }))
                    return

                }

                const newUser = {
                    name:data.name, conn: connection
                }
                users.push(newUser)
            break

            case "START_CALL":
                let userToCall = findUser(data.target)

                if(userToCall){
                    connection.send(JSON.stringify({
                        type:"CALL_RESPONSE", data:"user is ready for call"
                    }))
                } else{
                    connection.send(JSON.stringify({
                        type:"CALL_RESPONSE", data:"user is not online"
                    }))
                }

            break
            
            case "CREATE_OFFER":
                let userToReceiveOffer = findUser(data.target)

                if (userToReceiveOffer){
                    userToReceiveOffer.conn.send(JSON.stringify({
                        type:"OFFER_RECIEVED",
                        name:data.name,
                        data:data.data.sdp
                    }))
                }
            break
                
            case "CREATE_ANSWER":
                let userToReceiveAnswer = findUser(data.target)
                if(userToReceiveAnswer){
                    userToReceiveAnswer.conn.send(JSON.stringify({
                        type:"ANSWER_RECIEVED",
                        name: data.name,
                        data:data.data.sdp
                    }))
                }
            break

            case "ICE_CANDIDATE":
                let userToReceiveIceCandidate = findUser(data.target)
                if(userToReceiveIceCandidate){
                    userToReceiveIceCandidate.conn.send(JSON.stringify({
                        type:"ICE_CANDIDATE",
                        name:data.name,
                        data:{
                            sdpMLineIndex:data.data.sdpMLineIndex,
                            sdpMid:data.data.sdpMid,
                            sdpCandidate: data.data.sdpCandidate
                        }
                    }))
                }
            break

            case "CALL_ENDED":
            let userToNotifyCallEnded = findUser(data.target);

            if (userToNotifyCallEnded) {
        userToNotifyCallEnded.conn.send(JSON.stringify({
            type: "CALL_ENDED",
            name: data.name
        }));
        }
        break;


        }

    })
    
    connection.on('close', () =>{
        users.forEach( user => {
            if(user.conn === connection){
                users.splice(users.indexOf(user),1)
            }
        })
    })





})

const findUser = username =>{
    for(let i=0; i<users.length;i++){
        if(users[i].name === username)
        return users[i]
    }
}