# Job Importer

This service fetches job listings from multiple RSS/XML job feeds, processes them through a Redis-backed queue, stores normalized jobs into MongoDB, and logs each import run for audit and debugging.

The setup is kept intentionally simple so anyone can clone → run → understand the system quickly.

---

## 🚀 Features

- Fetch job data from **multiple external RSS/XML feeds**
- Normalize and batch raw job data
- Push batches to **Redis Queue (BullMQ)**
- Worker service processes each batch:
  - inserts new jobs
  - updates existing jobs
- Tracks full import metadata:
  - `totalFetched`
  - `totalImported`
  - `newJobs`
  - `updatedJobs`
  - `failedJobs` (with detailed reasons)
- Logs each import run inside `import_logs` collection
- Real-time events published via Redis Pub/Sub → Socket.io
- Fully Dockerized (MongoDB + Redis + API + Worker + Cron)

---


## clone from github -  ##



 

## In frontend ##
run ----*npm install* - for installing dependencies in NextJs --

run --- *npm run dev* -- for running port 

## backend ##

run ---- *npm install* --- for installing dependencies

## keep backend .env file inside inside backend folder ## 


For Running backend server ------> 
## Run With Docker
This runs: MongoDB, Redis, API Server, Worker Service, Cron Service


### 1️⃣ Build & Start
docker compose up -d --build

2️⃣ Stop & Remove
docker compose down --volumes

Why use Docker?
Guarantees same environment for MongoDB, Redis, server, worker, cron.
No need to install Redis or Mongo locally.


Useful Docker Logs - 

Server logs - To debug API, MongoDB connection, or Socket.IO events.

    docker logs -f job_importer_server

Worker logs - To see import progress, failures, or batch processing issues.

    docker logs -f job_importer_worker
   


Cron logs - To confirm external feeds are fetched and jobs are added to queue.

    docker logs -f job_importer_cron
