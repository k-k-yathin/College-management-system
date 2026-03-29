(() => {
  const root = document.documentElement;

  const themeToggle = document.getElementById("themeToggle");
  const clockEl = document.getElementById("clock");

  const landingScreen = document.getElementById("landingScreen");
  const loginScreen = document.getElementById("loginScreen");
  const dashboardScreen = document.getElementById("dashboardScreen");
  const backToRolesBtn = document.getElementById("backToRolesBtn");

  const selectedRolePill = document.getElementById("selectedRolePill");
  const roleButtons = Array.from(document.querySelectorAll("[data-select-role]"));
  const roleCards = Array.from(document.querySelectorAll("[data-role-card]"));

  const authMessage = document.getElementById("authMessage");
  const authCard = document.getElementById("authCard");
  const studentFacultyAuth = document.getElementById("studentFacultyAuth");
  const adminAuth = document.getElementById("adminAuth");

  const sfNewBtn = document.getElementById("sfNewBtn");
  const sfExistingBtn = document.getElementById("sfExistingBtn");
  const sfForm = document.getElementById("sfForm");
  const sfUserId = document.getElementById("sfUserId");
  const sfPassword = document.getElementById("sfPassword");
  const sfConfirmField = document.getElementById("sfConfirmField");
  const sfConfirmPassword = document.getElementById("sfConfirmPassword");
  const sfSubmit = document.getElementById("sfSubmit");

  const adminForm = document.getElementById("adminForm");
  const adminPasskey = document.getElementById("adminPasskey");

  const dashboardCard = dashboardScreen;
  const sessionLabel = document.getElementById("sessionLabel");
  const logoutBtn = document.getElementById("logoutBtn");

  const appNav = document.getElementById("appNav");
  const appView = document.getElementById("appView");

  const pad2 = (n) => String(n).padStart(2, "0");
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);

  const renderClock = () => {
    const now = new Date();
    const hh = pad2(now.getHours());
    const mm = pad2(now.getMinutes());
    const ss = pad2(now.getSeconds());
    if (clockEl) clockEl.textContent = `${hh}:${mm}:${ss}`;
  };

  // Storage keys
  const ROLE_KEY = "cms.role";
  const SESSION_KEY = "cms.session";
  const USERS_KEY = {
    student: "cms.users.student",
    faculty: "cms.users.faculty",
  };

  const DATA_KEY = {
    courses: "cms.data.courses",
    facultyAssignments: "cms.data.facultyAssignments", // courseId -> facultyId
    enrollments: "cms.data.enrollments", // studentId -> { semester, courseIds: [] }
    timetable: "cms.data.timetable", // [{id, courseId, day, start, end, room}]
    attendance: "cms.data.attendance", // [{id, courseId, dateISO, presentIds: [], takenBy}]
    assessments: "cms.data.assessments", // [{id, courseId, name, max, scores: {studentId: number}}]
    finalGrades: "cms.data.finalGrades", // courseId -> { studentId: grade }
    notices: "cms.data.notices", // [{id, scope, courseId?, title, body, createdAt, createdByRole, createdById}]
    settings: "cms.data.settings", // { requiredCredits }
    fees: "cms.data.fees", // [{id, amount, dueDateISO, description, createdAt}]
    payments: "cms.data.payments", // [{feeId, studentId, paidAt}]
  };

  const ADMIN_PASSKEY = "admin123";

  const ROLES = {
    student: { label: "Student" },
    faculty: { label: "Faculty" },
    admin: { label: "Administrator" },
  };

  // ---------- storage helpers ----------
  const loadJSON = (key, fallback) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", "http://localhost:8080/api/data?key=" + key, false);
      xhr.send(null);
      if (xhr.status === 200) {
        return JSON.parse(xhr.responseText);
      }
    } catch (e) {
      console.error(e);
    }
    return fallback;
  };

  const saveJSON = (key, value) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:8080/api/data?key=" + key, false);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify(value));
    } catch (e) {
      console.error(e);
    }
  };

  const getSavedTheme = () => {
    try {
      return localStorage.getItem("theme");
    } catch {
      return null;
    }
  };

  const setSavedTheme = (theme) => {
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // ignore
    }
  };

  const getSavedRole = () => {
    try {
      return localStorage.getItem(ROLE_KEY);
    } catch {
      return null;
    }
  };

  const setSavedRole = (roleId) => {
    try {
      localStorage.setItem(ROLE_KEY, roleId);
    } catch {
      // ignore
    }
  };

  const getSession = () => loadJSON(SESSION_KEY, null);
  const setSession = (session) => saveJSON(SESSION_KEY, session);
  const clearSession = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  };

  // ---------- UI helpers ----------
  const el = (tag, attrs, ...children) => {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === "class") node.className = v;
        else if (k === "dataset") Object.assign(node.dataset, v);
        else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
        else if (v === false || v === null || v === undefined) continue;
        else node.setAttribute(k, String(v));
      }
    }
    for (const child of children.flat()) {
      if (child === null || child === undefined || child === false) continue;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    }
    return node;
  };

  const clear = (node) => {
    if (!node) return;
    node.replaceChildren();
  };

  const setMessage = (variant, text) => {
    if (!authMessage) return;
    if (!text) {
      authMessage.removeAttribute("data-variant");
      authMessage.textContent = "";
      return;
    }
    authMessage.setAttribute("data-variant", variant);
    authMessage.textContent = text;
  };

  const normalizeUserId = (value) => value.trim();

  const loadUsers = (roleId) => {
    const key = USERS_KEY[roleId];
    return key ? loadJSON(key, {}) : {};
  };

  const saveUsers = (roleId, users) => {
    const key = USERS_KEY[roleId];
    if (key) saveJSON(key, users);
  };

  const setSelectedRoleUI = (roleId) => {
    const role = ROLES[roleId] || null;
    for (const card of roleCards) {
      card.setAttribute("data-selected", String(card.getAttribute("data-role-card") === roleId));
    }
    if (selectedRolePill) selectedRolePill.textContent = role ? role.label : "None";
  };

  // ---------- domain data helpers ----------
  const getCourses = () => loadJSON(DATA_KEY.courses, []);
  const setCourses = (courses) => saveJSON(DATA_KEY.courses, courses);

  const getFacultyAssignments = () => loadJSON(DATA_KEY.facultyAssignments, {});
  const setFacultyAssignments = (map) => saveJSON(DATA_KEY.facultyAssignments, map);

  const getEnrollments = () => loadJSON(DATA_KEY.enrollments, {});
  const setEnrollments = (map) => saveJSON(DATA_KEY.enrollments, map);

  const getTimetable = () => loadJSON(DATA_KEY.timetable, []);
  const setTimetable = (slots) => saveJSON(DATA_KEY.timetable, slots);

  const getAttendance = () => loadJSON(DATA_KEY.attendance, []);
  const setAttendance = (rows) => saveJSON(DATA_KEY.attendance, rows);

  const getAssessments = () => loadJSON(DATA_KEY.assessments, []);
  const setAssessments = (rows) => saveJSON(DATA_KEY.assessments, rows);

  const getFinalGrades = () => loadJSON(DATA_KEY.finalGrades, {});
  const setFinalGrades = (map) => saveJSON(DATA_KEY.finalGrades, map);

  const getNotices = () => loadJSON(DATA_KEY.notices, []);
  const setNotices = (rows) => saveJSON(DATA_KEY.notices, rows);

  const getSettings = () => loadJSON(DATA_KEY.settings, { requiredCredits: 120 });
  const setSettings = (s) => saveJSON(DATA_KEY.settings, s);

  const getFees = () => loadJSON(DATA_KEY.fees, []);
  const setFees = (f) => saveJSON(DATA_KEY.fees, f);

  const getPayments = () => loadJSON(DATA_KEY.payments, []);
  const setPayments = (p) => saveJSON(DATA_KEY.payments, p);

  const courseLabel = (course) => `${course.code} • ${course.name} (Sem ${course.semester})`;

  const gradeFromPct = (pct) => {
    if (pct >= 90) return "A+";
    if (pct >= 80) return "A";
    if (pct >= 70) return "B";
    if (pct >= 60) return "C";
    if (pct >= 50) return "D";
    return "F";
  };

  const computeCourseScore = ({ courseId, studentId }) => {
    const finalGrades = getFinalGrades();
    const override = finalGrades?.[courseId]?.[studentId] ?? null;
    const assessments = getAssessments().filter((a) => a.courseId === courseId);
    const totalMax = assessments.reduce((sum, a) => sum + (Number(a.max) || 0), 0);
    const totalGot = assessments.reduce((sum, a) => sum + (Number(a.scores?.[studentId] ?? 0) || 0), 0);
    const pct = totalMax > 0 ? (totalGot / totalMax) * 100 : 0;
    const computed = gradeFromPct(pct);
    return { totalGot, totalMax, pct, grade: override || computed, computedGrade: computed, overrideGrade: override };
  };

  const computeAttendance = ({ courseId, studentId }) => {
    const rows = getAttendance().filter((r) => r.courseId === courseId);
    const total = rows.length;
    const present = rows.filter((r) => (r.presentIds || []).includes(studentId)).length;
    const pct = total > 0 ? (present / total) * 100 : 0;
    return { present, total, pct };
  };

  // ---------- App shell / navigation ----------
  let selectedRole = null;
  let sfMode = "existing"; // "new" | "existing"
  let activeView = null;

  const setSfMode = (mode) => {
    sfMode = mode === "new" ? "new" : "existing";
    if (sfNewBtn) sfNewBtn.setAttribute("aria-pressed", String(sfMode === "new"));
    if (sfExistingBtn) sfExistingBtn.setAttribute("aria-pressed", String(sfMode === "existing"));
    if (sfConfirmField) sfConfirmField.hidden = sfMode !== "new";
    if (sfSubmit) sfSubmit.textContent = sfMode === "new" ? "Create account" : "Log in";
    if (sfPassword) sfPassword.autocomplete = sfMode === "new" ? "new-password" : "current-password";
    if (sfConfirmPassword) sfConfirmPassword.required = sfMode === "new";
  };

  const applyTheme = (theme) => {
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
      themeToggle?.setAttribute("aria-pressed", "true");
      setSavedTheme("light");
      return;
    }
    root.removeAttribute("data-theme");
    themeToggle?.setAttribute("aria-pressed", "false");
    setSavedTheme("dark");
  };

  const toggleTheme = () => {
    const current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
    applyTheme(current === "light" ? "dark" : "light");
  };
  themeToggle?.addEventListener("click", toggleTheme);

  const navForRole = (roleId) => {
    if (roleId === "student") {
      return [
        { id: "home", label: "Home" },
        { id: "register", label: "Register Courses" },
        { id: "timetable", label: "Timetable" },
        { id: "attendance", label: "Attendance" },
        { id: "marks", label: "Marks & Grades" },
        { id: "notices", label: "Notices" },
        { id: "payments", label: "Payments" },
      ];
    }
    if (roleId === "faculty") {
      return [
        { id: "home", label: "Home" },
        { id: "pickCourses", label: "Select Courses" },
        { id: "myCourses", label: "My Courses" },
        { id: "timetable", label: "Timetable" },
        { id: "attendance", label: "Attendance" },
        { id: "marks", label: "Marks & Grades" },
        { id: "notices", label: "Notices" },
      ];
    }
    if (roleId === "admin") {
      return [
        { id: "home", label: "Overview" },
        { id: "users", label: "Users" },
        { id: "courses", label: "Courses" },
        { id: "assign", label: "Assign Faculty" },
        { id: "enroll", label: "Enroll Students" },
        { id: "timetable", label: "Timetable" },
        { id: "notices", label: "Notices" },
        { id: "reports", label: "Reports" },
        { id: "fees", label: "Fees & Payments" },
      ];
    }
    return [];
  };

  const renderNav = (roleId) => {
    if (!appNav) return;
    clear(appNav);
    const items = navForRole(roleId);
    for (const item of items) {
      const btn = el(
        "button",
        {
          class: "nav-item" + (activeView === item.id ? " is-active" : ""),
          type: "button",
          onclick: () => navigate(item.id),
        },
        item.label,
      );
      appNav.appendChild(btn);
    }
  };

  const navigate = (viewId) => {
    const session = getSession();
    if (!session) return;

    if (session.role === "student" && viewId !== "payments") {
      const fees = getFees();
      const pays = getPayments().filter(p => p.studentId === session.userId).map(p => p.feeId);
      const nowISO = todayISO();
      const hasOverdue = fees.some(f => !pays.includes(f.id) && f.dueDateISO < nowISO);
      
      if (hasOverdue) {
        viewId = "payments";
        setMessage("error", "You have overdue payments. Please clear your dues to regain system access.");
      } else {
        setMessage("", "");
      }
    } else {
      setMessage("", "");
    }

    activeView = viewId;
    renderNav(session.role);
    renderView(session, viewId);
  };

  // ---------- view renderers ----------
  const renderEmptyState = (title, subtitle) => {
    return el(
      "section",
      { class: "panel" },
      el("div", { class: "panel-title" }, title),
      el("div", { class: "muted" }, subtitle),
    );
  };

  const renderHomeStudentFaculty = (session) => {
    const roleLabel = ROLES[session.role]?.label ?? session.role;
    const enrollments = getEnrollments()[session.userId];
    const courseIds = enrollments?.courseIds ?? [];
    const courses = getCourses().filter((c) => courseIds.includes(c.id));
    const notices = getNotices()
      .filter((n) => n.scope === "global" || (n.scope === "course" && courseIds.includes(n.courseId)))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 3);

    const settings = getSettings();
    const required = Number(settings.requiredCredits) || 120;
    const earnedCredits = courses.reduce((sum, c) => {
      const score = computeCourseScore({ courseId: c.id, studentId: session.userId });
      const isComplete = Boolean(score.overrideGrade) || score.totalMax > 0;
      const isPass = isComplete && score.grade !== "F";
      return sum + (isPass ? Number(c.credits || 0) : 0);
    }, 0);
    const gradStatus = earnedCredits >= required ? "Eligible" : "Not yet";

    return el(
      "div",
      { class: "stack" },
      el(
        "section",
        { class: "panel" },
        el("div", { class: "panel-title" }, "Overview"),
        el("div", { class: "kpi-grid" }, [
          el("div", { class: "kpi" }, el("div", { class: "kpi-label" }, "Role"), el("div", { class: "kpi-value" }, roleLabel)),
          el("div", { class: "kpi" }, el("div", { class: "kpi-label" }, "User ID"), el("div", { class: "kpi-value" }, session.userId)),
          el("div", { class: "kpi" }, el("div", { class: "kpi-label" }, "Registered courses"), el("div", { class: "kpi-value" }, String(courses.length))),
          el("div", { class: "kpi" }, el("div", { class: "kpi-label" }, "Semester"), el("div", { class: "kpi-value" }, enrollments?.semester ? `Sem ${enrollments.semester}` : "—")),
        ]),
      ),
      session.role === "student"
        ? el(
            "section",
            { class: "panel" },
            el("div", { class: "panel-title" }, "Graduation"),
            el("div", { class: "kpi-grid" }, [
              el("div", { class: "kpi" }, el("div", { class: "kpi-label" }, "Required credits"), el("div", { class: "kpi-value" }, String(required))),
              el("div", { class: "kpi" }, el("div", { class: "kpi-label" }, "Earned credits"), el("div", { class: "kpi-value" }, String(earnedCredits))),
              el("div", { class: "kpi" }, el("div", { class: "kpi-label" }, "Status"), el("div", { class: "kpi-value" }, gradStatus)),
              el("div", { class: "kpi" }, el("div", { class: "kpi-label" }, "Rule"), el("div", { class: "kpi-value" }, "Pass grades only")),
            ]),
            el("div", { class: "muted fineprint" }, "Credits count when a course has marks/grade and is not F."),
          )
        : null,
      el(
        "section",
        { class: "panel" },
        el("div", { class: "panel-title" }, "Quick notices"),
        notices.length
          ? el(
              "div",
              { class: "notice-list" },
              notices.map((n) =>
                el(
                  "article",
                  { class: "notice" },
                  el("div", { class: "notice-title" }, n.title),
                  el("div", { class: "muted notice-meta" }, new Date(n.createdAt).toLocaleString()),
                  el("div", { class: "notice-body" }, n.body),
                ),
              ),
            )
          : el("div", { class: "muted" }, "No notices yet."),
      ),
    );
  };

  const renderHomeAdmin = () => {
    const students = Object.keys(loadUsers("student")).length;
    const faculty = Object.keys(loadUsers("faculty")).length;
    const courses = getCourses().length;
    const notices = getNotices().length;

    const seedDemoData = () => {
      const existing = getCourses();
      if (existing.length) {
        setMessage("info", "Courses already exist. Demo data not added.");
        return;
      }
      const demoCourses = [
        { id: uid(), code: "CS101", name: "Programming Fundamentals", semester: 1, credits: 4 },
        { id: uid(), code: "MA101", name: "Engineering Mathematics", semester: 1, credits: 4 },
        { id: uid(), code: "CS201", name: "Data Structures", semester: 3, credits: 4 },
        { id: uid(), code: "CS301", name: "Database Systems", semester: 5, credits: 4 },
      ];
      setCourses(demoCourses);
      setNotices([
        {
          id: uid(),
          scope: "global",
          title: "Welcome",
          body: "This is demo data. You can add courses, enroll students, and take attendance/marks.",
          createdAt: Date.now(),
          createdByRole: "admin",
          createdById: "admin",
        },
      ]);
      setMessage("success", "Demo data created. Open Courses / Enroll Students next.");
      navigate("courses");
    };

    return el(
      "div",
      { class: "stack" },
      el(
        "section",
        { class: "panel" },
        el("div", { class: "panel-title" }, "Admin overview"),
        el("div", { class: "kpi-grid" }, [
          el("div", { class: "kpi" }, el("div", { class: "kpi-label" }, "Students"), el("div", { class: "kpi-value" }, String(students))),
          el("div", { class: "kpi" }, el("div", { class: "kpi-label" }, "Faculty"), el("div", { class: "kpi-value" }, String(faculty))),
          el("div", { class: "kpi" }, el("div", { class: "kpi-label" }, "Courses"), el("div", { class: "kpi-value" }, String(courses))),
          el("div", { class: "kpi" }, el("div", { class: "kpi-label" }, "Notices"), el("div", { class: "kpi-value" }, String(notices))),
        ]),
        el(
          "div",
          { class: "actions-row" },
          el("button", { class: "btn btn-secondary", type: "button", onclick: seedDemoData }, "Create demo data"),
          el("div", { class: "muted fineprint" }, "Optional: creates sample courses + a notice."),
        ),
      ),
    );
  };

  const renderUsersAdmin = () => {
    const students = loadUsers("student");
    const faculty = loadUsers("faculty");
    const rows = [
      ...Object.keys(students).map((id) => ({ role: "student", userId: id })),
      ...Object.keys(faculty).map((id) => ({ role: "faculty", userId: id })),
    ].sort((a, b) => (a.role + a.userId).localeCompare(b.role + b.userId));

    const roleSelect = el(
      "select",
      { required: true },
      el("option", { value: "student" }, "Student"),
      el("option", { value: "faculty" }, "Faculty"),
    );
    const userIdInput = el("input", { required: true, placeholder: "e.g. s1001" });
    const passInput = el("input", { required: true, type: "password", placeholder: "password" });

    const addUser = (e) => {
      e.preventDefault();
      const role = roleSelect.value;
      const userId = normalizeUserId(userIdInput.value);
      const password = passInput.value;
      if (!userId) return setMessage("error", "User ID required.");
      if (!password || password.length < 4) return setMessage("error", "Password must be at least 4 characters.");
      const users = loadUsers(role);
      if (users[userId]) return setMessage("error", "User already exists.");
      users[userId] = { password, createdAt: Date.now(), createdBy: "admin" };
      saveUsers(role, users);
      userIdInput.value = "";
      passInput.value = "";
      setMessage("success", "User added.");
      navigate("users");
    };

    const removeUser = (role, userId) => {
      const ok = window.confirm(`Remove ${userId} (${role})?`);
      if (!ok) return;
      const users = loadUsers(role);
      delete users[userId];
      saveUsers(role, users);

      // cleanup enrollment/records
      if (role === "student") {
        const enroll = getEnrollments();
        delete enroll[userId];
        setEnrollments(enroll);

        setAttendance(getAttendance().map((r) => ({ ...r, presentIds: (r.presentIds || []).filter((id) => id !== userId) })));
        setAssessments(
          getAssessments().map((a) => {
            const scores = { ...(a.scores || {}) };
            delete scores[userId];
            return { ...a, scores };
          }),
        );
      }

      setMessage("success", "User removed.");
      navigate("users");
    };

    const tableBody =
      rows.length === 0
        ? el("tr", null, el("td", { colSpan: "3", class: "muted" }, "No users yet."))
        : rows.map((r) =>
            el(
              "tr",
              null,
              el("td", null, ROLES[r.role]?.label ?? r.role),
              el("td", null, r.userId),
              el(
                "td",
                { class: "td-right" },
                el("button", { class: "btn btn-danger", type: "button", onclick: () => removeUser(r.role, r.userId) }, "Remove"),
              ),
            ),
          );

    return el(
      "div",
      { class: "stack" },
      el(
        "section",
        { class: "panel" },
        el("div", { class: "panel-title" }, "Add user"),
        el(
          "form",
          { class: "form compact", onsubmit: addUser },
          el("div", { class: "field" }, el("label", null, "Role"), roleSelect),
          el("div", { class: "field" }, el("label", null, "User ID"), userIdInput),
          el("div", { class: "field" }, el("label", null, "Password"), passInput),
          el("div", { class: "form-actions" }, el("button", { class: "btn btn-primary", type: "submit" }, "Add")),
        ),
      ),
      el(
        "section",
        { class: "panel" },
        el("div", { class: "panel-title" }, "Users"),
        el(
          "div",
          { class: "admin-table-wrap" },
          el(
            "table",
            { class: "table" },
            el("thead", null, el("tr", null, el("th", null, "Role"), el("th", null, "User ID"), el("th", { class: "th-right" }, "Action"))),
            el("tbody", null, tableBody),
          ),
        ),
      ),
    );
  };

  const renderCoursesAdmin = () => {
    const courses = getCourses().sort((a, b) => (a.semester - b.semester) || a.code.localeCompare(b.code));

    const codeInput = el("input", { required: true, placeholder: "CS101" });
    const nameInput = el("input", { required: true, placeholder: "Course name" });
    const semInput = el("input", { required: true, type: "number", min: "1", max: "8", value: "1" });
    const credInput = el("input", { required: true, type: "number", min: "1", max: "6", value: "4" });

    const addCourse = (e) => {
      e.preventDefault();
      const code = codeInput.value.trim().toUpperCase();
      const name = nameInput.value.trim();
      const semester = Number(semInput.value);
      const credits = Number(credInput.value);
      if (!code || !name) return setMessage("error", "Course code and name are required.");
      const list = getCourses();
      if (list.some((c) => c.code === code && c.semester === semester)) return setMessage("error", "Course already exists in that semester.");
      list.push({ id: uid(), code, name, semester, credits });
      setCourses(list);
      codeInput.value = "";
      nameInput.value = "";
      setMessage("success", "Course added.");
      navigate("courses");
    };

    const deleteCourse = (courseId) => {
      const ok = window.confirm("Delete this course? This also removes timetable slots, assessments, and assignments.");
      if (!ok) return;
      setCourses(getCourses().filter((c) => c.id !== courseId));
      const assn = getFacultyAssignments();
      delete assn[courseId];
      setFacultyAssignments(assn);
      setTimetable(getTimetable().filter((s) => s.courseId !== courseId));
      setAttendance(getAttendance().filter((a) => a.courseId !== courseId));
      setAssessments(getAssessments().filter((a) => a.courseId !== courseId));
      setNotices(getNotices().filter((n) => !(n.scope === "course" && n.courseId === courseId)));
      const enroll = getEnrollments();
      for (const sid of Object.keys(enroll)) {
        enroll[sid].courseIds = (enroll[sid].courseIds || []).filter((id) => id !== courseId);
      }
      setEnrollments(enroll);
      setMessage("success", "Course deleted.");
      navigate("courses");
    };

    const rows =
      courses.length === 0
        ? el("tr", null, el("td", { colSpan: "5", class: "muted" }, "No courses yet. Add one above."))
        : courses.map((c) =>
            el(
              "tr",
              null,
              el("td", null, `Sem ${c.semester}`),
              el("td", null, c.code),
              el("td", null, c.name),
              el("td", null, String(c.credits)),
              el(
                "td",
                { class: "td-right" },
                el("button", { class: "btn btn-danger", type: "button", onclick: () => deleteCourse(c.id) }, "Delete"),
              ),
            ),
          );

    return el(
      "div",
      { class: "stack" },
      el(
        "section",
        { class: "panel" },
        el("div", { class: "panel-title" }, "Add course"),
        el(
          "form",
          { class: "form compact", onsubmit: addCourse },
          el("div", { class: "field" }, el("label", null, "Course code"), codeInput),
          el("div", { class: "field" }, el("label", null, "Course name"), nameInput),
          el("div", { class: "split" }, [
            el("div", { class: "field" }, el("label", null, "Semester"), semInput),
            el("div", { class: "field" }, el("label", null, "Credits"), credInput),
          ]),
          el("div", { class: "form-actions" }, el("button", { class: "btn btn-primary", type: "submit" }, "Add")),
        ),
      ),
      el(
        "section",
        { class: "panel" },
        el("div", { class: "panel-title" }, "Courses"),
        el(
          "div",
          { class: "admin-table-wrap" },
          el(
            "table",
            { class: "table" },
            el(
              "thead",
              null,
              el("tr", null, el("th", null, "Semester"), el("th", null, "Code"), el("th", null, "Name"), el("th", null, "Credits"), el("th", { class: "th-right" }, "Action")),
            ),
            el("tbody", null, rows),
          ),
        ),
      ),
    );
  };

  const renderAssignFacultyAdmin = () => {
    const courses = getCourses().sort((a, b) => (a.semester - b.semester) || a.code.localeCompare(b.code));
    const facultyUsers = Object.keys(loadUsers("faculty")).sort();
    const assignments = getFacultyAssignments();

    if (courses.length === 0) return renderEmptyState("Assign faculty", "Add courses first.");
    if (facultyUsers.length === 0) return renderEmptyState("Assign faculty", "Add faculty users first.");

    const rows = courses.map((c) => {
      const select = el(
        "select",
        null,
        el("option", { value: "" }, "— Unassigned —"),
        facultyUsers.map((id) => el("option", { value: id, selected: assignments[c.id] === id }, id)),
      );
      select.addEventListener("change", () => {
        const map = getFacultyAssignments();
        if (!select.value) delete map[c.id];
        else map[c.id] = select.value;
        setFacultyAssignments(map);
        setMessage("success", "Saved.");
      });

      return el("tr", null, el("td", null, `Sem ${c.semester}`), el("td", null, c.code), el("td", null, c.name), el("td", null, select));
    });

    return el(
      "div",
      { class: "stack" },
      el(
        "section",
        { class: "panel" },
        el("div", { class: "panel-title" }, "Assign faculty to courses"),
        el(
          "div",
          { class: "admin-table-wrap" },
          el(
            "table",
            { class: "table" },
            el("thead", null, el("tr", null, el("th", null, "Sem"), el("th", null, "Code"), el("th", null, "Course"), el("th", null, "Faculty ID"))),
            el("tbody", null, rows),
          ),
        ),
      ),
    );
  };

  const renderEnrollAdmin = () => {
    const students = Object.keys(loadUsers("student")).sort();
    const courses = getCourses().sort((a, b) => (a.semester - b.semester) || a.code.localeCompare(b.code));
    if (students.length === 0) return renderEmptyState("Enroll students", "Add student users first.");
    if (courses.length === 0) return renderEmptyState("Enroll students", "Add courses first.");

    const studentSelect = el("select", null, students.map((id) => el("option", { value: id }, id)));
    const semesterInput = el("input", { type: "number", min: "1", max: "8", value: "1" });

    const enrollMap = getEnrollments();

    const listWrap = el("div", { class: "stack" });

    const rerenderCoursePick = () => {
      clear(listWrap);
      const studentId = studentSelect.value;
      const semester = Number(semesterInput.value) || 1;

      const available = courses.filter((c) => Number(c.semester) === semester);
      const current = enrollMap[studentId]?.courseIds ?? [];

      if (available.length === 0) {
        listWrap.appendChild(el("div", { class: "muted" }, "No courses in this semester."));
        return;
      }

      const form = el("form", { class: "form compact" });
      const box = el("div", { class: "checklist" });
      const checks = [];
      for (const c of available) {
        const id = `en_${c.id}`;
        const input = el("input", { type: "checkbox", id, checked: current.includes(c.id) });
        checks.push({ courseId: c.id, input });
        box.appendChild(
          el("label", { class: "check-item", for: id }, input, el("span", { class: "check-text" }, courseLabel(c))),
        );
      }
      const submit = el("button", { class: "btn btn-primary", type: "submit" }, "Save enrollment");
      form.append(
        el("div", { class: "muted fineprint" }, `Editing enrollment for ${studentId} (Sem ${semester}).`),
        box,
        el("div", { class: "form-actions" }, submit),
      );
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const selected = checks.filter((c) => c.input.checked).map((c) => c.courseId);
        const map = getEnrollments();
        map[studentId] = { semester, courseIds: selected };
        setEnrollments(map);
        setMessage("success", "Enrollment saved.");
      });
      listWrap.appendChild(form);
    };

    studentSelect.addEventListener("change", rerenderCoursePick);
    semesterInput.addEventListener("change", rerenderCoursePick);
    rerenderCoursePick();

    return el(
      "div",
      { class: "stack" },
      el(
        "section",
        { class: "panel" },
        el("div", { class: "panel-title" }, "Enroll students (semester-wise)"),
        el("div", { class: "split" }, [
          el("div", { class: "field" }, el("label", null, "Student ID"), studentSelect),
          el("div", { class: "field" }, el("label", null, "Semester"), semesterInput),
        ]),
        listWrap,
      ),
    );
  };

  const renderRegisterStudent = (session) => {
    const courses = getCourses();
    if (courses.length === 0) return renderEmptyState("Register courses", "No courses available yet. Ask admin to add courses.");

    const enrollMap = getEnrollments();
    const current = enrollMap[session.userId] ?? { semester: 1, courseIds: [] };
    const semesterInput = el("input", { type: "number", min: "1", max: "8", value: String(current.semester || 1) });

    const listWrap = el("div", { class: "stack" });
    const rerender = () => {
      clear(listWrap);
      const sem = Number(semesterInput.value) || 1;
      const available = courses.filter((c) => Number(c.semester) === sem).sort((a, b) => a.code.localeCompare(b.code));
      if (available.length === 0) {
        listWrap.appendChild(el("div", { class: "muted" }, "No courses found for this semester."));
        return;
      }

      const currentIds = current.semester === sem ? current.courseIds : [];
      const checks = [];
      const box = el("div", { class: "checklist" });
      for (const c of available) {
        const id = `sc_${c.id}`;
        const input = el("input", { type: "checkbox", id, checked: currentIds.includes(c.id) });
        checks.push({ courseId: c.id, input });
        box.appendChild(el("label", { class: "check-item", for: id }, input, el("span", { class: "check-text" }, courseLabel(c))));
      }

      const form = el(
        "form",
        { class: "form compact" },
        el("div", { class: "muted fineprint" }, `Select courses for Sem ${sem}.`),
        box,
        el("div", { class: "form-actions" }, el("button", { class: "btn btn-primary", type: "submit" }, "Save")),
      );
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const selected = checks.filter((x) => x.input.checked).map((x) => x.courseId);
        const map = getEnrollments();
        map[session.userId] = { semester: sem, courseIds: selected };
        setEnrollments(map);
        setMessage("success", "Courses saved.");
        navigate("timetable");
      });
      listWrap.appendChild(form);
    };

    semesterInput.addEventListener("change", rerender);
    rerender();

    return el(
      "div",
      { class: "stack" },
      el(
        "section",
        { class: "panel" },
        el("div", { class: "panel-title" }, "Course registration (semester-wise)"),
        el("div", { class: "field" }, el("label", null, "Semester"), semesterInput),
        listWrap,
      ),
    );
  };

  const renderMyCoursesFaculty = (session) => {
    const assignments = getFacultyAssignments();
    const courses = getCourses().filter((c) => assignments[c.id] === session.userId);
    if (courses.length === 0) return renderEmptyState("My courses", "No courses assigned to you yet. Ask admin to assign courses.");
    return el(
      "section",
      { class: "panel" },
      el("div", { class: "panel-title" }, "My courses"),
      el(
        "div",
        { class: "list" },
        courses
          .sort((a, b) => a.semester - b.semester || a.code.localeCompare(b.code))
          .map((c) => el("div", { class: "list-row" }, el("div", { class: "list-title" }, c.code), el("div", { class: "muted" }, `${c.name} • Sem ${c.semester}`))),
      ),
    );
  };

  const renderPickCoursesFaculty = (session) => {
    const courses = getCourses().sort((a, b) => a.semester - b.semester || a.code.localeCompare(b.code));
    if (courses.length === 0) return renderEmptyState("Select courses", "No courses available yet.");

    const semesterSelect = el(
      "select",
      null,
      Array.from({ length: 8 }).map((_, i) => el("option", { value: String(i + 1) }, `Semester ${i + 1}`)),
    );

    const content = el("div", { class: "stack" });

    const rerender = () => {
      clear(content);
      const sem = Number(semesterSelect.value) || 1;
      const assignments = getFacultyAssignments();

      const inSem = courses.filter((c) => Number(c.semester) === sem);
      if (inSem.length === 0) {
        content.appendChild(el("div", { class: "muted" }, "No courses found in this semester."));
        return;
      }

      const checks = [];
      const box = el("div", { class: "checklist" });

      for (const c of inSem) {
        const assignedTo = assignments[c.id] || null;
        const mine = assignedTo === session.userId;
        const locked = Boolean(assignedTo && !mine);

        const id = `fc_${c.id}`;
        const input = el("input", { type: "checkbox", id, checked: mine, disabled: locked });
        checks.push({ courseId: c.id, input, locked, mine, assignedTo });

        const meta = locked
          ? el("span", { class: "muted fineprint" }, `Assigned to ${assignedTo}`)
          : mine
            ? el("span", { class: "muted fineprint" }, "Selected")
            : el("span", { class: "muted fineprint" }, `${c.credits} credits`);

        box.appendChild(
          el(
            "label",
            { class: "check-item", for: id },
            input,
            el(
              "span",
              { class: "check-text" },
              `${c.code} • ${c.name} `,
              el("span", { class: "muted" }, `(Sem ${c.semester})`),
            ),
            el("span", { style: "margin-left:auto" }, meta),
          ),
        );
      }

      const form = el(
        "form",
        { class: "form compact" },
        el("div", { class: "muted fineprint" }, "Select the courses you teach. Courses already taken by another faculty are locked."),
        box,
        el("div", { class: "form-actions" }, el("button", { class: "btn btn-primary", type: "submit" }, "Save selection")),
      );

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const map = getFacultyAssignments();

        for (const row of checks) {
          if (row.locked) continue;
          const wants = row.input.checked;
          const currentlyMine = map[row.courseId] === session.userId;
          if (wants && !currentlyMine) map[row.courseId] = session.userId;
          if (!wants && currentlyMine) delete map[row.courseId];
        }

        setFacultyAssignments(map);
        setMessage("success", "Course selection saved.");
        navigate("myCourses");
      });

      content.appendChild(form);
    };

    semesterSelect.addEventListener("change", rerender);
    rerender();

    return el(
      "div",
      { class: "stack" },
      el(
        "section",
        { class: "panel" },
        el("div", { class: "panel-title" }, "Select courses"),
        el("div", { class: "field" }, el("label", null, "Semester"), semesterSelect),
        content,
      ),
    );
  };

  const renderTimetable = (session) => {
    const courses = getCourses();
    const slots = getTimetable();
    let courseIds = [];
    if (session.role === "student") {
      const enroll = getEnrollments()[session.userId];
      courseIds = enroll?.courseIds ?? [];
    } else if (session.role === "faculty") {
      const assignments = getFacultyAssignments();
      courseIds = courses.filter((c) => assignments[c.id] === session.userId).map((c) => c.id);
    } else if (session.role === "admin") {
      courseIds = courses.map((c) => c.id);
    }

    const mySlots = slots.filter((s) => courseIds.includes(s.courseId));
    if (session.role !== "admin" && courseIds.length === 0) return renderEmptyState("Timetable", "No courses found for you yet.");

    const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    mySlots.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day) || a.start.localeCompare(b.start));

    if (session.role === "admin") {
      const courseSelect = el(
        "select",
        { required: true },
        courses
          .sort((a, b) => a.semester - b.semester || a.code.localeCompare(b.code))
          .map((c) => el("option", { value: c.id }, courseLabel(c))),
      );
      const daySelect = el(
        "select",
        { required: true },
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => el("option", { value: d }, d)),
      );
      const startInput = el("input", { type: "time", required: true, value: "09:00" });
      const endInput = el("input", { type: "time", required: true, value: "10:00" });
      const roomInput = el("input", { placeholder: "Room (optional)" });

      const addSlot = (e) => {
        e.preventDefault();
        const slot = {
          id: uid(),
          courseId: courseSelect.value,
          day: daySelect.value,
          start: startInput.value,
          end: endInput.value,
          room: roomInput.value.trim(),
        };
        setTimetable([...getTimetable(), slot]);
        setMessage("success", "Timetable slot added.");
        navigate("timetable");
      };

      const deleteSlot = (id) => {
        setTimetable(getTimetable().filter((s) => s.id !== id));
        setMessage("success", "Slot removed.");
        navigate("timetable");
      };

      const rows =
        mySlots.length === 0
          ? el("tr", null, el("td", { colSpan: "5", class: "muted" }, "No timetable slots yet."))
          : mySlots.map((s) => {
              const c = courses.find((x) => x.id === s.courseId);
              return el(
                "tr",
                null,
                el("td", null, s.day),
                el("td", null, `${s.start}–${s.end}`),
                el("td", null, c ? c.code : "—"),
                el("td", null, s.room || "—"),
                el("td", { class: "td-right" }, el("button", { class: "btn btn-danger", type: "button", onclick: () => deleteSlot(s.id) }, "Delete")),
              );
            });

      return el(
        "div",
        { class: "stack" },
        el(
          "section",
          { class: "panel" },
          el("div", { class: "panel-title" }, "Add timetable slot"),
          el(
            "form",
            { class: "form compact", onsubmit: addSlot },
            el("div", { class: "field" }, el("label", null, "Course"), courseSelect),
            el("div", { class: "split" }, [
              el("div", { class: "field" }, el("label", null, "Day"), daySelect),
              el("div", { class: "field" }, el("label", null, "Room"), roomInput),
            ]),
            el("div", { class: "split" }, [
              el("div", { class: "field" }, el("label", null, "Start"), startInput),
              el("div", { class: "field" }, el("label", null, "End"), endInput),
            ]),
            el("div", { class: "form-actions" }, el("button", { class: "btn btn-primary", type: "submit" }, "Add")),
          ),
        ),
        el(
          "section",
          { class: "panel" },
          el("div", { class: "panel-title" }, "Timetable slots"),
          el(
            "div",
            { class: "admin-table-wrap" },
            el(
              "table",
              { class: "table" },
              el("thead", null, el("tr", null, el("th", null, "Day"), el("th", null, "Time"), el("th", null, "Course"), el("th", null, "Room"), el("th", { class: "th-right" }, "Action"))),
              el("tbody", null, rows),
            ),
          ),
        ),
      );
    }

    if (mySlots.length === 0) return renderEmptyState("Timetable", "No timetable slots yet. Admin needs to add timetable slots.");

    const rows = mySlots.map((s) => {
      const c = courses.find((x) => x.id === s.courseId);
      return el(
        "tr",
        null,
        el("td", null, s.day),
        el("td", null, `${s.start}–${s.end}`),
        el("td", null, c ? c.code : "—"),
        el("td", null, c ? c.name : "—"),
        el("td", null, s.room || "—"),
      );
    });

    return el(
      "section",
      { class: "panel" },
      el("div", { class: "panel-title" }, "Timetable"),
      el(
        "div",
        { class: "admin-table-wrap" },
        el(
          "table",
          { class: "table" },
          el("thead", null, el("tr", null, el("th", null, "Day"), el("th", null, "Time"), el("th", null, "Code"), el("th", null, "Course"), el("th", null, "Room"))),
          el("tbody", null, rows),
        ),
      ),
    );
  };

  const renderAttendanceStudent = (session) => {
    const enroll = getEnrollments()[session.userId];
    const courseIds = enroll?.courseIds ?? [];
    if (courseIds.length === 0) return renderEmptyState("Attendance", "Register courses first.");
    const courses = getCourses().filter((c) => courseIds.includes(c.id));

    const rows = courses
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((c) => {
        const a = computeAttendance({ courseId: c.id, studentId: session.userId });
        return el(
          "tr",
          null,
          el("td", null, c.code),
          el("td", null, c.name),
          el("td", null, `${a.present}/${a.total}`),
          el("td", null, `${a.pct.toFixed(1)}%`),
        );
      });

    return el(
      "div",
      { class: "stack" },
      el(
        "section",
        { class: "panel" },
        el("div", { class: "panel-title" }, "Attendance summary"),
        el(
          "div",
          { class: "admin-table-wrap" },
          el(
            "table",
            { class: "table" },
            el("thead", null, el("tr", null, el("th", null, "Code"), el("th", null, "Course"), el("th", null, "Present/Total"), el("th", null, "Percentage"))),
            el("tbody", null, rows),
          ),
        ),
        el("div", { class: "muted fineprint" }, "Faculty records attendance per date."),
      ),
    );
  };

  const renderAttendanceFaculty = (session) => {
    const assignments = getFacultyAssignments();
    const myCourses = getCourses().filter((c) => assignments[c.id] === session.userId);
    if (myCourses.length === 0) return renderEmptyState("Attendance", "No assigned courses. Ask admin to assign you courses.");

    const courseSelect = el("select", null, myCourses.map((c) => el("option", { value: c.id }, courseLabel(c))));
    const dateInput = el("input", { type: "date", value: todayISO() });
    const listWrap = el("div", { class: "stack" });

    const rerender = () => {
      clear(listWrap);
      const courseId = courseSelect.value;
      const enroll = getEnrollments();
      const studentIds = Object.keys(enroll)
        .filter((sid) => (enroll[sid].courseIds || []).includes(courseId))
        .sort();
      if (studentIds.length === 0) {
        listWrap.appendChild(el("div", { class: "muted" }, "No students enrolled in this course."));
        return;
      }

      const existing = getAttendance().find((r) => r.courseId === courseId && r.dateISO === dateInput.value);
      const presentSet = new Set(existing?.presentIds || []);

      const box = el("div", { class: "checklist" });
      const checks = [];
      for (const sid of studentIds) {
        const id = `at_${sid}`;
        const input = el("input", { type: "checkbox", id, checked: presentSet.has(sid) });
        checks.push({ sid, input });
        box.appendChild(el("label", { class: "check-item", for: id }, input, el("span", { class: "check-text" }, sid)));
      }

      const form = el(
        "form",
        { class: "form compact" },
        el("div", { class: "muted fineprint" }, "Tick present students and save."),
        box,
        el("div", { class: "form-actions" }, el("button", { class: "btn btn-primary", type: "submit" }, existing ? "Update" : "Save")),
      );

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const presentIds = checks.filter((c) => c.input.checked).map((c) => c.sid);
        const rows = getAttendance();
        const idx = rows.findIndex((r) => r.courseId === courseId && r.dateISO === dateInput.value);
        const row = { id: existing?.id ?? uid(), courseId, dateISO: dateInput.value, presentIds, takenBy: session.userId };
        if (idx >= 0) rows[idx] = row;
        else rows.push(row);
        setAttendance(rows);
        setMessage("success", "Attendance saved.");
      });

      // history
      const history = getAttendance()
        .filter((r) => r.courseId === courseId)
        .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
        .slice(0, 8);

      const histRows =
        history.length === 0
          ? el("div", { class: "muted" }, "No attendance recorded yet.")
          : el(
              "div",
              { class: "list" },
              history.map((h) =>
                el(
                  "div",
                  { class: "list-row" },
                  el("div", { class: "list-title" }, h.dateISO),
                  el("div", { class: "muted" }, `${(h.presentIds || []).length} present`),
                ),
              ),
            );

      listWrap.append(form, el("div", { class: "divider" }), el("div", { class: "panel-title" }, "Recent records"), histRows);
    };

    courseSelect.addEventListener("change", rerender);
    dateInput.addEventListener("change", rerender);
    rerender();

    return el(
      "div",
      { class: "stack" },
      el(
        "section",
        { class: "panel" },
        el("div", { class: "panel-title" }, "Take attendance"),
        el("div", { class: "split" }, [
          el("div", { class: "field" }, el("label", null, "Course"), courseSelect),
          el("div", { class: "field" }, el("label", null, "Date"), dateInput),
        ]),
        listWrap,
      ),
    );
  };

  const renderMarksStudent = (session) => {
    const enroll = getEnrollments()[session.userId];
    const courseIds = enroll?.courseIds ?? [];
    if (courseIds.length === 0) return renderEmptyState("Marks & grades", "Register courses first.");
    const courses = getCourses().filter((c) => courseIds.includes(c.id));

    const rows = courses
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((c) => {
        const s = computeCourseScore({ courseId: c.id, studentId: session.userId });
        return el(
          "tr",
          null,
          el("td", null, c.code),
          el("td", null, c.name),
          el("td", null, `${s.totalGot}/${s.totalMax}`),
          el("td", null, `${s.pct.toFixed(1)}%`),
          el("td", null, s.overrideGrade ? `${s.grade} (Final)` : s.totalMax > 0 ? s.grade : "—"),
        );
      });

    return el(
      "section",
      { class: "panel" },
      el("div", { class: "panel-title" }, "Marks & grades"),
      el(
        "div",
        { class: "admin-table-wrap" },
        el(
          "table",
          { class: "table" },
          el("thead", null, el("tr", null, el("th", null, "Code"), el("th", null, "Course"), el("th", null, "Total"), el("th", null, "Percent"), el("th", null, "Grade"))),
          el("tbody", null, rows),
        ),
      ),
      el("div", { class: "muted fineprint" }, "Grades are computed from total percentage across assessments."),
    );
  };

  const renderMarksFaculty = (session) => {
    const assignments = getFacultyAssignments();
    const myCourses = getCourses().filter((c) => assignments[c.id] === session.userId);
    if (myCourses.length === 0) return renderEmptyState("Marks & grades", "No assigned courses. Ask admin to assign you courses.");

    const courseSelect = el("select", null, myCourses.map((c) => el("option", { value: c.id }, courseLabel(c))));
    const nameInput = el("input", { required: true, placeholder: "Midterm / Quiz 1 / Assignment" });
    const maxInput = el("input", { required: true, type: "number", min: "1", value: "100" });

    const marksWrap = el("div", { class: "stack" });
    const gradeOptions = ["A+", "A", "B", "C", "D", "F"];

    const rerender = () => {
      clear(marksWrap);
      const courseId = courseSelect.value;
      const enroll = getEnrollments();
      const studentIds = Object.keys(enroll)
        .filter((sid) => (enroll[sid].courseIds || []).includes(courseId))
        .sort();
      if (studentIds.length === 0) {
        marksWrap.appendChild(el("div", { class: "muted" }, "No students enrolled in this course."));
        return;
      }

      const assRows = getAssessments().filter((a) => a.courseId === courseId).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      const createAssessment = (e) => {
        e.preventDefault();
        const name = nameInput.value.trim();
        const max = Number(maxInput.value);
        if (!name) return setMessage("error", "Assessment name required.");
        if (!max || max <= 0) return setMessage("error", "Max marks must be > 0.");
        const a = { id: uid(), courseId, name, max, scores: {}, createdAt: Date.now(), createdBy: session.userId };
        setAssessments([...getAssessments(), a]);
        nameInput.value = "";
        setMessage("success", "Assessment created. Enter marks below.");
        rerender();
      };

      const assessmentList =
        assRows.length === 0
          ? el("div", { class: "muted" }, "No assessments yet. Create one above.")
          : el(
              "div",
              { class: "list" },
              assRows.map((a) =>
                el(
                  "button",
                  {
                    class: "list-row list-btn",
                    type: "button",
                    onclick: () => renderMarksEntry(courseId, a, studentIds),
                  },
                  el("div", { class: "list-title" }, a.name),
                  el("div", { class: "muted" }, `Max ${a.max}`),
                ),
              ),
            );

      const renderMarksEntry = (courseId2, assessment, sids) => {
        const scores = assessment.scores || {};
        const form = el("form", { class: "form compact" });
        const inputs = {};
        const box = el("div", { class: "grid2" });
        for (const sid of sids) {
          const input = el("input", {
            type: "number",
            min: "0",
            max: String(assessment.max),
            value: scores[sid] ?? "",
            placeholder: "—",
          });
          inputs[sid] = input;
          box.append(
            el("div", { class: "field" }, el("label", null, sid), input),
          );
        }
        const saveBtn = el("button", { class: "btn btn-primary", type: "submit" }, "Save marks");
        const delBtn = el("button", { class: "btn btn-danger", type: "button" }, "Delete assessment");
        delBtn.addEventListener("click", () => {
          const ok = window.confirm("Delete this assessment?");
          if (!ok) return;
          setAssessments(getAssessments().filter((a) => a.id !== assessment.id));
          setMessage("success", "Assessment deleted.");
          rerender();
        });

        form.append(
          el("div", { class: "panel-title" }, `Enter marks: ${assessment.name}`),
          el("div", { class: "muted fineprint" }, `Max marks: ${assessment.max}`),
          box,
          el("div", { class: "form-actions" }, saveBtn, delBtn),
        );
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          const nextScores = { ...(assessment.scores || {}) };
          for (const sid of sids) {
            const raw = inputs[sid].value;
            if (raw === "") {
              delete nextScores[sid];
              continue;
            }
            const val = Number(raw);
            if (Number.isNaN(val) || val < 0 || val > Number(assessment.max)) {
              setMessage("error", `Invalid marks for ${sid}. Must be 0–${assessment.max}.`);
              return;
            }
            nextScores[sid] = val;
          }
          const all = getAssessments();
          const idx = all.findIndex((a) => a.id === assessment.id);
          all[idx] = { ...assessment, scores: nextScores };
          setAssessments(all);
          setMessage("success", "Marks saved.");
        });

        marksWrap.appendChild(el("div", { class: "divider" }));
        marksWrap.appendChild(form);
      };

      const finalGrades = getFinalGrades();
      const courseGrades = finalGrades[courseId] || {};
      const gradeForm = el("form", { class: "form compact" });
      const gradeGrid = el("div", { class: "grid2" });
      const gradeSelects = {};

      for (const sid of studentIds) {
        const select = el(
          "select",
          null,
          el("option", { value: "" }, "— Auto —"),
          gradeOptions.map((g) => el("option", { value: g, selected: courseGrades[sid] === g }, g)),
        );
        gradeSelects[sid] = select;
        gradeGrid.append(el("div", { class: "field" }, el("label", null, sid), select));
      }

      gradeForm.append(
        el("div", { class: "panel-title" }, "Final grades (override)"),
        el("div", { class: "muted fineprint" }, "Leave “Auto” to use computed grade from marks."),
        gradeGrid,
        el("div", { class: "form-actions" }, el("button", { class: "btn btn-primary", type: "submit" }, "Save final grades")),
      );

      gradeForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const all = getFinalGrades();
        const next = { ...(all[courseId] || {}) };
        for (const sid of studentIds) {
          const v = gradeSelects[sid].value;
          if (!v) delete next[sid];
          else next[sid] = v;
        }
        all[courseId] = next;
        setFinalGrades(all);
        setMessage("success", "Final grades saved.");
      });

      marksWrap.append(
        el(
          "section",
          { class: "panel" },
          el("div", { class: "panel-title" }, "Create assessment"),
          el(
            "form",
            { class: "form compact", onsubmit: createAssessment },
            el("div", { class: "field" }, el("label", null, "Assessment name"), nameInput),
            el("div", { class: "field" }, el("label", null, "Max marks"), maxInput),
            el("div", { class: "form-actions" }, el("button", { class: "btn btn-primary", type: "submit" }, "Create")),
          ),
        ),
        el("section", { class: "panel" }, el("div", { class: "panel-title" }, "Assessments"), assessmentList),
        el("section", { class: "panel" }, gradeForm),
      );
    };

    courseSelect.addEventListener("change", rerender);
    rerender();

    return el(
      "div",
      { class: "stack" },
      el(
        "section",
        { class: "panel" },
        el("div", { class: "panel-title" }, "Marks & grades"),
        el("div", { class: "field" }, el("label", null, "Course"), courseSelect),
        marksWrap,
      ),
    );
  };

  const renderNotices = (session) => {
    const all = getNotices().sort((a, b) => b.createdAt - a.createdAt);
    const courses = getCourses();

    const canCreateGlobal = session.role === "admin";
    const canCreateCourse = session.role === "faculty";

    let visible = all;
    if (session.role === "student") {
      const enroll = getEnrollments()[session.userId];
      const courseIds = enroll?.courseIds ?? [];
      visible = all.filter((n) => n.scope === "global" || (n.scope === "course" && courseIds.includes(n.courseId)));
    }
    if (session.role === "faculty") {
      const assignments = getFacultyAssignments();
      const myCourseIds = courses.filter((c) => assignments[c.id] === session.userId).map((c) => c.id);
      visible = all.filter((n) => n.scope === "global" || (n.scope === "course" && myCourseIds.includes(n.courseId)));
    }

    const list =
      visible.length === 0
        ? el("div", { class: "muted" }, "No notices yet.")
        : el(
            "div",
            { class: "notice-list" },
            visible.map((n) => {
              const scope =
                n.scope === "global"
                  ? "Global"
                  : `Course: ${(courses.find((c) => c.id === n.courseId)?.code ?? "—")}`;
              const canDelete =
                session.role === "admin" ||
                (session.role === "faculty" && n.createdByRole === "faculty" && n.createdById === session.userId);

              const delBtn = canDelete
                ? el(
                    "button",
                    {
                      class: "btn btn-danger",
                      type: "button",
                      onclick: () => {
                        const ok = window.confirm("Delete this notice?");
                        if (!ok) return;
                        setNotices(getNotices().filter((x) => x.id !== n.id));
                        setMessage("success", "Notice deleted.");
                        navigate("notices");
                      },
                    },
                    "Delete",
                  )
                : null;

              return el(
                "article",
                { class: "notice" },
                el("div", { class: "notice-top" }, [
                  el("div", null, el("div", { class: "notice-title" }, n.title), el("div", { class: "muted notice-meta" }, `${scope} • ${new Date(n.createdAt).toLocaleString()}`)),
                  delBtn,
                ]),
                el("div", { class: "notice-body" }, n.body),
              );
            }),
          );

    const createPanel = (() => {
      if (!canCreateGlobal && !canCreateCourse) return null;

      const scopeSelect = el(
        "select",
        null,
        canCreateGlobal ? el("option", { value: "global" }, "Global notice") : null,
        canCreateCourse ? el("option", { value: "course" }, "Course notice") : null,
      );
      const courseSelect = el(
        "select",
        { hidden: true },
        ...(() => {
          if (session.role !== "faculty") return [];
          const assignments = getFacultyAssignments();
          const myCourses = courses.filter((c) => assignments[c.id] === session.userId);
          if (myCourses.length === 0) return [el("option", { value: "" }, "No assigned courses")];
          return myCourses.map((c) => el("option", { value: c.id }, courseLabel(c)));
        })(),
      );

      const titleInput = el("input", { required: true, placeholder: "Title" });
      const bodyInput = el("textarea", { required: true, rows: "4", placeholder: "Notice details..." });

      const sync = () => {
        const scope = scopeSelect.value;
        courseSelect.hidden = scope !== "course";
      };
      scopeSelect.addEventListener("change", sync);
      sync();

      const submit = (e) => {
        e.preventDefault();
        const scope = scopeSelect.value;
        const title = titleInput.value.trim();
        const body = bodyInput.value.trim();
        const courseId = scope === "course" ? (courseSelect.value || null) : null;
        if (!title || !body) return setMessage("error", "Title and body are required.");
        if (scope === "course" && !courseId) return setMessage("error", "Select a course.");

        const notice = {
          id: uid(),
          scope,
          courseId,
          title,
          body,
          createdAt: Date.now(),
          createdByRole: session.role,
          createdById: session.userId,
        };
        setNotices([notice, ...getNotices()]);
        setMessage("success", "Notice posted.");
        navigate("notices");
      };

      return el(
        "section",
        { class: "panel" },
        el("div", { class: "panel-title" }, "Post a notice"),
        el(
          "form",
          { class: "form compact", onsubmit: submit },
          el("div", { class: "field" }, el("label", null, "Type"), scopeSelect),
          el("div", { class: "field", hidden: false }, el("label", null, "Course"), courseSelect),
          el("div", { class: "field" }, el("label", null, "Title"), titleInput),
          el("div", { class: "field" }, el("label", null, "Body"), bodyInput),
          el("div", { class: "form-actions" }, el("button", { class: "btn btn-primary", type: "submit" }, "Post")),
        ),
      );
    })();

    return el(
      "div",
      { class: "stack" },
      createPanel,
      el("section", { class: "panel" }, el("div", { class: "panel-title" }, "Notices"), list),
    );
  };

  const renderPaymentsStudent = (session) => {
    const fees = getFees().sort((a, b) => a.dueDateISO.localeCompare(b.dueDateISO));
    const myPays = getPayments().filter((p) => p.studentId === session.userId).map((p) => p.feeId);

    const payFee = (feeId) => {
      const pays = getPayments();
      pays.push({ feeId, studentId: session.userId, paidAt: Date.now() });
      setPayments(pays);
      setMessage("success", "Payment successful.");
      navigate("payments");
    };

    const rows =
      fees.length === 0
        ? el("tr", null, el("td", { colSpan: "5", class: "muted" }, "No fees to display."))
        : fees.map((f) => {
            const isPaid = myPays.includes(f.id);
            const isOverdue = !isPaid && f.dueDateISO < todayISO();
            const action = isPaid
              ? el("span", { class: "pill" }, "Paid")
              : el("button", { class: "btn btn-primary", type: "button", onclick: () => payFee(f.id) }, "Pay Now");

            return el(
              "tr",
              { class: isOverdue ? "danger-row" : "" },
              el("td", null, f.description),
              el("td", null, "₹" + f.amount),
              el("td", null, f.dueDateISO),
              el("td", null, isPaid ? "Clear" : isOverdue ? "Overdue" : "Pending"),
              el("td", { class: "td-right" }, action),
            );
          });

    return el(
      "div",
      { class: "stack" },
      el(
        "section",
        { class: "panel" },
        el("div", { class: "panel-title" }, "My Payments & Dues"),
        el(
          "div",
          { class: "admin-table-wrap" },
          el(
            "table",
            { class: "table" },
            el(
              "thead",
              null,
              el(
                "tr",
                null,
                el("th", null, "Description"),
                el("th", null, "Amount"),
                el("th", null, "Due Date"),
                el("th", null, "Status"),
                el("th", { class: "th-right" }, "Action"),
              ),
            ),
            el("tbody", null, rows),
          ),
        ),
      ),
    );
  };

  const renderFeesAdmin = () => {
    const fees = getFees().sort((a, b) => b.createdAt - a.createdAt);

    const amountInput = el("input", { required: true, type: "number", min: "1", placeholder: "100" });
    const dateInput = el("input", { required: true, type: "date" });
    const descInput = el("input", { required: true, placeholder: "Tuition Fee" });

    const createFee = (e) => {
      e.preventDefault();
      const amount = Number(amountInput.value);
      const dueDateISO = dateInput.value;
      const description = descInput.value.trim();

      if (!amount || !dueDateISO || !description) return setMessage("error", "All fields are required.");

      const list = getFees();
      list.push({ id: uid(), amount, dueDateISO, description, createdAt: Date.now() });
      setFees(list);

      amountInput.value = "";
      dateInput.value = "";
      descInput.value = "";

      setMessage("success", "Fee created.");
      navigate("fees");
    };

    const deleteFee = (feeId) => {
      const ok = window.confirm("Delete this fee? Associated payments will also be lost.");
      if (!ok) return;
      setFees(getFees().filter((f) => f.id !== feeId));
      setPayments(getPayments().filter((p) => p.feeId !== feeId));
      setMessage("success", "Fee deleted.");
      navigate("fees");
    };

    const rows =
      fees.length === 0
        ? el("tr", null, el("td", { colSpan: "4", class: "muted" }, "No fees created yet."))
        : fees.map((f) =>
            el(
              "tr",
              null,
              el("td", null, f.description),
              el("td", null, "₹" + f.amount),
              el("td", null, f.dueDateISO),
              el(
                "td",
                { class: "td-right" },
                el("button", { class: "btn btn-danger", type: "button", onclick: () => deleteFee(f.id) }, "Delete"),
              ),
            ),
          );

    return el(
      "div",
      { class: "stack" },
      el(
        "section",
        { class: "panel" },
        el("div", { class: "panel-title" }, "Create new fee"),
        el(
          "form",
          { class: "form compact", onsubmit: createFee },
          el("div", { class: "field" }, el("label", null, "Description"), descInput),
          el("div", { class: "split" }, [
            el("div", { class: "field" }, el("label", null, "Amount (₹)"), amountInput),
            el("div", { class: "field" }, el("label", null, "Due Date"), dateInput),
          ]),
          el("div", { class: "form-actions" }, el("button", { class: "btn btn-primary", type: "submit" }, "Release Fee")),
        ),
      ),
      el(
        "section",
        { class: "panel" },
        el("div", { class: "panel-title" }, "All Fees"),
        el(
          "div",
          { class: "admin-table-wrap" },
          el(
            "table",
            { class: "table" },
            el(
              "thead",
              null,
              el(
                "tr",
                null,
                el("th", null, "Description"),
                el("th", null, "Amount"),
                el("th", null, "Due Date"),
                el("th", { class: "th-right" }, "Action"),
              ),
            ),
            el("tbody", null, rows),
          ),
        ),
      ),
    );
  };

  const renderReportsAdmin = () => {
    const students = Object.keys(loadUsers("student")).length;
    const faculty = Object.keys(loadUsers("faculty")).length;
    const courses = getCourses().length;
    const slots = getTimetable().length;
    const attendance = getAttendance().length;
    const assessments = getAssessments().length;
    const notices = getNotices().length;

    return el(
      "section",
      { class: "panel" },
      el("div", { class: "panel-title" }, "Reports (quick stats)"),
      el("div", { class: "kpi-grid" }, [
        el("div", { class: "kpi" }, el("div", { class: "kpi-label" }, "Students"), el("div", { class: "kpi-value" }, String(students))),
        el("div", { class: "kpi" }, el("div", { class: "kpi-label" }, "Faculty"), el("div", { class: "kpi-value" }, String(faculty))),
        el("div", { class: "kpi" }, el("div", { class: "kpi-label" }, "Courses"), el("div", { class: "kpi-value" }, String(courses))),
        el("div", { class: "kpi" }, el("div", { class: "kpi-label" }, "Timetable slots"), el("div", { class: "kpi-value" }, String(slots))),
        el("div", { class: "kpi" }, el("div", { class: "kpi-label" }, "Attendance records"), el("div", { class: "kpi-value" }, String(attendance))),
        el("div", { class: "kpi" }, el("div", { class: "kpi-label" }, "Assessments"), el("div", { class: "kpi-value" }, String(assessments))),
        el("div", { class: "kpi" }, el("div", { class: "kpi-label" }, "Notices"), el("div", { class: "kpi-value" }, String(notices))),
      ]),
      el("div", { class: "muted fineprint" }, "These are local demo stats."),
    );
  };

  const renderView = (session, viewId) => {
    if (!appView) return;
    clear(appView);

    if (session.role === "student") {
      if (viewId === "home") appView.appendChild(renderHomeStudentFaculty(session));
      else if (viewId === "register") appView.appendChild(renderRegisterStudent(session));
      else if (viewId === "timetable") appView.appendChild(renderTimetable(session));
      else if (viewId === "attendance") appView.appendChild(renderAttendanceStudent(session));
      else if (viewId === "marks") appView.appendChild(renderMarksStudent(session));
      else if (viewId === "notices") appView.appendChild(renderNotices(session));
      else if (viewId === "payments") appView.appendChild(renderPaymentsStudent(session));
      else appView.appendChild(renderEmptyState("Not found", "This section does not exist."));
      return;
    }

    if (session.role === "faculty") {
      if (viewId === "home") appView.appendChild(renderHomeStudentFaculty(session));
      else if (viewId === "pickCourses") appView.appendChild(renderPickCoursesFaculty(session));
      else if (viewId === "myCourses") appView.appendChild(renderMyCoursesFaculty(session));
      else if (viewId === "timetable") appView.appendChild(renderTimetable(session));
      else if (viewId === "attendance") appView.appendChild(renderAttendanceFaculty(session));
      else if (viewId === "marks") appView.appendChild(renderMarksFaculty(session));
      else if (viewId === "notices") appView.appendChild(renderNotices(session));
      else appView.appendChild(renderEmptyState("Not found", "This section does not exist."));
      return;
    }

    if (session.role === "admin") {
      if (viewId === "home") appView.appendChild(renderHomeAdmin());
      else if (viewId === "users") appView.appendChild(renderUsersAdmin());
      else if (viewId === "courses") appView.appendChild(renderCoursesAdmin());
      else if (viewId === "assign") appView.appendChild(renderAssignFacultyAdmin());
      else if (viewId === "enroll") appView.appendChild(renderEnrollAdmin());
      else if (viewId === "timetable") appView.appendChild(renderTimetable(session));
      else if (viewId === "notices") appView.appendChild(renderNotices(session));
      else if (viewId === "reports") appView.appendChild(renderReportsAdmin());
      else if (viewId === "fees") appView.appendChild(renderFeesAdmin());
      else appView.appendChild(renderEmptyState("Not found", "This section does not exist."));
    }
  };

  // ---------- auth flow ----------
  const showAuthForRole = (roleId) => {
    selectedRole = roleId;
    setSavedRole(roleId);
    setSelectedRoleUI(roleId);
    setMessage("", "");

    if (landingScreen) landingScreen.hidden = true;
    if (loginScreen) loginScreen.hidden = false;
    if (dashboardScreen) dashboardScreen.hidden = true;
    if (authCard) authCard.hidden = false;

    if (studentFacultyAuth) studentFacultyAuth.hidden = !(roleId === "student" || roleId === "faculty");
    if (adminAuth) adminAuth.hidden = roleId !== "admin";

    if (roleId === "student" || roleId === "faculty") {
      setSfMode("existing");
      sfUserId?.focus();
    } else if (roleId === "admin") {
      adminPasskey?.focus();
    }
  };

  const showDashboard = (session) => {
    setMessage("", "");
    if (landingScreen) landingScreen.hidden = true;
    if (loginScreen) loginScreen.hidden = true;
    if (dashboardScreen) dashboardScreen.hidden = false;

    if (sessionLabel) {
      const roleLabel = ROLES[session.role]?.label ?? session.role;
      sessionLabel.textContent = session.role === "admin" ? roleLabel : `${roleLabel} • ${session.userId}`;
    }

    activeView = navForRole(session.role)[0]?.id ?? "home";
    renderNav(session.role);
    renderView(session, activeView);
  };

  const selectRole = (roleId) => {
    if (!ROLES[roleId]) return;
    const session = getSession();
    if (session && session.role !== roleId) clearSession();
    showAuthForRole(roleId);
  };

  for (const btn of roleButtons) {
    btn.addEventListener("click", () => {
      const roleId = btn.getAttribute("data-select-role");
      if (roleId) selectRole(roleId);
    });
  }

  sfNewBtn?.addEventListener("click", () => setSfMode("new"));
  sfExistingBtn?.addEventListener("click", () => setSfMode("existing"));

  sfForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!(selectedRole === "student" || selectedRole === "faculty")) return;

    const userId = normalizeUserId(sfUserId?.value ?? "");
    const password = sfPassword?.value ?? "";

    if (!userId) return setMessage("error", "Please enter a User ID.");
    if (userId.length > 40) return setMessage("error", "User ID is too long (max 40 characters).");
    if (!password || password.length < 4) return setMessage("error", "Password must be at least 4 characters.");

    const users = loadUsers(selectedRole);

    if (sfMode === "new") {
      const confirm = sfConfirmPassword?.value ?? "";
      if (password !== confirm) return setMessage("error", "Passwords do not match.");
      if (users[userId]) return setMessage("error", "This User ID already exists. Choose “Already a user”.");
      users[userId] = { password, createdAt: Date.now() };
      saveUsers(selectedRole, users);
      const session = { role: selectedRole, userId, createdAt: Date.now() };
      setSession(session);
      setMessage("success", "Account created. Signed in.");
      showDashboard(session);
      return;
    }

    if (!users[userId]) return setMessage("error", "User not found. Choose “New user” to create an account.");
    if (users[userId].password !== password) return setMessage("error", "Incorrect password.");

    const session = { role: selectedRole, userId, createdAt: Date.now() };
    setSession(session);
    setMessage("success", "Signed in.");
    showDashboard(session);
  });

  adminForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (selectedRole !== "admin") return;
    const key = adminPasskey?.value ?? "";
    if (key !== ADMIN_PASSKEY) return setMessage("error", "Invalid admin passkey.");
    const session = { role: "admin", userId: "admin", createdAt: Date.now() };
    setSession(session);
    showDashboard(session);
  });

  logoutBtn?.addEventListener("click", () => {
    clearSession();
    setMessage("success", "Logged out.");
    setSelectedRoleUI(null);
    if (landingScreen) landingScreen.hidden = false;
    if (loginScreen) loginScreen.hidden = true;
    if (dashboardScreen) dashboardScreen.hidden = true;
  });

  backToRolesBtn?.addEventListener("click", () => {
    setMessage("", "");
    setSelectedRoleUI(null);
    if (landingScreen) landingScreen.hidden = false;
    if (loginScreen) loginScreen.hidden = true;
    if (dashboardScreen) dashboardScreen.hidden = true;
  });

  const seedRandomCoursesIfEmpty = () => {
    const existing = getCourses();
    if (existing.length) return;

    const wordsA = ["Applied", "Fundamentals of", "Principles of", "Introduction to", "Advanced", "Modern"];
    const wordsB = ["Computing", "Mathematics", "Networks", "Databases", "AI", "Software Engineering", "Operating Systems", "Web Development", "Cybersecurity", "Data Science", "Cloud"];
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const makeName = () => `${pick(wordsA)} ${pick(wordsB)}`;

    const courses = [];
    for (let sem = 1; sem <= 8; sem += 1) {
      for (let i = 1; i <= 3; i += 1) {
        courses.push({ id: uid(), code: `S${sem}C${i}3`, name: makeName(), semester: sem, credits: 3 });
      }
      for (let i = 1; i <= 3; i += 1) {
        courses.push({ id: uid(), code: `S${sem}C${i}4`, name: makeName(), semester: sem, credits: 4 });
      }
    }
    setCourses(courses);
  };

  // ---------- boot ----------
  applyTheme(getSavedTheme() || "dark");
  renderClock();
  window.setInterval(renderClock, 1000);

  seedRandomCoursesIfEmpty();

  const bootRole = getSavedRole();
  if (bootRole && ROLES[bootRole]) setSelectedRoleUI(bootRole);

  const bootSession = getSession();
  if (bootSession && ROLES[bootSession.role]) {
    selectedRole = bootSession.role;
    setSelectedRoleUI(bootSession.role);
    showDashboard(bootSession);
  } else {
    if (landingScreen) landingScreen.hidden = false;
    if (loginScreen) loginScreen.hidden = true;
    if (dashboardScreen) dashboardScreen.hidden = true;
  }
})();
