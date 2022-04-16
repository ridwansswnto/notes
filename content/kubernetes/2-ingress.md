---
title: "Kubernetes Production - Ingress Controller"
metaTitle: "Sejarah DevOps"
metaDescription: "This is the meta description for this page"
---

# Ingress Nginx Controller

ingress nginx controller merupakan

## Install nginx

1. Download Manifest
```
wget https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.1.2/deploy/static/provider/cloud/deploy.yaml
```

2. Apply manifest
```
kubectl apply -f deploy.yaml
```

## Install nginx with internal IP

1. Edit manifest yang sudah di download tambahkan anotation pada service
```
apiVersion: v1
kind: Service
metadata:
  annotations:
+   cloud.google.com/load-balancer-type: "Internal"
    service.beta.kubernetes.io/do-loadbalancer-enable-proxy-protocol: "true"
  labels:
    app.kubernetes.io/component: controller
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
    app.kubernetes.io/version: 1.1.3
  name: ingress-nginx-controller
  namespace: ingress-nginx
```