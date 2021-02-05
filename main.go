package main

import "fmt"
import "net/http"
import "strings"

var jsFile = "/fetcher.js"

func main() {
	h := http.NewServeMux()
	// Echo the accept header without adding a `vary: accept` response header.
	// The response should be broken. Either the HTML page will show
	// "application/json" (not the right accept header) or the JavaScript console
	// will fail to parse JSON (since it's receiving HTML).
	h.Handle("/echo-accept-header", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("cache-control", "public, max-age=120, immutable")
		echoAcceptHeader(w, r)
	}))
	// Echo the accept header and add a `vary: accept` response header.
	// The response should not b broken. The HTML page will show an accept header
	// value that begins with "text/html" (each browser is slightly different)
	// and the JavaScript console should echo an object that contains the accept
	// header value "application/json".
	h.Handle("/echo-accept-header-w-vary", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("vary", "accept")
		w.Header().Add("cache-control", "public, max-age=120, immutable")
		echoAcceptHeader(w, r)
	}))
	// Serve the test JS program.
	h.Handle(jsFile, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("cache-control", "public, max-age=120, must-revalidate")
		w.Header().Add("content-type", "application/javascript")
		http.ServeFile(w, r, "."+jsFile)
	}))
	http.ListenAndServe(":8880", h)
}

// Inspects the request's accept header. Responds with either HTML, JSON, or a
// 406 Not Acceptable for an unrecognized value.
func echoAcceptHeader(w http.ResponseWriter, r *http.Request) {
	accept := r.Header.Get("accept")
	types := strings.Split(accept, ",")
	switch types[0] {
	case "text/html":
		echoAcceptHeaderHTML(w, r)
	case "application/json":
		echoAcceptHeaderJSON(w, r)
	case "application/hal+json":
		echoAcceptHeaderJSON(w, r)
	default:
		w.WriteHeader(http.StatusNotAcceptable)
	}
}

// Serves an HTML response with an inline JavaScript program which fetches the
// same URL that served the request and specificies an
// `accept: application/json` header value, the it parses the response and logs
// it. An error will appear in the console or the browser window will show a
// JSON object if the browser is caching the response without varying by the
// accept header.
func echoAcceptHeaderHTML(w http.ResponseWriter, r *http.Request) {
	accept := r.Header.Get("accept")
	html := fmt.Sprintf("<html><script src=\"%s\"></script><body><code>%s</code></body></html>", jsFile, accept)
	fmt.Fprintf(w, html)
}

// Serves a JSON response containing a JSON object containing the value of the
// request's accept header.
func echoAcceptHeaderJSON(w http.ResponseWriter, r *http.Request) {
	accept := r.Header.Get("accept")
	fmt.Fprintf(w, "{\"accept\": \""+accept+"\"}")
}
