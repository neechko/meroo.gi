package main

import (
    "bufio"
    "log"
    "net/http"
    "os"
    "strings"

    "github.com/neechko/meroo.gi/apps/api/internal/router"
)

func loadDotEnv(path string) {
    f, err := os.Open(path)
    if err != nil {
        return
    }
    defer f.Close()
    scanner := bufio.NewScanner(f)
    for scanner.Scan() {
        line := strings.TrimSpace(scanner.Text())
        if line == "" || strings.HasPrefix(line, "#") {
            continue
        }
        if k, v, ok := strings.Cut(line, "="); ok {
            key := strings.TrimSpace(k)
            val := strings.Trim(strings.TrimSpace(v), `"'`)
            if os.Getenv(key) == "" {
                _ = os.Setenv(key, val)
            }
        }
    }
}

func main() {
    loadDotEnv(".env")

    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }

    log.Printf("Meroo.gi Go API berjalan di :%s", port)
    log.Fatal(http.ListenAndServe(":"+port, router.New()))
}
