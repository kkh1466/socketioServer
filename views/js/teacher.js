const socket= io()
console.log(socket)


const welcome = document.getElementById('welcome')
const byebye = document.getElementById('byebye')
const form1 = welcome.querySelector('form')
const form2 = byebye.querySelector('form')
const enter_btn = document.getElementById('enter_btn')
const leave_btn = document.getElementById('leave_btn')

const chatRoom = document.getElementById('chatRoom')
const form3 = document.getElementById('nickname')
const form4 = document.getElementById('message')
const send_btn = document.getElementById('send_btn')
const nick_btn = document.getElementById('nick_btn')
//chatRoom.hidden = true

myNick='Anon'
myRoom='None'


function nick_send(event){
    event.preventDefault()
    const input = form3.querySelector('input')
    nick = input.value
    is_teacher = true
    socket.emit('login', nick, is_teacher)
    const id = document.getElementById('nick_label')
    id.innerText = nick
    myNick = nick
    input.value=''
}
nick_btn.addEventListener('click', nick_send)


function enter(event){
    event.preventDefault()
    const input = form1.querySelector('input')
    roomName=input.value
    socket.emit('enter_room', roomName, myNick)
    input.value=''
    h3 = chatRoom.querySelector('h3')
    h3.innerText=`${roomName}의 방`
    myRoom = roomName
}
enter_btn.addEventListener('click', enter)


function leave(event){
    event.preventDefault()
    const input = form2.querySelector('input')
    console.log(input)
    socket.emit('leave_room', input.value)
    input.value=''
}
leave_btn.addEventListener('click', leave)



function addMessage(msg){
    ul = chatRoom.querySelector('ul')
    li = document.createElement('li')
    li.innerText = msg
    ul.appendChild(li)
}


function msg_send(event){
    event.preventDefault()
    const input = form4.querySelector('input')
    message = input.value
    socket.emit('send_msg', message)
    input.value=''
    addMessage(message)
}
send_btn.addEventListener('click', msg_send)


socket.on('welcome', ()=>{
    addMessage('Someone Joined')
})

socket.on('bye', (id)=>{
    addMessage(id+' left')
})


socket.on('send_msg', (msg)=>{
    addMessage(msg)
})


socket.on('rooms', (msg)=>{
    alert(msg)
})

socket.on('connected_people', (list)=>{
    alert(list)
})

socket.on('studentCome', (studentID)=>{
    addMessage(studentID+' join')
})

socket.on('relogin', (coalaID)=>{
    if (confirm("재 로그인 하시겠습니까?")) {
        socket.emit('relogin', coalaID, true)
    }
})

socket.on('selfDicconnect', ()=>{
    addMessage('selfDicconnect')
})

socket.io.on("reconnect", (attempt) => {
    console.log('reconnect event fired')
    if(myNick !== 'Anon'){
        is_teacher = true
        socket.emit('login', myNick, is_teacher)
    }

    if(myRoom !== 'None'){
        socket.emit('enter_room', myRoom, myNick)
    }
})

socket.io.on("reconnect_error", (error) => {
    console.log(error)
});


const searchRoom_btn = document.getElementById('searchRoom_btn')

function searchRoom(event){
    event.preventDefault()
    socket.emit('get_rooms')
}
searchRoom_btn.addEventListener('click', searchRoom)


const searchStudent_btn = document.getElementById('searchStudent_btn')

function searchStudent(event){
    event.preventDefault()
    socket.emit('connected_people', myRoom)
}
searchStudent_btn.addEventListener('click', searchStudent)
