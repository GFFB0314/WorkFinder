import unittest
import sys
from pathlib import Path
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.scrapers.adzuna import fetch_adzuna_jobs, is_remote_adzuna_job


class AdzunaRemotePolicyTest(unittest.TestCase):
    def test_remote_detector_accepts_explicit_remote_posting(self):
        job = {
            "title": "Remote Python Developer",
            "description": "Build APIs from anywhere.",
            "location": {"display_name": "United Kingdom"},
        }

        self.assertTrue(is_remote_adzuna_job(job))

    def test_remote_detector_rejects_non_remote_posting(self):
        job = {
            "title": "Python Developer",
            "description": "Office role in London.",
            "location": {"display_name": "London, UK"},
        }

        self.assertFalse(is_remote_adzuna_job(job))

    @patch("app.scrapers.adzuna.requests.get")
    def test_fetch_adzuna_jobs_emits_only_remote_jobs(self, mock_get):
        response = Mock()
        response.status_code = 200
        response.json.return_value = {
            "results": [
                {
                    "title": "Python Developer",
                    "company": {"display_name": "OfficeCo"},
                    "location": {"display_name": "London, UK"},
                    "description": "Office role using Python.",
                    "redirect_url": "https://example.com/office",
                    "created": "2026-06-25T00:00:00Z",
                },
                {
                    "title": "Remote Python Developer",
                    "company": {"display_name": "RemoteCo"},
                    "location": {"display_name": "Worldwide"},
                    "description": "Fully remote Python role.",
                    "redirect_url": "https://example.com/remote",
                    "created": "2026-06-25T00:00:00Z",
                },
            ]
        }
        response.raise_for_status.return_value = None
        mock_get.return_value = response

        jobs = fetch_adzuna_jobs(limit=2)

        self.assertEqual(len(jobs), 1)
        self.assertEqual(jobs[0]["company"], "RemoteCo")
        self.assertTrue(jobs[0]["remote"])


if __name__ == "__main__":
    unittest.main()
