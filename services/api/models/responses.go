package models

type ApiError struct {
	Code string `json:"errorCode"`
	Msg  string `json:"errorText"`
}
