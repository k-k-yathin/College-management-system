CREATE DATABASE IF NOT EXISTS cms;
USE cms;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    role VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at BIGINT NOT NULL,
    created_by VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    semester INT NOT NULL,
    credits INT NOT NULL
);

CREATE TABLE IF NOT EXISTS faculty_assignments (
    course_id VARCHAR(50) PRIMARY KEY,
    faculty_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS enrollments (
    student_id VARCHAR(50) NOT NULL,
    course_id VARCHAR(50) NOT NULL,
    semester INT NOT NULL,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS timetable (
    id VARCHAR(50) PRIMARY KEY,
    course_id VARCHAR(50) NOT NULL,
    day INT NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    room VARCHAR(50) NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(50) PRIMARY KEY,
    course_id VARCHAR(50) NOT NULL,
    date_iso VARCHAR(20) NOT NULL,
    taken_by VARCHAR(50) NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance_records (
    attendance_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    PRIMARY KEY (attendance_id, student_id),
    FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assessments (
    id VARCHAR(50) PRIMARY KEY,
    course_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    max_score INT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assessment_scores (
    assessment_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    score INT NOT NULL,
    PRIMARY KEY (assessment_id, student_id),
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS final_grades (
    course_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    grade VARCHAR(5) NOT NULL,
    PRIMARY KEY (course_id, student_id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notices (
    id VARCHAR(50) PRIMARY KEY,
    scope VARCHAR(20) NOT NULL,
    course_id VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    created_at BIGINT NOT NULL,
    created_by_role VARCHAR(20) NOT NULL,
    created_by_id VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS fees (
    id VARCHAR(50) PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    due_date_iso VARCHAR(20) NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    fee_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    paid_at BIGINT NOT NULL,
    PRIMARY KEY (fee_id, student_id),
    FOREIGN KEY (fee_id) REFERENCES fees(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (id, role, password, created_at, created_by) VALUES ('admin', 'admin', 'admin123', UNIX_TIMESTAMP() * 1000, 'system') ON DUPLICATE KEY UPDATE id=id;
