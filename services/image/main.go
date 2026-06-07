package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	_ "image/jpeg"
	_ "image/png"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
	"github.com/valkey-io/valkey-go"
)

type Job struct {
	ID         string `json:"job_id"`
	SourcePath string `json:"source_path"`
	ResultPath string `json:"result_path"`
	Operation  string `json:"operation"`
}

func connectDB() *sql.DB {
	dsn := os.Getenv("DATABASE_URL")
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Panicf("error connecting to database: %v", err)
	}
	if err := db.Ping(); err != nil {
		log.Panicf("error pinging database: %v", err)
	}
	log.Println("connected to database")
	return db
}

func updateJobStatus(db *sql.DB, jobID string, status string, resultPath string) error {
	_, err := db.Exec(
		"UPDATE jobs SET status = $1, result_path = $2, updated_at = NOW() WHERE id = $3",
		status, resultPath, jobID,
	)
	return err
}

func toGreyscale(img image.Image) image.Image {
	bounds := img.Bounds()
	grey := image.NewGray(bounds)
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			grey.Set(x, y, color.GrayModel.Convert(img.At(x, y)))
		}
	}
	return grey
}

func processJob(db *sql.DB, payload string) error {
	var job Job
	if err := json.Unmarshal([]byte(payload), &job); err != nil {
		return fmt.Errorf("error parsing job payload: %w", err)
	}

	log.Printf("processing job %s — operation: %s", job.ID, job.Operation)

	// Mark as processing
	if err := updateJobStatus(db, job.ID, "processing", ""); err != nil {
		return fmt.Errorf("error updating job status: %w", err)
	}

	// TODO: download from MinIO, process, upload result
	// For now just mark as complete to prove the flow works
	if err := updateJobStatus(db, job.ID, "complete", job.ResultPath); err != nil {
		return fmt.Errorf("error marking job complete: %w", err)
	}

	log.Printf("job %s complete", job.ID)
	return nil
}

func main() {
	db := connectDB()
	defer db.Close()

	valkeyHost := os.Getenv("VALKEY_HOST")
	valkeyPort := os.Getenv("VALKEY_PORT")
	valkeyUsername := os.Getenv("VALKEY_USERNAME")
	valkeyPassword := os.Getenv("VALKEY_PASSWORD")

	option := valkey.ClientOption{
		InitAddress: []string{fmt.Sprintf("%s:%s", valkeyHost, valkeyPort)},
		Username:    valkeyUsername,
		Password:    valkeyPassword,
	}

	client, err := valkey.NewClient(option)
	if err != nil {
		log.Panicf("error creating valkey client: %v", err)
	}
	defer client.Close()

	ctx := context.Background()
	log.Println("image worker listening for jobs...")

	for {
		result, err := client.Do(ctx, client.B().Blpop().Key("image:jobs").Timeout(0).Build()).AsStrSlice()
		if err != nil {
			log.Printf("error reading from queue: %v", err)
			time.Sleep(time.Second)
			continue
		}

		jobPayload := result[1]
		log.Printf("received job: %s", jobPayload)

		if err := processJob(db, jobPayload); err != nil {
			log.Printf("error processing job: %v", err)
		}
	}
}
