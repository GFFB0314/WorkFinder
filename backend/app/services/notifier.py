"""
Notification Matching & Alerting Service

Matches new jobs against user watchlists and sends mock email notifications.
Uses word-boundary-aware matching to avoid false positives with short keywords
like "AI" matching inside words like "maintain" or "domain".
"""

import re
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app import models, crud
from app.database import SessionLocal


def _strip_html(text: str) -> str:
    """Remove HTML tags from a string for clean text matching."""
    if not text:
        return ""
    return re.sub(r"<[^>]+>", " ", text)


def _keyword_matches(keyword: str, text: str) -> bool:
    """
    Check if a keyword appears in text using word-boundary matching.
    
    This prevents short keywords like 'AI' from matching inside
    unrelated words like 'maintain', 'domain', 'training', etc.
    
    For multi-word keywords like 'data science', we check if the 
    exact phrase appears (case-insensitive).
    """
    if not text or not keyword:
        return False
    # Use word boundaries (\\b) for precise matching
    # re.escape handles special regex characters in keywords
    pattern = r"\b" + re.escape(keyword.strip()) + r"\b"
    return bool(re.search(pattern, text, re.IGNORECASE))


def _job_matches_watchlist(job: models.Job, keywords: list[str]) -> bool:
    """
    Check if a job matches any of the watchlist keywords.
    
    Matching is done on:
      - Job title (clean text)
      - Job description (HTML-stripped)
    
    Uses word-boundary matching to avoid false positives.
    """
    title = job.title or ""
    description = _strip_html(job.description or "")
    combined = f"{title} {description}"
    
    for kw in keywords:
        if _keyword_matches(kw, combined):
            return True
    return False


import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def send_email_mock(to_email: str, job_count: int, jobs: list):
    """Mock email sending with file logging"""
    print(f"\n[EMAIL SENT] To: {to_email}")
    print(f"Subject: WorkFinder Alert - {job_count} new jobs found!")
    print("Body:")
    for job in jobs[:5]:
        print(f"- {job.title} at {job.company} ({job.url})")
    if job_count > 5:
        print(f"...and {job_count - 5} more.")
    print("-" * 30)
    
    log_file = "notifications.log"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(f"\n{'='*70}\n")
        f.write(f"[{timestamp}] EMAIL SENT\n")
        f.write(f"To: {to_email}\n")
        f.write(f"Subject: WorkFinder Alert - {job_count} new jobs found!\n")
        f.write(f"\nMatched Jobs:\n")
        for i, job in enumerate(jobs, 1):
            f.write(f"{i}. {job.title}\n")
            f.write(f"   Company: {job.company}\n")
            f.write(f"   Location: {job.location}\n")
            f.write(f"   URL: {job.url}\n")
            f.write(f"   Posted: {job.created_at}\n")
            if i >= 10:
                f.write(f"   ...and {job_count - 10} more jobs\n")
                break
        f.write(f"{'='*70}\n")


def send_email_real(to_email: str, job_count: int, jobs: list):
    """Sends real styled HTML email using SMTP if configured in .env, otherwise uses mock logger"""
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    
    if not all([smtp_host, smtp_port, smtp_user, smtp_password]):
        # Fall back to mock
        send_email_mock(to_email, job_count, jobs)
        return

    subject = f"WorkFinder Alert - {job_count} nouvelles offres tech trouvees !"
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = to_email

    # HTML body
    jobs_li = ""
    for job in jobs[:10]:
        location_text = job.location or "Non specifie"
        remote_badge = "Teletravail (Remote)" if job.remote else "Sur site (Local)"
        jobs_li += f"""
        <li style="margin-bottom: 15px; padding: 12px; border-left: 4px solid #4f46e5; list-style-type: none; background-color: #f9fafb; border-radius: 0 6px 6px 0;">
            <a href="{job.url}" style="font-weight: bold; color: #4f46e5; text-decoration: none; font-size: 16px;">{job.title}</a><br/>
            <span style="color: #374151; font-weight: 500;">{job.company}</span> - <span style="color: #6b7280; font-size: 14px;">{location_text}</span><br/>
            <span style="font-size: 12px; color: #10b981; font-weight: 600; text-transform: uppercase;">{remote_badge}</span>
        </li>
        """
        
    remaining = job_count - 10
    more_msg = f"<p style='color: #6b7280; font-style: italic; margin-top: 10px;'>...et {remaining} autres offres en attente sur votre tableau de bord.</p>" if remaining > 0 else ""

    html_content = f"""
    <html>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 20px; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 8px solid #4f46e5;">
                <h1 style="color: #1f2937; margin-bottom: 5px; font-size: 24px; font-weight: 700;">Alertes WorkFinder</h1>
                <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">Bonjour,</p>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Nous avons trouve <strong>{job_count} nouvelles offres d'emploi tech</strong> correspondant a vos criteres de recherche :</p>
                <ul style="padding-left: 0; margin-top: 20px; margin-bottom: 20px;">
                    {jobs_li}
                </ul>
                {more_msg}
                <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
                    <a href="http://localhost:5173/dashboard" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Gérer mes alertes</a>
                </div>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin-top: 30px; margin-bottom: 20px;"/>
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">Vous recevez cet e-mail car vous êtes abonne aux alertes intelligentes de la plateforme WorkFinder.</p>
            </div>
        </body>
    </html>
    """
    
    msg.attach(MIMEText(html_content, "html"))
    
    try:
        server = smtplib.SMTP(smtp_host, int(smtp_port))
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, to_email, msg.as_string())
        server.quit()
        print(f"[Notifier] Email alerts successfully sent via SMTP to: {to_email}")
    except Exception as e:
        print(f"[Notifier] SMTP failed to send: {e}. Falling back to mock logger.")
        send_email_mock(to_email, job_count, jobs)


def match_and_notify():
    """
    Main notification logic.
    Only notifies about jobs created since the last notification for each watchlist.
    Uses word-boundary matching to prevent false positives.
    """
    db: Session = SessionLocal()
    try:
        print("Starting Match & Notify cycle...")
        watchlists = db.query(models.Watchlist).filter(
            models.Watchlist.active == True
        ).all()
        
        for wl in watchlists:
            user = crud.get_user(db, wl.user_id)
            if not user:
                continue
                
            keywords = wl.keywords  # List of strings
            if not keywords:
                continue
            
            # Determine time window based on last notification
            if wl.last_notified_at:
                since_time = wl.last_notified_at
                print(f"Watchlist {wl.id}: Checking jobs since {since_time}")
            else:
                # First time - check last 24 hours
                since_time = datetime.utcnow() - timedelta(hours=24)
                print(f"Watchlist {wl.id}: First check - last 24 hours")
            
            # Get all new jobs since last notification
            candidate_jobs = db.query(models.Job).filter(
                models.Job.created_at >= since_time
            ).all()
            
            # Apply precise word-boundary matching in Python
            matched_jobs = [
                job for job in candidate_jobs
                if _job_matches_watchlist(job, keywords)
            ]
            
            if matched_jobs:
                print(f"Watchlist {wl.id}: {len(matched_jobs)} matches for keywords {keywords}")
                send_email_real(user.email, len(matched_jobs), matched_jobs)
                
                # Update last notification timestamp
                wl.last_notified_at = datetime.utcnow()
                db.commit()
            else:
                print(f"Watchlist {wl.id}: No new matches (User: {user.email})")
                
    except Exception as e:
        print(f"Error in notification routine: {e}")
        db.rollback()
    finally:
        db.close()
