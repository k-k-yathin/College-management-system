package models

type User struct {
	ID        string `json:"id"`
	Role      string `json:"role"`
	Password  string `json:"password"`
	CreatedAt int64  `json:"createdAt"`
	CreatedBy string `json:"createdBy"`
}

type Course struct {
	ID       string `json:"id"`
	Code     string `json:"code"`
	Name     string `json:"name"`
	Semester int    `json:"semester"`
	Credits  int    `json:"credits"`
}

type FacultyAssignment struct {
	CourseID  string `json:"courseId"`
	FacultyID string `json:"facultyId"`
}

type Enrollment struct {
	StudentID string `json:"studentId"`
	CourseID  string `json:"courseId"`
	Semester  int    `json:"semester"`
}

type Timetable struct {
	ID        string `json:"id"`
	CourseID  string `json:"courseId"`
	Day       int    `json:"day"`
	StartTime string `json:"startTime"`
	EndTime   string `json:"endTime"`
	Room      string `json:"room"`
}

type Attendance struct {
	ID       string `json:"id"`
	CourseID string `json:"courseId"`
	DateISO  string `json:"dateISO"`
	TakenBy  string `json:"takenBy"`
}

type AttendanceRecord struct {
	AttendanceID string `json:"attendanceId"`
	StudentID    string `json:"studentId"`
}

type Assessment struct {
	ID       string `json:"id"`
	CourseID string `json:"courseId"`
	Name     string `json:"name"`
	MaxScore int    `json:"maxScore"`
}

type AssessmentScore struct {
	AssessmentID string `json:"assessmentId"`
	StudentID    string `json:"studentId"`
	Score        int    `json:"score"`
}

type FinalGrade struct {
	CourseID  string `json:"courseId"`
	StudentID string `json:"studentId"`
	Grade     string `json:"grade"`
}

type Notice struct {
	ID            string `json:"id"`
	Scope         string `json:"scope"`
	CourseID      string `json:"courseId"`
	Title         string `json:"title"`
	Body          string `json:"body"`
	CreatedAt     int64  `json:"createdAt"`
	CreatedByRole string `json:"createdByRole"`
	CreatedByID   string `json:"createdById"`
}

type Setting struct {
	SettingKey   string `json:"settingKey"`
	SettingValue string `json:"settingValue"`
}

type Fee struct {
	ID          string  `json:"id"`
	Amount      float64 `json:"amount"`
	DueDateISO  string  `json:"dueDateISO"`
	Description string  `json:"description"`
	CreatedAt   int64   `json:"createdAt"`
}

type Payment struct {
	FeeID     string `json:"feeId"`
	StudentID string `json:"studentId"`
	PaidAt    int64  `json:"paidAt"`
}
