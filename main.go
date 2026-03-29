package main

import (
	"cms/db"
	"cms/handlers"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	db.InitDB()
	r := mux.NewRouter()
	
	// Data sync endpoints
	r.HandleFunc("/api/data", handlers.SyncGet).Methods("GET")
	r.HandleFunc("/api/data", handlers.SyncPost).Methods("POST")

	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"}, // Allow all origins for dev
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type"},
	})

	handler := c.Handler(r)

	fmt.Println("Server is running on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", handler))
}
