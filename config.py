import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration class for Flask app."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'default_secret_key_village_adm_12938')
    
    # Oracle Database Credentials
    ORACLE_USER = os.getenv('ORACLE_USER', 'SYSTEM')
    ORACLE_PASSWORD = os.getenv('ORACLE_PASSWORD', 'password_oracle')
    ORACLE_DSN = os.getenv('ORACLE_DSN', 'localhost:1521/XE')
    
    # Check if we should run oracledb in thin mode or thick mode
    # Default is Thin Mode which is recommended for modern deployments and doesn't require Instant Client
    ORACLE_THIN_MODE = True
