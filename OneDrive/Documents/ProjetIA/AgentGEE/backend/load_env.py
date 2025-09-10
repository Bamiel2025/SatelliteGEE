import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def get_gee_project_id():
    """
    Get the Google Earth Engine project ID from environment variables
    """
    project_id = os.environ.get('GEE_PROJECT_ID')
    if not project_id or project_id == 'your-project-id':
        print("Warning: GEE_PROJECT_ID not set or using default value")
        print("Please create a .env file with your actual project ID")
        return None
    return project_id