package priority

import (
	"math"
	"sort"
	"time"
)

type Seniority string

const (
	SeniorityJunior Seniority = "junior"
	SeniorityMid    Seniority = "mid"
	SenioritySenior Seniority = "senior"
)

type WorkerInput struct {
	ID                  string    `json:"id"`
	FullName            string    `json:"full_name"`
	Seniority           Seniority `json:"seniority_level"`
	MaxCapacity         int       `json:"max_capacity"`
	CurrentActiveOrders int       `json:"current_active_orders"`
	IsAvailable         bool      `json:"is_available"`
	IsOnLeave           bool      `json:"is_on_leave"`
	AverageRating       float64   `json:"average_rating"`
}

type TaskInput struct {
	OrderID           string     `json:"order_id"`
	ServiceName       string     `json:"service_name"`
	RequiredSeniority Seniority  `json:"required_seniority"`
	EstimatedHours    int        `json:"estimated_hours"`
	CurrentPercentage int        `json:"current_percentage"`
	Deadline          *time.Time `json:"expected_completion_at"`
}

type PriorityWeights struct {
	FairLoadWeight  float64 // Bobot pemerataan jumlah job (default 50)
	SkillMatchWeight float64 // Bobot kesesuaian keahlian/senioritas (default 30)
	RatingWeight    float64 // Bobot performa rating (default 20)
}

func DefaultWeights() PriorityWeights {
	return PriorityWeights{
		FairLoadWeight:   50.0,
		SkillMatchWeight: 30.0,
		RatingWeight:     20.0,
	}
}

type WorkerEvaluation struct {
	Worker        WorkerInput `json:"worker"`
	Eligible      bool        `json:"eligible"`
	Reason        string      `json:"reason"`
	PriorityScore float64     `json:"priority_score"`
	LoadRatio     float64     `json:"load_ratio"`
}

func seniorityRank(s Seniority) int {
	switch s {
	case SenioritySenior:
		return 3
	case SeniorityMid:
		return 2
	default:
		return 1
	}
}

// EvaluateWorkerForTask menilai kelayakan & skor prioritas pekerja secara dinamis
func EvaluateWorkerForTask(task TaskInput, worker WorkerInput, weights PriorityWeights) WorkerEvaluation {
	if !worker.IsAvailable || worker.IsOnLeave {
		return WorkerEvaluation{Worker: worker, Eligible: false, Reason: "Worker sedang offline atau cuti"}
	}
	if worker.MaxCapacity <= 0 {
		worker.MaxCapacity = 3
	}
	if worker.CurrentActiveOrders >= worker.MaxCapacity {
		return WorkerEvaluation{
			Worker:    worker,
			Eligible:  false,
			Reason:    "Kapasitas job penuh",
			LoadRatio: 1.0,
		}
	}

	reqRank := seniorityRank(task.RequiredSeniority)
	wrkRank := seniorityRank(worker.Seniority)
	if wrkRank < reqRank {
		return WorkerEvaluation{
			Worker:   worker,
			Eligible: false,
			Reason:   "Tingkat keahlian di bawah syarat layanan",
		}
	}

	// 1. Skor Pemerataan Job: makin sedikit job aktif, makin tinggi skornya (0..1)
	loadRatio := float64(worker.CurrentActiveOrders) / float64(worker.MaxCapacity)
	fairnessFactor := 1.0 - loadRatio

	// 2. Skor Kecocokan Keahlian: tepat sasaran dapat 1.0, overqualified sedikit dikurangi agar job dasar tetap dibagi ke junior
	skillDiff := wrkRank - reqRank
	skillFactor := 1.0 - (float64(skillDiff) * 0.15)
	if skillFactor < 0.6 {
		skillFactor = 0.6
	}

	// 3. Skor Rating (skala 0..5 dinormalisasi ke 0..1)
	ratingFactor := math.Min(math.Max(worker.AverageRating, 3.5), 5.0) / 5.0

	totalScore := (fairnessFactor * weights.FairLoadWeight) +
		(skillFactor * weights.SkillMatchWeight) +
		(ratingFactor * weights.RatingWeight)

	return WorkerEvaluation{
		Worker:        worker,
		Eligible:      true,
		Reason:        "Siap ditugaskan",
		PriorityScore: math.Round(totalScore*100) / 100,
		LoadRatio:     math.Round(loadRatio*100) / 100,
	}
}

// RankWorkersForTask mengurutkan daftar worker dari prioritas tertinggi (paling adil & sesuai)
func RankWorkersForTask(task TaskInput, workers []WorkerInput, weights PriorityWeights) []WorkerEvaluation {
	results := make([]WorkerEvaluation, 0, len(workers))
	for _, w := range workers {
		results = append(results, EvaluateWorkerForTask(task, w, weights))
	}
	sort.Slice(results, func(i, j int) bool {
		if results[i].Eligible != results[j].Eligible {
			return results[i].Eligible
		}
		return results[i].PriorityScore > results[j].PriorityScore
	})
	return results
}