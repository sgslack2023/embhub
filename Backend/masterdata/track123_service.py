"""
Track123 API service for package tracking
"""
import requests
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

TRACK123_API_URL = "https://api.track123.com/gateway/open-api/tk/v2/track/import"
TRACK123_QUERY_URL = "https://api.track123.com/gateway/open-api/tk/v2/track/query"


def import_tracking_to_track123(api_key: str, tracking_numbers: List[str], courier_code: str) -> Dict:
    """
    Import tracking numbers to Track123 API
    
    Args:
        api_key: Track123 API key
        tracking_numbers: List of tracking numbers to import
        courier_code: Courier code (e.g., 'fedex', 'ups', 'usps')
    
    Returns:
        Dict with 'success' (bool) and 'data' or 'error' keys
    """
    if not api_key:
        return {'success': False, 'error': 'Track123 API key is not configured'}
    
    if not tracking_numbers:
        return {'success': False, 'error': 'No tracking numbers provided'}
    
    if not courier_code:
        return {'success': False, 'error': 'Courier code is required'}
    
    # Prepare the payload
    payload = [
        {
            "trackNo": track_no.strip(),
            "courierCode": courier_code.lower()
        }
        for track_no in tracking_numbers
        if track_no and track_no.strip()
    ]
    
    if not payload:
        return {'success': False, 'error': 'No valid tracking numbers provided'}
    
    try:
        headers = {
            'Track123-Api-Secret': api_key,
            'accept': 'application/json',
            'content-type': 'application/json'
        }
        
        response = requests.post(TRACK123_API_URL, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            response_data = response.json()
            logger.info(f"Successfully imported {len(payload)} tracking numbers to Track123")
            return {
                'success': True,
                'data': response_data,
                'tracking_count': len(payload)
            }
        else:
            error_msg = f"Track123 API returned status {response.status_code}"
            try:
                error_data = response.json()
                error_msg = error_data.get('message', error_data.get('error', error_msg))
            except ValueError:
                error_msg = f"{error_msg}: {response.text}"
            
            logger.error(f"Track123 API error: {error_msg}")
            return {
                'success': False,
                'error': error_msg,
                'status_code': response.status_code
            }
    
    except requests.exceptions.Timeout:
        logger.error("Track123 API request timed out")
        return {'success': False, 'error': 'Request to Track123 API timed out'}
    except requests.exceptions.RequestException as e:
        logger.error(f"Track123 API request failed: {str(e)}")
        return {'success': False, 'error': f'Failed to connect to Track123 API: {str(e)}'}
    except Exception as e:
        logger.error(f"Unexpected error calling Track123 API: {str(e)}")
        return {'success': False, 'error': f'Unexpected error: {str(e)}'}


def get_tracking_status(api_key: str, tracking_number: str, courier_code: str) -> Dict:
    """
    Get tracking status from Track123 API
    
    Args:
        api_key: Track123 API key
        tracking_number: Tracking number to query
        courier_code: Courier code (e.g., 'fedex', 'ups', 'usps')
    
    Returns:
        Dict with 'success' (bool), 'status' (str), and 'data' or 'error' keys
    """
    if not api_key:
        return {'success': False, 'error': 'Track123 API key is not configured'}
    
    if not tracking_number or not tracking_number.strip():
        return {'success': False, 'error': 'Tracking number is required'}
    
    if not courier_code:
        return {'success': False, 'error': 'Courier code is required'}
    
    try:
        headers = {
            'Track123-Api-Secret': api_key,
            'accept': 'application/json',
            'content-type': 'application/json'
        }
        
        payload = {"trackNos": [tracking_number.strip()]}
        
        response = requests.post(TRACK123_QUERY_URL, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            response_data = response.json()
            logger.info(f"Successfully fetched tracking status for {tracking_number}")
            
            # Extract status from Track123 response structure: data.accepted.content[0]
            status = None
            try:
                content = response_data.get('data', {}).get('accepted', {}).get('content', [])
                if content and len(content) > 0:
                    first_item = content[0]
                    transit_status = first_item.get('transitStatus')
                    
                    if transit_status:
                        # Convert status codes to readable format
                        status_mapping = {
                            'DELIVERED': 'Delivered',
                            'IN_TRANSIT': 'In Transit',
                            'INFO_RECEIVED': 'Info Received',
                            'WAITING_DELIVERY': 'Out for Delivery',
                            'DELIVERY_FAILED': 'Delivery Failed',
                            'EXCEPTION': 'Exception'
                        }
                        
                        # Map status code to readable format
                        for code, readable in status_mapping.items():
                            if transit_status.startswith(code):
                                status = readable
                                break
                        
                        # If no mapping found, use the original status
                        if not status:
                            status = transit_status
                        
                        # Add event detail from latest tracking event if available
                        logistics_info = first_item.get('localLogisticsInfo', {})
                        tracking_details = logistics_info.get('trackingDetails', [])
                        if tracking_details and len(tracking_details) > 0:
                            latest_event = tracking_details[0]
                            event_detail = latest_event.get('eventDetail', '')
                            if event_detail:
                                status = f"{status} - {event_detail}"
                    
                    # Fallback to transitSubStatus if transitStatus not available
                    if not status:
                        status = first_item.get('transitSubStatus', 'Status not available')
            except (KeyError, IndexError, AttributeError) as e:
                logger.warning(f"Error extracting status from Track123 response: {str(e)}")
                status = 'Status not available'
            
            return {
                'success': True,
                'status': str(status) if status else 'Status not available',
                'data': response_data
            }
        else:
            error_msg = f"Track123 API returned status {response.status_code}"
            try:
                error_data = response.json()
                error_msg = error_data.get('msg', error_data.get('message', error_data.get('error', error_msg)))
            except ValueError:
                error_msg = f"{error_msg}: {response.text}"
            
            logger.error(f"Track123 API error: {error_msg}")
            return {
                'success': False,
                'error': error_msg,
                'status_code': response.status_code
            }
    
    except requests.exceptions.Timeout:
        logger.error("Track123 API request timed out")
        return {'success': False, 'error': 'Request to Track123 API timed out'}
    except requests.exceptions.RequestException as e:
        logger.error(f"Track123 API request failed: {str(e)}")
        return {'success': False, 'error': f'Failed to connect to Track123 API: {str(e)}'}
    except Exception as e:
        logger.error(f"Unexpected error calling Track123 API: {str(e)}")
        return {'success': False, 'error': f'Unexpected error: {str(e)}'}
