package handlers

import (
    "encoding/json"
    "net/http"
    "strings"
    "sync"
    "time"

    "github.com/go-chi/chi/v5"
    "github.com/neechko/meroo.gi/apps/api/internal/middleware"
)

func (a *API) UpdateMyProfile(w http.ResponseWriter, r *http.Request) {
    userID, _ := r.Context().Value(middleware.UserIDKey).(string)
    var req struct {
        FullName    string `json:"full_name"`
        Username    string `json:"username"`
        ContactInfo string `json:"contact_info"`
        AvatarURL   string `json:"avatar_url"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "payload profil tidak valid"})
        return
    }

    updates := map[string]any{}
    if strings.TrimSpace(req.FullName) != "" {
        updates["full_name"] = strings.TrimSpace(req.FullName)
    }
    if strings.TrimSpace(req.Username) != "" {
        updates["username"] = strings.ToLower(strings.TrimPrefix(strings.TrimSpace(req.Username), "@"))
    }
    if req.ContactInfo != "" {
        updates["contact_info"] = strings.TrimSpace(req.ContactInfo)
    }
    if req.AvatarURL != "" {
        updates["avatar_url"] = req.AvatarURL
    }

    if len(updates) == 0 {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "tidak ada perubahan profil"})
        return
    }

    if err := a.DB.Request(r.Context(), http.MethodPatch, "profiles?id=eq."+userID, updates, "return=minimal", nil); err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
        return
    }
    writeJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

func (a *API) CreateOrderProgress(w http.ResponseWriter, r *http.Request) {
    uid, _ := r.Context().Value(middleware.UserIDKey).(string)
    role, _ := r.Context().Value(middleware.UserRoleKey).(string)
    orderID := chi.URLParam(r, "id")

    var orders []struct {
        ID       string  `json:"id"`
        WorkerID *string `json:"worker_id"`
        Status   string  `json:"status"`
    }
    if err := a.DB.Request(r.Context(), http.MethodGet, "orders?id=eq."+orderID+"&select=id,worker_id,status", nil, "", &orders); err != nil || len(orders) == 0 {
        writeJSON(w, http.StatusNotFound, map[string]string{"error": "order tidak ditemukan"})
        return
    }
    ord := orders[0]
    if role != "admin" && (ord.WorkerID == nil || *ord.WorkerID != uid) {
        writeJSON(w, http.StatusForbidden, map[string]string{"error": "hanya worker yang ditugaskan atau admin yang dapat mengupdate progres"})
        return
    }
    if ord.Status == "cancelled" {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "order yang dibatalkan tidak dapat diperbarui"})
        return
    }

    var req struct {
        Percentage    int    `json:"percentage"`
        Notes         string `json:"notes"`
        ScreenshotURL string `json:"screenshot_url"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "payload progres tidak valid"})
        return
    }
    if req.Percentage < 0 {
        req.Percentage = 0
    }
    if req.Percentage > 100 {
        req.Percentage = 100
    }
    if strings.TrimSpace(req.Notes) == "" {
        req.Notes = "Update progres pengerjaan"
    }

    nextStatus := "in_progress"
    orderPatch := map[string]any{
        "current_percentage": req.Percentage,
        "status":             nextStatus,
    }
    if req.Percentage >= 100 {
        nextStatus = "completed"
        orderPatch["status"] = nextStatus
        orderPatch["completed_at"] = time.Now().UTC().Format(time.RFC3339)
    }

    // Keunggulan Go: insert progress_updates & patch orders berjalan PARALEL (goroutine)
    var wg sync.WaitGroup
    var errInsert, errPatch error
    wg.Add(2)

    go func() {
        defer wg.Done()
        errInsert = a.DB.Request(r.Context(), http.MethodPost, "progress_updates", map[string]any{
            "order_id":       orderID,
            "percentage":     req.Percentage,
            "notes":          strings.TrimSpace(req.Notes),
            "screenshot_url": req.ScreenshotURL,
        }, "return=minimal", nil)
    }()

    go func() {
        defer wg.Done()
        errPatch = a.DB.Request(r.Context(), http.MethodPatch, "orders?id=eq."+orderID, orderPatch, "return=minimal", nil)
    }()

    wg.Wait()
    if errInsert != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": errInsert.Error()})
        return
    }
    if errPatch != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": errPatch.Error()})
        return
    }

    writeJSON(w, http.StatusOK, map[string]any{
        "status":             nextStatus,
        "current_percentage": req.Percentage,
    })
}
