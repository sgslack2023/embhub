from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class MasterdataConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'masterdata'

    def ready(self):
        """
        Called when Django starts up.
        Auto-start the tracking scheduler if Django Q2 is available.
        """
        # Only auto-start if we're running the qcluster command
        import sys
        
        # Check if this is the qcluster process
        if 'qcluster' in sys.argv:
            try:
                # Import here to avoid circular imports
                from masterdata.tracking_service import auto_start_tracking_scheduler
                
                # Small delay to ensure Django Q2 is fully initialized
                import threading
                import time
                
                def delayed_start():
                    time.sleep(2)  # Wait 2 seconds for Q2 to initialize
                    try:
                        result = auto_start_tracking_scheduler()
                        if result.get('success'):
                            if result.get('auto_started'):
                                logger.info("🚀 Tracking scheduler auto-started with qcluster!")
                            else:
                                logger.info("📋 Tracking scheduler was already running")
                        else:
                            logger.error(f"❌ Failed to auto-start scheduler: {result.get('error')}")
                    except Exception as e:
                        logger.error(f"❌ Error auto-starting scheduler: {str(e)}")
                
                # Start in background thread to avoid blocking Django startup
                threading.Thread(target=delayed_start, daemon=True).start()
                
            except ImportError:
                # Django Q2 not available, skip auto-start
                logger.warning("Django Q2 not available - skipping auto-start of tracking scheduler")
            except Exception as e:
                logger.error(f"Error setting up auto-start for tracking scheduler: {str(e)}")
