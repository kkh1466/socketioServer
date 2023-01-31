const teacher_btn = document.getElementById('teacher_btn')
const student_btn = document.getElementById('student_btn')


function teacher(event){
    event.preventDefault()
    location.href = '/teacher'
}
teacher_btn.addEventListener('click', teacher)

function student(event){
    event.preventDefault()
    location.href = '/student'
}
student_btn.addEventListener('click', student)