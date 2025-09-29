package types


type NotificationWidget struct {
	Id           string   `json:"_id" bson:"_id"`
	AccountId    string   `json:"account_id" bson:"account_id"`
	PushTokens   []string `json:"push_tokens" bson:"push_tokens"`
	Distance     int      `json:"distance" bson:"distance"`
	EndTime      int      `json:"end_time" bson:"end_time"`
	StartTime    int      `json:"start_time" bson:"start_time"`
	GeoJSON      GeoJSON  `json:"geojson" bson:"geojson"`
	PatternId    string   `json:"pattern_id" bson:"pattern_id"`
	StopId       string   `json:"stop_id" bson:"stop_id"`
	StopSequence int      `json:"stop_sequence" bson:"stop_sequence"`
	WeekDays     []string `json:"weekdays" bson:"weekdays"`
}