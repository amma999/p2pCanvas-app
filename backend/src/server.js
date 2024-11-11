import express, { json } from "express"
import http from "http"
import { server as websocketServer } from "webSocket"
const app = express();
const httpserver = http.createServer(app)
const PORT = 4444 || process.env.PORT
httpserver.listen(PORT, () => {
    console.log(`listenting to port " ${PORT}`);
})

const clients = {}
const rooms = {}
const room_state = {
    "state": ""
}

const wsserver = new websocketServer({
    "httpServer": httpserver
})

wsserver.on("request", request => {
    let cond = true;

    const connection = request.accept(null, request.origin);
    connection.on('open', () => console.log("connection opened"));
    connection.on("close", () => console.log("connection closed"));
    connection.on("message", message => {
        const recieved_data = JSON.parse(message.utf8Data);

        if (recieved_data.method === "create") {
            const recieved_client_id = recieved_data.id;
            const room_id = gid()
            rooms[room_id] = {
                "id": room_id,
                "owner": recieved_client_id,
                "client": [],
                "state_data": {
                    "owner": "",
                    "state": ""
                },
                "length": ""


            }
            const client_data = {
                "id": recieved_client_id
            }
            rooms[room_id].client.push(client_data)

            const payload = {
                "method": "create",
                "room_id": room_id
            }

            const con = clients[recieved_client_id].connection
            con.send(JSON.stringify(payload))

        }

        if (recieved_data.method === "join") {
            const recieved_client_id = recieved_data.id;
            const recieved_room_id = recieved_data.room_id;
            const room = rooms[recieved_room_id];


            if (room.client.length >= 4) {
                return console.log("not able to join");

            }

       
              
                const client_data = {
                    "id": recieved_client_id
                }
                room.client.push(client_data)

            if (rooms[recieved_room_id]?.client?.length > 1) updateRoomState(recieved_room_id)
                
                
            const payload = {
                "method": "join",
                "room_data": rooms[recieved_room_id]
            }

 const id_data = room.client.filter(element=>element.id!== recieved_client_id)
 
                const payload_for_join = {
                    "method" : "user_joined",
                    "joined_user_id": id_data
                }
            const con = clients[recieved_client_id].connection
            con.send(JSON.stringify(payload))
            
            // const conn = clients[recieved_client_id].connection
            // conn.send(JSON.stringify(payload_for_join))

            setTimeout(() => {
                const conn = clients[recieved_client_id].connection
            conn.send(JSON.stringify(payload_for_join))
              }, 1000);
            
        }

        if (recieved_data.method === "state") {
            const room_id = recieved_data.room_id;
            const state = recieved_data.state;
            const owner = recieved_data.owner;
            rooms[room_id].state_data.state = state;
            rooms[room_id].state_data.owner = owner;

            // if (k == 1) {
            //     rooms[room_id].state_data.state = state;
            //     rooms[room_id].state_data.owner = owner;
            //     k = 2


            // }else{

            //     if (JSON.stringify(rooms[room_id].state_data.state.appState) !== JSON.stringify(state.appState)) {



            //         console.log("appluing data",j);
            //         j +=1;

            //         rooms[room_id].state_data.state = state;
            //         rooms[room_id].state_data.owner = owner;
            //     }
            // }





            // console.log("updating state in backend ....");




        }

        if (recieved_data.method === "offer") {
            const id_to_send = recieved_data.target
            const sdp = recieved_data.sdp
            const caller = recieved_data.caller
            const payload = {
                "method": "offer",
                sdp,
                caller
            }
            const con = clients[id_to_send].connection;
            con.send(JSON.stringify(payload))
        }

        if (recieved_data.method === "answer") {
            const id_to_send = recieved_data.target;
            const sdp = recieved_data.sdp;
            const payload = {
                "method": "answer",
                sdp
            }
            const con = clients[id_to_send].connection;
            con.send(JSON.stringify(payload))
        }
        if (recieved_data.method === "ice-candidate") {

            if (recieved_data) {
                const id_to_send = recieved_data.target
                const candidate = recieved_data.candidate


                console.log(id_to_send);



                const payload = {
                    "method": "ice-candidate",
                    candidate
                }
                if (payload) {
                    const con = clients[id_to_send].connection;
                    con.send(JSON.stringify(payload))
                }
            }
        }
    })

    const updateRoomState = (room_id) => {

        if (cond == true) {

            room_state[room_id] = {
                "state": rooms[room_id].state_data.state
            }
            console.log("value of cond for first time" + cond);

            
            
            if (rooms[room_id].state_data) {
                const payload = {
                    "method": "update",
                    "room_id": room_id,
                    "state": rooms[room_id]?.state_data?.state
                }



                if (Array.isArray(rooms[room_id].client)) {
                    // console.log("updating state from backend ");

                    rooms[room_id].client.filter(client_id => client_id.id !== rooms[room_id]?.state_data?.owner).forEach(client_id => {

                        clients[client_id.id].connection.send(JSON.stringify(payload))

                    });

                }




            }
            cond = false
            console.log("value of cond for second time" + cond);
        }
        else {
            if (JSON.stringify(rooms[room_id].state_data.state) != JSON.stringify(room_state[room_id].state)) {
                if (rooms[room_id].state_data) {
                    const payload = {
                        "method": "update",
                        "room_id": room_id,
                        "state": rooms[room_id]?.state_data?.state
                    }


                    console.log("value of cond for else time" + cond);

                    if (Array.isArray(rooms[room_id].client)) {
                        // console.log("updating state from backend ");

                        rooms[room_id].client.filter(client_id => client_id.id !== rooms[room_id]?.state_data?.owner).forEach(client_id => {

                            clients[client_id.id].connection.send(JSON.stringify(payload))

                        });
                        room_state[room_id].state = rooms[room_id].state_data.state
                    }




                }


            }
        }

        setTimeout(() => updateRoomState(room_id), 350);

    }



    const client_id = gid()
    clients[client_id] = {
        "connection": connection
    }

    const payload = {
        "method": "connect",
        "id": client_id
    }

    connection.send(JSON.stringify(payload))

})


const s4 = () => {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
}
const gid = () => (s4() + "-" + s4() + "-" + s4() + "-4" + s4().substring(1))






