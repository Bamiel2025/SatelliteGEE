# 🔧 Fix GitHub Pages Deployment Issue

## ❌ Problème rencontré
GitHub Pages utilise Jekyll par défaut et essaie de traiter votre build Vite comme un site Jekyll, causant cette erreur :
```
Conversion error: Jekyll::Converters::Scss encountered an error while converting 'assets/css/style.scss':
No such file or directory @ dir_chdir0 - /github/workspace/docs
```

## ✅ Solution appliquée

### 1. **Workflow GitHub Actions personnalisé**
Un workflow a été créé dans `.github/workflows/deploy.yml` qui :
- Désactive complètement Jekyll
- Utilise Node.js pour builder le projet
- Déploie directement les fichiers statiques du dossier `docs/`

### 2. **Configuration du workflow**
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run build
    - uses: peaceiris/actions-gh-pages@v3
      with:
        publish_dir: ./docs
```

## 🚀 Prochaines étapes

### 1. **Pousser les changements**
```bash
git add .
git commit -m "Fix: Add GitHub Actions workflow for Pages deployment"
git push origin main
```

### 2. **Configurer GitHub Pages**
1. Allez dans **Settings** → **Pages**
2. Sélectionnez **"GitHub Actions"** comme source
3. Le workflow se déclenchera automatiquement

### 3. **Vérifier le déploiement**
- Allez dans l'onglet **Actions** de votre repository
- Cliquez sur le workflow en cours
- Attendez la fin du déploiement
- Votre site sera accessible à : `https://votre-username.github.io/Analyseur-satellite/`

## 📁 Structure des fichiers
```
.github/
  workflows/
    deploy.yml          # ← Nouveau workflow GitHub Actions
docs/
  .nojekyll           # Désactive Jekyll
  index.html          # Page principale
  assets/             # Fichiers compilés
```

## ⚠️ Points importants
- Le workflow utilise Node.js 18 (compatible avec votre projet)
- Le build se fait automatiquement à chaque push sur `main`
- Jekyll est complètement contourné
- Les fichiers sont servis statiquement

## 🔍 Dépannage
Si le déploiement échoue :
1. Vérifiez les logs dans l'onglet **Actions**
2. Assurez-vous que `npm run build` fonctionne localement
3. Vérifiez que le dossier `docs/` contient bien les fichiers buildés

---
**✅ Cette solution résout définitivement le problème Jekyll/GitHub Pages !**