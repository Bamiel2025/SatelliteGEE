# 🛰️ Analyseur d'Images Satellites avec Google Earth Engine

Un outil éducatif interactif pour analyser et comparer des images satellites, mesurer des distances et surfaces sur des cartes.

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** (version 16 ou supérieure) : [Télécharger](https://nodejs.org/)
- **Python** (version 3.8 ou supérieure) : [Télécharger](https://python.org/)
- **Git** : [Télécharger](https://git-scm.com/)

## 🚀 Installation

### Étape 1 : Cloner le repository

```bash
git clone https://github.com/Bamiel2025/Analyseur-satellite.git
cd Analyseur-satellite
```

### Étape 2 : Installer les dépendances

#### Pour le frontend (React) :
```bash
cd frontend
npm install
```

#### Pour le backend (Python) :
```bash
cd backend
pip install -r requirements.txt
```

### Étape 3 : Configuration de Google Earth Engine

1. Créer un compte Google Earth Engine : [earthengine.google.com](https://earthengine.google.com/)
2. Créer un projet Google Cloud : [console.cloud.google.com](https://console.cloud.google.com/)
3. Activer l'API Google Earth Engine
4. Créer des credentials et les sauvegarder dans un fichier `.env`

#### Fichier `.env` :
```env
GOOGLE_EARTH_ENGINE_PROJECT_ID=votre-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/credentials.json
```

## 🎯 Utilisation

### Démarrer l'application

1. **Terminal 1** - Lancer le serveur backend :
```bash
cd backend
python server.py
```

2. **Terminal 2** - Lancer le frontend :
```bash
cd frontend
npm start
```

3. Ouvrir votre navigateur à l'adresse : `http://localhost:3000`

### 🌐 Accès Direct en Ligne

**Pour un accès rapide sans installation :**
```
https://bamiel2025.github.io/Analyseur-satellite/
```

*Note : Certaines fonctionnalités avancées nécessitent l'installation complète.*

## 🚀 Déploiement

### Déploiement du Backend sur Back4App

Le backend peut être déployé sur Back4App en tant que conteneur Docker :

1. Créer un compte Back4App
2. Créer une nouvelle application
3. Sélectionner "Container as a Service (CaaS)"
4. Uploader le dossier `backend/` comme source
5. Configurer les variables d'environnement dans Back4App
6. Déployer

### Déploiement du Frontend sur GitHub Pages

Le frontend se déploie automatiquement sur GitHub Pages via GitHub Actions :

1. Pousser le code vers la branche `main`
2. Le workflow GitHub Actions se déclenche automatiquement
3. Le site est disponible sur `https://votre-username.github.io/nom-du-repo/`

### Fonctionnalités principales

#### 📍 Recherche de lieux
- Saisir un nom de lieu dans la barre de recherche
- Utiliser les coordonnées GPS directement
- Sélectionner un lieu sur la carte

#### 📐 Outils de mesure
- **Mesure de distance** : Cliquer pour tracer une ligne
- **Mesure de surface** : Cliquer pour définir un polygone
- **Double-clic** ou bouton "Terminer" pour finaliser

#### 🖼️ Comparaison d'images
- Sélectionner des dates "avant" et "après"
- Charger des images satellites
- Appliquer des filtres (NDVI, NDWI, RGB)

#### 📊 Analyse des résultats
- Visualiser les mesures dans la section "Résultats"
- Exporter les rapports en PDF
- Sauvegarder les analyses

## 📁 Structure du projet

```
├── frontend/
│   ├── src/
│   │   ├── components/          # Composants React
│   │   │   ├── App.jsx         # Composant principal
│   │   │   ├── SplitMapComponent.jsx    # Carte interactive
│   │   │   ├── ControlPanel.jsx         # Panneau de contrôle
│   │   │   ├── MeasurementControls.jsx  # Outils de mesure
│   │   │   └── AnalysisResults.jsx      # Résultats d'analyse
│   │   ├── services/           # Services backend
│   │   │   ├── geeService.js   # Service Google Earth Engine
│   │   │   └── locationService.js       # Service de géolocalisation
│   │   └── style.css           # Styles CSS
│   ├── public/                 # Assets statiques
│   ├── docs/                   # Site construit pour GitHub Pages
│   ├── package.json           # Dépendances Node.js
│   ├── vite.config.js         # Configuration Vite
│   └── .github/workflows/     # Workflows GitHub Actions
├── backend/
│   ├── server.py               # Serveur backend Python
│   ├── requirements.txt        # Dépendances Python
│   ├── Dockerfile             # Configuration Docker
│   ├── .env                   # Variables d'environnement
│   └── ...                    # Autres fichiers Python
└── README.md                  # Ce fichier
```

## 🔧 Configuration avancée

### Variables d'environnement

Créer un fichier `.env` à la racine avec :

```env
# Google Earth Engine
GOOGLE_EARTH_ENGINE_PROJECT_ID=votre-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json

# Serveur
PORT=5000
FRONTEND_PORT=3000

# Debug
DEBUG=true
```

### Personnalisation des filtres

Les filtres disponibles sont configurés dans `src/services/geeService.js` :
- `rgb` : Image couleur naturelle
- `ndvi` : Indice de végétation
- `ndwi` : Indice d'eau

## 🐛 Dépannage

### Problèmes courants

#### Erreur de connexion GEE
- Vérifier que votre projet Google Cloud est activé
- Contrôler les credentials dans le fichier `.env`
- S'assurer que l'API Earth Engine est activée

#### Images qui ne se chargent pas
- Vérifier la connexion internet
- Contrôler les dates sélectionnées
- S'assurer que la région sélectionnée a des images disponibles

#### Erreurs de dépendances
```bash
# Nettoyer et réinstaller le frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Pour le backend
cd ../backend
pip install --upgrade pip
pip install -r requirements.txt
```

## 📚 Ressources pédagogiques

### Pour les élèves
- [Documentation Google Earth Engine](https://developers.google.com/earth-engine)
- [Tutoriels cartographie](https://leafletjs.com/)
- [Guide React](https://react.dev/)

### Pour les enseignants
- Guide d'installation détaillé
- Exercices pratiques suggérés
- Corrections des exercices

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Créer une issue sur GitHub
- Contacter l'enseignant référent
- Consulter la documentation

---

**Développé avec ❤️ pour l'enseignement des sciences de la Terre et de l'analyse d'images satellites.**