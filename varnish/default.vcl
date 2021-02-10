vcl 4.0;

backend default {
  .host = "host.docker.internal:8880";
}

sub vcl_deliver {
  if (obj.hits > 0) { # Add debug header to see if it's a HIT/MISS
    set resp.http.X-Cache = "HIT";
  } else {
    set resp.http.X-Cache = "MISS";
  }
}
