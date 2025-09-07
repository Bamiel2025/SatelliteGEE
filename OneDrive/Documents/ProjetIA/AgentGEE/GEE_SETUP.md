# Google Earth Engine Setup Guide

This guide will help you set up Google Earth Engine for use with this application.

## Prerequisites

1. A Google account
2. Access to Google Cloud Platform

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "gee-satellite-analyzer")
5. Click "Create"

## Step 2: Enable Billing

1. In the Google Cloud Console, go to the Billing section
2. Link a billing account to your project
3. Note: Earth Engine has free usage quotas, but billing must be enabled

## Step 3: Enable the Earth Engine API

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Earth Engine API"
3. Click on "Google Earth Engine API"
4. Click "Enable"

## Step 4: Set up Earth Engine Access

1. Go to [Earth Engine Code Editor](https://code.earthengine.google.com/)
2. Sign in with your Google account
3. Accept the terms of service

## Step 5: Set Environment Variables

Create a `.env` file in the project root with your project ID:

```
GEE_PROJECT_ID=your-actual-project-id
```

Replace `your-actual-project-id` with your actual Google Cloud project ID.

## Step 6: Authenticate

Run the authentication script:

```bash
python gee_auth.py
```

Follow the prompts to authenticate with your Google account.

## Troubleshooting

### "no project found" Error

This means the project ID is not set correctly. Make sure you:

1. Have created a Google Cloud Project
2. Have set the GEE_PROJECT_ID environment variable
3. Have enabled the Earth Engine API for your project

### Authentication Issues

If you're having authentication issues:

1. Make sure you're using the same Google account for Earth Engine and Google Cloud
2. Check that you've accepted the Earth Engine Terms of Service
3. Try running `gcloud auth login` to authenticate with Google Cloud

## Useful Resources

- [Earth Engine Homepage](https://earthengine.google.com/)
- [Earth Engine Documentation](https://developers.google.com/earth-engine)
- [Earth Engine API Reference](https://developers.google.com/earth-engine/apidocs)
- [Google Cloud Console](https://console.cloud.google.com/)