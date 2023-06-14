package notification

import (
	"encoding/json"
	"syscall/js"

	"github.com/crowdsecurity/crowdsec/pkg/csplugin"
	"github.com/crowdsecurity/crowdsec/pkg/models"
)

func formatAlert(this js.Value, args []js.Value) interface{} {
	if len(args) != 2 {
		return map[string]interface{}{"error": "Invalid no of arguments passed"}
	}

	alertString := args[0].String()
	template := args[1].String()

	alerts := []*models.Alert{}

	err := json.Unmarshal([]byte(alertString), &alerts)

	if err != nil {
		return map[string]interface{}{"error": err.Error()}
	}

	out, err := csplugin.FormatAlerts(template, alerts)

	if err != nil {
		return map[string]string{"error": err.Error()}
	}

	return map[string]interface{}{"out": out}
}

func RegisterJSFuncs() {
	js.Global().Set("formatAlert", js.FuncOf(formatAlert))
}
