"""
Django management command to auto-start the tracking scheduler.
This command is designed to be run when the Django Q2 cluster starts.
"""

from django.core.management.base import BaseCommand
from masterdata.tracking_service import auto_start_tracking_scheduler
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Auto-start the tracking status scheduler for Django Q2'

    def add_arguments(self, parser):
        parser.add_argument(
            '--interval',
            type=int,
            default=720,
            help='Interval in minutes between tracking updates (default: 720 / 12 hours)'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force restart even if scheduler is already running'
        )

    def handle(self, *args, **options):
        interval = options['interval']
        force = options['force']
        
        self.stdout.write(
            self.style.SUCCESS(f'Starting tracking scheduler with {interval} minute interval...')
        )

        if force:
            # Cancel existing schedules first
            from masterdata.tracking_service import cancel_tracking_schedule
            cancel_result = cancel_tracking_schedule()
            if cancel_result.get('success'):
                self.stdout.write(
                    self.style.WARNING(f"Cancelled existing schedules: {cancel_result.get('message')}")
                )

        # Start the scheduler
        if force or interval != 720:
            # Use custom interval or force restart
            from masterdata.tracking_service import schedule_tracking_updates
            result = schedule_tracking_updates(interval_minutes=interval)
        else:
            # Use auto-start function with default settings
            result = auto_start_tracking_scheduler()

        if result.get('success'):
            if result.get('auto_started', True):
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✓ Tracking scheduler started successfully!\n"
                        f"  Schedule ID: {result.get('schedule_id')}\n"
                        f"  Interval: {interval} minutes ({interval/60:.1f} hours)\n"
                        f"  Orders will be checked every {interval} minutes for tracking updates."
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f"⚠ Scheduler was already running\n"
                        f"  Schedule ID: {result.get('schedule_id')}\n"
                        f"  Use --force to restart with new settings."
                    )
                )
        else:
            self.stdout.write(
                self.style.ERROR(
                    f"✗ Failed to start tracking scheduler: {result.get('error')}"
                )
            )
            return

        self.stdout.write(
            self.style.SUCCESS(
                "\n" + "="*60 + "\n"
                "TRACKING SCHEDULER IS NOW ACTIVE\n"
                "="*60 + "\n"
                "The scheduler will automatically:\n"
                "• Check all shipped orders for tracking updates\n"
                "• Skip orders that are already delivered\n"
                "• Update tracking status from Track123 API\n"
                "• Run in the background every {} minutes\n".format(interval) +
                "\nTo monitor: Check Django Admin → Django Q → Scheduled tasks\n"
                "To stop: Use the API endpoint or Django admin interface\n"
                "="*60
            )
        )
