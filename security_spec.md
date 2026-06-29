# CivicResolve Security Specifications (Attribute-Based Access Control)

This document outlines the strict security parameters, structural invariants, and test payload assertions for the Firestore security infrastructure.

---

## 1. Data Invariants

- **User Profiles (`/users/{userId}`)**: A user profile document is immutable with respect to its `email` and `id` properties. Users can never set or upgrade their own `role` or adjust their `points` directly without system or validation checks.
- **Issue Reports (`/reports/{reportId}`)**: Citizens can write new reports with a state of `"reported"` only. The fields `aiConfidence` and `aiReasoning` are system-only and cannot be updated by clients. Once an issue is in `"resolved"` (terminal state), no updates are allowed unless performed by an authorized administrator.
- **Status Audit History (`/status_history/{historyId}`)**: Status history records are completely immutable and append-only.
- **Verifications (`/verifications/{verificationId}`)**: A citizen cannot submit multiple verifications for the same issue report. Each verification must correspond to an existing active issue.
- **Leaderboard entries (`/leaderboard/{userId}`)**: Leaderboard entries are system-controlled cache documents and are client-immutable. Only read operations are permitted by clients.
- **Prediction History (`/prediction_history/{predictionId}`)**: Predictive records are strictly read-only for clients, as they are generated server-side by Google Gemini models.

---

## 2. The "Dirty Dozen" Threat Payloads

These 12 malicious payloads are engineered to exploit system trust. Our security rules mathematically block every single one of them.

### Threat 1: Self-Assigned Role Escalation
- **Target Path**: `/users/nav090105@gmail.com`
- **Exploit payload**:
  ```json
  {
    "role": "admin",
    "email": "nav090105@gmail.com",
    "name": "Nav"
  }
  ```
- **Expectation**: `PERMISSION_DENIED` - Citizen role is restricted, self-escalation blocked.

### Threat 2: Fraudulent Point Granting
- **Target Path**: `/users/nav090105@gmail.com`
- **Exploit payload**:
  ```json
  {
    "points": 99999,
    "email": "nav090105@gmail.com"
  }
  ```
- **Expectation**: `PERMISSION_DENIED` - Direct client modification of points is blocked.

### Threat 3: Spoofing Report Identity (Shadow Reporter)
- **Target Path**: `/reports/issue-999`
- **Exploit payload**:
  ```json
  {
    "reporterEmail": "victim@city.gov",
    "reporterName": "Victim Director",
    "description": "Faked garbage complaint",
    "status": "reported"
  }
  ```
- **Expectation**: `PERMISSION_DENIED` - Reporter email must strictly match the authenticated user's verified token email.

### Threat 4: Unauthorized Issue Status Elevation (State Jumping)
- **Target Path**: `/reports/issue-101` (Existing status: `"reported"`)
- **Exploit payload**:
  ```json
  {
    "status": "resolved",
    "resolutionProofDescription": "Faked resolve by non-official citizen"
  }
  ```
- **Expectation**: `PERMISSION_DENIED` - Direct resolution upgrades are restricted to authorized accounts in the `authority` role.

### Threat 5: AI Score Spoofing & Poisoning
- **Target Path**: `/reports/issue-101`
- **Exploit payload**:
  ```json
  {
    "aiConfidence": 1.0,
    "aiReasoning": "Malicious override of AI diagnostics"
  }
  ```
- **Expectation**: `PERMISSION_DENIED` - System-generated field overrides are client-blocked.

### Threat 6: Modifying Resolved Terminal Incidents
- **Target Path**: `/reports/issue-104` (Existing status: `"resolved"`)
- **Exploit payload**:
  ```json
  {
    "description": "Altering resolved history to cause confusion"
  }
  ```
- **Expectation**: `PERMISSION_DENIED` - Incidents with a resolved state are locked to client updates.

### Threat 7: Faking verification Multi-Vote (Collusion)
- **Target Path**: `/verifications/nav_issue-101`
- **Exploit payload**:
  ```json
  {
    "userId": "otheruser@gmail.com",
    "reportId": "issue-101",
    "voteType": "upvote"
  }
  ```
- **Expectation**: `PERMISSION_DENIED` - The verification ID or sender ID must match the verified user's active session.

### Threat 8: Predictive Forecast Poisoning
- **Target Path**: `/prediction_history/malicious-pred`
- **Exploit payload**:
  ```json
  {
    "region": "Downtown",
    "riskScore": 100,
    "reasoning": "Poisoning municipal spatial modeling"
  }
  ```
- **Expectation**: `PERMISSION_DENIED` - Predictions are strictly read-only for client profiles.

### Threat 9: Blanket Directory Scraping
- **Target Path**: Querying `/reports` without constraint.
- **Exploit payload**: `db.collection('reports').get()`
- **Expectation**: Secured by query-enforcer rules verifying structured outputs.

### Threat 10: Status History Manipulation
- **Target Path**: `/status_history/audit-trail-1`
- **Exploit payload**:
  ```json
  {
    "newStatus": "resolved",
    "changedBy": "hacker@evil.org"
  }
  ```
- **Expectation**: `PERMISSION_DENIED` - Status history collection is immutable and write-protected from clients.

### Threat 11: Leaderboard Spoofing
- **Target Path**: `/leaderboard/nav090105@gmail.com`
- **Exploit payload**:
  ```json
  {
    "rank": 1,
    "points": 5000000
  }
  ```
- **Expectation**: `PERMISSION_DENIED` - Standings entries are read-only.

### Threat 12: Resource ID Poisoning (Denial of Wallet)
- **Target Path**: `/reports/issue-!!!!!!!!!!!!!!EXTREMELYLONGJUNKID!!!!!!!!!!!!!!!!!!!!`
- **Exploit payload**: Any create payload with malicious ID format.
- **Expectation**: `PERMISSION_DENIED` - Document IDs must pass the `isValidId()` regex check and size cap.

---

## 3. Security Rules Test Runner Schema

```typescript
import { assertSucceeds, assertFails, initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe("CivicResolve Fortress Rules Unit Tests", () => {
  let testEnv;

  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "civicresolve-prod-security",
      firestore: {
        rules: require('fs').readFileSync('firestore.rules', 'utf8')
      }
    });
  });

  it("Threat 1: User cannot self-assign authority roles", async () => {
    const context = testEnv.authenticatedContext("nav_uid", { email: "nav@gmail.com", email_verified: true });
    const db = context.firestore();
    await assertFails(db.collection("users").doc("nav@gmail.com").set({
      role: "authority",
      email: "nav@gmail.com"
    }));
  });

  it("Threat 5: Client cannot overwrite AI telemetry diagnostics", async () => {
    const context = testEnv.authenticatedContext("nav_uid", { email: "nav@gmail.com", email_verified: true });
    const db = context.firestore();
    await assertFails(db.collection("reports").doc("issue-101").update({
      aiConfidence: 0.99,
      aiReasoning: "Tampered"
    }));
  });
});
```
