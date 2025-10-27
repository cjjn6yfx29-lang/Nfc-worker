// Admin mode flag
let isAdmin=false;
const adminPassword='admin123'; // Change password

// LocalStorage keys
const LS = { workers:'workersData_v1', nfc:'nfcMap_v1', logs:'checkinLogs_v1', dark:'darkMode_v1', business:'businessName_v1' };
function uid(n=8){return Math.random().toString(36).slice(2,2+n)}

// Load data
let workers=JSON.parse(localStorage.getItem(LS.workers)||'[]');
let nfcMap=JSON.parse(localStorage.getItem(LS.nfc)||'{}');
let logs=JSON.parse(localStorage.getItem(LS.logs)||'[]');
workers.forEach(w=> nfcMap[w.nfc]=w.id);

// Elements
const totalWorkersEl=document.getElementById('totalWorkers');
const checkedInNowEl=document.getElementById('checkedInNow');
const uniqueTodayEl=document.getElementById('uniqueToday');
const arrivedCountEl=document.getElementById('arrivedCount');
const partsGridEl=document.getElementById('partsGrid');
const workerListEl=document.getElementById('workerList');
const liveNfcEl=document.getElementById('liveNfc');
const adminPanel=document.getElementById('adminPanel');

// Dark mode
const darkToggle=document.getElementById('darkToggle');
if(localStorage.getItem(LS.dark)==='true'){document.documentElement.setAttribute('data-theme','dark');darkToggle.checked=true;}
darkToggle.addEventListener('change',()=>{const on=darkToggle.checked;if(on)document.documentElement.setAttribute('data-theme','dark');else document.documentElement.removeAttribute('data-theme');localStorage.setItem(LS.dark,on?'true':'false');});

// Business name
const businessNameEl=document.getElementById('businessName');
if(localStorage.getItem(LS.business)) businessNameEl.textContent=localStorage.getItem(LS.business);
businessNameEl.addEventListener('input',()=> localStorage.setItem(LS.business,businessNameEl.textContent));

// Save
function saveAll(){localStorage.setItem(LS.workers,JSON.stringify(workers));localStorage.setItem(LS.nfc,JSON.stringify(nfcMap));localStorage.setItem(LS.logs,JSON.stringify(logs));}

// Render
function renderCounts(){
  totalWorkersEl.textContent=workers.length;
  checkedInNowEl.textContent=workers.filter(w=>w.currentlyCheckedIn).length;
  const today=new Date().toISOString().slice(0,10);
  uniqueTodayEl.textContent=new Set(logs.filter(l=>l.time.slice(0,10)===today).map(l=>l.workerId)).size;
  arrivedCountEl.textContent=uniqueTodayEl.textContent;
}

function renderWorkers(){
  workerListEl.innerHTML='';
  workers.forEach(w=>{
    const div=document.createElement('div');
    div.className='worker-card';
    div.innerHTML=`<div class="meta"><div class="name">${w.name}</div><div class="sub">${w.job} - ${w.part} - €${w.monthly}</div></div>`;
    if(isAdmin){
      const btn=document.createElement('button');
      btn.className='remove-btn';
      btn.textContent='Remove';
      btn.onclick=()=>{
        if(confirm('Remove this worker?')){
          delete nfcMap[w.nfc];
          workers=workers.filter(worker=>worker.id!==w.id);
          saveAll();
          refreshAll();
        }
      };
      div.appendChild(btn);
    }
    workerListEl.appendChild(div);
  });
}

function renderParts(){
  const parts=[];['A','B','C'].forEach(l=>{for(let i=1;i<=5;i++) parts.push(`${l}${i}`);});
  partsGridEl.innerHTML=parts.map(p=>`<div class="part">${p}<div style="font-size:12px;color:var(--muted)">${workers.filter(w=>w.part===p).length}</div></div>`).join('');
}

function renderActivity(){
  const activityList=document.getElementById('activityList');
  activityList.innerHTML='';
  logs.slice().reverse().forEach(l=>{
    const li=document.createElement('li');
    li.innerHTML=`${l.name} - <b>${l.action}</b><div class="time">${new Date(l.time).toLocaleString()}</div>`;
    activityList.appendChild(li);
  });
}

function refreshAll(){renderCounts();renderWorkers();renderParts();renderActivity();}
refreshAll();

// Admin Login
document.getElementById('adminBtn').addEventListener('click',()=>{
  const pass=prompt('Enter admin password:');
  if(pass===adminPassword){
    isAdmin=true;
    adminPanel.style.display='block';
    refreshAll();
  } else alert('Wrong password!');
});

// Add worker
document.getElementById('addWorkerBtn').addEventListener('click',()=>{
  const n=document.getElementById('newName').value.trim();
  const dob=document.getElementById('newDOB').value;
  const c=document.getElementById('newCountry').value.trim();
  const s=parseFloat(document.getElementById('newSalary').value);
  const j=document.getElementById('newJob').value.trim();
  const p=document.getElementById('newPart').value;
  const nfc=document.getElementById('newNFC').value.trim();
  if(!n||!dob||!c||!s||!j||!p||!nfc){alert('Fill all fields');return;}
  const id='W'+String(workers.length+1).padStart(3,'0');
  workers.push({id,uid:uid(6),nfc,name:n,dob,country:c,monthly:s,job:j,part:p,currentlyCheckedIn:false,currentStart:null});
  nfcMap[nfc]=id;saveAll();refreshAll();
  ['newName','newDOB','newCountry','newSalary','newJob','newPart','newNFC'].forEach(id=>document.getElementById(id).value='');
  alert(`Worker "${n}" added successfully!`);
});

// NFC Scan
const nfcInput=document.getElementById('nfcInput');
document.getElementById('scanBtn').addEventListener('click',()=>{
  const nfc=nfcInput.value.trim();
  if(!nfcMap[nfc]){alert('Unknown NFC'); return;}
  const worker=workers.find(w=>w.id===nfcMap[nfc]);
  if(!worker) return;
  const now=new Date().toISOString();
  worker.currentlyCheckedIn=!worker.currentlyCheckedIn;
  if(worker.currentlyCheckedIn) worker.currentStart=now; else worker.currentStart=null;
  logs.push({workerId:worker.id,name:worker.name,time:now,action:worker.currentlyCheckedIn?'IN':'OUT'});
  saveAll(); refreshAll();
  nfcInput.value='';
});