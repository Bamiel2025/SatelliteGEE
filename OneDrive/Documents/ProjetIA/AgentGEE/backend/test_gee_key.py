#!/usr/bin/env python3
"""
Script pour tester la validite d'une cle de service account Google Earth Engine
"""
import os
import json
import base64
import sys
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

def test_gee_key():
    print("=== Test de la Cle Google Earth Engine ===\n")

    # Recuperer les variables d'environnement
    project_id = os.environ.get('GEE_PROJECT_ID')
    service_account_key = os.environ.get('GEE_SERVICE_ACCOUNT_KEY')
    service_account_key_b64 = os.environ.get('GEE_SERVICE_ACCOUNT_KEY_B64')

    print(f"Project ID: {project_id}")
    print(f"Service Account Key present: {bool(service_account_key)}")
    print(f"Service Account Key B64 present: {bool(service_account_key_b64)}")
    print()

    if not project_id:
        print("[ERREUR] GEE_PROJECT_ID n'est pas defini")
        return False

    if not service_account_key and not service_account_key_b64:
        print("[ERREUR] Aucune cle de service account trouvee")
        print("Definissez GEE_SERVICE_ACCOUNT_KEY ou GEE_SERVICE_ACCOUNT_KEY_B64")
        return False

    try:
        # Importer les modules necessaires
        print("[INFO] Import des modules GEE...")
        import ee
        from google.oauth2 import service_account
        print("[OK] Modules importes avec succes")
        print()

        # Preparer la cle
        if service_account_key_b64:
            print("[INFO] Decodage de la cle base64...")
            try:
                key_json = base64.b64decode(service_account_key_b64).decode('utf-8')
                print("[OK] Cle decodee avec succes")
            except Exception as decode_err:
                print(f"[ERREUR] Erreur de decodage base64: {decode_err}")
                return False
        else:
            print("Using direct service account key")
            key_json = service_account_key

        # Parser le JSON
        print("[INFO] Analyse du JSON de la cle...")
        try:
            key_data = json.loads(key_json)
            print("[OK] JSON analyse avec succes")
            print(f"   Service Account: {key_data.get('client_email', 'N/A')}")
            print(f"   Project ID: {key_data.get('project_id', 'N/A')}")
        except Exception as e:
            print(f"[ERREUR] Erreur d'analyse JSON: {e}")
            return False

        print()

        # Creer les credentials
        print("[INFO] Creation des credentials...")
        try:
            credentials = service_account.Credentials.from_service_account_info(key_data)
            print("[OK] Credentials crees avec succes")
        except Exception as cred_err:
            print(f"[ERREUR] Erreur de creation des credentials: {cred_err}")
            return False

        print()

        # Tester l'initialisation GEE
        print("[INFO] Test d'initialisation Google Earth Engine...")
        try:
            ee.Initialize(credentials, project=project_id)
            print("[OK] Google Earth Engine initialise avec succes !")
            print()

            # Test simple d'une operation GEE
            print("[INFO] Test d'une operation GEE simple...")
            collection = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
            count = collection.size().getInfo()
            print(f"[OK] Test reussi - Collection Landsat contient {count} images")

            print()
            print("[SUCCES] Votre cle de service account GEE est valide et fonctionnelle.")
            return True

        except Exception as e:
            print(f"[ERREUR] Erreur d'initialisation GEE: {e}")
            if "invalid_scope" in str(e).lower():
                print("[INFO] Cette erreur indique souvent que la cle a expire ou que les permissions sont insuffisantes.")
            return False

    except ImportError as e:
        print(f"[ERREUR] Erreur d'import: {e}")
        print("Assurez-vous que google-auth et earthengine-api sont installes:")
        print("pip install google-auth earthengine-api")
        return False
    except Exception as e:
        print(f"[ERREUR] Erreur inattendue: {e}")
        return False

if __name__ == "__main__":
    success = test_gee_key()
    sys.exit(0 if success else 1)