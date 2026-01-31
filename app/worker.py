"""
Celery Worker Configuration

This module configures the Celery distributed task queue for asynchronous job processing.
It sets up the broker (Redis) and result backend for task management.
"""

import os
from celery import Celery

# Initialize Celery application
celery: Celery = Celery(__name__)

# Configure broker and result backend from environment variables
celery.conf.broker_url = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379")
celery.conf.result_backend = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379")
