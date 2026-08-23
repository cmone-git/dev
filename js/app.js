import {showSplash} from "./splash.js";
import {initNavigation} from "./navigation.js";
import {initLoading} from "./loading.js";
import {formatIndianDate} from "./date.js";
import {auth, db} from "./firebase-config.js";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  getCountFromServer,
  query,
  where,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

let dashboardState = {
  user: null,
  firebaseUser: null,
  clientsTotal: 0,
  complianceTotal: 0,
  completedTotal: 0,
  calendarRecords: [],
  recentRecords: []
};

let calendarDate = new Date();

export async function initApp(){

  await showSplash();
  initLoading();

  auth.onAuthStateChanged(async firebaseUser => {

    if(!firebaseUser){
      location.replace("auth/login.html");
      return;
    }

    try{

      const userSnap = await getDoc(
        doc(db,"users",firebaseUser.uid)
      );

      if(!userSnap.exists()){
        await auth.signOut();
        alert("User profile was not found.");
        location.replace("auth/login.html");
        return;
      }

      const user = userSnap.data();

      if(user.status !== "active"){
        await auth.signOut();
        alert("Your account is inactive.");
        location.replace("auth/login.html");
        return;
      }

      if(user.role !== "admin"){
        await auth.signOut();
        alert("Administrator access is required.");
        location.replace("auth/login.html");
        return;
      }

      dashboardState.user = user;
      dashboardState.firebaseUser = firebaseUser;

      renderDashboard();

      /*
       * Dashboard data loads after the shell is rendered.
       * Counts use Firestore count aggregation where possible,
       * while only the records needed for calendar/recent views
       * are downloaded.
       */
      await loadDashboardData();

    }catch(error){

      console.error("Dashboard authentication error:",error);
      await auth.signOut().catch(()=>{});
      location.replace("auth/login.html");

    }

  });
}


// ==========================================================
// DASHBOARD SHELL
// ==========================================================

function renderDashboard(){

  const user = dashboardState.user;
  const firebaseUser = dashboardState.firebaseUser;

  document.getElementById("app").innerHTML = `

<header class="cm-header">
  <div class="cm-header-inner">

    <div class="cm-header-left">

      <button class="menu-toggle" id="menuToggle" type="button">
        <i data-lucide="menu"></i>
      </button>

      <div class="cm-brand">

        <div class="cm-logo">CM</div>

        <div>
          <div class="cm-brand-title">CM | BIZODIT</div>
          <div class="cm-brand-subtitle">Business Management</div>
        </div>

      </div>

    </div>

    <div class="header-right">

      <button class="header-icon" id="dashboardSearch" type="button"
        title="Compliance Search">
        <i data-lucide="search"></i>
      </button>

      <button class="header-icon" type="button"
        title="Notifications">
        <i data-lucide="bell"></i>
      </button>

      <button class="profile" id="profileButton" type="button">

        <div class="profile-avatar">
          ${getInitials(user.name || firebaseUser.email)}
        </div>

        <div class="profile-info">
          <div class="profile-name">
            ${escapeHTML(user.name || firebaseUser.email)}
          </div>
          <div class="profile-role">Administrator · All Branches</div>
        </div>

      </button>

    </div>

  </div>
</header>


<aside class="sidebar">

  <div class="sidebar-inner">

    <div class="sidebar-label">MAIN</div>

    ${navigationItems()}

  </div>

</aside>


<main class="main">

  <div class="page">

    <section class="dashboard-hero">

      <div class="module-header">

        <div class="module-title">

          <h1>Good day, ${escapeHTML(user.name || "Admin")}</h1>

          <p>Manage your business from one place.</p>

          <div class="report-as-on">
            Report as on :
            <strong>${formatIndianDate(new Date())}</strong>
            &nbsp; · &nbsp; All Branches
          </div>

        </div>

        <div class="module-actions">

          <button class="btn btn-primary"
            id="quickAddButton"
            type="button">

            <i data-lucide="plus"></i>
            <span>Quick Add</span>

          </button>

        </div>

      </div>

    </section>


    <!-- CLIENT TOTAL -->

    <section class="dashboard-summary-one">

      <div class="summary-card dashboard-client-card">

        <div>

          <div class="summary-label">Total Clients</div>

          <div class="summary-value"
            id="clientTotal">—</div>

          <div class="summary-note">
            Active client records
          </div>

        </div>

        <div class="dashboard-summary-icon">
          <i data-lucide="users-round"></i>
        </div>

      </div>

    </section>


    <!-- CALENDAR + DONUT -->

    <section class="dashboard-data-grid">

      <div class="dashboard-panel">

        <div class="dashboard-panel-head">

          <div>
            <h2 class="dashboard-panel-title">
              Compliance Calendar
            </h2>

            <p class="dashboard-panel-sub">
              Due dates marked on the calendar
            </p>
          </div>

          <button class="dashboard-small-button"
            id="refreshDashboard"
            type="button"
            title="Refresh">

            <i data-lucide="refresh-cw"></i>

          </button>

        </div>


        <div class="calendar-head">

          <strong id="calendarMonth"></strong>

          <div class="calendar-nav">

            <button class="calendar-button"
              id="calendarPrev"
              type="button">

              <i data-lucide="chevron-left"></i>

            </button>

            <button class="calendar-button"
              id="calendarToday"
              type="button">

              <i data-lucide="circle-dot"></i>

            </button>

            <button class="calendar-button"
              id="calendarNext"
              type="button">

              <i data-lucide="chevron-right"></i>

            </button>

          </div>

        </div>


        <div class="calendar-week">
          <span>SU</span><span>MO</span><span>TU</span>
          <span>WE</span><span>TH</span><span>FR</span><span>SA</span>
        </div>

        <div id="calendarDays" class="calendar-days"></div>

        <div id="calendarDueNote" class="calendar-note">
          Select a marked date to view due compliance.
        </div>

      </div>


      <div class="dashboard-panel">

        <div class="dashboard-panel-head">

          <div>
            <h2 class="dashboard-panel-title">
              Compliance
            </h2>

            <p class="dashboard-panel-sub">
              Pending and completed
            </p>
          </div>

        </div>


        <div class="donut-area">

          <div class="compliance-donut"
            id="complianceDonut">

            <div class="donut-center">

              <div class="donut-number"
                id="complianceTotal">—</div>

              <div class="donut-text">
                Total
              </div>

            </div>

          </div>


          <div class="donut-legend">

            <div class="legend-row">
              <span class="legend-dot pending"></span>
              <span>Pending</span>
              <strong id="pendingCount">—</strong>
            </div>

            <div class="legend-row">
              <span class="legend-dot completed"></span>
              <span>Completed</span>
              <strong id="completedCount">—</strong>
            </div>

          </div>

        </div>

      </div>

    </section>


    <!-- RECENT COMPLIANCE -->

    <section class="dashboard-panel dashboard-recent-panel">

      <div class="dashboard-panel-head">

        <div>
          <h2 class="dashboard-panel-title">
            Recent Compliance
          </h2>

          <p class="dashboard-panel-sub">
            Latest client compliance work
          </p>
        </div>

        <button class="dashboard-small-button"
          id="openCompliance"
          type="button"
          title="View Compliance">

          <i data-lucide="arrow-up-right"></i>

        </button>

      </div>


      <div id="recentCompliance"
        class="recent-compliance-list">

        <div class="dashboard-empty">
          Loading compliance...
        </div>

      </div>

    </section>


    <!-- EXISTING MODULES -->

    <section class="dashboard-grid dashboard-modules">

      ${moduleCards()}

    </section>

  </div>

</main>


<nav class="bottom-nav">

  <div class="bottom-nav-inner">

    <a class="bottom-item active" href="index.html">
      <i data-lucide="house"></i>
      <span>HOME</span>
    </a>

    <a class="bottom-item"
      href="modules/crm/crm.html">
      <i data-lucide="users-round"></i>
      <span>CRM</span>
    </a>

    <a class="bottom-item"
      href="modules/accounts/accounts.html">
      <i data-lucide="wallet"></i>
      <span>ACCOUNTS</span>
    </a>

    <a class="bottom-item"
      href="modules/settings/settings.html">
      <i data-lucide="settings-2"></i>
      <span>SETTINGS</span>
    </a>

  </div>

</nav>


<div id="profileModal"
  class="dashboard-modal">

  <div class="dashboard-modal-card">

    <div class="dashboard-modal-name">
      ${escapeHTML(user.name || "Admin")}
    </div>

    <div class="dashboard-modal-email">
      ${escapeHTML(firebaseUser.email || "")}
    </div>

    <div class="dashboard-modal-row">
      <strong>Role:</strong> Administrator
    </div>

    <div class="dashboard-modal-row">
      <strong>Branch:</strong> All Branches
    </div>

    <div class="dashboard-modal-actions">

      <button class="btn btn-secondary"
        id="closeProfile">
        Close
      </button>

      <button class="btn btn-primary"
        id="logoutButton">
        Sign Out
      </button>

    </div>

  </div>

</div>

`;

  window.lucide?.createIcons();
  initNavigation();
  setupDashboardEvents();

}


// ==========================================================
// DATA
// ==========================================================

async function loadDashboardData(){

  setDashboardLoading(true);

  try{

    const clientsCountSnap =
      await getCountFromServer(
        collection(db,"clients")
      );

    const complianceCountSnap =
      await getCountFromServer(
        collection(db,"compliances")
      );

    const completedCountSnap =
      await getCountFromServer(
        query(
          collection(db,"compliances"),
          where("status","==","Completed")
        )
      );

    dashboardState.clientsTotal =
      clientsCountSnap.data().count;

    dashboardState.complianceTotal =
      complianceCountSnap.data().count;

    dashboardState.completedTotal =
      completedCountSnap.data().count;

    /*
     * Only download current calendar-month compliance
     * records instead of every compliance record.
     */
    await loadCalendarRecords();

    /*
     * Recent records are bounded to 8.
     */
    const recentSnap =
      await getDocs(
        query(
          collection(db,"compliances"),
          orderBy("createdAt","desc"),
          limit(8)
        )
      );

    dashboardState.recentRecords =
      recentSnap.docs.map(d => ({
        id:d.id,
        ...d.data()
      }));

    renderDashboardStats();
    renderCalendar();
    renderRecentCompliance();

  }catch(error){

    console.error("Dashboard data load:",error);

    setDashboardError(
      "Unable to load dashboard data."
    );

  }finally{

    setDashboardLoading(false);

  }

}


async function loadCalendarRecords(){

  const start =
    new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth(),
      1
    );

  const end =
    new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth()+1,
      1
    );

  const startISO = toISODate(start);
  const endISO = toISODate(end);

  try{

    const snap =
      await getDocs(
        query(
          collection(db,"compliances"),
          where("dueDate",">=",startISO),
          where("dueDate","<",endISO)
        )
      );

    dashboardState.calendarRecords =
      snap.docs.map(d => ({
        id:d.id,
        ...d.data()
      }));

  }catch(error){

    /*
     * Fallback if an index/query mismatch exists.
     * This remains bounded to 500 records.
     */
    console.warn("Calendar range query fallback:",error);

    const snap =
      await getDocs(
        query(
          collection(db,"compliances"),
          limit(500)
        )
      );

    dashboardState.calendarRecords =
      snap.docs.map(d => ({
        id:d.id,
        ...d.data()
      })).filter(d => {

        const due =
          String(d.dueDate || "").slice(0,10);

        return due >= startISO && due < endISO;

      });

  }

}


function renderDashboardStats(){

  const total =
    dashboardState.complianceTotal;

  const completed =
    dashboardState.completedTotal;

  const pending =
    Math.max(0,total-completed);

  document.getElementById("clientTotal").textContent =
    dashboardState.clientsTotal;

  document.getElementById("complianceTotal").textContent =
    total;

  document.getElementById("pendingCount").textContent =
    pending;

  document.getElementById("completedCount").textContent =
    completed;

  const donut =
    document.getElementById("complianceDonut");

  const completedDegrees =
    total
      ? Math.round((completed/total)*360)
      : 0;

  donut.style.background =
    `conic-gradient(
      #0b3b66 0deg ${completedDegrees}deg,
      #e5eaee ${completedDegrees}deg 360deg
    )`;

}


function setDashboardLoading(isLoading){

  if(!isLoading)return;

  document.getElementById("clientTotal").textContent="…";
  document.getElementById("complianceTotal").textContent="…";
  document.getElementById("pendingCount").textContent="…";
  document.getElementById("completedCount").textContent="…";

}


function setDashboardError(message){

  document.getElementById("recentCompliance").innerHTML =
    `<div class="dashboard-empty">${escapeHTML(message)}</div>`;

}


// ==========================================================
// CALENDAR
// ==========================================================

function renderCalendar(){

  const year =
    calendarDate.getFullYear();

  const month =
    calendarDate.getMonth();

  document.getElementById("calendarMonth").textContent =
    new Intl.DateTimeFormat("en-IN",{
      month:"long",
      year:"numeric"
    }).format(calendarDate);

  const firstDay =
    new Date(year,month,1).getDay();

  const daysInMonth =
    new Date(year,month+1,0).getDate();

  const previousDays =
    new Date(year,month,0).getDate();

  const today =
    toISODate(new Date());

  const dueDates =
    new Set(
      dashboardState.calendarRecords
        .map(x => String(x.dueDate || "").slice(0,10))
    );

  let html="";

  for(let i=0;i<42;i++){

    const position =
      i-firstDay+1;

    let date;
    let dayNumber;
    let current=true;

    if(position<1){
      dayNumber=previousDays+position;
      date=new Date(year,month-1,dayNumber);
      current=false;
    }else if(position>daysInMonth){
      dayNumber=position-daysInMonth;
      date=new Date(year,month+1,dayNumber);
      current=false;
    }else{
      dayNumber=position;
      date=new Date(year,month,dayNumber);
    }

    const iso=toISODate(date);
    const hasDue=dueDates.has(iso);

    html+=`
      <button
        type="button"
        class="calendar-day
          ${current?"":"muted"}
          ${iso===today?"today":""}
          ${hasDue?"has-due":""}"
        data-date="${iso}">
        <span>${dayNumber}</span>
      </button>
    `;

  }

  document.getElementById("calendarDays").innerHTML=html;

  document
    .querySelectorAll(".calendar-day")
    .forEach(button => {

      button.addEventListener("click",() => {

        showCalendarDate(
          button.dataset.date
        );

      });

    });

}


function showCalendarDate(iso){

  const records =
    dashboardState.calendarRecords.filter(x =>
      String(x.dueDate || "").slice(0,10)===iso
    );

  const note =
    document.getElementById("calendarDueNote");

  if(!records.length){

    note.textContent =
      `${formatDisplayDate(iso)} · No compliance due.`;

    return;

  }

  const names =
    records.slice(0,3).map(x =>
      `${x.taskTitle || "Compliance"} · ${x.clientName || x.clientId || ""}`
    );

  note.innerHTML =
    `<strong>${formatDisplayDate(iso)}</strong> · `+
    `${records.length} due · `+
    `${escapeHTML(names.join(" · "))}`+
    (records.length>3 ? " · More" : "");

}


// ==========================================================
// RECENT
// ==========================================================

function renderRecentCompliance(){

  const container =
    document.getElementById("recentCompliance");

  const rows =
    dashboardState.recentRecords;

  if(!rows.length){

    container.innerHTML =
      `<div class="dashboard-empty">
        No compliance records found.
      </div>`;

    return;

  }

  container.innerHTML =
    rows.map(row=>`

      <div class="recent-compliance-item">

        <div class="recent-compliance-main">

          <div class="recent-compliance-title">
            ${escapeHTML(row.taskTitle || "Compliance")}
          </div>

          <div class="recent-compliance-sub">
            ${escapeHTML(row.clientName || row.clientId || "Client")}
            ·
            ${escapeHTML(row.complianceID || row.id || "")}
          </div>

        </div>

        <div class="recent-compliance-meta">

          <span class="recent-status">
            ${escapeHTML(row.status || "Pending")}
          </span>

          <span class="recent-due">
            Due ${escapeHTML(formatDisplayDate(row.dueDate))}
          </span>

        </div>

      </div>

    `).join("");

}


async function refreshCalendar(){

  await loadCalendarRecords();
  renderCalendar();

}


// ==========================================================
// EVENTS
// ==========================================================

function setupDashboardEvents(){

  document.getElementById("calendarPrev")
    ?.addEventListener("click",async()=>{

      calendarDate =
        new Date(
          calendarDate.getFullYear(),
          calendarDate.getMonth()-1,
          1
        );

      await refreshCalendar();

    });

  document.getElementById("calendarNext")
    ?.addEventListener("click",async()=>{

      calendarDate =
        new Date(
          calendarDate.getFullYear(),
          calendarDate.getMonth()+1,
          1
        );

      await refreshCalendar();

    });

  document.getElementById("calendarToday")
    ?.addEventListener("click",async()=>{

      calendarDate=new Date();

      await refreshCalendar();

    });

  document.getElementById("refreshDashboard")
    ?.addEventListener("click",loadDashboardData);

  document.getElementById("openCompliance")
    ?.addEventListener("click",()=>{
      location.href="modules/crm/forms/compliance.html";
    });

  document.getElementById("dashboardSearch")
    ?.addEventListener("click",()=>{
      location.href="modules/crm/forms/compliance.html";
    });

  document.getElementById("quickAddButton")
    ?.addEventListener("click",()=>{
      location.href="modules/crm/forms/clients.html";
    });

  document.getElementById("profileButton")
    ?.addEventListener("click",()=>{
      document.getElementById("profileModal").style.display="flex";
    });

  document.getElementById("closeProfile")
    ?.addEventListener("click",()=>{
      document.getElementById("profileModal").style.display="none";
    });

  document.getElementById("logoutButton")
    ?.addEventListener("click",async()=>{
      await auth.signOut();
      location.replace("auth/login.html");
    });

}


// ==========================================================
// NAVIGATION / MODULES
// ==========================================================

function navigationItems(){

  const modules=[
    ["index.html","HOME","house"],
    ["modules/company/company.html","COMPANY","building-2"],
    ["modules/crm/crm.html","CRM","users-round"],
    ["modules/accounts/accounts.html","ACCOUNTS","wallet"],
    ["modules/projects/projects.html","PROJECTS","folder-kanban"],
    ["modules/employees/employees.html","EMPLOYEES","briefcase-business"],
    ["modules/data/data.html","DATA","database"],
    ["modules/tax-compliance/tax-compliance.html","TAX COMPLIANCE","file-check-2"],
    ["modules/settings/settings.html","SETTINGS","settings-2"],
    ["modules/users/users.html","USERS","user-round-cog"],
    ["modules/sign/sign.html","SIGN","pen-line"]
  ];

  return modules.map((m,i)=>`

    <a
      class="nav-item ${i===0?"active":""}"
      href="${m[0]}">

      <i data-lucide="${m[2]}"></i>
      ${m[1]}

    </a>

  `).join("");

}


function moduleCards(){

  const modules=[
    ["company","Company","Company master and business information","building-2"],
    ["crm","CRM","Clients, compliance and credentials","users-round"],
    ["accounts","Accounts","Ledgers, vouchers and transactions","wallet"],
    ["projects","Projects","Projects, tasks and reports","folder-kanban"],
    ["employees","Employees","Employees and HR information","briefcase-business"],
    ["data","Data","Business documents and data","database"],
    ["tax-compliance","Tax Compliance","GST, income tax and TDS","file-check-2"],
    ["settings","Settings","Business configuration","settings-2"],
    ["users","Users","Users and permissions","user-round-cog"],
    ["sign","Sign","Digital documents and signatures","pen-line"]
  ];

  return modules.map(m=>`

    <a
      class="module-card"
      href="modules/${m[0]}/${m[0]}.html">

      <div class="module-card-icon">
        <i data-lucide="${m[3]}"></i>
      </div>

      <h3>${m[1]}</h3>
      <p>${m[2]}</p>

    </a>

  `).join("");

}


// ==========================================================
// HELPERS
// ==========================================================

function toISODate(date){

  const d=new Date(date);

  return d.getFullYear()+
    "-"+
    String(d.getMonth()+1).padStart(2,"0")+
    "-"+
    String(d.getDate()).padStart(2,"0");

}


function formatDisplayDate(value){

  if(!value)return "—";

  const s=String(value).slice(0,10);
  const parts=s.split("-");

  if(parts.length===3)
    return `${parts[2]}/${parts[1]}/${parts[0]}`;

  return s;

}


function getInitials(value){

  return String(value||"")
    .trim()
    .split(/\s+/)
    .slice(0,2)
    .map(x=>x.charAt(0))
    .join("")
    .toUpperCase();

}


function escapeHTML(value){

  return String(value??"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

}
