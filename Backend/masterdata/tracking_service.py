"""
Django Q2 Service for Tracking Delivery Status
Fetches tracking status for orders and updates their delivery status.
Skips orders that are already marked as delivered.
"""

from typing import Dict, List
from django.db.models import Q
from django_q.tasks import async_task, schedule
from django_q.models import Schedule
import logging

from masterdata.models import PackingSlip
from masterdata.track123_service import get_tracking_status
from users.models import GoogleDriveSettings


logger = logging.getLogger(__name__)


def update_single_order_tracking(packing_slip_id: int) -> Dict:
    """
    Update tracking status for a single packing slip.

    Args:
        packing_slip_id: ID of the PackingSlip to update

    Returns:
        Dict with success status and message
    """
    try:
        packing_slip = PackingSlip.objects.get(id=packing_slip_id)

        # Skip if already delivered (check order status)
        if packing_slip.status == 'delivered':
            logger.info(f"Order {packing_slip.order_id} already delivered. Skipping.")
            return {
                'success': True,
                'skipped': True,
                'order_id': packing_slip.order_id,
                'message': 'Already delivered'
            }

        # Skip if no tracking information
        if not packing_slip.tracking_ids or not packing_slip.tracking_vendor:
            logger.warning(f"Order {packing_slip.order_id} has no tracking information.")
            return {
                'success': False,
                'order_id': packing_slip.order_id,
                'error': 'No tracking information available'
            }

        # Get Track123 API key from user's settings
        try:
            drive_settings = GoogleDriveSettings.objects.filter(user=packing_slip.product.owner).first()
            if not drive_settings or not drive_settings.track123_api_key:
                logger.error(f"No Track123 API key found for user {packing_slip.product.owner.username}")
                return {
                    'success': False,
                    'order_id': packing_slip.order_id,
                    'error': 'No Track123 API key configured'
                }
            api_key = drive_settings.track123_api_key
        except Exception as e:
            logger.error(f"Error getting API key: {str(e)}")
            return {
                'success': False,
                'order_id': packing_slip.order_id,
                'error': f'Error getting API key: {str(e)}'
            }

        # Parse tracking IDs (handle comma-separated string)
        tracking_ids = packing_slip.tracking_ids.split(',') if isinstance(packing_slip.tracking_ids, str) else [packing_slip.tracking_ids]
        tracking_ids = [tid.strip() for tid in tracking_ids if tid.strip()]

        if not tracking_ids:
            return {
                'success': False,
                'order_id': packing_slip.order_id,
                'error': 'No valid tracking IDs'
            }

        # Get tracking status for the first tracking ID
        # (You can modify this to handle multiple tracking IDs if needed)
        tracking_number = tracking_ids[0]

        # Map vendor to courier code
        courier_code = packing_slip.tracking_vendor.lower()

        # Fetch tracking status from Track123
        result = get_tracking_status(api_key, tracking_number, courier_code)

        if result.get('success'):
            new_status = result.get('status', '')
            old_status = packing_slip.tracking_status or 'Unknown'

            # Update tracking status
            packing_slip.tracking_status = new_status

            # Auto-update order status to delivered if tracking shows delivered
            if new_status.lower() == 'delivered' and packing_slip.status != 'delivered':
                old_order_status = packing_slip.status
                packing_slip.status = 'delivered'
                packing_slip.save(update_fields=['tracking_status', 'status', 'updated_at'])
                logger.info(f"Updated order {packing_slip.order_id}: tracking {old_status} -> {new_status}, status {old_order_status} -> delivered")
            else:
                packing_slip.save(update_fields=['tracking_status', 'updated_at'])
                logger.info(f"Updated order {packing_slip.order_id}: {old_status} -> {new_status}")

            return {
                'success': True,
                'order_id': packing_slip.order_id,
                'tracking_number': tracking_number,
                'old_status': old_status,
                'new_status': new_status,
                'is_delivered': new_status.lower() == 'delivered'
            }
        else:
            error_msg = result.get('error', 'Unknown error')
            logger.error(f"Failed to get tracking status for order {packing_slip.order_id}: {error_msg}")
            return {
                'success': False,
                'order_id': packing_slip.order_id,
                'tracking_number': tracking_number,
                'error': error_msg
            }

    except PackingSlip.DoesNotExist:
        logger.error(f"PackingSlip with id {packing_slip_id} does not exist")
        return {
            'success': False,
            'error': f'PackingSlip with id {packing_slip_id} not found'
        }
    except Exception as e:
        logger.error(f"Error updating tracking for packing slip {packing_slip_id}: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


def update_all_pending_orders() -> Dict:
    """
    Update tracking status for all orders that are shipped but not delivered.
    This is the main function that should be scheduled with Django Q2.

    Returns:
        Dict with summary of updates
    """
    try:
        # Query for shipped orders that are not delivered
        # Exclude orders with no tracking info or already delivered
        pending_orders = PackingSlip.objects.filter(
            status='shipped'
        ).exclude(
            Q(tracking_ids__isnull=True) |
            Q(tracking_ids__exact='') |
            Q(tracking_vendor__isnull=True) |
            Q(tracking_vendor__exact='') |
            Q(status__iexact='delivered')
        )

        total_orders = pending_orders.count()
        logger.info(f"Found {total_orders} orders to update tracking status")

        if total_orders == 0:
            return {
                'success': True,
                'total_orders': 0,
                'message': 'No pending orders to update'
            }

        # Process each order asynchronously
        results = {
            'total_orders': total_orders,
            'updated': 0,
            'skipped': 0,
            'failed': 0,
            'delivered': 0,
            'errors': []
        }

        for packing_slip in pending_orders:
            # Queue async task for each order
            async_task(
                'masterdata.tracking_service.update_single_order_tracking',
                packing_slip.id,
                hook='masterdata.tracking_service.update_tracking_callback'
            )

        logger.info(f"Queued {total_orders} tracking update tasks")

        return {
            'success': True,
            'total_orders': total_orders,
            'message': f'Queued {total_orders} tracking update tasks'
        }

    except Exception as e:
        logger.error(f"Error in update_all_pending_orders: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


def update_tracking_callback(task):
    """
    Callback function to log the result of tracking updates.

    Args:
        task: Django Q task object
    """
    if task.success:
        result = task.result
        if result.get('success'):
            if result.get('skipped'):
                logger.info(f"Skipped order {result.get('order_id')}: {result.get('message')}")
            elif result.get('is_delivered'):
                logger.info(f"Order {result.get('order_id')} marked as DELIVERED")
            else:
                logger.info(f"Updated order {result.get('order_id')}: {result.get('old_status')} -> {result.get('new_status')}")
        else:
            logger.error(f"Failed to update order {result.get('order_id')}: {result.get('error')}")
    else:
        logger.error(f"Task failed: {task.result}")


def schedule_tracking_updates(interval_minutes: int = 720):
    """
    Schedule periodic tracking updates using Django Q2 scheduler.

    Args:
        interval_minutes: How often to check for updates (default: 720 minutes / 12 hours)
    """
    try:
        # Check if schedule already exists
        existing_schedule = Schedule.objects.filter(
            func='masterdata.tracking_service.update_all_pending_orders',
            name='tracking_status_updater'
        ).first()

        if existing_schedule:
            logger.info("Tracking update schedule already exists")
            return {
                'success': True,
                'message': 'Schedule already exists',
                'schedule_id': existing_schedule.id
            }

        # Create new schedule
        schedule_id = schedule(
            'masterdata.tracking_service.update_all_pending_orders',
            name='tracking_status_updater',
            schedule_type=Schedule.MINUTES,
            minutes=interval_minutes,
            repeats=-1  # Repeat indefinitely
        )

        logger.info(f"Created tracking update schedule with ID: {schedule_id}")

        return {
            'success': True,
            'message': f'Scheduled tracking updates every {interval_minutes} minutes',
            'schedule_id': schedule_id
        }

    except Exception as e:
        logger.error(f"Error scheduling tracking updates: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


def cancel_tracking_schedule():
    """
    Cancel the scheduled tracking updates.
    """
    try:
        schedules = Schedule.objects.filter(
            func='masterdata.tracking_service.update_all_pending_orders',
            name='tracking_status_updater'
        )

        count = schedules.count()
        schedules.delete()

        logger.info(f"Cancelled {count} tracking update schedule(s)")

        return {
            'success': True,
            'message': f'Cancelled {count} schedule(s)'
        }

    except Exception as e:
        logger.error(f"Error cancelling tracking schedule: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


def trigger_immediate_update():
    """
    Trigger an immediate tracking update for all pending orders.
    Useful for manual triggering or testing.

    Returns:
        Task ID for tracking the async operation
    """
    try:
        task_id = async_task(
            'masterdata.tracking_service.update_all_pending_orders',
            hook='masterdata.tracking_service.immediate_update_callback'
        )

        logger.info(f"Triggered immediate tracking update with task ID: {task_id}")

        return {
            'success': True,
            'message': 'Immediate tracking update triggered',
            'task_id': task_id
        }

    except Exception as e:
        logger.error(f"Error triggering immediate update: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


def immediate_update_callback(task):
    """
    Callback for immediate update tasks.

    Args:
        task: Django Q task object
    """
    if task.success:
        result = task.result
        logger.info(f"Immediate update completed: {result}")
    else:
        logger.error(f"Immediate update failed: {task.result}")


def auto_start_tracking_scheduler():
    """
    Auto-start the tracking scheduler when Django Q2 cluster starts.
    This ensures the scheduler is always running without manual intervention.
    
    Returns:
        Dict with success status and message
    """
    try:
        # Check if schedule already exists
        existing_schedule = Schedule.objects.filter(
            func='masterdata.tracking_service.update_all_pending_orders',
            name='tracking_status_updater'
        ).first()

        if existing_schedule:
            logger.info("Tracking scheduler already running - auto-start skipped")
            return {
                'success': True,
                'message': 'Scheduler already active',
                'schedule_id': existing_schedule.id,
                'auto_started': False
            }

        # Auto-start with default 12-hour interval
        result = schedule_tracking_updates(interval_minutes=720)
        
        if result.get('success'):
            logger.info("Tracking scheduler auto-started successfully with 12-hour interval")
            result['auto_started'] = True
            return result
        else:
            logger.error(f"Failed to auto-start tracking scheduler: {result.get('error')}")
            return result

    except Exception as e:
        logger.error(f"Error in auto-start tracking scheduler: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'auto_started': False
        }
