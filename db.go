package db

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB

func InitDB() {
	var err error
	// Update connection string based on your local MySQL setup
	// Format: username:password@tcp(127.0.0.1:3306)/dbname
	dsn := "root:@tcp(127.0.0.1:3306)/cms"
	
	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Error connecting to the database: ", err)
	}

	err = DB.Ping()
	if err != nil {
		log.Fatal("Database is not reachable: ", err)
	}

	fmt.Println("Successfully connected to the database!")
}
