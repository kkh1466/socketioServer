const express = require('express')
const http = require('http')
const path = require('path')
const socketIO = require('socket.io')
const { createClient } = require('redis')
const { createAdapter } = require('@socket.io/redis-adapter')
require("dotenv").config()

const app = express()
app.use(express.urlencoded({extended: true})) 
app.use(express.static(path.join(__dirname, 'views')))

const HTTPserver = http.createServer(app)
const io = socketIO(HTTPserver)


const pubClient = createClient({ 
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PW
})
const subClient = pubClient.duplicate()


io.adapter(createAdapter(pubClient, subClient))


// 아래 부분의 HTTPserver를 io로 바꾸면 실행이 안됌
HTTPserver.listen(process.env.PORT, () => console.log(`server is running on ${process.env.PORT}`))


// publicRoom들을 list 형태로 반환해주는 함수
function publicRoom(){
    const {
        sockets: {
            adapter: {sids, rooms},  // sids는 접속해 있는 전체 소켓 map, rooms는 전체 방 map(개인소켓방 포함)
        },
    } = io

    const publicRooms = []
    rooms.forEach((_, key)=>{
        if(sids.get(key) === undefined){
            publicRooms.push(key)
        }
    })
    return publicRooms
}


io.on("connection", (socket)=>{
    const ip = socket.request.headers['x-forwarded-for'] || socket.request.connection.remoteAddress;
    console.log(`클라이언트 연결 성공 - 클라이언트IP: ${ip}, 소켓ID: ${socket.id}`);
    socket['coalaID']='None'  // id저장
    socket['teacher']='None'  // 선생님의 id 저장(선생님은 본인 아이디 저장)


    socket.onAny((event)=>{   // 이벤트 실행 확인 메서드
        console.log(`${event} event is rise up`)
    })

    socket.on('login', (coalaID, is_teacher)=>{
        sw=1
        io.sockets.sockets.forEach((soc)=>{ 
            if(soc.coalaID === coalaID){
                socket.emit('relogin', coalaID)
                sw=0
                return false
            }
        })

        if(sw){
            socket['coalaID']=coalaID       
            socket['is_teacher']=is_teacher  // 선생님이면 true 학생이면 false
        }
    })

    socket.on('relogin', (coalaID, is_teacher)=>{
        io.sockets.sockets.forEach((soc)=>{ 
            if(soc.coalaID === coalaID){
                soc.emit('selfDicconnect')
                io.in(soc.id).disconnectSockets(true)
                return false
            }
        })
        socket['coalaID']=coalaID       
        socket['is_teacher']=is_teacher  
    })

    socket.on('get_rooms', ()=>{     // public room들의 이름을 반환
        socket.emit('rooms', publicRoom().toString())
    })

    socket.on('enter_room', (roomName, coalaID)=>{   // 방이름과, 자기자신 id를 받음 
        socket.join(roomName)   // 방에 들어가고
        //console.log(socket.rooms)
        console.log('is_teacher?: ', socket.is_teacher)

        const roomSet = io.sockets.adapter.rooms.get(roomName) // room에 존재하는 전체 소켓id들이 저장된 set 

        if(socket.is_teacher) socket.teacher=coalaID   // 선생님 접속시
        else{                                          // 학생 접속시
            io.sockets.sockets.forEach((soc)=>{   // 모든 소켓을 확인해보고
                if(soc.is_teacher){               // 해당 소켓이 선생님이면
                    roomSet.forEach((socID)=>{    
                        if(soc.id === socID){     // 헤당 선생님이 내방의 선생님이 맞으면
                            socket['teacher']=soc.coalaID   // 그 소켓의 coalaid를 teacher 속성에 저장
                        }
                    })
                }
            })
        }


        if(socket.is_teacher){  // 선생님 접속시 
            socket.to(roomName).emit('teacherCome', coalaID)
        }  
        else{                                                          // 학생 접속시
            socket.to(roomName).emit('studentCome', coalaID)   // 선생님(방에 있는 전원)에겐 학생 id를 보냄  
            socket.emit('teacherName', socket.teacher)         // 자기자신에겐 선생님 id를 보냄                                         
        } 
    })

    socket.on('connected_people', (roomName)=>{
        const roomSet = io.sockets.adapter.rooms.get(roomName) // room에 존재하는 전체 소켓id들이 저장된 set 
        connected_people = []
        io.sockets.sockets.forEach((soc)=>{   // 모든 소켓을 확인해보고
            roomSet.forEach((socID)=>{    
                if(soc.id === socID && soc.coalaID !== socket.coalaID){     // 헤당 선생님이 내방의 선생님이 맞으면
                    connected_people.push(soc.coalaID)
                }
            })
        })
        socket.emit('connected_people', connected_people)
    })

    socket.on('leave_room', (roomName)=>{
        socket.leave(roomName)    
        console.log(socket.rooms)
    })

    socket.on('send_msg', (msg)=>{    // 전체 메세지
        socket.rooms.forEach((room)=>socket.to(room).emit('send_msg', socket['coalaID']+': '+msg))
    })
    
    socket.on('to_teacher', (teacherID, studentID, message)=>{    // 학생이 선생님에게 dm
        io.sockets.sockets.forEach((soc)=>{
            if(soc.teacher===teacherID && soc.is_teacher){
                soc.emit('msg', studentID, message)
            }
        })
    })

    socket.on('to_student', (coalaID, message)=>{   // 선생님이 학생에게 dm (id는 학생의 id)
        io.sockets.sockets.forEach((soc)=>{
            if(soc.coalaID === coalaID){
                soc.emit('msg', message)
            }
        })
    })


    socket.on('disconnecting', (reason)=>{
        console.log(reason)
        socket.rooms.forEach((room) => socket.to(room).emit('bye', socket.coalaID))
    })

    socket.on('disconnect', (reason)=>{
        console.log(reason)
        console.log(`연결 종료 - 클라이언트IP: ${ip}, 소켓ID: ${socket.id}`)
    })

    socket.on('error', (error)=>{
        console.log(`에러 발생: ${error}`);
    })
})


app.get('/', (req, res)=>{ 
    res.sendFile(__dirname +'/index.html')
})
 
app.get('/teacher', (req, res)=>{ 
    res.sendFile(__dirname +'/views/teacher.html')
})

app.get('/student', (req, res)=>{ 
    res.sendFile(__dirname +'/views/student.html')
})