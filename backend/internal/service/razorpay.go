package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const razorpayAPI = "https://api.razorpay.com/v1"

type RazorpayClient struct {
	keyID  string
	secret string
	http   *http.Client
}

func NewRazorpayClient(keyID, secret string) *RazorpayClient {
	return &RazorpayClient{keyID: keyID, secret: secret, http: &http.Client{Timeout: 15 * time.Second}}
}

func (c *RazorpayClient) CreateOrder(ctx context.Context, amount int64, receipt string) (string, error) {
	requestBody, err := json.Marshal(map[string]any{"amount": amount, "currency": "INR", "receipt": receipt})
	if err != nil {
		return "", err
	}
	var response struct {
		ID string `json:"id"`
	}
	if err := c.request(ctx, http.MethodPost, "/orders", bytes.NewReader(requestBody), &response); err != nil {
		return "", err
	}
	if response.ID == "" {
		return "", fmt.Errorf("Razorpay returned an empty order ID")
	}
	return response.ID, nil
}

type razorpayPayment struct {
	OrderID  string `json:"order_id"`
	Amount   int64  `json:"amount"`
	Currency string `json:"currency"`
	Status   string `json:"status"`
}

func (c *RazorpayClient) GetPayment(ctx context.Context, paymentID string) (*razorpayPayment, error) {
	var payment razorpayPayment
	if err := c.request(ctx, http.MethodGet, "/payments/"+url.PathEscape(paymentID), nil, &payment); err != nil {
		return nil, err
	}
	return &payment, nil
}

func (c *RazorpayClient) request(ctx context.Context, method, path string, body io.Reader, target any) error {
	req, err := http.NewRequestWithContext(ctx, method, razorpayAPI+path, body)
	if err != nil {
		return err
	}
	req.SetBasicAuth(c.keyID, c.secret)
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		message, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return fmt.Errorf("Razorpay API returned %s: %s", resp.Status, strings.TrimSpace(string(message)))
	}
	if target == nil {
		return nil
	}
	return json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(target)
}
