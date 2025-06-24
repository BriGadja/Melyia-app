# 🧪 TESTS APIS ADMIN - RÉSULTATS

> **Version** : v26.0  
> **Date test** : [À compléter après déploiement]  
> **Environnement** : Production (app-dev.melyia.com)

---

## 📋 CHECKLIST PRÉ-TEST

### Prérequis :

- [ ] Corrections PostgreSQL appliquées
- [ ] server.js mis à jour
- [ ] PM2 redémarré
- [ ] Vue admin_stats avec 9 colonnes

### Compte de test :

- **Email** : brice@melyia.com
- **Password** : password
- **Role** : admin

---

## 🔐 TEST AUTHENTIFICATION

### `POST /api/auth/login`

```bash
curl -X POST https://app-dev.melyia.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"brice@melyia.com","password":"password"}'
```

**Résultat attendu** :

- ✅ success: true
- ✅ token JWT valide
- ✅ user.role: "admin"
- ✅ redirectUrl: "/admin/dashboard"

**Résultat obtenu** : [À compléter]

---

## 📊 TEST API ADMIN/STATS

### `GET /api/admin/stats`

```bash
curl -H "Authorization: Bearer TOKEN" \
  https://app-dev.melyia.com/api/admin/stats
```

**Résultat attendu** :

```json
{
  "success": true,
  "data": {
    "total_users": [nombre],
    "total_dentists": [nombre],
    "total_patients": [nombre],
    "total_admins": [nombre],
    "total_documents": [nombre],
    "total_conversations": [nombre],
    "active_users": [nombre],
    "disk_usage_mb": [nombre],
    "last_updated": "[timestamp]"
  }
}
```

**Points de vérification** :

- [ ] 9 colonnes présentes (vs 4 avant)
- [ ] Pas d'erreur PostgreSQL
- [ ] Valeurs cohérentes
- [ ] Temps de réponse < 1s

**Résultat obtenu** : [À compléter]

---

## 👥 TEST API ADMIN/USERS

### `GET /api/admin/users`

```bash
curl -H "Authorization: Bearer TOKEN" \
  https://app-dev.melyia.com/api/admin/users
```

**Résultat attendu** :

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "role": "patient",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2025-01-01",
      "isActive": true,
      "lastLogin": "2025-01-24",
      "displayName": "John Doe (patient)"
    }
  ],
  "total": [nombre],
  "message": "Utilisateurs récupérés avec succès"
}
```

**Points de vérification** :

- [ ] Pas d'erreur JOIN
- [ ] Colonnes correctes
- [ ] displayName formaté
- [ ] Limitation à 100 utilisateurs

**Résultat obtenu** : [À compléter]

---

## 📄 TEST API ADMIN/DOCUMENTS

### `GET /api/admin/documents`

```bash
curl -H "Authorization: Bearer TOKEN" \
  https://app-dev.melyia.com/api/admin/documents
```

**Résultat attendu** :

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fileName": "document.pdf",
      "filePath": "/path/to/file",
      "createdAt": "2025-01-24",
      "documentType": "radiographie",
      "fileSize": 1234567,
      "dentistEmail": "dentiste@example.com",
      "patientEmail": "patient@example.com",
      "patientName": "John Doe"
    }
  ],
  "total": [nombre]
}
```

**Points de vérification** :

- [ ] Colonnes document_type, file_size présentes
- [ ] JOINs avec tables users fonctionnels
- [ ] Limitation à 50 documents
- [ ] Tri par created_at DESC

**Résultat obtenu** : [À compléter]

---

## 💬 TEST API ADMIN/CONVERSATIONS

### `GET /api/admin/conversations`

```bash
curl -H "Authorization: Bearer TOKEN" \
  https://app-dev.melyia.com/api/admin/conversations
```

**Résultat attendu** :

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "message": "Question patient",
      "response": "Réponse IA",
      "created_at": "2025-01-24",
      "patient_email": "patient@example.com",
      "dentist_email": "dentiste@example.com",
      "response_length": 156
    }
  ]
}
```

**Points de vérification** :

- [ ] Métadonnées conversations présentes
- [ ] JOINs utilisateurs OK
- [ ] Limitation à 20 conversations
- [ ] Tri chronologique

**Résultat obtenu** : [À compléter]

---

## 🗑️ TEST SUPPRESSION UTILISATEUR

### `DELETE /api/admin/users/:id`

```bash
curl -X DELETE -H "Authorization: Bearer TOKEN" \
  https://app-dev.melyia.com/api/admin/users/[ID_TEST]
```

**Résultat attendu** :

- ✅ Protection admin (erreur si role=admin)
- ✅ Suppression CASCADE des profils
- ✅ Confirmation de suppression

**Points de vérification** :

- [ ] Impossible de supprimer un admin
- [ ] CASCADE DELETE fonctionne
- [ ] Message de confirmation

**Résultat obtenu** : [À compléter]

---

## 📊 SYNTHÈSE DES TESTS

### Résultats globaux :

- **APIs testées** : 5/5
- **Succès** : [X/5]
- **Erreurs** : [X/5]
- **Performance** : [Acceptable/Dégradée]

### Points d'amélioration identifiés :

- [ ] [Point 1]
- [ ] [Point 2]

### Actions correctives :

- [ ] [Action 1]
- [ ] [Action 2]

---

## 🎯 VALIDATION DASHBOARD

### Test interface :

- [ ] http://localhost:5173/admin/dashboard charge
- [ ] Statistiques s'affichent correctement
- [ ] Pas d'erreurs JavaScript console
- [ ] Tableaux utilisateurs/documents OK

### Performance interface :

- [ ] Temps chargement < 3s
- [ ] Pas de lag sur interactions
- [ ] Données temps réel

---

**Testeur** : [Nom]  
**Date** : [Date test]  
**Statut global** : [ ] ✅ Tous tests OK | [ ] ⚠️ Problèmes mineurs | [ ] ❌ Problèmes critiques
