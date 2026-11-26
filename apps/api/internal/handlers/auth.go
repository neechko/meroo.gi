package handlers

import (
    "encoding/json"
    "net/http"
    "net/url"
    "strings"
)

func (a *API) ResolveIdentifier(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Identifier string `json:"identifier"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "payload tidak valid"})
        return
    }

    ident := strings.TrimSpace(req.Identifier)
    if ident == "" {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "email atau username wajib diisi"})
        return
    }

    // Jika sudah berbentuk email, kembalikan langsung
    if strings.Contains(ident, "@") {
        writeJSON(w, http.StatusOK, map[string]string{"email": strings.ToLower(ident)})
        return
    }

    cleanUser := strings.ToLower(strings.TrimPrefix(ident, "@"))
    var rows []struct {
        Email string `json:"email"`
    }
    query := "profiles?username=ilike." + url.QueryEscape(cleanUser) + "&select=email&limit=1"
    if err := a.DB.Request(r.Context(), http.MethodGet, query, nil, "", &rows); err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "gagal mencari akun"})
        return
    }
    if len(rows) == 0 || rows[0].Email == "" {
        writeJSON(w, http.StatusNotFound, map[string]string{"error": "username tidak ditemukan"})
        return
    }

    writeJSON(w, http.StatusOK, map[string]string{"email": rows[0].Email})
}
