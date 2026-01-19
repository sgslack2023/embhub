# Django Q2 Tracking Service

Automated delivery status tracking service for orders using Django Q2 task queue.

## Overview

This service automatically fetches and updates tracking status for shipped orders using the Track123 API. It intelligently skips orders that are already marked as delivered, reducing unnecessary API calls.

## Features

- Automatic periodic tracking status updates
- Skips already delivered orders
- Async task processing with Django Q2
- REST API endpoints for manual control
- Scheduled background tasks
- Real-time status updates from Track123

## Setup

### 1. Install Dependencies

```bash
pip install django-q2
```

**Note:** Redis is NOT required! Django Q2 is configured to use Django's ORM as the message broker, so it works with your existing database (SQLite/PostgreSQL).

### 2. Run Migrations

```bash
python manage.py migrate
```

This creates the Django Q2 database tables.

### 3. Start Django Q2 Cluster

In a separate terminal, run:

```bash
python manage.py qcluster
```

Keep this running in the background. This is the worker process that executes scheduled tasks.

**🚀 AUTO-START FEATURE**: The tracking scheduler will automatically start when you run `qcluster`! No need to manually call the start API - it will begin checking orders every 12 hours automatically.

**That's it!** No Redis installation needed - Django Q2 uses your existing database.

### Alternative: Manual Start (Optional)

If you prefer to manually start the scheduler or need custom settings:

```bash
# Start with default 12-hour interval
python manage.py start_tracking_scheduler

# Start with custom interval (e.g., 6 hours)
python manage.py start_tracking_scheduler --interval 360

# Force restart even if already running
python manage.py start_tracking_scheduler --force
```

## Usage

### 🚀 Automatic Startup (Recommended)

**The scheduler starts automatically when you run the qcluster!** Just run:

```bash
python manage.py qcluster
```

The tracking scheduler will automatically:
- Start with a 12-hour interval (720 minutes)
- Begin checking all shipped orders for tracking updates
- Skip orders that are already delivered
- Run continuously in the background

**No manual API calls needed!** The system is ready to use immediately.

### Manual Control (Optional)

If you need to manually control the scheduler, you can still use the API endpoints:

#### API Endpoints

All endpoints require authentication.

#### 1. Start Scheduler

Start automatic periodic tracking updates:

```http
POST /api/masterdata/tracking/scheduler/
Content-Type: application/json

{
  "action": "start",
  "interval": 720  // Optional: minutes between updates (default: 720 / 12 hours)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scheduled tracking updates every 720 minutes (12 hours)",
  "schedule_id": "abc123"
}
```

#### 2. Stop Scheduler

Stop automatic tracking updates:

```http
POST /api/masterdata/tracking/scheduler/
Content-Type: application/json

{
  "action": "stop"
}
```

#### 3. Check Scheduler Status

Check if scheduler is running:

```http
POST /api/masterdata/tracking/scheduler/
Content-Type: application/json

{
  "action": "status"
}
```

**Response:**
```json
{
  "success": true,
  "active": true,
  "schedules": [
    {
      "id": 1,
      "name": "tracking_status_updater",
      "interval_minutes": 60,
      "next_run": "2025-12-16T15:30:00Z",
      "repeats": "Indefinitely",
      "task_count": 25
    }
  ]
}
```

#### 4. Trigger Immediate Update

Run tracking update immediately (without waiting for schedule):

```http
POST /api/masterdata/tracking/scheduler/
Content-Type: application/json

{
  "action": "run_now"
}
```

#### 5. Update Specific Order

Update tracking status for a single order:

```http
POST /api/masterdata/tracking/update/
Content-Type: application/json

{
  "order_id": "123-456-789"  // or use "packing_slip_id": 42
}
```

#### 6. Update All Pending Orders

Update all shipped (not delivered) orders:

```http
POST /api/masterdata/tracking/update/
Content-Type: application/json

{}
```

## How It Works

### Automatic Updates

1. **Scheduler runs** every X minutes (default: 60)
2. **Queries database** for orders with `status='shipped'` that:
   - Have tracking numbers
   - Have tracking vendor set
   - Are NOT already delivered
3. **Queues async tasks** for each order
4. **Fetches status** from Track123 API
5. **Updates database** with new tracking status

### Smart Skipping

The service automatically skips:
- Orders already marked as "delivered"
- Orders without tracking information
- Orders without Track123 API key configured

This reduces API calls and improves performance.

### Order Filtering Logic

```python
# Only processes shipped orders
status = 'shipped'

# Excludes:
- No tracking_ids
- No tracking_vendor
- tracking_status = 'delivered' (case-insensitive)
```

## Configuration

### Change Update Interval

Default is 720 minutes (12 hours). To change:

```http
POST /api/masterdata/tracking/scheduler/
{
  "action": "start",
  "interval": 60  // Update every 60 minutes (1 hour)
}
```

### Django Q2 Settings

Located in [settings.py](d:\Projects\IMS\Backend\back_sinan\settings.py#L168-L181):

```python
Q_CLUSTER = {
    'name': 'IMS_Q_Cluster',
    'workers': 4,              # Number of worker processes
    'recycle': 500,            # Recycle worker after N tasks
    'timeout': 90,             # Task timeout in seconds
    'compress': True,          # Compress task data
    'save_limit': 250,         # Keep last 250 successful tasks
    'queue_limit': 500,        # Max tasks in queue
    'cpu_affinity': 1,
    'label': 'Django Q2',
    'orm': 'default'           # Use Django ORM as broker (no Redis!)
}
```

**No Redis Required!** Django Q2 uses your existing database as the message broker.

## Monitoring

### View Task History

Django Q2 provides an admin interface to view task history:

1. Go to Django admin: `/admin/`
2. Navigate to: **Django Q** → **Successful tasks** / **Failed tasks**

### Check Logs

The service logs all operations:

```python
import logging
logger = logging.getLogger(__name__)
```

Configure Django logging in settings.py to see logs.

### Monitor Queue

Since Django Q2 uses the ORM broker, queued tasks are stored in your database. You can view them via Django admin or query directly:

```python
from django_q.models import OrmQ

# Check queued tasks
queued_tasks = OrmQ.objects.all()
print(f"Tasks in queue: {queued_tasks.count()}")
```

## Troubleshooting

### Scheduler not running?

1. Check if qcluster is running:
   ```bash
   python manage.py qcluster
   ```

2. Check scheduler status via API:
   ```bash
   POST /api/masterdata/tracking/scheduler/ {"action": "status"}
   ```

3. Verify migrations are applied:
   ```bash
   python manage.py migrate
   ```

### Tasks not executing?

1. Check Django Q2 admin panel for failed tasks
2. Review error logs
3. Verify Track123 API key is configured in GoogleDriveSettings
4. Check internet connectivity

### Orders not updating?

1. Verify order has `status='shipped'`
2. Check `tracking_ids` and `tracking_vendor` are set
3. Confirm order is not already marked as delivered
4. Test Track123 API manually using existing endpoint:
   ```http
   GET /api/masterdata/packing-slips/{id}/fetch-tracking-status/
   ```

## Architecture

### Service Layer
- [tracking_service.py](d:\Projects\IMS\Backend\masterdata\tracking_service.py) - Core service functions

### Key Functions

- `update_single_order_tracking(packing_slip_id)` - Update one order
- `update_all_pending_orders()` - Update all shipped orders
- `schedule_tracking_updates(interval_minutes)` - Schedule recurring updates
- `trigger_immediate_update()` - Run update now
- `cancel_tracking_schedule()` - Stop scheduler

### Views
- [views.py:2708-2839](d:\Projects\IMS\Backend\masterdata\views.py#L2708-L2839)
  - `TrackingSchedulerView` - Scheduler control
  - `TrackingUpdateView` - Manual updates

### URL Routes
- [urls.py:76-78](d:\Projects\IMS\Backend\masterdata\urls.py#L76-L78)

## Example Workflow

### Initial Setup

```bash
# Terminal 1: Start Django Q2 cluster
python manage.py qcluster

# Terminal 2: Start Django dev server
python manage.py runserver
```

### Start Automated Tracking

```bash
curl -X POST http://localhost:8000/api/masterdata/tracking/scheduler/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "start", "interval": 720}'
```

Now tracking updates will run automatically every 12 hours!

### Stop Tracking (if needed)

```bash
curl -X POST http://localhost:8000/api/masterdata/tracking/scheduler/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "stop"}'
```

## Best Practices

1. **Always run qcluster** in production as a service/daemon
2. **Set appropriate intervals** - Don't spam Track123 API (recommended: 60+ minutes)
3. **Check logs regularly** for errors
4. **Use immediate updates** sparingly (manual testing only)
5. **Monitor database size** - Django Q2 stores task history in your database
6. **Clean up old tasks** periodically using Django Q2's cleanup commands

## Production Deployment

### Using systemd (Linux)

Create `/etc/systemd/system/django-q.service`:

```ini
[Unit]
Description=Django Q2 Cluster
After=network.target redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/IMS/Backend
ExecStart=/path/to/venv/bin/python manage.py qcluster
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable django-q
sudo systemctl start django-q
sudo systemctl status django-q
```

### Using Docker

```dockerfile
# In your docker-compose.yml
services:
  qcluster:
    build: .
    command: python manage.py qcluster
    depends_on:
      - db
    volumes:
      - .:/app
```

## API Response Examples

### Successful Update

```json
{
  "success": true,
  "order_id": "123-456-789",
  "tracking_number": "1Z999AA10123456784",
  "old_status": "In Transit",
  "new_status": "Delivered",
  "is_delivered": true
}
```

### Already Delivered (Skipped)

```json
{
  "success": true,
  "skipped": true,
  "order_id": "123-456-789",
  "message": "Already delivered"
}
```

### Error Response

```json
{
  "success": false,
  "order_id": "123-456-789",
  "error": "No Track123 API key configured"
}
```

## Support

For issues or questions:
1. Check Django Q2 documentation: https://django-q2.readthedocs.io/
2. Review Track123 API docs
3. Check application logs
4. Check Django Q2 admin panel for task history

## Notes

- The service uses existing [track123_service.py](d:\Projects\IMS\Backend\masterdata\track123_service.py) for API calls
- Track123 API key is read from `GoogleDriveSettings` model
- All API endpoints require authentication via `isAuthenticatedCustom`
- Delivered orders are permanently skipped (won't be checked again)
