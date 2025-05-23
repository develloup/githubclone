package utils

import (
	"fmt"
	"math"
)

// Bézier-Kurven Interpolation für sanfte Übergänge
func bezierInterpolate(points []float64, steps int) []float64 {
	n := len(points)
	result := make([]float64, 0, steps)
	for i := 0; i <= steps; i++ {
		t := float64(i) / float64(steps)
		sum := 0.0
		for j := 0; j < n; j++ {
			coeff := float64(binomialCoeff(n-1, j)) * math.Pow(t, float64(j)) * math.Pow(1-t, float64(n-1-j))
			sum += coeff * points[j]
		}
		result = append(result, sum)
	}
	return result
}

// Binomialkoeffizienten berechnen für Bézier-Interpolation
func binomialCoeff(n, k int) int {
	if k == 0 || k == n {
		return 1
	}
	return binomialCoeff(n-1, k-1) + binomialCoeff(n-1, k)
}

// Create a svg containing a heat curve
func GenerateCommitSVG(commitCounts []int) string {
	width := 500
	height := 300
	maxCommits := 0
	for _, count := range commitCounts {
		if count > maxCommits {
			maxCommits = count
		}
	}

	// Punkte berechnen
	xVals := make([]float64, len(commitCounts))
	yVals := make([]float64, len(commitCounts))
	for i, commits := range commitCounts {
		xVals[i] = float64(i) * (float64(width) / float64(len(commitCounts)-1))
		yVals[i] = float64(height) - (float64(commits) / float64(maxCommits) * float64(height-20))
	}

	// Bézier-Interpolation für weichere Kurve
	xSmooth := bezierInterpolate(xVals, 100)
	ySmooth := bezierInterpolate(yVals, 100)

	// SVG-Pfad erstellen
	svg := fmt.Sprintf(`<svg width="%d" height="%d" xmlns="http://www.w3.org/2000/svg">`, width, height)
	svg += `<path d="M `
	for i := range xSmooth {
		svg += fmt.Sprintf("%.2f,%.2f ", xSmooth[i], ySmooth[i])
	}
	svg += `" fill="none" stroke="green" stroke-width="2"/>`
	svg += `</svg>`

	return svg
}
