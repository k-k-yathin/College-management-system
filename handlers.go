package handlers

import (
	"cms/db"
	"cms/models"
	"database/sql"
	"encoding/json"
	"net/http"
	"io"
	"fmt"
)

func SyncGet(w http.ResponseWriter, r *http.Request) {
	key := r.URL.Query().Get("key")
	var data interface{}

	switch key {
	case "cms.users.student", "cms.users.faculty":
		role := "student"
		if key == "cms.users.faculty" { role = "faculty" }
		rows, _ := db.DB.Query("SELECT id, password, created_at, created_by FROM users WHERE role = ?", role)
		defer rows.Close()
		usersMap := make(map[string]interface{})
		for rows.Next() {
			var id, pass, createdBy string
			var createdAt int64
			rows.Scan(&id, &pass, &createdAt, &createdBy)
			usersMap[id] = map[string]interface{}{
				"password": pass, "createdAt": createdAt, "createdBy": createdBy,
			}
		}
		data = usersMap

	case "cms.data.courses":
		rows, _ := db.DB.Query("SELECT id, code, name, semester, credits FROM courses")
		defer rows.Close()
		var courses []models.Course
		for rows.Next() {
			var c models.Course
			rows.Scan(&c.ID, &c.Code, &c.Name, &c.Semester, &c.Credits)
			courses = append(courses, c)
		}
		if courses == nil { courses = make([]models.Course, 0) }
		data = courses

	case "cms.data.facultyAssignments":
		rows, _ := db.DB.Query("SELECT course_id, faculty_id FROM faculty_assignments")
		defer rows.Close()
		assn := make(map[string]string)
		for rows.Next() {
			var cid, fid string
			rows.Scan(&cid, &fid)
			assn[cid] = fid
		}
		data = assn

	case "cms.data.enrollments":
		rows, _ := db.DB.Query("SELECT student_id, course_id, semester FROM enrollments")
		defer rows.Close()
		type Enroll struct {
			Semester  int      `json:"semester"`
			CourseIDs []string `json:"courseIds"`
		}
		enMap := make(map[string]*Enroll)
		for rows.Next() {
			var sid, cid string
			var sem int
			rows.Scan(&sid, &cid, &sem)
			if _, ok := enMap[sid]; !ok {
				enMap[sid] = &Enroll{Semester: sem, CourseIDs: []string{}}
			}
			enMap[sid].CourseIDs = append(enMap[sid].CourseIDs, cid)
		}
		data = enMap

	case "cms.data.timetable":
		rows, _ := db.DB.Query("SELECT id, course_id, day, start_time, end_time, room FROM timetable")
		defer rows.Close()
		var tt []models.Timetable
		for rows.Next() {
			var t models.Timetable
			rows.Scan(&t.ID, &t.CourseID, &t.Day, &t.StartTime, &t.EndTime, &t.Room)
			tt = append(tt, t)
		}
		if tt == nil { tt = make([]models.Timetable, 0) }
		data = tt

	case "cms.data.attendance":
		rows, _ := db.DB.Query("SELECT id, course_id, date_iso, taken_by FROM attendance")
		defer rows.Close()
		
		type Att struct {
			ID         string   `json:"id"`
			CourseID   string   `json:"courseId"`
			DateISO    string   `json:"dateISO"`
			PresentIDs []string `json:"presentIds"`
			TakenBy    string   `json:"takenBy"`
		}
		var atts []Att
		for rows.Next() {
			var a Att
			rows.Scan(&a.ID, &a.CourseID, &a.DateISO, &a.TakenBy)
			a.PresentIDs = make([]string, 0)
			prows, _ := db.DB.Query("SELECT student_id FROM attendance_records WHERE attendance_id=?", a.ID)
			for prows.Next() {
				var sid string
				prows.Scan(&sid)
				a.PresentIDs = append(a.PresentIDs, sid)
			}
			prows.Close()
			atts = append(atts, a)
		}
		if atts == nil { atts = make([]Att, 0) }
		data = atts

	case "cms.data.assessments":
		rows, _ := db.DB.Query("SELECT id, course_id, name, max_score FROM assessments")
		defer rows.Close()
		
		type Assm struct {
			ID       string         `json:"id"`
			CourseID string         `json:"courseId"`
			Name     string         `json:"name"`
			MaxScore int            `json:"max"`
			Scores   map[string]int `json:"scores"`
		}
		var asms []Assm
		for rows.Next() {
			var a Assm
			a.Scores = make(map[string]int)
			rows.Scan(&a.ID, &a.CourseID, &a.Name, &a.MaxScore)
			
			srows, _ := db.DB.Query("SELECT student_id, score FROM assessment_scores WHERE assessment_id=?", a.ID)
			for srows.Next() {
				var sid string
				var score int
				srows.Scan(&sid, &score)
				a.Scores[sid] = score
			}
			srows.Close()
			asms = append(asms, a)
		}
		if asms == nil { asms = make([]Assm, 0) }
		data = asms

	case "cms.data.finalGrades":
		rows, _ := db.DB.Query("SELECT course_id, student_id, grade FROM final_grades")
		defer rows.Close()
		grades := make(map[string]map[string]string)
		for rows.Next() {
			var cid, sid, grade string
			rows.Scan(&cid, &sid, &grade)
			if grades[cid] == nil {
				grades[cid] = make(map[string]string)
			}
			grades[cid][sid] = grade
		}
		data = grades

	case "cms.data.notices":
		rows, _ := db.DB.Query("SELECT id, scope, course_id, title, body, created_at, created_by_role, created_by_id FROM notices")
		defer rows.Close()
		var nts []models.Notice
		for rows.Next() {
			var n models.Notice
			var cid sql.NullString
			rows.Scan(&n.ID, &n.Scope, &cid, &n.Title, &n.Body, &n.CreatedAt, &n.CreatedByRole, &n.CreatedByID)
			if cid.Valid { n.CourseID = cid.String }
			nts = append(nts, n)
		}
		if nts == nil { nts = make([]models.Notice, 0) }
		data = nts

	case "cms.data.settings":
		rows, _ := db.DB.Query("SELECT setting_key, setting_value FROM settings")
		defer rows.Close()
		s := map[string]string{}
		for rows.Next() {
			var k, v string
			rows.Scan(&k, &v)
			s[k] = v
		}
		data = s

	case "cms.data.fees":
		rows, _ := db.DB.Query("SELECT id, amount, due_date_iso, description, created_at FROM fees")
		defer rows.Close()
		var fees []models.Fee
		for rows.Next() {
			var f models.Fee
			rows.Scan(&f.ID, &f.Amount, &f.DueDateISO, &f.Description, &f.CreatedAt)
			fees = append(fees, f)
		}
		if fees == nil { fees = make([]models.Fee, 0) }
		data = fees

	case "cms.data.payments":
		rows, _ := db.DB.Query("SELECT fee_id, student_id, paid_at FROM payments")
		defer rows.Close()
		var pays []models.Payment
		for rows.Next() {
			var p models.Payment
			rows.Scan(&p.FeeID, &p.StudentID, &p.PaidAt)
			pays = append(pays, p)
		}
		if pays == nil { pays = make([]models.Payment, 0) }
		data = pays

	default:
		data = map[string]interface{}{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func SyncPost(w http.ResponseWriter, r *http.Request) {
	key := r.URL.Query().Get("key")
	body, _ := io.ReadAll(r.Body)

	switch key {
	case "cms.users.student", "cms.users.faculty":
		role := "student"
		if key == "cms.users.faculty" { role = "faculty" }

		var users map[string]struct{
			Password  string `json:"password"`
			CreatedAt int64  `json:"createdAt"`
			CreatedBy string `json:"createdBy"`
		}
		json.Unmarshal(body, &users)

		db.DB.Exec("DELETE FROM users WHERE role=?", role)
		for id, u := range users {
			db.DB.Exec("INSERT INTO users (id, role, password, created_at, created_by) VALUES (?, ?, ?, ?, ?)", id, role, u.Password, u.CreatedAt, u.CreatedBy)
		}

	case "cms.data.courses":
		var courses []models.Course
		json.Unmarshal(body, &courses)
		
		db.DB.Exec("DELETE FROM courses")
		for _, c := range courses {
			db.DB.Exec("INSERT INTO courses (id, code, name, semester, credits) VALUES (?, ?, ?, ?, ?)", c.ID, c.Code, c.Name, c.Semester, c.Credits)
		}

	case "cms.data.facultyAssignments":
		var assn map[string]string
		json.Unmarshal(body, &assn)
		
		db.DB.Exec("DELETE FROM faculty_assignments")
		for cid, fid := range assn {
			db.DB.Exec("INSERT INTO faculty_assignments (course_id, faculty_id) VALUES (?, ?)", cid, fid)
		}

	case "cms.data.enrollments":
		var en map[string]struct{
			Semester int `json:"semester"`
			CourseIds []string `json:"courseIds"`
		}
		json.Unmarshal(body, &en)

		db.DB.Exec("DELETE FROM enrollments")
		for sid, d := range en {
			for _, cid := range d.CourseIds {
				db.DB.Exec("INSERT INTO enrollments (student_id, course_id, semester) VALUES (?, ?, ?)", sid, cid, d.Semester)
			}
		}

	case "cms.data.timetable":
		var tt []models.Timetable
		json.Unmarshal(body, &tt)

		db.DB.Exec("DELETE FROM timetable")
		for _, t := range tt {
			db.DB.Exec("INSERT INTO timetable (id, course_id, day, start_time, end_time, room) VALUES (?, ?, ?, ?, ?, ?)", t.ID, t.CourseID, t.Day, t.StartTime, t.EndTime, t.Room)
		}

	case "cms.data.attendance":
		type Att struct {
			ID         string   `json:"id"`
			CourseID   string   `json:"courseId"`
			DateISO    string   `json:"dateISO"`
			PresentIDs []string `json:"presentIds"`
			TakenBy    string   `json:"takenBy"`
		}
		var atts []Att
		json.Unmarshal(body, &atts)

		db.DB.Exec("DELETE FROM attendance")
		db.DB.Exec("DELETE FROM attendance_records")

		for _, a := range atts {
			db.DB.Exec("INSERT INTO attendance (id, course_id, date_iso, taken_by) VALUES (?, ?, ?, ?)", a.ID, a.CourseID, a.DateISO, a.TakenBy)
			for _, pid := range a.PresentIDs {
				db.DB.Exec("INSERT INTO attendance_records (attendance_id, student_id) VALUES (?, ?)", a.ID, pid)
			}
		}

	case "cms.data.assessments":
		type Assm struct {
			ID       string         `json:"id"`
			CourseID string         `json:"courseId"`
			Name     string         `json:"name"`
			MaxScore int            `json:"max"`
			Scores   map[string]int `json:"scores"`
		}
		var asms []Assm
		json.Unmarshal(body, &asms)

		db.DB.Exec("DELETE FROM assessments")
		db.DB.Exec("DELETE FROM assessment_scores")

		for _, a := range asms {
			db.DB.Exec("INSERT INTO assessments (id, course_id, name, max_score) VALUES (?, ?, ?, ?)", a.ID, a.CourseID, a.Name, a.MaxScore)
			for sid, score := range a.Scores {
				db.DB.Exec("INSERT INTO assessment_scores (assessment_id, student_id, score) VALUES (?, ?, ?)", a.ID, sid, score)
			}
		}

	case "cms.data.finalGrades":
		var grades map[string]map[string]string
		json.Unmarshal(body, &grades)

		db.DB.Exec("DELETE FROM final_grades")
		for cid, m := range grades {
			for sid, g := range m {
				db.DB.Exec("INSERT INTO final_grades (course_id, student_id, grade) VALUES (?, ?, ?)", cid, sid, g)
			}
		}

	case "cms.data.notices":
		var nts []models.Notice
		json.Unmarshal(body, &nts)

		db.DB.Exec("DELETE FROM notices")
		for _, n := range nts {
			var cid interface{}
			if n.CourseID != "" { cid = n.CourseID } else { cid = nil }
			db.DB.Exec("INSERT INTO notices (id, scope, course_id, title, body, created_at, created_by_role, created_by_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", n.ID, n.Scope, cid, n.Title, n.Body, n.CreatedAt, n.CreatedByRole, n.CreatedByID)
		}

	case "cms.data.settings":
		var sett map[string]string
		json.Unmarshal(body, &sett)

		db.DB.Exec("DELETE FROM settings")
		for k, v := range sett {
			db.DB.Exec("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)", k, v)
		}

	case "cms.data.fees":
		var fees []models.Fee
		json.Unmarshal(body, &fees)

		db.DB.Exec("DELETE FROM fees")
		for _, f := range fees {
			db.DB.Exec("INSERT INTO fees (id, amount, due_date_iso, description, created_at) VALUES (?, ?, ?, ?, ?)", f.ID, f.Amount, f.DueDateISO, f.Description, f.CreatedAt)
		}

	case "cms.data.payments":
		var pays []models.Payment
		json.Unmarshal(body, &pays)

		// DO NOT delete fees, just payments.
		db.DB.Exec("DELETE FROM payments")
		for _, p := range pays {
			db.DB.Exec("INSERT INTO payments (fee_id, student_id, paid_at) VALUES (?, ?, ?)", p.FeeID, p.StudentID, p.PaidAt)
		}
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status":"ok"}`)
}
