import os
import logging

logger = logging.getLogger(__name__)


def _init():
    try:
        import firebase_admin
        from firebase_admin import credentials
        if firebase_admin._apps:
            return True
        key_path = os.environ.get(
            'FIREBASE_KEY_PATH',
            os.path.join(os.path.dirname(__file__), 'firebase-service-account.json'),
        )
        if not os.path.exists(key_path):
            logger.warning('FCM: service account key not found at %s', key_path)
            return False
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
        return True
    except Exception as exc:
        logger.error('FCM init failed: %s', exc)
        return False


def send_push(token: str, title: str, body: str) -> None:
    if not token:
        return
    try:
        if not _init():
            return
        from firebase_admin import messaging
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(color='#0D1B3E'),
            ),
            token=token,
        )
        messaging.send(message)
        logger.info('FCM sent to token ...%s', token[-6:])
    except Exception as exc:
        logger.error('FCM send failed: %s', exc)
