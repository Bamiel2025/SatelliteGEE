#!/bin/bash

echo "🚀 Déploiement GitHub Pages - Script automatique"
echo "================================================"

# Vérifier si on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Vous n'êtes pas dans le répertoire du projet"
    echo "Allez dans: cd OneDrive/Documents/ProjetIA/AgentGEE/"
    exit 1
fi

echo "📁 Répertoire: $(pwd)"
echo ""

# Vérifier l'état Git
echo "🔍 Vérification de l'état Git..."
git status --porcelain

if [ $? -eq 0 ]; then
    echo ""
    echo "📝 Fichiers à commiter détectés"
else
    echo "❌ Erreur Git"
    exit 1
fi

echo ""
echo "📦 Ajout de tous les fichiers..."
git add .

echo ""
echo "💾 Commit des changements..."
git commit -m "Fix: Complete GitHub Pages deployment setup

- Add GitHub Actions workflow for static deployment
- Add .nojekyll and _config.yml to disable Jekyll
- Add comprehensive deployment documentation
- Fix Jekyll/SCSS conversion errors"

if [ $? -eq 0 ]; then
    echo ""
    echo "⬆️  Push vers GitHub..."
    git push origin main

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ SUCCÈS ! Tous les fichiers ont été poussés sur GitHub"
        echo ""
        echo "📋 PROCHAINES ÉTAPES :"
        echo "1. Allez sur https://github.com/votre-username/Analyseur-satellite"
        echo "2. Settings → Pages → Source: Changez vers 'GitHub Actions'"
        echo "3. Actions → Attendez le workflow 'Deploy to GitHub Pages'"
        echo "4. Votre site sera à: https://votre-username.github.io/Analyseur-satellite/"
        echo ""
        echo "🎉 Le problème Jekyll sera résolu !"
    else
        echo "❌ Erreur lors du push"
        exit 1
    fi
else
    echo "❌ Erreur lors du commit"
    exit 1
fi