"use strict"

// Fetches the browser window's URL with an accept header set to the mediaType.
async function doFetch(mediaType) {
  const url = window.location.href;
  const options = {
    headers: {
      accept: mediaType,
    },
  }
  return (await fetch(url, options)).json()
}

// Serially makes requests and logs the response received from the server. If
// the logging breaks or the log messages do not match, it means some HTTP
// cache is not respecting the vary header. If the browser does *not* cache the
// third request, even with a proper Vary header, it means the browser has
// disabled caching of the response altogether (probably because of the vary:
// accept header).
(async function doFetches() {
  await doFetch("application/json").then(obj => { console.log(obj.accept) })
  await doFetch("application/hal+json").then(obj => { console.log(obj.accept) })
  await doFetch("application/json").then(obj => { console.log(obj.accept) })
})()
