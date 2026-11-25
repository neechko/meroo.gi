package supa

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type Client struct {
	BaseURL        string
	ServiceRoleKey string
	HTTP           *http.Client
}

func NewClient(baseURL, serviceRoleKey string) *Client {
	return &Client{
		BaseURL:        baseURL,
		ServiceRoleKey: serviceRoleKey,
		HTTP:           &http.Client{},
	}
}

func (c *Client) Request(ctx context.Context, method, pathWithQuery string, body any, prefer string, out any) error {
	var bodyReader io.Reader
	if body != nil {
		raw, err := json.Marshal(body)
		if err != nil {
			return err
		}
		bodyReader = bytes.NewReader(raw)
	}

	req, err := http.NewRequestWithContext(ctx, method, c.BaseURL+"/rest/v1/"+pathWithQuery, bodyReader)
	if err != nil {
		return err
	}
	req.Header.Set("apikey", c.ServiceRoleKey)
	req.Header.Set("Authorization", "Bearer "+c.ServiceRoleKey)
	req.Header.Set("Content-Type", "application/json")
	if prefer != "" {
		req.Header.Set("Prefer", prefer)
	}

	resp, err := c.HTTP.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("supabase error (%d): %s", resp.StatusCode, string(respBytes))
	}
	if out != nil && len(respBytes) > 0 {
		return json.Unmarshal(respBytes, out)
	}
	return nil
}