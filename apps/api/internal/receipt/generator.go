package receipt

import (
	"fmt"
	"strings"
	"time"
)

type TransactionReceipt struct {
	ReceiptNumber  string    `json:"receipt_number"`
	OrderID        string    `json:"order_id"`
	IssuedAt       time.Time `json:"issued_at"`
	MerchantName   string    `json:"merchant_name"`
	CostumerName   string    `json:"costumer_name"`
	CostumerPhone  string    `json:"costumer_phone"`
	WorkerName     string    `json:"worker_name"`
	ServiceName    string    `json:"service_name"`
	GameUID        string    `json:"game_uid"`
	GameServer     string    `json:"game_server"`
	Notes          string    `json:"notes"`
	Status         string    `json:"status"`
	ProgressPct    int       `json:"progress_pct"`
	TotalAmountIDR int       `json:"total_amount_idr"`
	PrintableText  string    `json:"printable_text"`
}

func BuildReceipt(r TransactionReceipt) TransactionReceipt {
	shortID := r.OrderID
	if len(shortID) > 8 {
		shortID = strings.ToUpper(shortID[:8])
	}
	if r.MerchantName == "" {
		r.MerchantName = "meroo.gi Studio"
	}
	if r.IssuedAt.IsZero() {
		r.IssuedAt = time.Now()
	}
	r.ReceiptNumber = fmt.Sprintf("INV-%s-%s", r.IssuedAt.Format("20060102"), shortID)

	workerDisplay := r.WorkerName
	if workerDisplay == "" {
		workerDisplay = "Menunggu Penugasan"
	}

	r.PrintableText = fmt.Sprintf(
		"====================================\n"+
			"           %s\n"+
			"      BUKTI TRANSAKSI LAYANAN\n"+
			"====================================\n"+
			"No. Struk : %s\n"+
			"Tanggal   : %s\n"+
			"Status    : %s (%d%%)\n"+
			"------------------------------------\n"+
			"Costumer  : %s\n"+
			"UID / Srv : %s (%s)\n"+
			"Layanan   : %s\n"+
			"Worker    : %s\n"+
			"Catatan   : %s\n"+
			"------------------------------------\n"+
			"TOTAL     : Rp %d\n"+
			"====================================\n"+
			"Terima kasih telah menggunakan %s\n",
		r.MerchantName,
		r.ReceiptNumber,
		r.IssuedAt.Format("02 Jan 2006 15:04 WIB"),
		strings.ToUpper(r.Status),
		r.ProgressPct,
		r.CostumerName,
		r.GameUID,
		r.GameServer,
		r.ServiceName,
		workerDisplay,
		r.Notes,
		r.TotalAmountIDR,
		r.MerchantName,
	)
	return r
}