/* Minimal app.js for demo - includes seed data, login/register, and patient/doctor/admin appointments */
const LS_KEYS = {
  users: "hc_users",
  appointments: "hc_appointments",
  doctorPatient: "hc_doctor_patient",
  currentUser: "hc_current_user",
  seeded: "hc_seeded"
};

function getUsers(){ return JSON.parse(localStorage.getItem(LS_KEYS.users) || "[]"); }
function setUsers(u){ localStorage.setItem(LS_KEYS.users, JSON.stringify(u)); }

function getAppointments(){ return JSON.parse(localStorage.getItem(LS_KEYS.appointments) || "[]"); }
function setAppointments(a){ localStorage.setItem(LS_KEYS.appointments, JSON.stringify(a)); }

function getDoctorPatient(){ return JSON.parse(localStorage.getItem(LS_KEYS.doctorPatient) || "[]"); }
function setDoctorPatient(dp){ localStorage.setItem(LS_KEYS.doctorPatient, JSON.stringify(dp)); }

function getCurrentUser(){ const c = localStorage.getItem(LS_KEYS.currentUser); return c?JSON.parse(c):null; }
function setCurrentUser(u){ localStorage.setItem(LS_KEYS.currentUser, JSON.stringify(u)); }

function logout(){ localStorage.removeItem(LS_KEYS.currentUser); window.location.href = '../index.html'; }

function uid(){ return Date.now()+Math.floor(Math.random()*1000); }

function seedData(){
  if (localStorage.getItem(LS_KEYS.seeded)) return;
  setUsers([
    {id:1,name:'Main Admin',email:'admin@clinic.com',password:'123456',role:'admin'},
    {id:2,name:'Dr. Akoto',email:'akoto@clinic.com',password:'123456',role:'doctor'},
    {id:3,name:'Dr. Brown',email:'brown@clinic.com',password:'123456',role:'doctor'},
    {id:4,name:'John Doe',email:'john@example.com',password:'123456',role:'patient'},
    {id:5,name:'Jane Smith',email:'jane@example.com',password:'123456',role:'patient'}
  ]);
  setAppointments([
    {id:1001,patient_id:4,doctor_id:3,date:'2025-09-01',time:'10:00',status:'pending',reason:'Routine check'}
  ]);
  setDoctorPatient([
    {id:5001,doctor_id:2,patient_id:4},
    {id:5002,doctor_id:3,patient_id:5}
  ]);
  localStorage.setItem(LS_KEYS.seeded,'1');
}

document.addEventListener('DOMContentLoaded', ()=>{
  seedData();

  // --- Login handler ---
  const loginForm = document.getElementById('loginForm');
  if (loginForm){
    loginForm.addEventListener('submit', e=>{
      e.preventDefault();
      const email=document.getElementById('email').value.toLowerCase();
      const password=document.getElementById('password').value;
      const u=getUsers().find(x=>x.email.toLowerCase()===email && x.password===password);
      if(!u){ alert('Invalid credentials'); return;}
      setCurrentUser(u);
      if(u.role==='admin') location.href='admin/dashboard.html';
      else if(u.role==='doctor') location.href='doctor/dashboard.html';
      else location.href='patient/dashboard.html';
    });
  }

  // --- Register handler ---
  const registerForm = document.getElementById('registerForm');
  if(registerForm){
    registerForm.addEventListener('submit', e=>{
      e.preventDefault();
      const name=document.getElementById('name').value;
      const email=document.getElementById('reg_email').value.toLowerCase();
      const pass=document.getElementById('reg_password').value;
      const role=document.getElementById('role').value;
      const users=getUsers();
      if(users.some(x=>x.email.toLowerCase()===email)){ alert('Email exists'); return;}
      if(role==='admin' && users.some(x=>x.role==='admin')){ alert('Admin exists'); return;}
      users.push({id:uid(),name, email, password:pass, role});
      setUsers(users);
      alert('Registered'); location.href='index.html';
    });
  }

  // --- Welcome message ---
  const welcomeEl = document.getElementById("welcomeMessage");
  const cu = getCurrentUser();
  if(cu && welcomeEl){
    const hour = new Date().getHours();
    let greeting = "Hello";
    if (hour < 12) greeting = "Good Morning";
    else if (hour < 18) greeting = "Good Afternoon";
    else greeting = "Good Evening";

    let displayName = cu.name;
    if (cu.role === "doctor" && !cu.name.startsWith("Dr.")){
      displayName = `Dr. ${cu.name}`;
    } else if (cu.role === "admin"){
      displayName = `Admin ${cu.name}`;
    }

    welcomeEl.textContent = `${greeting}, ${displayName}`;
  }

  // --- Patient Dashboard ---
  if(cu && cu.role === "patient"){
    // populate doctor dropdown
    const doctorSelect = document.getElementById("doctor");
    if(doctorSelect){
      const doctors = getUsers().filter(u=>u.role==="doctor");
      doctorSelect.innerHTML = `<option value="">-- Select Doctor --</option>`;
      doctors.forEach(d=>{
        doctorSelect.innerHTML += `<option value="${d.id}">${d.name}</option>`;
      });
    }

    // booking form
    const form = document.getElementById("appointmentForm");
    if(form){
      form.addEventListener("submit", e=>{
        e.preventDefault();
        const doctorId = document.getElementById("doctor").value;
        const date = document.getElementById("date").value;
        const time = document.getElementById("time").value;
        const reason = document.getElementById("reason").value;
        if(!doctorId){ alert("Please select a doctor"); return; }

        let appts = getAppointments();
        appts.push({
          id: uid(),
          patient_id: cu.id,
          doctor_id: parseInt(doctorId),
          date, time, reason,
          status:"pending"
        });
        setAppointments(appts);
        alert("✅ Appointment booked!");
        loadPatientAppointments();
        form.reset();
      });
    }

    function loadPatientAppointments(){
      const tbody = document.getElementById("appointmentsTableBody");
      if(!tbody) return;
      tbody.innerHTML = "";
      const users = getUsers();
      const appts = getAppointments().filter(a=>a.patient_id===cu.id);
      appts.forEach(a=>{
        const doctor = users.find(u=>u.id===a.doctor_id);
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="border px-2 py-1">${a.date}</td>
          <td class="border px-2 py-1">${a.time}</td>
          <td class="border px-2 py-1">${doctor?doctor.name:"-"}</td>
          <td class="border px-2 py-1">${a.reason}</td>
          <td class="border px-2 py-1">${a.status}</td>
        `;
        tbody.appendChild(tr);
      });
    }
    loadPatientAppointments();
  }

  // --- Doctor Dashboard ---
  if(cu && cu.role==="doctor"){
    function loadDoctorAppointments(){
      const tbody=document.getElementById("doctorAppointmentsTableBody");
      if(!tbody) return;
      tbody.innerHTML="";
      const users=getUsers();
      const appts=getAppointments().filter(a=>a.doctor_id===cu.id);
      appts.forEach((a)=>{
        const patient=users.find(u=>u.id===a.patient_id);
        const tr=document.createElement("tr");
        tr.innerHTML=`
          <td class="border px-2 py-1">${a.date}</td>
          <td class="border px-2 py-1">${a.time}</td>
          <td class="border px-2 py-1">${patient?patient.name:"-"}</td>
          <td class="border px-2 py-1">${a.reason}</td>
          <td class="border px-2 py-1">${a.status}</td>
          <td class="border px-2 py-1">
            <button onclick="updateDoctorAppt(${a.id},'approved')" class="px-2 py-1 bg-green-500 text-white rounded">Approve</button>
            <button onclick="updateDoctorAppt(${a.id},'rejected')" class="px-2 py-1 bg-red-500 text-white rounded">Reject</button>
            <button onclick="updateDoctorAppt(${a.id},'completed')" class="px-2 py-1 bg-blue-500 text-white rounded">Complete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
    window.updateDoctorAppt=function(id,status){
      let appts=getAppointments();
      const appt=appts.find(a=>a.id===id);
      if(appt){ appt.status=status; setAppointments(appts); loadDoctorAppointments(); }
    };
    loadDoctorAppointments();
  }
});

// --- Admin: Users Table (with password editing & search) ---
function loadUsersTable(search="") {
  const usersTableBody = document.getElementById('usersTableBody');
  if (!usersTableBody) return;
  let users = getUsers();

  if(search.trim() !== ""){
    search = search.toLowerCase();
    users = users.filter(u => 
      u.name.toLowerCase().includes(search) || 
      u.email.toLowerCase().includes(search) || 
      u.role.toLowerCase().includes(search)
    );
  }

  usersTableBody.innerHTML = users.map((u) => `
    <tr>
      <td class="border px-2 py-1">${u.name}</td>
      <td class="border px-2 py-1">${u.email}</td>
      <td class="border px-2 py-1">${u.role}</td>
      <td class="border px-2 py-1">
        <input type="password" id="password-${u.id}" value="${u.password}" class="border rounded px-2 py-1 w-32" disabled>
        <button class="ml-2 text-xs px-2 py-1 rounded bg-blue-500 text-white" onclick="editPassword('${u.id}')">Edit</button>
        <button class="ml-1 text-xs px-2 py-1 rounded bg-green-500 text-white hidden" id="saveBtn-${u.id}" onclick="savePassword('${u.id}')">Save</button>
      </td>
      <td class="border px-2 py-1">
        <button class="bg-red-500 text-white px-2 py-1 rounded" onclick="deleteUser('${u.id}')">Delete</button>
      </td>
    </tr>
  `).join("");
}

window.editPassword = function(userId) {
  const input = document.getElementById(`password-${userId}`);
  const saveBtn = document.getElementById(`saveBtn-${userId}`);
  input.disabled = false;
  input.type = "text";
  saveBtn.classList.remove("hidden");
};

window.savePassword = function(userId) {
  let users = getUsers();
  const input = document.getElementById(`password-${userId}`);
  const saveBtn = document.getElementById(`saveBtn-${userId}`);
  const userIndex = users.findIndex(u => u.id == userId);
  if (userIndex !== -1) {
    users[userIndex].password = input.value.trim();
    setUsers(users);
  }
  input.disabled = true;
  input.type = "password";
  saveBtn.classList.add("hidden");
  alert("✅ Password updated successfully!");
  loadUsersTable();
};

// --- Admin: Appointments Table (with search & filter) ---
function loadAllAppointments(search="") {
  const appointments = getAppointments();
  const tbody = document.getElementById("adminAppointmentsTableBody");
  if (!tbody) return;

  const users = getUsers();
  tbody.innerHTML = "";

  let filtered = appointments;
  if(search.trim() !== ""){
    search = search.toLowerCase();
    filtered = appointments.filter(a => {
      const patient = users.find(u=>u.id===a.patient_id);
      const doctor = users.find(u=>u.id===a.doctor_id);
      return (
        (patient && patient.name.toLowerCase().includes(search)) ||
        (doctor && doctor.name.toLowerCase().includes(search)) ||
        a.reason.toLowerCase().includes(search) ||
        a.status.toLowerCase().includes(search)
      );
    });
  }

  filtered.forEach((appt) => {
    const patient = users.find(u=>u.id===appt.patient_id);
    const doctor = users.find(u=>u.id===appt.doctor_id);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="border px-2 py-1">${appt.date}</td>
      <td class="border px-2 py-1">${appt.time}</td>
      <td class="border px-2 py-1">${patient ? patient.name : "-"}</td>
      <td class="border px-2 py-1">${doctor ? doctor.name : "-"}</td>
      <td class="border px-2 py-1">${appt.reason}</td>
      <td class="border px-2 py-1">
        <select onchange="updateAppointmentStatus(${appt.id}, this.value)" class="border rounded p-1">
          <option value="pending" ${appt.status==="pending"?"selected":""}>Pending</option>
          <option value="approved" ${appt.status==="approved"?"selected":""}>Approved</option>
          <option value="rejected" ${appt.status==="rejected"?"selected":""}>Rejected</option>
          <option value="completed" ${appt.status==="completed"?"selected":""}>Completed</option>
          <option value="cancelled" ${appt.status==="cancelled"?"selected":""}>Cancelled</option>
        </select>
      </td>
      <td class="border px-2 py-1">
        <button onclick="deleteAppointment(${appt.id})" class="px-2 py-1 bg-red-600 text-white rounded">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.updateAppointmentStatus = function(id, newStatus) {
  const appointments = getAppointments();
  const appt = appointments.find(a => a.id === id);
  if(appt){
    appt.status = newStatus;
    setAppointments(appointments);
    alert("Appointment status updated successfully!");
    loadAllAppointments();
  }
};

window.deleteAppointment = function(id) {
  let appointments = getAppointments();
  if (confirm("Are you sure you want to delete this appointment?")) {
    appointments = appointments.filter(a => a.id !== id);
    setAppointments(appointments);
    alert("Appointment deleted successfully!");
    loadAllAppointments();
  }
};

// --- Init admin tables + auto-refresh ---
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("usersTableBody")) {
    loadUsersTable();
    const searchUsers = document.getElementById("searchUsers");
    if(searchUsers){
      searchUsers.addEventListener("input", e=>{
        loadUsersTable(e.target.value);
      });
    }
  }

  if (document.getElementById("adminAppointmentsTableBody")) {
    loadAllAppointments();
    const searchAppointments = document.getElementById("searchAppointments");
    if(searchAppointments){
      searchAppointments.addEventListener("input", e=>{
        loadAllAppointments(e.target.value);
      });
    }
  }
});

// 🔄 Auto-refresh across tabs/pages whenever localStorage changes
window.addEventListener("storage", (e)=>{
  if(e.key === LS_KEYS.users) loadUsersTable();
  if(e.key === LS_KEYS.appointments) loadAllAppointments();
});
