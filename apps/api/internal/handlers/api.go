package handlers

import (
    "encoding/json"
    "math"
    "net/http"
    "time"

    "github.com/go-chi/chi/v5"
    "github.com/neechko/meroo.gi/apps/api/internal/crypto"
    "github.com/neechko/meroo.gi/apps/api/internal/middleware"
    "github.com/neechko/meroo.gi/apps/api/internal/priority"
    "github.com/neechko/meroo.gi/apps/api/internal/receipt"
    "github.com/neechko/meroo.gi/apps/api/internal/supa"
)

type API struct {
    DB        *supa.Client
    MasterKey []byte
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    _ = json.NewEncoder(w).Encode(payload)
}

func roleDisplayLabel(role string) string {
    switch role {
    case "consumer":
        return "Costumer"
    case "worker":
        return "Worker"
    case "admin":
        return "Admin"
    default:
        return role
    }
}

func (a *API) GetMe(w http.ResponseWriter, r *http.Request) {
    uid := r.Context().Value(middleware.UserIDKey).(string)
    role := r.Context().Value(middleware.UserRoleKey).(string)

    var profiles []map[string]any
    err := a.DB.Request(r.Context(), http.MethodGet, "profiles?id=eq."+uid+"&select=*", nil, "", &profiles)
    if err != nil || len(profiles) == 0 {
        writeJSON(w, http.StatusNotFound, map[string]string{"error": "profil tidak ditemukan"})
        return
    }

    writeJSON(w, http.StatusOK, map[string]any{
        "user_id":    uid,
        "role":       role,
        "role_label": roleDisplayLabel(role),
        "profile":    profiles[0],
    })
}

func (a *API) CancelOrder(w http.ResponseWriter, r *http.Request) {
    uid := r.Context().Value(middleware.UserIDKey).(string)
    role := r.Context().Value(middleware.UserRoleKey).(string)
    orderID := chi.URLParam(r, "id")

    var body struct {
        Reason string `json:"reason"`
    }
    _ = json.NewDecoder(r.Body).Decode(&body)
    if body.Reason == "" {
        body.Reason = "Dibatalkan oleh Costumer"
    }

    var orders []struct {
        ID         string `json:"id"`
        ConsumerID string `json:"consumer_id"`
        Status     string `json:"status"`
    }
    if err := a.DB.Request(r.Context(), http.MethodGet, "orders?id=eq."+orderID+"&select=id,consumer_id,status", nil, "", &orders); err != nil || len(orders) == 0 {
        writeJSON(w, http.StatusNotFound, map[string]string{"error": "pesanan tidak ditemukan"})
        return
    }

    ord := orders[0]
    if role != "admin" && ord.ConsumerID != uid {
        writeJSON(w, http.StatusForbidden, map[string]string{"error": "bukan pemilik pesanan"})
        return
    }
    if ord.Status != "pending" && ord.Status != "paid" {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "pesanan yang sudah berjalan atau selesai tidak dapat dibatalkan"})
        return
    }

    now := time.Now().UTC().Format(time.RFC3339)
    err := a.DB.Request(r.Context(), http.MethodPatch, "orders?id=eq."+orderID, map[string]any{
        "status":        "cancelled",
        "cancel_reason": body.Reason,
        "cancelled_at":  now,
    }, "return=minimal", nil)
    if err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
        return
    }

    writeJSON(w, http.StatusOK, map[string]any{"status": "cancelled", "order_id": orderID})
}

func (a *API) GetOrderReceipt(w http.ResponseWriter, r *http.Request) {
    uid := r.Context().Value(middleware.UserIDKey).(string)
    role := r.Context().Value(middleware.UserRoleKey).(string)
    orderID := chi.URLParam(r, "id")

    query := "orders?id=eq." + orderID + "&select=id,consumer_id,worker_id,total_price,game_uid,game_server,notes,status,current_percentage,created_at,services(name),consumer:profiles!orders_consumer_id_fkey(full_name,phone),worker:profiles!orders_worker_id_fkey(full_name)"
    var rows []struct {
        ID         string    `json:"id"`
        ConsumerID string    `json:"consumer_id"`
        WorkerID   *string   `json:"worker_id"`
        TotalPrice int       `json:"total_price"`
        GameUID    string    `json:"game_uid"`
        GameServer string    `json:"game_server"`
        Notes      string    `json:"notes"`
        Status     string    `json:"status"`
        Percentage int       `json:"current_percentage"`
        CreatedAt  time.Time `json:"created_at"`
        Services   struct {
            Name string `json:"name"`
        } `json:"services"`
        Consumer struct {
            FullName string `json:"full_name"`
            Phone    string `json:"phone"`
        } `json:"consumer"`
        Worker *struct {
            FullName string `json:"full_name"`
        } `json:"worker"`
    }

    if err := a.DB.Request(r.Context(), http.MethodGet, query, nil, "", &rows); err != nil || len(rows) == 0 {
        writeJSON(w, http.StatusNotFound, map[string]string{"error": "order tidak ditemukan"})
        return
    }
    row := rows[0]
    if role != "admin" && row.ConsumerID != uid && (row.WorkerID == nil || *row.WorkerID != uid) {
        writeJSON(w, http.StatusForbidden, map[string]string{"error": "akses struk ditolak"})
        return
    }

    wName := ""
    if row.Worker != nil {
        wName = row.Worker.FullName
    }

    rcp := receipt.BuildReceipt(receipt.TransactionReceipt{
        OrderID:        row.ID,
        IssuedAt:       row.CreatedAt,
        CostumerName:   row.Consumer.FullName,
        CostumerPhone:  row.Consumer.Phone,
        WorkerName:     wName,
        ServiceName:    row.Services.Name,
        GameUID:        row.GameUID,
        GameServer:     row.GameServer,
        Notes:          row.Notes,
        Status:         row.Status,
        ProgressPct:    row.Percentage,
        TotalAmountIDR: row.TotalPrice,
    })
    writeJSON(w, http.StatusOK, rcp)
}

func (a *API) SaveOrderCredentials(w http.ResponseWriter, r *http.Request) {
    uid := r.Context().Value(middleware.UserIDKey).(string)
    orderID := chi.URLParam(r, "id")

    var req struct {
        GameUID         string `json:"game_uid"`
        LoginIdentifier string `json:"login_identifier"`
        Password        string `json:"password"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.LoginIdentifier == "" || req.Password == "" {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "login_identifier dan password wajib diisi"})
        return
    }

    var orders []struct {
        ConsumerID string `json:"consumer_id"`
        GameUID    string `json:"game_uid"`
    }
    if err := a.DB.Request(r.Context(), http.MethodGet, "orders?id=eq."+orderID+"&select=consumer_id,game_uid", nil, "", &orders); err != nil || len(orders) == 0 {
        writeJSON(w, http.StatusNotFound, map[string]string{"error": "order tidak ditemukan"})
        return
    }
    if orders[0].ConsumerID != uid {
        writeJSON(w, http.StatusForbidden, map[string]string{"error": "hanya pemilik order yang dapat menyimpan kredensial"})
        return
    }

    cipherText, err := crypto.EncryptSecret(req.Password, a.MasterKey)
    if err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "gagal mengenkripsi kredensial"})
        return
    }

    gameUID := req.GameUID
    if gameUID == "" {
        gameUID = orders[0].GameUID
    }

    payload := map[string]any{
        "order_id":            orderID,
        "game_uid":            gameUID,
        "login_identifier":    req.LoginIdentifier,
        "encrypted_password":  cipherText,
        "verification_status": "idle",
        "updated_at":          time.Now().UTC().Format(time.RFC3339),
    }
    err = a.DB.Request(r.Context(), http.MethodPost, "order_credentials?on_conflict=order_id", payload, "resolution=merge-duplicates,return=minimal", nil)
    if err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
        return
    }
    writeJSON(w, http.StatusOK, map[string]string{"status": "encrypted_saved"})
}

func (a *API) GetOrderCredentials(w http.ResponseWriter, r *http.Request) {
    uid := r.Context().Value(middleware.UserIDKey).(string)
    role := r.Context().Value(middleware.UserRoleKey).(string)
    orderID := chi.URLParam(r, "id")

    var orders []struct {
        ConsumerID string  `json:"consumer_id"`
        WorkerID   *string `json:"worker_id"`
        Status     string  `json:"status"`
    }
    if err := a.DB.Request(r.Context(), http.MethodGet, "orders?id=eq."+orderID+"&select=consumer_id,worker_id,status", nil, "", &orders); err != nil || len(orders) == 0 {
        writeJSON(w, http.StatusNotFound, map[string]string{"error": "order tidak ditemukan"})
        return
    }
    ord := orders[0]
    isAssignedWorker := ord.WorkerID != nil && *ord.WorkerID == uid
    isOwner := ord.ConsumerID == uid
    if role != "admin" && !isAssignedWorker && !isOwner {
        writeJSON(w, http.StatusForbidden, map[string]string{"error": "akses vault ditolak"})
        return
    }

    var creds []struct {
        GameUID            string  `json:"game_uid"`
        LoginIdentifier    string  `json:"login_identifier"`
        EncryptedPassword  *string `json:"encrypted_password"`
        VerificationStatus string  `json:"verification_status"`
        VerificationCode   *string `json:"verification_code"`
    }
    _ = a.DB.Request(r.Context(), http.MethodGet, "order_credentials?order_id=eq."+orderID+"&select=*", nil, "", &creds)
    if len(creds) == 0 {
        writeJSON(w, http.StatusOK, map[string]any{"configured": false})
        return
    }

    c := creds[0]
    if isOwner && role != "admin" {
        writeJSON(w, http.StatusOK, map[string]any{
            "configured":          true,
            "game_uid":            c.GameUID,
            "login_identifier":    c.LoginIdentifier,
            "has_password":        c.EncryptedPassword != nil && *c.EncryptedPassword != "",
            "verification_status": c.VerificationStatus,
        })
        return
    }

    if ord.Status == "completed" || ord.Status == "cancelled" {
        writeJSON(w, http.StatusForbidden, map[string]string{"error": "kredensial otomatis dikunci/dihapus karena order sudah selesai"})
        return
    }

    plainPassword := ""
    if c.EncryptedPassword != nil && *c.EncryptedPassword != "" {
        dec, err := crypto.DecryptSecret(*c.EncryptedPassword, a.MasterKey)
        if err == nil {
            plainPassword = dec
        }
    }

    _ = a.DB.Request(r.Context(), http.MethodPatch, "order_credentials?order_id=eq."+orderID, map[string]any{
        "last_accessed_by": uid,
        "last_accessed_at": time.Now().UTC().Format(time.RFC3339),
    }, "return=minimal", nil)

    writeJSON(w, http.StatusOK, map[string]any{
        "configured":          true,
        "game_uid":            c.GameUID,
        "login_identifier":    c.LoginIdentifier,
        "password":            plainPassword,
        "verification_status": c.VerificationStatus,
        "verification_code":   c.VerificationCode,
    })
}

func (a *API) HandleVerificationCode(w http.ResponseWriter, r *http.Request) {
    role := r.Context().Value(middleware.UserRoleKey).(string)
    orderID := chi.URLParam(r, "id")

    var req struct {
        Action string `json:"action"`
        Code   string `json:"code"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "payload tidak valid"})
        return
    }

    update := map[string]any{"updated_at": time.Now().UTC().Format(time.RFC3339)}
    if req.Action == "request" {
        if role != "worker" && role != "admin" {
            writeJSON(w, http.StatusForbidden, map[string]string{"error": "hanya worker/admin yang dapat meminta kode verifikasi"})
            return
        }
        update["verification_status"] = "waiting_code"
        update["verification_code"] = nil
    } else if req.Action == "submit" {
        if req.Code == "" {
            writeJSON(w, http.StatusBadRequest, map[string]string{"error": "kode verifikasi wajib diisi"})
            return
        }
        update["verification_status"] = "submitted"
        update["verification_code"] = req.Code
    } else {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "action harus request atau submit"})
        return
    }

    if err := a.DB.Request(r.Context(), http.MethodPatch, "order_credentials?order_id=eq."+orderID, update, "return=minimal", nil); err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
        return
    }
    writeJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

func (a *API) EditOrderProgress(w http.ResponseWriter, r *http.Request) {
    orderID := chi.URLParam(r, "id")
    progressID := chi.URLParam(r, "progressId")

    var req struct {
        Percentage int    `json:"percentage"`
        Notes      string `json:"notes"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "payload tidak valid"})
        return
    }
    if req.Percentage < 0 {
        req.Percentage = 0
    }
    if req.Percentage > 100 {
        req.Percentage = 100
    }

    if err := a.DB.Request(r.Context(), http.MethodPatch, "progress_updates?id=eq."+progressID+"&order_id=eq."+orderID, map[string]any{
        "percentage": req.Percentage,
        "notes":      req.Notes,
    }, "return=minimal", nil); err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
        return
    }

    _ = a.DB.Request(r.Context(), http.MethodPatch, "orders?id=eq."+orderID, map[string]any{
        "current_percentage": req.Percentage,
    }, "return=minimal", nil)

    writeJSON(w, http.StatusOK, map[string]any{"status": "progress_updated", "percentage": req.Percentage})
}

func (a *API) ListChecklists(w http.ResponseWriter, r *http.Request) {
    orderID := chi.URLParam(r, "id")
    dateFilter := r.URL.Query().Get("date")

    query := "order_checklists?order_id=eq." + orderID + "&order=task_date.desc,created_at.asc"
    if dateFilter != "" {
        query += "&task_date=eq." + dateFilter
    }

    var items []map[string]any
    if err := a.DB.Request(r.Context(), http.MethodGet, query, nil, "", &items); err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
        return
    }
    writeJSON(w, http.StatusOK, items)
}

func (a *API) CreateChecklistItem(w http.ResponseWriter, r *http.Request) {
    orderID := chi.URLParam(r, "id")
    var req struct {
        TaskDate     string `json:"task_date"`
        Cadence      string `json:"cadence"`
        TaskKey      string `json:"task_key"`
        TaskLabel    string `json:"task_label"`
        TargetDetail string `json:"target_detail"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.TaskLabel == "" {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "task_label wajib diisi"})
        return
    }
    if req.TaskDate == "" {
        req.TaskDate = time.Now().Format("2006-01-02")
    }
    if req.Cadence == "" {
        req.Cadence = "daily"
    }
    if req.TaskKey == "" {
        req.TaskKey = "custom"
    }

    payload := map[string]any{
        "order_id":      orderID,
        "task_date":     req.TaskDate,
        "cadence":       req.Cadence,
        "task_key":      req.TaskKey,
        "task_label":    req.TaskLabel,
        "target_detail": req.TargetDetail,
    }
    var created []map[string]any
    if err := a.DB.Request(r.Context(), http.MethodPost, "order_checklists", payload, "return=representation", &created); err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
        return
    }
    writeJSON(w, http.StatusCreated, created)
}

func (a *API) ToggleChecklistItem(w http.ResponseWriter, r *http.Request) {
    uid := r.Context().Value(middleware.UserIDKey).(string)
    itemID := chi.URLParam(r, "itemId")

    var req struct {
        IsDone       bool   `json:"is_done"`
        TargetDetail string `json:"target_detail"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "payload tidak valid"})
        return
    }

    update := map[string]any{
        "is_done": req.IsDone,
    }
    if req.TargetDetail != "" {
        update["target_detail"] = req.TargetDetail
    }
    if req.IsDone {
        update["completed_by"] = uid
        update["completed_at"] = time.Now().UTC().Format(time.RFC3339)
    } else {
        update["completed_by"] = nil
        update["completed_at"] = nil
    }

    if err := a.DB.Request(r.Context(), http.MethodPatch, "order_checklists?id=eq."+itemID, update, "return=minimal", nil); err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
        return
    }
    writeJSON(w, http.StatusOK, map[string]any{"id": itemID, "is_done": req.IsDone})
}

func (a *API) GetWorkerCandidates(w http.ResponseWriter, r *http.Request) {
    orderID := chi.URLParam(r, "id")

    var orders []struct {
        ID                 string     `json:"id"`
        CurrentPercentage  int        `json:"current_percentage"`
        TotalEstimatedHrs  int        `json:"total_estimated_hours"`
        ExpectedCompletion *time.Time `json:"expected_completion_at"`
        Services           struct {
            Name              string             `json:"name"`
            RequiredSeniority priority.Seniority `json:"required_seniority"`
        } `json:"services"`
    }
    if err := a.DB.Request(r.Context(), http.MethodGet, "orders?id=eq."+orderID+"&select=id,current_percentage,total_estimated_hours,expected_completion_at,services(name,required_seniority)", nil, "", &orders); err != nil || len(orders) == 0 {
        writeJSON(w, http.StatusNotFound, map[string]string{"error": "order tidak ditemukan"})
        return
    }
    ord := orders[0]

    var workers []priority.WorkerInput
    if err := a.DB.Request(r.Context(), http.MethodGet, "profiles?role=in.(worker,admin)&select=id,full_name,seniority_level,max_capacity,current_active_orders,is_available,is_on_leave,average_rating", nil, "", &workers); err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
        return
    }

    task := priority.TaskInput{
        OrderID:           ord.ID,
        ServiceName:       ord.Services.Name,
        RequiredSeniority: ord.Services.RequiredSeniority,
        EstimatedHours:    ord.TotalEstimatedHrs,
        CurrentPercentage: ord.CurrentPercentage,
        Deadline:          ord.ExpectedCompletion,
    }

    ranked := priority.RankWorkersForTask(task, workers, priority.DefaultWeights())
    writeJSON(w, http.StatusOK, ranked)
}

// POST /v1/admin/orders/{id}/assign (Assign manual atau auto-pick skor prioritas tertinggi + alokasi keuangan)
func (a *API) AssignWorkerToOrder(w http.ResponseWriter, r *http.Request) {
    orderID := chi.URLParam(r, "id")
    var req struct {
        WorkerID string `json:"worker_id"` // kosongkan jika ingin auto-assign terbaik
    }
    _ = json.NewDecoder(r.Body).Decode(&req)

    var orders []struct {
        ID                string `json:"id"`
        TotalPrice        int    `json:"total_price"`
        Status            string `json:"status"`
        CurrentPercentage int    `json:"current_percentage"`
        TotalEstimatedHrs int    `json:"total_estimated_hours"`
        Services          struct {
            Name              string             `json:"name"`
            RequiredSeniority priority.Seniority `json:"required_seniority"`
        } `json:"services"`
    }
    if err := a.DB.Request(r.Context(), http.MethodGet, "orders?id=eq."+orderID+"&select=id,total_price,status,current_percentage,total_estimated_hours,services(name,required_seniority)", nil, "", &orders); err != nil || len(orders) == 0 {
        writeJSON(w, http.StatusNotFound, map[string]string{"error": "order tidak ditemukan"})
        return
    }
    ord := orders[0]

    chosenWorkerID := req.WorkerID
    if chosenWorkerID == "" {
        var workers []priority.WorkerInput
        _ = a.DB.Request(r.Context(), http.MethodGet, "profiles?role=in.(worker,admin)&select=id,full_name,seniority_level,max_capacity,current_active_orders,is_available,is_on_leave,average_rating", nil, "", &workers)
        ranked := priority.RankWorkersForTask(priority.TaskInput{
            OrderID:           ord.ID,
            ServiceName:       ord.Services.Name,
            RequiredSeniority: ord.Services.RequiredSeniority,
            EstimatedHours:    ord.TotalEstimatedHrs,
            CurrentPercentage: ord.CurrentPercentage,
        }, workers, priority.DefaultWeights())
        for _, c := range ranked {
            if c.Eligible {
                chosenWorkerID = c.Worker.ID
                break
            }
        }
        if chosenWorkerID == "" {
            writeJSON(w, http.StatusConflict, map[string]string{"error": "tidak ada worker yang tersedia atau memenuhi syarat"})
            return
        }
    }

    nextStatus := ord.Status
    if nextStatus == "pending" || nextStatus == "paid" {
        nextStatus = "in_progress"
    }

    if err := a.DB.Request(r.Context(), http.MethodPatch, "orders?id=eq."+orderID, map[string]any{
        "worker_id": chosenWorkerID,
        "status":    nextStatus,
    }, "return=minimal", nil); err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
        return
    }

    // Hitung & simpan alokasi pembagian uang untuk order ini
    var settings []struct {
        WorkerSharePct    float64 `json:"worker_share_pct"`
        AdminSharePct     float64 `json:"admin_share_pct"`
        StudioTreasuryPct float64 `json:"studio_treasury_pct"`
    }
    _ = a.DB.Request(r.Context(), http.MethodGet, "finance_settings?id=eq.1&select=*", nil, "", &settings)
    wPct, aPct := 75.0, 15.0
    if len(settings) > 0 {
        wPct = settings[0].WorkerSharePct
        aPct = settings[0].AdminSharePct
    }
    workerAmt := int(math.Round(float64(ord.TotalPrice) * (wPct / 100.0)))
    adminAmt := int(math.Round(float64(ord.TotalPrice) * (aPct / 100.0)))
    treasuryAmt := ord.TotalPrice - workerAmt - adminAmt

    _ = a.DB.Request(r.Context(), http.MethodPost, "financial_allocations?on_conflict=order_id", map[string]any{
        "order_id":        orderID,
        "worker_id":       chosenWorkerID,
        "gross_amount":    ord.TotalPrice,
        "worker_amount":   workerAmt,
        "admin_amount":    adminAmt,
        "treasury_amount": treasuryAmt,
    }, "resolution=merge-duplicates,return=minimal", nil)

    writeJSON(w, http.StatusOK, map[string]any{
        "order_id":  orderID,
        "worker_id": chosenWorkerID,
        "status":    nextStatus,
    })
}

func (a *API) GetFinanceSummary(w http.ResponseWriter, r *http.Request) {
    var orders []struct {
        ID         string  `json:"id"`
        WorkerID   *string `json:"worker_id"`
        TotalPrice int     `json:"total_price"`
        Status     string  `json:"status"`
    }
    if err := a.DB.Request(r.Context(), http.MethodGet, "orders?status=in.(paid,in_progress,completed)&select=id,worker_id,total_price,status", nil, "", &orders); err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
        return
    }

    var settings []struct {
        WorkerSharePct    float64 `json:"worker_share_pct"`
        AdminSharePct     float64 `json:"admin_share_pct"`
        StudioTreasuryPct float64 `json:"studio_treasury_pct"`
    }
    _ = a.DB.Request(r.Context(), http.MethodGet, "finance_settings?id=eq.1&select=*", nil, "", &settings)

    wPct, aPct, tPct := 75.0, 15.0, 10.0
    if len(settings) > 0 {
        wPct = settings[0].WorkerSharePct
        aPct = settings[0].AdminSharePct
        tPct = settings[0].StudioTreasuryPct
    }

    grossTotal := 0
    for _, o := range orders {
        grossTotal += o.TotalPrice
    }

    workerTotal := int(math.Round(float64(grossTotal) * (wPct / 100.0)))
    adminTotal := int(math.Round(float64(grossTotal) * (aPct / 100.0)))
    treasuryTotal := grossTotal - workerTotal - adminTotal

    var allocations []map[string]any
    _ = a.DB.Request(r.Context(), http.MethodGet, "financial_allocations?order=created_at.desc&select=*", nil, "", &allocations)

    writeJSON(w, http.StatusOK, map[string]any{
        "valid_orders_count": len(orders),
        "gross_revenue":      grossTotal,
        "worker_share_total": workerTotal,
        "admin_share_total":  adminTotal,
        "treasury_total":     treasuryTotal,
        "split_ratios": map[string]float64{
            "worker_share_pct":    wPct,
            "admin_share_pct":     aPct,
            "studio_treasury_pct": tPct,
        },
        "allocations": allocations,
    })
}

func (a *API) UpdateFinanceSettings(w http.ResponseWriter, r *http.Request) {
    var req struct {
        WorkerSharePct    float64 `json:"worker_share_pct"`
        AdminSharePct     float64 `json:"admin_share_pct"`
        StudioTreasuryPct float64 `json:"studio_treasury_pct"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "payload tidak valid"})
        return
    }
    if math.Round(req.WorkerSharePct+req.AdminSharePct+req.StudioTreasuryPct) != 100 {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "total persentase pembagian harus tepat 100%"})
        return
    }
    if err := a.DB.Request(r.Context(), http.MethodPatch, "finance_settings?id=eq.1", map[string]any{
        "worker_share_pct":    req.WorkerSharePct,
        "admin_share_pct":     req.AdminSharePct,
        "studio_treasury_pct": req.StudioTreasuryPct,
        "updated_at":          time.Now().UTC().Format(time.RFC3339),
    }, "return=minimal", nil); err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
        return
    }
    writeJSON(w, http.StatusOK, map[string]string{"status": "finance_settings_updated"})
}

func (a *API) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
    targetID := chi.URLParam(r, "id")
    var req struct {
        Role string `json:"role"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil || (req.Role != "consumer" && req.Role != "worker" && req.Role != "admin") {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "role harus consumer, worker, atau admin"})
        return
    }
    if err := a.DB.Request(r.Context(), http.MethodPatch, "profiles?id=eq."+targetID, map[string]any{
        "role": req.Role,
    }, "return=minimal", nil); err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
        return
    }
    writeJSON(w, http.StatusOK, map[string]any{"user_id": targetID, "role": req.Role})
}

func (a *API) DeleteService(w http.ResponseWriter, r *http.Request) {
    serviceID := chi.URLParam(r, "id")
    if err := a.DB.Request(r.Context(), http.MethodDelete, "services?id=eq."+serviceID, nil, "return=minimal", nil); err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
        return
    }
    writeJSON(w, http.StatusOK, map[string]string{"deleted": serviceID})
}

func (a *API) UpdateReview(w http.ResponseWriter, r *http.Request) {
    reviewID := chi.URLParam(r, "id")
    var req struct {
        Rating  int    `json:"rating"`
        Comment string `json:"comment"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "payload tidak valid"})
        return
    }
    if err := a.DB.Request(r.Context(), http.MethodPatch, "reviews?id=eq."+reviewID, map[string]any{
        "rating":  req.Rating,
        "comment": req.Comment,
    }, "return=minimal", nil); err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
        return
    }
    writeJSON(w, http.StatusOK, map[string]string{"updated": reviewID})
}

func (a *API) DeleteReview(w http.ResponseWriter, r *http.Request) {
    reviewID := chi.URLParam(r, "id")
    if err := a.DB.Request(r.Context(), http.MethodDelete, "reviews?id=eq."+reviewID, nil, "return=minimal", nil); err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
        return
    }
    writeJSON(w, http.StatusOK, map[string]string{"deleted": reviewID})
}
