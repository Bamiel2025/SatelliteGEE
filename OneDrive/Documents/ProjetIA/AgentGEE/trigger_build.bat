@echo off
echo 🔄 Déclenchement manuel du build GitHub Pages
echo ============================================
echo.

echo 📁 Répertoire: %cd%
echo.

echo 💾 Création d'un commit vide pour déclencher le build...
git commit --allow-empty -m "Trigger: Manual deployment trigger"

echo.
echo ⬆️  Push du commit vide...
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCÈS ! Commit vide poussé
    echo.
    echo 📋 PROCHAINES ÉTAPES :
    echo 1. Allez dans l'onglet Actions de votre repository
    echo 2. Cliquez sur le workflow "Deploy to GitHub Pages"
    echo 3. Le build devrait se lancer automatiquement
    echo.
    echo ⏱️  Temps estimé: 2-3 minutes
) else (
    echo ❌ Erreur lors du push
)

echo.
pause