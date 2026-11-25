package router

import (
    "net/http"
    "os"

    "github.com/go-chi/chi/v5"
    chimw "github.com/go-chi/chi/v5/middleware"
    "github.com/go-chi/cors"
    "github.com/neechko/meroo.gi/apps/api/internal/handlers"
    "github.com/neechko/meroo.gi/apps/api/internal/middleware"
    "github.com/neechko/meroo.gi/apps/api/internal/supa"
)

func New() http.Handler {
    supaURL := os.Getenv("SUPABASE_URL")
    serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
    masterKey := os.Getenv("ENCRYPTION_MASTER_KEY")
    if len(masterKey) != 32 {
        masterKey = "meroogi-default-32byte-vault-key"
    }

    guard := &middleware.AuthGuard{
        JWTSecret:      os.Getenv("SUPABASE_JWT_SECRET"),
        SupabaseURL:    supaURL,
        ServiceRoleKey: serviceKey,
    }

    api := &handlers.API{
        DB:        supa.NewClient(supaURL, serviceKey),
        MasterKey: []byte(masterKey),
    }

    r := chi.NewRouter()
    r.Use(chimw.Logger)
    r.Use(chimw.Recoverer)
    r.Use(cors.Handler(cors.Options{
        AllowedOrigins:   []string{"*"},
        AllowedMethods:   []string{"GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"},
        AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
        AllowCredentials: true,
    }))

    r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{"status":"ok","service":"meroo-go-api"}`))
    })

    r.Post("/v1/auth/resolve-identifier", api.ResolveIdentifier)

    r.Route("/v1", func(v1 chi.Router) {
        v1.Use(guard.Authenticate)

        v1.Get("/me", api.GetMe)
        v1.Patch("/me/profile", api.UpdateMyProfile)

        v1.Post("/orders/{id}/cancel", api.CancelOrder)
        v1.Get("/orders/{id}/receipt", api.GetOrderReceipt)
        v1.Post("/orders/{id}/credentials", api.SaveOrderCredentials)
        v1.Get("/orders/{id}/credentials", api.GetOrderCredentials)
        v1.Post("/orders/{id}/credentials/verification", api.HandleVerificationCode)

        v1.Get("/orders/{id}/checklists", api.ListChecklists)
        v1.Post("/orders/{id}/checklists", api.CreateChecklistItem)
        v1.Patch("/checklists/{itemId}", api.ToggleChecklistItem)

        v1.Group(func(staff chi.Router) {
            staff.Use(guard.RequireRoles("worker", "admin"))
            staff.Post("/orders/{id}/progress", api.CreateOrderProgress)
            staff.Patch("/orders/{id}/progress/{progressId}", api.EditOrderProgress)
        })

        v1.Group(func(admin chi.Router) {
            admin.Use(guard.RequireRoles("admin"))
            admin.Get("/admin/orders/{id}/worker-candidates", api.GetWorkerCandidates)
            admin.Post("/admin/orders/{id}/assign", api.AssignWorkerToOrder)
            admin.Get("/admin/finance/summary", api.GetFinanceSummary)
            admin.Patch("/admin/finance/settings", api.UpdateFinanceSettings)
            admin.Get("/admin/users", api.ListAdminUsers)
            admin.Patch("/admin/users/{id}/role", api.UpdateUserRole)
            admin.Patch("/admin/users/{id}/account", api.UpdateUserAccount)
            admin.Get("/admin/workers/invites", api.ListWorkerInvites)
            admin.Post("/admin/workers/invite", api.InviteWorker)
            admin.Delete("/admin/services/{id}", api.DeleteService)
            admin.Patch("/admin/reviews/{id}", api.UpdateReview)
            admin.Delete("/admin/reviews/{id}", api.DeleteReview)
        })
    })

    return r
}
