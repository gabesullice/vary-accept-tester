"use strict"

// Fetches the browser window's URL with an accept header set to the mediaType.
async function doFetch(mediaType, host) {
  const loc = window.location
  const url = `${loc.protocol}//${host || loc.host}${loc.pathname}`;
  const options = {
    headers: {
      accept: mediaType,
    },
  }
  const response = await fetch(url, options)
  return mediaType.startsWith('text/html')
    ? response.text().then(parseHTML).then(getAcceptHeaderFromHTMLDoc)
    : response.json()
}

// Given the expected DOM document node, get the "echoed" Accept header. Every
// browser sends a different value, which is why it's not hardcoded.
function getAcceptHeaderFromHTMLDoc(doc) {
  const accept = doc.querySelector('body code').innerText
  return { accept }
}

// Given a string of HTML, parse it into a DOM document node.
function parseHTML(html) {
  const dom = new DOMParser();
  const doc = dom.parseFromString(html, 'text/html')
  return doc
}

// Serially makes requests and logs the responses received If the logging
// breaks or the log messages do not match expectaions, it means some HTTP
// cache is not respecting the vary header and a cached response for a
// different accept header value was incorrectly reused.
document.addEventListener('DOMContentLoaded', async function doFetches() {
  let last = null
  // Should be cached because this replicates the browser's first page load.
  last = await doFetch(getAcceptHeaderFromHTMLDoc(document).accept)
  console.log(last)

  // Should not be cached since it's a new request to a new host.
  last = await doFetch("application/json", "127.0.0.1:8880")
  console.log(last)

  // Should be cached no matter what.
  last = await doFetch("application/json", "127.0.0.1:8880")
  console.log(last)

  // Should not be cached since it's a new accept header.
  last = await doFetch("application/hal+json,application/json;q=0.9")
  console.log(last)

  // Should be cached no matter what.
  last = await doFetch("application/hal+json,application/json;q=0.9")
  console.log(last)

  // Ideally, this would be cached, but it won't be since browsers only cache
  // one response per URL at a time. It will have been "overridden" by the
  // hal+json response.
  last = await doFetch("application/json")
  console.log(last)

  // Should be cached no matter what.
  last = await doFetch("application/json")
  console.log(last)

  // Ideally, this would be cached, but it won't be since browsers only cache
  // one response per URL at a time. It will have been "overridden" by the last
  // json response.
  last = await doFetch(getAcceptHeaderFromHTMLDoc(document).accept)
  console.log(last)
})
