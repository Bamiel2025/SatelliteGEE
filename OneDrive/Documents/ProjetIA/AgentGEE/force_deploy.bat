@echo off
echo 🔧 Forcer le redémarrage du déploiement GitHub Pages
echo ===================================================
echo.

echo 📁 Répertoire: %cd%
echo.

echo 💾 Ajout de la modification du workflow...
git add .github/workflows/deploy.yml

echo.
echo 💾 Commit de la modification...
git commit -m "Fix: Add manual workflow trigger to bypass queued jobs"

echo.
echo ⬆️  Push vers GitHub...
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCÈS ! Modification poussée
    echo.
    echo 📋 PROCHAINES ÉTAPES :
    echo 1. Allez dans Actions sur GitHub
    echo 2. Cliquez sur le workflow "Deploy to GitHub Pages"
    echo 3. Vous devriez voir un bouton "Run workflow" (bouton bleu)
    echo 4. Cliquez dessus pour déclencher manuellement
    echo.
    echo 🎯 Cette fois le workflow devrait se lancer immédiatement !
) else (
    echo ❌ Erreur lors du push
)

echo.
pause