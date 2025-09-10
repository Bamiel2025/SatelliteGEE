@echo off
echo 🔧 Push des corrections GitHub Pages
echo ====================================
echo.

echo 📁 Répertoire: %cd%
echo.

echo ⬆️  Push vers GitHub...
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCÈS ! Corrections poussées sur GitHub
    echo.
    echo 📋 PROCHAINES ÉTAPES :
    echo 1. Allez sur https://github.com/votre-username/Analyseur-satellite
    echo 2. Settings → Pages → Source: Changez vers 'GitHub Actions'
    echo 3. Actions → Attendez le workflow 'Deploy to GitHub Pages'
    echo 4. Votre site sera à: https://votre-username.github.io/Analyseur-satellite/
    echo.
    echo 🎉 Le problème Jekyll est maintenant résolu !
) else (
    echo ❌ Erreur lors du push
    echo.
    echo 💡 Solutions possibles :
    echo - Vérifiez votre connexion internet
    echo - Vérifiez vos credentials Git (git config --list)
    echo - Essayez: git push -u origin main
)

echo.
pause