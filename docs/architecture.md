# Architecture — Job Importer System

This document explains how the Job Importer is designed, why certain architectural decisions were taken, and how the system behaves under load. The goal was to keep the implementation simple enough to understand quickly, yet scalable enough to demonstrate real-world backend patterns.

---

# 🏗️ High-Level Components

### **1. Cron Service**
The cron worker fetches external RSS/XML job feeds at fixed intervals.  
Its responsibilities include:

- hitting the remote job URLs  
- parsing raw XML  
- normalizing inconsistent fields (title, link, guid, description…)  
- grouping jobs into batches  
- pushing batches to Redis queue  

The cron process is intentionally independent so it can be scaled or disabled without affecting the API or worker.

---

### **2. Queue Layer (Redis + BullMQ)**
Redis acts as a dedicated task broker.

BullMQ gives:

- durable queues (tasks survive restarts)
- retry mechanisms for temporary failures
- concurrency control
- back-pressure
- delayed jobs
- horizontal scaling (multiple workers can attach)

This ensures that even if feeds contain thousands of items, workers process them safely without overloading the API.

---

### **3. Worker Service**
The worker accepts jobs from the queue and performs all actual processing:

- upserts jobs into MongoDB  
- validates fields  
- tracks failures  
- counts:
  - totalFetched  
  - totalImported  
  - newJobs  
  - updatedJobs  
  - failedJobs  

When a batch finishes, the worker writes a log entry into `import_logs`.  
This allows the UI to display a full history of imports.

Workers can be horizontally scaled simply with:

docker compose up --scale worker=5 -d  - That alone can multiply throughput by 5×.


That alone can multiply throughput by 5×.

---

### **4. API Server**
The API service is intentionally lightweight:

- exposes `/api/import-logs`
- provides import history to frontend
- broadcasts events via Socket.IO

API service does **not** do any heavy lifting.  
That work stays inside the worker so the API stays responsive.

---

### **5. MongoDB**
MongoDB stores two collections:

1. `jobs`  
   - normalized schema
   - upserted by worker  
   - supports indexing by `guid`  

2. `import_logs`  
   - one document per import run  
   - includes all metrics (new, updated, failed…)  
   - used by the UI for reporting and debugging  

MongoDB Atlas (used here) handles scaling, global access, and backups.

---

# Data Flow — Step by Step

### **1. Cron triggers**
Hits all RSS/XML feeds.

### **2. Parse & Normalize**
RSS → XML → JS objects  
Fields are cleaned (trimmed, optional values removed).

### **3. Batch the results**
Example: 120 items → batches of 50 → creates 3 queue jobs.

### **4. Push batches to Redis Queue**
Each batch is added as a BullMQ job.

### **5. Worker consumes jobs**
For each batch:

- upserts data using `guid`
- increments counters
- tracks failures (with rejection reason)
- emits progress events  

### **6. Create import log**
One record is inserted into `import_logs`:

```json
{
  "_id": {
    "$oid": "692167e8e9805b5ff8d93ee4"
  },
  "feedUrl": "https://jobicy.com/?feed=job_feed&job_categories=smm&job_types=full-time",
  "timestamp": {
    "$date": "2025-11-22T07:36:07.394Z"
  },
  "totalFetched": 6,
  "totalImported": 6,
  "newJobs": 6,
  "updatedJobs": 0,
  "failedJobs": [],
  "createdAt": {
    "$date": "2025-11-22T07:36:08.344Z"
  },
  "updatedAt": {
    "$date": "2025-11-22T07:36:08.344Z"
  },
  "__v": 0
}


System Design Decisions

1. Why choose a queue ?
Direct insertion risks:
sudden spikes of 1,000+ jobs blocking the server
inconsistent external feed latency
API slowdowns from heavy DB writes

Queue solves all of this:
smooths out spikes
isolates failures
allows retry logic
lets workers scale independently


2. Why split components (API, Cron, Worker)?
Instead of one large server:
smaller services are easier to debug
worker-heavy loads do not slow the API
cron failures cannot crash the system
scaling becomes granular (scale only workers)


Why BullMQ over ?

BullMQ provides:
automatic retry
back-off strategies
concurrency handling
job state tracking
event listeners


Why store import history separately?
You could compute logs by diffing data — but that is expensive.
A dedicated import_logs collection gives:
zero-cost reporting
full audit trail
debugging information
metrics visibility
MongoDB fits:
semi-structured RSS feeds
unstructured HTML-rich descriptions
flexible schema evolution
fast upserts using guid