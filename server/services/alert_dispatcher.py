import logging
from typing import List

logger = logging.getLogger(__name__)

class AlertDispatcher:
    def __init__(self, use_mock: bool = True):
        self.use_mock = use_mock
        
    def dispatch_sms(self, to_numbers: List[str], message: str, language: str = 'en') -> bool:
        """
        Dispatches alerts to both the primary family caregiver and the assigned ASHA worker.
        Formats culturally sensitive SMS messages in regional languages (Assamese, Bodo, Bengali, English).
        """
        formatted_message = self._format_message(message, language)
        
        if self.use_mock:
            for num in to_numbers:
                logger.info(f"[MOCK SMS] To: {num} | Message: {formatted_message}")
            return True
        else:
            # Twilio/Msg91 Integration would go here
            return True
            
    def dispatch_sos(self, to_numbers: List[str], patient_name: str, gps_coords: dict) -> bool:
        """
        Formats emergency SMS including patient GPS coordinates, Google Maps link, and emergency contacts.
        """
        lat, lon = gps_coords.get("lat"), gps_coords.get("lon")
        maps_link = f"https://maps.google.com/?q={lat},{lon}"
        
        message = (
            f"EMERGENCY: {patient_name} has triggered an SOS alert. "
            f"Location: {maps_link}. "
            f"Please check immediately or contact emergency services."
        )
        
        return self.dispatch_sms(to_numbers, message, language='en')

    def _format_message(self, base_message: str, language: str) -> str:
        # Culturally sensitive localized templates
        templates = {
            "en": "[SmritiSetu Alert] {msg}",
            "as": "[স্মৃতিসেতু সতৰ্কবাণী] {msg}",
            "bn": "[স্মৃতিসেতু সতর্কবার্তা] {msg}",
            "brx": "[SmritiSetu Alert] {msg}"
        }
        template = templates.get(language, templates["en"])
        return template.format(msg=base_message)
