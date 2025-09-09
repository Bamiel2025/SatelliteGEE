@echo off
echo 🚀 Déploiement GitHub Pages - Script automatique
echo ================================================
echo.

REM Vérifier si on est dans le bon répertoire
if not exist "package.json" (
    echo ❌ Erreur: Vous n'êtes pas dans le répertoire du projet
    echo Allez dans: cd OneDrive\Documents\ProjetIA\AgentGEE\
    pause
    exit /b 1
)

echo 📁 Répertoire: %cd%
echo.

REM Vérifier l'état Git
echo 🔍 Vérification de l'état Git...
git status --porcelain >nul 2>&1

if %errorlevel% equ 0 (
    echo.
    echo 📝 Fichiers à commiter détectés
) else (
    echo ❌ Erreur Git
    pause
    exit /b 1
)

echo.
echo 📦 Ajout de tous les fichiers...
git add .

echo.
echo 💾 Commit des changements...
git commit -m "Fix: Complete GitHub Pages deployment setup

- Add GitHub Actions workflow for static deployment
- Add .nojekyll and _config.yml to disable Jekyll
- Add comprehensive deployment documentation
- Fix Jekyll/SCSS conversion errors"

if %errorlevel% equ 0 (
    echo.
    echo ⬆️  Push vers GitHub...
    git push origin main

    if %errorlevel% equ 0 (
        echo.
        echo ✅ SUCCÈS ! Tous les fichiers ont été poussés sur GitHub
        echo.
        echo 📋 PROCHAINES ÉTAPES :
        echo 1. Allez sur https://github.com/votre-username/Analyseur-satellite
        echo 2. Settings → Pages → Source: Changez vers 'GitHub Actions'
        echo 3. Actions → Attendez le workflow 'Deploy to GitHub Pages'
        echo 4. Votre site sera à: https://votre-username.github.io/Analyseur-satellite/
        echo.
        echo 🎉 Le problème Jekyll sera résolu !
    ) else (
        echo ❌ Erreur lors du push
        pause
        exit /b 1
    )
) else (
    echo ❌ Erreur lors du commit
    pause
    exit /b 1
)

echo.
pause