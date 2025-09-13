#!/usr/bin/env python3
"""
Script pour tester la validité d'une clé de service account Google Earth Engine
"""
import os
import json
import base64
import sys
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

def test_gee_key():
    print("=== Test de la Clé Google Earth Engine ===\n")

    # Récupérer les variables d'environnement
    project_id = os.environ.get('GEE_PROJECT_ID')
    service_account_key = os.environ.get('GEE_SERVICE_ACCOUNT_KEY')
    service_account_key_b64 = os.environ.get('GEE_SERVICE_ACCOUNT_KEY_B64')

    print(f"Project ID: {project_id}")
    print(f"Service Account Key présent: {bool(service_account_key)}")
    print(f"Service Account Key B64 présent: {bool(service_account_key_b64)}")
    print()

    if not project_id:
        print("❌ Erreur: GEE_PROJECT_ID n'est pas défini")
        return False

    if not service_account_key and not service_account_key_b64:
        print("❌ Erreur: Aucune clé de service account trouvée")
        print("Définissez GEE_SERVICE_ACCOUNT_KEY ou GEE_SERVICE_ACCOUNT_KEY_B64")
        return False

    try:
        # Importer les modules nécessaires
        print("🔄 Import des modules GEE...")
        import ee
        from google.oauth2 import service_account
        print("✅ Modules importés avec succès")
        print()

        # Préparer la clé
        if service_account_key_b64:
            print("🔄 Décodage de la clé base64...")
            try:
                key_json = base64.b64decode(service_account_key_b64).decode('utf-8')
                print("✅ Clé décodée avec succès")
            except Exception as e:
                print(f"❌ Erreur de décodage base64: {e}")
                return False
        else:
            key_json = service_account_key

        # Parser le JSON
        print("🔄 Analyse du JSON de la clé...")
        try:
            key_data = json.loads(key_json)
            print("✅ JSON analysé avec succès")
            print(f"   Service Account: {key_data.get('client_email', 'N/A')}")
            print(f"   Project ID: {key_data.get('project_id', 'N/A')}")
        except Exception as e:
            print(f"❌ Erreur d'analyse JSON: {e}")
            return False

        print()

        # Créer les credentials
        print("🔄 Création des credentials...")
        try:
            credentials = service_account.Credentials.from_service_account_info(key_data)
            print("✅ Credentials créés avec succès")
        except Exception as e:
            print(f"❌ Erreur de création des credentials: {e}")
            return False

        print()

        # Tester l'initialisation GEE
        print("🔄 Test d'initialisation Google Earth Engine...")
        try:
            ee.Initialize(credentials, project=project_id)
            print("✅ Google Earth Engine initialisé avec succès !")
            print()

            # Test simple d'une opération GEE
            print("🔄 Test d'une opération GEE simple...")
            collection = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
            count = collection.size().getInfo()
            print(f"✅ Test réussi - Collection Landsat contient {count} images")

            print()
            print("🎉 SUCCÈS TOTAL !")
            print("Votre clé de service account GEE est valide et fonctionnelle.")
            return True

        except Exception as e:
            print(f"❌ Erreur d'initialisation GEE: {e}")
            if "invalid_scope" in str(e).lower():
                print("💡 Cette erreur indique souvent que la clé a expiré ou que les permissions sont insuffisantes.")
            return False

    except ImportError as e:
        print(f"❌ Erreur d'import: {e}")
        print("Assurez-vous que google-auth et earthengine-api sont installés:")
        print("pip install google-auth earthengine-api")
        return False
    except Exception as e:
        print(f"❌ Erreur inattendue: {e}")
        return False

if __name__ == "__main__":
    success = test_gee_key()
    sys.exit(0 if success else 1)