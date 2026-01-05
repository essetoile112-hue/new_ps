# 🧪 GUIDE DE TEST MANUEL

## Prérequis
- [ ] Frontend en démarrage: `npm run dev`
- [ ] Backend en démarrage: `npm run start` (backend folder)
- [ ] Firebase connecté et données disponibles
- [ ] Console DevTools ouvert (F12)

---

## Test 1: Training du Modèle

### Étape 1: Naviguer vers la page
1. Ouvrir http://localhost:5173 (ou le port de votre frontend)
2. Aller à la page "Fixed Stations" ou là où PredictionChart est utilisé
3. Localiser la section "CO Emissions Prediction"

### Étape 2: Vérifier l'état initial
```
VÉRIFIER:
✓ Bouton "Train Model" est visible et ACTIVÉ
✓ Bouton "Predict" est visible mais DÉSACTIVÉ (grisé)
✓ Pas de message d'erreur
✓ Pas de prédictions affichées
```

### Étape 3: Cliquer sur "Train Model"
1. Ouvrir Console DevTools (F12 → Console)
2. Cliquer sur le bouton "Train Model"
3. Observer les logs:

```javascript
// LOGS ATTENDUS:
[PredictionChart] Starting training...

// Après ~10-30 secondes (dépend de la taille du dataset):
[PredictionChart] Training successful: {
  success: true,
  message: "Model trained successfully",
  dataPoints: 720,
  daysUsed: 30,
  trainingDate: "2025-12-20T14:15:00.000Z"
}
```

### Étape 4: Vérifier le résultat
```
VÉRIFIER:
✓ Bouton change en "Training..." pendant l'exécution
✓ Message bleu: "✓ Model trained successfully"
✓ Bouton "Predict" devient ACTIVÉ
✓ PAS de message d'erreur rouge
✓ setTrained(true) dans la state
```

### Scénario de Timeout (Test optionnel)
Pour tester le timeout (modifier le code temporairement):
```typescript
// Changez la valeur timeout à 1 seconde pour test:
timeoutId = setTimeout(() => { ... }, 1000);  // au lieu de 300000

// Vérifier:
✓ Message d'erreur: "Training took too long (5+ minutes)"
✓ PAS d'erreur "signal is aborted" confuse
✓ Bouton "Predict" reste DÉSACTIVÉ
```

---

## Test 2: Prédiction

### Étape 1: Prérequis
- [ ] Modèle doit être entraîné (Test 1 réussi)
- [ ] Bouton "Predict" doit être ACTIVÉ

### Étape 2: Cliquer sur "Predict"
1. Console toujours ouverte
2. Cliquer sur le bouton "Predict"
3. Observer les logs:

```javascript
// LOGS ATTENDUS:
[PredictionChart] Starting prediction for 7 days (168 hours)...

// Après ~5-30 secondes:
[PredictionChart] Prediction result: {
  success: true,
  prediction: {
    future_values: [120.34, 118.56, 115.23, ...],  // 168 valeurs
    future_dates: ["2025-12-20 14:00", "2025-12-20 15:00", ...],
    accuracy: {
      mae: "12.3456",
      rmse: "15.6789"
    }
  },
  generatedAt: "2025-12-20T14:15:00.000Z",
  stepsGenerated: 168
}

[PredictionChart] Generated 168 predictions
```

### Étape 3: Vérifier le résultat
```
VÉRIFIER:
✓ Bouton change en "Predicting..." pendant l'exécution
✓ Chart se met à jour avec la courbe orange (prédictions)
✓ Affichage des 2 métriques:
   - Mean Absolute Error (MAE): ~12.3456
   - Root Mean Squared Error (RMSE): ~15.6789
✓ X-axis affiche les dates: "20/14:00", "21/01:00", etc
✓ Légende affiche:
   - Green area: "Actual Data"
   - Orange dashed: "Prediction"
✓ PAS de message d'erreur rouge
```

### Étape 4: Vérifier le Chart
```
CHART VISUEL:
✓ Ligne verte: Dernières 30 jours de données réelles
✓ Ligne orange pointillée: 7 jours de prédictions futures
✓ Les deux courbes sont visuellement différentes (pas de copie)
✓ Transition smooth entre données réelles et prédites
✓ Tooltip affiche les valeurs exactes au survol
```

---

## Test 3: Error Cases

### Test 3.1: Erreur Réseau
1. Ouvrir DevTools → Network tab
2. Activer "Offline" (throttle → Offline)
3. Cliquer sur "Train Model"
4. Attendre ~5s

```
VÉRIFIER:
✓ Message d'erreur: "Failed to train model" ou "Network error"
✓ PAS d'erreur "signal is aborted without reason"
✓ Bouton "Predict" reste DÉSACTIVÉ
✓ Timeout est nettoyé (vérifier dans code)
```

### Test 3.2: Timeout Simulé
Modifier le timeout à 2 secondes (dans le code temporairement):

```typescript
// Dans handleTrain():
timeoutId = setTimeout(() => { ... }, 2000);  // 2s au lieu de 300s
```

1. Cliquer sur "Train Model"
2. Attendre 2+ secondes

```
VÉRIFIER:
✓ Message d'erreur: "Training took too long (5+ minutes)"
✓ Console log: "[PredictionChart] Training timeout reached"
✓ PAS d'erreur "signal is aborted without reason"
✓ Bouton état correct
```

### Test 3.3: Erreur Serveur Simulée
1. Arrêter le backend
2. Cliquer sur "Train Model"

```
VÉRIFIER:
✓ Message d'erreur: "Failed to connect" ou "Server error"
✓ Timeout est nettoyé
✓ État de l'app reste cohérent
```

---

## Test 4: Répétitions

### Test 4.1: Train → Train Successif
1. Cliquer "Train Model"
2. Attendre succès
3. Cliquer "Train Model" à nouveau
4. Attendre succès

```
VÉRIFIER:
✓ Deuxième train réussit
✓ État réinitalisé: prediction=null, error=null
✓ Pas de données dupliquées
```

### Test 4.2: Train → Predict → Train → Predict
1. Cliquer "Train Model" → succès
2. Cliquer "Predict" → affiche chart
3. Cliquer "Train Model" → succès
4. Cliquer "Predict" → chart mis à jour

```
VÉRIFIER:
✓ Chaque opération réussit
✓ Chart se met à jour chaque fois
✓ Pas de données dupliquées
✓ Pas d'erreurs de mémoire (TensorFlow dispose)
```

---

## Test 5: Validation des Données

### Test 5.1: Vérifier les Prédictions
Dans Console:
```javascript
// Après une prédiction réussie:
const values = prediction.future_values;  // devrait être ~168 nombres
const dates = prediction.future_dates;    // devrait être ~168 dates

console.log('Count match:', values.length === dates.length);     // true
console.log('All numbers:', values.every(v => typeof v === 'number'));  // true
console.log('Date format sample:', dates[0]);  // "2025-12-20 14:00"
```

### Test 5.2: Vérifier la Chronologie
```javascript
// Les dates doivent être strictement croissantes:
const dates = prediction.future_dates.map(d => new Date(d).getTime());
const isSorted = dates.every((v, i) => i === 0 || v > dates[i-1]);
console.log('Dates sorted:', isSorted);  // true
```

### Test 5.3: Vérifier les Valeurs
```javascript
// Les prédictions doivent être dans une plage raisonnable:
const values = prediction.future_values;
console.log('Min:', Math.min(...values));     // ex: ~100
console.log('Max:', Math.max(...values));     // ex: ~200
console.log('Mean:', values.reduce((a,b)=>a+b)/values.length);  // raisonnable
```

---

## Test 6: Performance

### Métrique de Temps
Mesurer dans Console:
```javascript
// Avant de cliquer "Train Model":
console.time('Training');

// [Cliquer sur Train Model]

// Dans les logs de succès, regarder le console.time():
console.timeEnd('Training');  // ex: "Training: 25341ms"
```

```
TEMPS ATTENDU:
- Training: 10-30 secondes (dataset ~720 points)
- Prediction: 5-15 secondes (168 forecasts)
- Timeout: 300s training, 120s prediction (généreusement sûr)
```

### Utilisation Mémoire
Ouvrir DevTools → Memory tab:
```
VÉRIFIER:
✓ Pas de croissance de mémoire après le training
✓ Pas de fuite TensorFlow (dispose() appelé)
✓ Modèle supprimé correctement après dispose
```

---

## Checklist de Validation Final

```
ÉTAT INITIAL:
✓ [ ] Train button est ENABLED
✓ [ ] Predict button est DISABLED
✓ [ ] Pas d'erreur visible
✓ [ ] Pas de chart

APRÈS TRAINING:
✓ [ ] Message de succès bleu
✓ [ ] Train button reste activé (peut retrain)
✓ [ ] Predict button devient ENABLED
✓ [ ] Console logs montrent succès
✓ [ ] trained=true dans state

APRÈS PREDICTION:
✓ [ ] Chart affiche données + prédictions
✓ [ ] Accuracy metrics affichés
✓ [ ] Legend montre "Actual Data" et "Prediction"
✓ [ ] Dates formatées correctement
✓ [ ] 168 prédictions générées

ERROR HANDLING:
✓ [ ] Erreur réseau affichée clairement
✓ [ ] Timeout affiche "took too long" (pas confus)
✓ [ ] Timeout est nettoyé (pas de fuite)
✓ [ ] État app reste cohérent après erreur

PERFORMANCE:
✓ [ ] Training complète en <1 minute
✓ [ ] Prediction complète en <30 sec
✓ [ ] Pas de lag visuel pendant l'exécution
✓ [ ] Pas de memory leak après múltiples runs
```

---

## Debugging Tips

### Si vous voyez l'ancien bug:
```
❌ "AbortError: signal is aborted without reason"

Solution:
1. Vérifier que vous avez bien la NOUVELLE version du code
2. Hard refresh (Ctrl+F5) pour vider le cache
3. Redémarrer le serveur frontend
4. Vérifier dans PredictionChart.tsx ligne 28 que timeoutId est déclaré
```

### Si la prédiction ne s'affiche pas:
```
Debugging:
1. Ouvrir Console (F12 → Console)
2. Chercher le log: "[PredictionChart] Prediction result:"
3. Vérifier que prediction.future_values existe
4. Vérifier que prediction.future_dates existe
5. Vérifier qu'ils ont la même longueur (168)
```

### Si le training prend trop longtemps:
```
Possibilités:
1. Dataset trop grand (>10k points) → attendre ou augmenter timeout
2. Backend lent → vérifier Firebase connection
3. TensorFlow pas optimisé → c'est normal en JS
```

---

## Points Importants

🔴 **NE PAS faire**:
- Fermer l'onglet pendant training (perd le modèle)
- Naviguer loin (perd le modèle)
- Modifier les timestamps dans Firebase

🟢 **À faire**:
- Attendre le succès avant nouvelle action
- Vérifier les logs de Console
- Valider les données affichées
- Tester les cas d'erreur

---

**Status**: ✅ Ready for Manual Testing  
**Test Date**: December 20, 2025  
**Expected Result**: ALL TESTS PASS ✅
