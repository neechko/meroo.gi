package handlers

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
    "strings"

    "github.com/go-chi/chi/v5"
    "github.com/neechko/meroo.gi/apps/api/internal/middleware"
)

func (a *API) ListWorkerInvites(w http.ResponseWriter, r *http.Request) {
    var invites []map[string]any
    if err := a.DB.Request(r.Context(), http.MethodGet, "worker_invites?order=created_at.desc&select=*", nil, "", &invites); err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
        return
    }
    writeJSON(w, http.StatusOK, invites)
}

func (a *API) InviteWorker(w http.ResponseWriter, r *http.Request) {
    adminID, _ := r.Context().Value(middleware.UserIDKey).(string)
    var req struct {
        Email          string `json:"email"`
        SeniorityLevel string `json:"seniority_level"`
        MaxCapacity    int    `json:"max_capacity"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "payload tidak valid"})
        return
    }
    email := strings.ToLower(strings.TrimSpace(req.Email))
    if email == "" || !strings.Contains(email, "@") {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "masukkan alamat Gmail yang valid"})
        return
    }
    if req.SeniorityLevel != "junior" && req.SeniorityLevel != "senior" && req.SeniorityLevel != "lead" {
        req.SeniorityLevel = "junior"
    }
    if req.MaxCapacity < 1 {
        req.MaxCapacity = 3
    }

    var existing []struct {
        ID string `json:"id"`
    }
    _ = a.DB.Request(r.Context(), http.MethodGet, "profiles?email=ilike."+email+"&select=id&limit=1", nil, "", &existing)

    inviteStatus := "pending"
    if len(existing) > 0 {
        inviteStatus = "accepted"
        _ = a.DB.Request(r.Context(), http.MethodPatch, "profiles?id=eq."+existing[0].ID, map[string]any{
            "role":            "worker",
            "seniority_level": req.SeniorityLevel,
            "max_capacity":    req.MaxCapacity,
            "is_available":    true,
        }, "return=minimal", nil)
    }

    payload := map[string]any{
        "email":           email,
        "seniority_level": req.SeniorityLevel,
        "max_capacity":    req.MaxCapacity,
        "status":          inviteStatus,
        "invited_by":      adminID,
    }
    if err := a.DB.Request(r.Context(), http.MethodPost, "worker_invites?on_conflict=email", payload, "resolution=merge-duplicates,return=minimal", nil); err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
        return
    }

    writeJSON(w, http.StatusOK, map[string]any{
        "email":  email,
        "status": inviteStatus,
    })
}

func (a *API) ListAdminUsers(w http.ResponseWriter, r *http.Request) {
    var profiles []map[string]any
    if err := a.DB.Request(r.Context(), http.MethodGet, "profiles?order=created_at.desc&select=*", nil, "", &profiles); err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
        return
    }

    var orders []struct {
        ConsumerID string `json:"consumer_id"`
        GameUID    string `json:"game_uid"`
    }
    _ = a.DB.Request(r.Context(), http.MethodGet, "orders?select=consumer_id,game_uid", nil, "", &orders)

    uidMap := map[string][]string{}
    seen := map[string]bool{}
    for _, o := range orders {
        if o.ConsumerID == "" || o.GameUID == "" {
            continue
        }
        key := o.ConsumerID + ":" + o.GameUID
        if !seen[key] {
            seen[key] = true
            uidMap[o.ConsumerID] = append(uidMap[o.ConsumerID], o.GameUID)
        }
    }

    for i := range profiles {
        id, _ := profiles[i]["id"].(string)
        profiles[i]["game_uids"] = uidMap[id]
    }

    writeJSON(w, http.StatusOK, profiles)
}

func (a *API) UpdateUserAccount(w http.ResponseWriter, r *http.Request) {
    targetID := chi.URLParam(r, "id")
    if targetID == "" {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "user id wajib diisi"})
        return
    }

    var req struct {
        Role           string `json:"role"`
        FullName       string `json:"full_name"`
        Username       string `json:"username"`
        Email          string `json:"email"`
        Password       string `json:"password"`
        SeniorityLevel string `json:"seniority_level"`
        MaxCapacity    int    `json:"max_capacity"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "payload tidak valid"})
        return
    }

    authUpdates := map[string]any{}
    profileUpdates := map[string]any{}

    if req.Email != "" {
        cleanEmail := strings.ToLower(strings.TrimSpace(req.Email))
        authUpdates["email"] = cleanEmail
        authUpdates["email_confirm"] = true
        profileUpdates["email"] = cleanEmail
    }
    if req.Password != "" {
        if len(req.Password) < 6 {
            writeJSON(w, http.StatusBadRequest, map[string]string{"error": "password baru minimal 6 karakter"})
            return
        }
        authUpdates["password"] = req.Password
    }
    if req.FullName != "" {
        profileUpdates["full_name"] = strings.TrimSpace(req.FullName)
    }
    if req.Username != "" {
        profileUpdates["username"] = strings.ToLower(strings.TrimPrefix(strings.TrimSpace(req.Username), "@"))
    }
    if req.Role == "consumer" || req.Role == "worker" || req.Role == "admin" {
        profileUpdates["role"] = req.Role
    }
    if req.SeniorityLevel == "junior" || req.SeniorityLevel == "senior" || req.SeniorityLevel == "lead" {
        profileUpdates["seniority_level"] = req.SeniorityLevel
    }
    if req.MaxCapacity > 0 {
        profileUpdates["max_capacity"] = req.MaxCapacity
    }

    // Sinkronkan perubahan Email / Password ke Supabase Auth Admin API
    if len(authUpdates) > 0 {
        supaURL := strings.TrimRight(os.Getenv("SUPABASE_URL"), "/")
        serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
        bodyBytes, _ := json.Marshal(authUpdates)

        httpReq, err := http.NewRequestWithContext(r.Context(), http.MethodPut, supaURL+"/auth/v1/admin/users/"+targetID, bytes.NewReader(bodyBytes))
        if err != nil {
            writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
            return
        }
        httpReq.Header.Set("apikey", serviceKey)
        httpReq.Header.Set("Authorization", "Bearer "+serviceKey)
        httpReq.Header.Set("Content-Type", "application/json")

        resp, err := (&http.Client{}).Do(httpReq)
        if err != nil {
            writeJSON(w, http.StatusBadGateway, map[string]string{"error": "gagal menghubungi Supabase Auth Admin"})
            return
        }
        defer resp.Body.Close()
        if resp.StatusCode >= 300 {
            errBody, _ := io.ReadAll(resp.Body)
            writeJSON(w, http.StatusBadRequest, map[string]string{"error": fmt.Sprintf("auth update gagal: %s", string(errBody))})
            return
        }
    }

    if len(profileUpdates) > 0 {
        if err := a.DB.Request(r.Context(), http.MethodPatch, "profiles?id=eq."+targetID, profileUpdates, "return=minimal", nil); err != nil {
            writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
            return
        }
    }

    writeJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}
