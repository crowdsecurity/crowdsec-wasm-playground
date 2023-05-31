package main

import (
	"grokker/pkg/grok"
	"grokker/pkg/notification"
)

func main() {

	grok.RegisterJSFuncs()
	notification.RegisterJSFuncs()

	<-make(chan bool)

}
