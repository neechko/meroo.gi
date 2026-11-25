package handler

import (
    "net/http"

    "github.com/neechko/meroo.gi/apps/api/internal/router"
)

var app = router.New()

func Handler(w http.ResponseWriter, r *http.Request) {
    app.ServeHTTP(w, r)
}
