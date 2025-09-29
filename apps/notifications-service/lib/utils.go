package lib

import (
	"strings"
	"time"

	"notifications-service/types"
)

/**
 * Gets the current second in the day.
 * @returns The current second in the day.
 */
func GetCurrentSecondInDay() int32 {
	now := time.Now()
	return int32(now.Hour()*3600 + now.Minute()*60 + now.Second())
}

/**
 * Gets the current week day.
 * @returns The current week day.
 */
func GetCurrentWeekDay() string {
	now := time.Now()
	weekday := now.Weekday()
	return strings.ToLower(weekday.String())
}

/**
 * Replaces a prefix in a string.
 * @param key The string to replace the prefix in.
 * @param oldPrefix The old prefix to replace.
 * @param newPrefix The new prefix to replace the old prefix with.
 * @returns The string with the replaced prefix.
 */
func ReplacePrefix(key, oldPrefix, newPrefix string) string {
	return strings.Replace(key, oldPrefix, newPrefix, 1)
}

/**
 * IsPointInPolygon checks if a point is inside a polygon
 * @param point The point to check.
 * @param polygon The polygon to check the point in.
 * @returns True if the point is inside the polygon, false otherwise.
 */
func PointInPolygon(point types.Point, polygon []types.Point) bool {
	n := len(polygon)
	if n < 3 {
		return false // A polygon must have at least 3 points
	}

	inside := false
	j := n - 1 // Last vertex of the polygon

	for i := 0; i < n; i++ {
		// Check if the point is within the y-bounds of the edge and to the left of the x-bound
		if (polygon[i].Y > point.Y) != (polygon[j].Y > point.Y) &&
			point.X < (polygon[j].X-polygon[i].X)*(point.Y-polygon[i].Y)/(polygon[j].Y-polygon[i].Y)+polygon[i].X {
			inside = !inside
		}
		j = i
	}

	return inside
}