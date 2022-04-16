---
title: "Perkenalan Istio"
metaTitle: "Sejarah DevOps"
metaDescription: "This is the meta description for this page"
---

The following is a code block with JavaScript language syntax highlighting.

```javascript
import React from 'react';
```

Supports multiple languages.

The following is a code block with diff. Lines with `+` highlighted in green shade indicating an addition. Lines with `-` highlighted in red shade indicating a deletion.

```javascript
- const data = ['1','2'];
+ const data = [1,2];
```

``` yaml
# docker-compose.yml
version: '3.8'
services:
  prometheus:
+   image: prom/prometheus:latest
-   image: prometheus/pro:latest    
    container_name: prometheus
    volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
    - '--config.file=/etc/prometheus/prometheus.yml'
    - '--web.enable-lifecycle'
    depends_on:
    - cadvisor
    ports:
    - 9090:9090
    networks:
    - jenkins_network
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    ports:
    - 8080:8080
    volumes:
    - /:/rootfs:ro
    - /var/run:/var/run:ro
    - /sys:/sys:ro
    - /var/lib/docker/:/var/lib/docker:ro
    command:
      - privileged=true
    networks:
    - jenkins_network
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
    - 9100:9100
    networks:
    - jenkins_network
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    user: "1000"
    environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
    depends_on:
    - prometheus
    ports:
    - 3000:3000
    networks:
    - jenkins_network
networks:
  jenkins_network:
    external: true
## IMPORTANT:
## This project is designed to be on the same network as the Jenkins network: 'jenkins_network'.
## How to do that? Define name of jenkins network in every container (services.<container_name>.networks)
## and set networks.<network_name>.external to true.
```

```go
package main

import (
	"log"
	"net/http"
)

func career(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Haloo Ini Halaman Karir, Kita lagi open rekrutmen lhoo!!!"))
}

func blog(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Haloo Ini BLOG kita, ini berisi catatan-catatan engineer kita lhoo!!"))
}

func main(){
	mux := http.NewServeMux()
	mux.HandleFunc("/career", career)
	mux.HandleFunc("/blog", blog)
	log.Println("Starting server on :8080")
	err := http.ListenAndServe(":8080", mux)
	log.Fatal(err)
}
```

## Live Editing example

```javascript react-live=true
<button className={'btn btn-default'}>Change my text</button>
```

> Secara default root directory Docker berada di /var/lib/docker. Khusus untuk WSL, lokasinya berada di tempat yang berbeda. Saya belum bisa menjamin apakah lokasinya selalu di wsl\\docker-desktop-data\\version-pack-data\\community\\docker. Mohon dipastikan terlebih dahulu. Link terkait: github.com/google/cadvisor/issues/2648.
{: .prompt-danger }
