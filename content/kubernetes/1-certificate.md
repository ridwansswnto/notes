---
title: "Kubernetes Production - Certificate"
metaTitle: "k8s"
metaDescription: "This is the meta description for this page"
---

Ini merupakan timeline plan untuk persiapan provision kubernetes cluster dengan production grade:
- How to provision cluster? Manual or IaC?
- What's about the component like certificate, psp, etc

# Setup Certificate

## Install Cert Manager
Using cert-manager will applying easy management for certificate, pada case ini saya menggunakan acme dns01, clouddns/route53. Jadi berikut step2nya


1. Install crd untuk cert-manager/clusterissuer menggunakan native kubeclt / helm. Tapi sampai sekarang belum tau bagaimana caranya agar bisa set resolver si cert-managernya jika menggunakan kubectl
```
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.8.0/cert-manager.yaml

atau

helm install \                                                               
  cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.8.0 \
  --set installCRDs=true \
  --set 'extraArgs={--dns01-recursive-nameservers-only,--dns01-recursive-nameservers=8.8.8.8:53\,1.1.1.1:53}'
```

2. Output apply crd tersebut
```
namespace/cert-manager created
customresourcedefinition.apiextensions.k8s.io/certificaterequests.cert-manager.io created
customresourcedefinition.apiextensions.k8s.io/certificates.cert-manager.io created
customresourcedefinition.apiextensions.k8s.io/challenges.acme.cert-manager.io created
customresourcedefinition.apiextensions.k8s.io/clusterissuers.cert-manager.io created
customresourcedefinition.apiextensions.k8s.io/issuers.cert-manager.io created
customresourcedefinition.apiextensions.k8s.io/orders.acme.cert-manager.io created
serviceaccount/cert-manager-cainjector created
serviceaccount/cert-manager created
serviceaccount/cert-manager-webhook created
configmap/cert-manager-webhook created
clusterrole.rbac.authorization.k8s.io/cert-manager-cainjector created
clusterrole.rbac.authorization.k8s.io/cert-manager-controller-issuers created
clusterrole.rbac.authorization.k8s.io/cert-manager-controller-clusterissuers created
clusterrole.rbac.authorization.k8s.io/cert-manager-controller-certificates created
clusterrole.rbac.authorization.k8s.io/cert-manager-controller-orders created
clusterrole.rbac.authorization.k8s.io/cert-manager-controller-challenges created
clusterrole.rbac.authorization.k8s.io/cert-manager-controller-ingress-shim created
clusterrole.rbac.authorization.k8s.io/cert-manager-view created
clusterrole.rbac.authorization.k8s.io/cert-manager-edit created
clusterrole.rbac.authorization.k8s.io/cert-manager-controller-approve:cert-manager-io created
clusterrole.rbac.authorization.k8s.io/cert-manager-controller-certificatesigningrequests created
clusterrole.rbac.authorization.k8s.io/cert-manager-webhook:subjectaccessreviews created
clusterrolebinding.rbac.authorization.k8s.io/cert-manager-cainjector created
clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-issuers created
clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-clusterissuers created
clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-certificates created
clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-orders created
clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-challenges created
clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-ingress-shim created
clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-approve:cert-manager-io created
clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-certificatesigningrequests created
clusterrolebinding.rbac.authorization.k8s.io/cert-manager-webhook:subjectaccessreviews created
role.rbac.authorization.k8s.io/cert-manager-cainjector:leaderelection created
role.rbac.authorization.k8s.io/cert-manager:leaderelection created
role.rbac.authorization.k8s.io/cert-manager-webhook:dynamic-serving created
rolebinding.rbac.authorization.k8s.io/cert-manager-cainjector:leaderelection created
rolebinding.rbac.authorization.k8s.io/cert-manager:leaderelection created
rolebinding.rbac.authorization.k8s.io/cert-manager-webhook:dynamic-serving created
service/cert-manager created
service/cert-manager-webhook created
deployment.apps/cert-manager-cainjector created
deployment.apps/cert-manager created
deployment.apps/cert-manager-webhook created
mutatingwebhookconfiguration.admissionregistration.k8s.io/cert-manager-webhook created
validatingwebhookconfiguration.admissionregistration.k8s.io/cert-manager-webhook created
```

3. Test issuer untuk mengetest webhook tersebut dengan langkah seperti berikut
```
apiVersion: v1
kind: Namespace
metadata:
  name: cert-manager-test
---
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: test-selfsigned
  namespace: cert-manager-test
spec:
  selfSigned: {}
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: selfsigned-cert
  namespace: cert-manager-test
spec:
  dnsNames:
    - example.com
  secretName: selfsigned-cert-tls
  issuerRef:
    name: test-selfsigned

kubectl apply -f test-certificate-resources.yaml
```

4. Describe certificate yang sudah kita buat untuk mengecek apakah berhasil atau tidak

```
kubectl describe certificate -n cert-manager-test

Spec:
  Dns Names:
    example.com
  Issuer Ref:
    Name:       test-selfsigned
  Secret Name:  selfsigned-cert-tls
Status:
  Conditions:
    Last Transition Time:  2022-04-08T19:02:54Z
    Message:               Certificate is up to date and has not expired
    Observed Generation:   1
    Reason:                Ready
    Status:                True
    Type:                  Ready
  Not After:               2022-07-07T19:02:54Z
  Not Before:              2022-04-08T19:02:54Z
  Renewal Time:            2022-06-07T19:02:54Z
  Revision:                1
Events:
  Type    Reason     Age   From                                       Message
  ----    ------     ----  ----                                       -------
  Normal  Issuing    100s  cert-manager-certificates-trigger          Issuing certificate as Secret does not exist
  Normal  Generated  100s  cert-manager-certificates-key-manager      Stored new private key in temporary Secret resource "selfsigned-cert-b9vhz"
  Normal  Requested  100s  cert-manager-certificates-request-manager  Created new CertificateRequest resource "selfsigned-cert-9mfmp"
  Normal  Issuing    100s  cert-manager-certificates-issuing          The certificate has been successfully issued

```

Disini kita sudah berhasil mengetes untuk installasi cert-manager, dan mengetes issuing certificate kita


## Issuer menggunakan DNS01 dan CloudDNS Google

This guide explains how to set up an Issuer, or ClusterIssuer, to use Google CloudDNS to solve DNS01 ACME challenges

### Setup Service Account

cert-manager needs to be able to add records to CloudDNS in order to solve the DNS01 challenge. To enable this, a GCP service account must be created with the `dns.admin` role.

> ```Note: For this guide the gcloud command will be used to set up the service account. Ensure that gcloud is using the correct project and zone before entering the commands. ```

1. Create service account
```
$ PROJECT_ID=tk-dev-vpchost
$ gcloud iam service-accounts create dns01-solver --display-name "dns01-solver"
```

2. Add role for service account
```
$ gcloud projects add-iam-policy-binding $PROJECT_ID \
   --member serviceAccount:dns01-solver@$PROJECT_ID.iam.gserviceaccount.com \
   --role roles/dns.admin
```

3. Download keys for secret
```
$ gcloud iam service-accounts keys create key.json \
   --iam-account dns01-solver@$PROJECT_ID.iam.gserviceaccount.com
```

4. Create kubernetes secret with jsonfile from serviceaccount
```
$ kubectl create secret generic clouddns-dns01-solver-svc-acct \
   --from-file=key.json -n cert-manager
```

> Note: If you have already added the Secret but get an error: ...due to error processing: error getting clouddns service account: secret "XXX" not found, the Secret may be in the wrong namespace. If you're configuring a ClusterIssuer, move the Secret to the Cluster Resource Namespace which is cert-manager by default. If you're configuring an Issuer, the Secret should be stored in the same namespace as the Issuer resource.


### Create an Issuer/ClusterIssuer CloudDNS

1. Install ClusterIssuer untuk CloudDNS (contoh1)

```
$ clusterissuer-clouddns.yaml

apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: clouddns-issuer
  namespace: cert-manager
spec:
  acme:
    email: ridwan.siswanto@tiket.com
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: clouddns-issuer-key
    solvers:
      - dns01:
          cloudDNS:
            project: tk-dev-vpchost
            serviceAccountSecretRef:
              name: clouddns-dns01-solver-svc-acct
              key: key.json
```

2. Check cluster issuer
```
Status:
  Acme:
    Last Registered Email:  ridwan.siswanto@tiket.com
    Uri:                    https://acme-v02.api.letsencrypt.org/acme/acct/492094690
  Conditions:
    Last Transition Time:  2022-04-13T13:17:59Z
    Message:               The ACME account was registered with the ACME server
    Observed Generation:   1
    Reason:                ACMEAccountRegistered
    Status:                True
    Type:                  Ready
Events:                    <none>
```

### Setup Cloud DNS
Pada contoh ini kita akan membuat certificate dengan wildcard untuk domain `*.ridwan-siswanto.com`.

1. kita akan buat zone public karena acme butuh untuk resolve ke domain kita. Pastikan sesuai dengan project yang ada di cluster issuer `tk-dev-vpchost`

```
gcloud dns managed-zones create ridwan-siswanto --description="testing-for-certificate" --dns-name=ridwan-siswanto.com
Created [https://dns.googleapis.com/dns/v1/projects/tk-dev-vpchost/managedZones/ridwan-siswanto]
```

2. pastikan zone sudah dibuat

```
gcloud dns managed-zones list
NAME             DNS_NAME                DESCRIPTION                             VISIBILITY
ridwan-siswanto  ridwan-siswanto.com.    testing-for-certificate                 public
```

### Setup Registrar
1. Go to your domain list, and check mengenai registrar setup. Kita perlu menambahkan record nameserver berikut ke registrar kita

```
NS  
ns-cloud-b1.googledomains.com.
ns-cloud-b2.googledomains.com.
ns-cloud-b3.googledomains.com.
ns-cloud-b4.googledomains.com.
```

2. Saya sudah menambahkan nameserver di registar

```
Your Current Nameservers:

Nameserver 1: ns-cloud-b1.googledomains.com
Nameserver 2: ns-cloud-b2.googledomains.com
Nameserver 3: ns-cloud-b3.googledomains.com
Nameserver 4: ns-cloud-b4.googledomains.com
```

### Create certificate
1. Kita akan membuat certificate untuk domain `*.ridwan-siswanto.com`
```
$ certificate-clouddns.yaml

apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: infra-com-gcp
  namespace: cert-manager
spec:
  secretName: infra-com-gcp
  issuerRef:
    kind: ClusterIssuer
    name: clouddns-issuer
  dnsNames:
  - '*.ridwan-siswanto.com'
```

2. check
```
k get certificate -n cert-manager
NAME                  READY   SECRET                AGE
infra-com-gcp         True    infra-com-gcp         8s
```

3. describe
```
Status:
  Conditions:
    Last Transition Time:  2022-04-15T10:38:00Z
    Message:               Certificate is up to date and has not expired
    Observed Generation:   1
    Reason:                Ready
    Status:                True
    Type:                  Ready
  Not After:               2022-07-14T09:37:58Z
  Not Before:              2022-04-15T09:37:59Z
  Renewal Time:            2022-06-14T09:37:58Z
  Revision:                1
Events:
  Type    Reason     Age   From                                       Message
  ----    ------     ----  ----                                       -------
  Normal  Issuing    18m   cert-manager-certificates-trigger          Issuing certificate as Secret does not exist
  Normal  Generated  18m   cert-manager-certificates-key-manager      Stored new private key in temporary Secret resource "infra-com-gcp-d5lwr"
  Normal  Requested  18m   cert-manager-certificates-request-manager  Created new CertificateRequest resource "infra-com-gcp-nd7df"
  Normal  Issuing    17m   cert-manager-certificates-issuing          The certificate has been successfully issued
```

4. check certificate request
```
k get certificaterequests.cert-manager.io -n cert-manager
NAME                        APPROVED   DENIED   READY   ISSUER            REQUESTOR                                         AGE
infra-com-gcp-6lbpn         True                True    clouddns-issuer   system:serviceaccount:cert-manager:cert-manager   62s
```

4. Get order
```
k get order -n cert-manager
NAME                                   STATE   AGE
infra-com-gcp-6lbpn-3072773403         valid   101s
```

5. Get challenge, biasanya untuk pertama kali akan ada request challenge 
```

```

6. Liat record google clouddns, jika pertama kali maka akan ada penambahan record txt oleh acme ke domain yang mau kita buatkan certificatenya

```
NAME                                 TYPE  TTL    DATA
ridwan-siswanto.com.                 NS    21600  ns-cloud-b1.googledomains.com.,ns-cloud-b2.googledomains.com.,ns-cloud-b3.googledomains.com.,ns-cloud-b4.googledomains.com.
ridwan-siswanto.com.                 SOA   21600  ns-cloud-b1.googledomains.com. cloud-dns-hostmaster.google.com. 1 21600 3600 259200 300
_acme-challenge.ridwan-siwanto.com.  TXT   60     "-----"
```

7. Liat log cert-manager
```
I0415 10:37:55.758685       1 trigger_controller.go:200] cert-manager/certificates-trigger "msg"="Certificate must be re-issued" "key"="cert-manager/infra-com-gcp" "message"="Issuing certificate as Secret does not exist" "reason"="DoesNotExist"
I0415 10:37:55.758679       1 conditions.go:201] Setting lastTransitionTime for Certificate "infra-com-gcp" condition "Ready" to 2022-04-15 10:37:55.758668385 +0000 UTC m=+179197.739331866
I0415 10:37:55.758720       1 conditions.go:201] Setting lastTransitionTime for Certificate "infra-com-gcp" condition "Issuing" to 2022-04-15 10:37:55.758714527 +0000 UTC m=+179197.739378010
I0415 10:37:55.807781       1 controller.go:161] cert-manager/certificates-trigger "msg"="re-queuing item due to optimistic locking on resource" "key"="cert-manager/infra-com-gcp" "error"="Operation cannot be fulfilled on certificates.cert-manager.io \"infra-com-gcp\": the object has been modified; please apply your changes to the latest version and try again"
I0415 10:37:55.807973       1 trigger_controller.go:200] cert-manager/certificates-trigger "msg"="Certificate must be re-issued" "key"="cert-manager/infra-com-gcp" "message"="Issuing certificate as Secret does not exist" "reason"="DoesNotExist"
I0415 10:37:55.808007       1 conditions.go:201] Setting lastTransitionTime for Certificate "infra-com-gcp" condition "Issuing" to 2022-04-15 10:37:55.808000511 +0000 UTC m=+179197.788664015
I0415 10:37:56.009770       1 conditions.go:261] Setting lastTransitionTime for CertificateRequest "infra-com-gcp-nd7df" condition "Approved" to 2022-04-15 10:37:56.00976007 +0000 UTC m=+179197.990423546
I0415 10:37:56.050723       1 conditions.go:261] Setting lastTransitionTime for CertificateRequest "infra-com-gcp-nd7df" condition "Ready" to 2022-04-15 10:37:56.05071085 +0000 UTC m=+179198.031374322
I0415 10:38:00.327545       1 acme.go:216] cert-manager/certificaterequests-issuer-acme/sign "msg"="certificate issued" "related_resource_kind"="Order" "related_resource_name"="infra-com-gcp-nd7df-3072773403" "related_resource_namespace"="cert-manager" "related_resource_version"="v1" "resource_kind"="CertificateRequest" "resource_name"="infra-com-gcp-nd7df" "resource_namespace"="cert-manager" "resource_version"="v1"
I0415 10:38:00.327902       1 conditions.go:250] Found status change for CertificateRequest "infra-com-gcp-nd7df" condition "Ready": "False" -> "True"; setting lastTransitionTime to 2022-04-15 10:38:00.327892639 +0000 UTC m=+179202.308556117
I0415 10:38:00.390712       1 conditions.go:190] Found status change for Certificate "infra-com-gcp" condition "Ready": "False" -> "True"; setting lastTransitionTime to 2022-04-15 10:38:00.390701644 +0000 UTC m=+179202.371365129
I0415 10:38:00.413669       1 controller.go:161] cert-manager/certificates-issuing "msg"="re-queuing item due to optimistic locking on resource" "key"="cert-manager/infra-com-gcp" "error"="Operation cannot be fulfilled on certificates.cert-manager.io \"infra-com-gcp\": the object has been modified; please apply your changes to the latest version and try again"
```

8. liat secret
```
k get secret -n cert-manager
NAME                                  TYPE                                  DATA   AGE
cert-manager-cainjector-token-h4rxb   kubernetes.io/service-account-token   3      2d1h
cert-manager-token-4pm6n              kubernetes.io/service-account-token   3      2d1h
cert-manager-webhook-ca               Opaque                                3      4d
cert-manager-webhook-token-tbzjj      kubernetes.io/service-account-token   3      2d1h
clouddns-dns01-solver-svc-acct        Opaque                                1      4d
clouddns-issuer-key                   Opaque                                1      4d
default-token-cqnln                   kubernetes.io/service-account-token   3      4d
infra-com-gcp                         kubernetes.io/tls                     2      3m37s
sh.helm.release.v1.cert-manager.v1    helm.sh/release.v1                    1      2d1h
```

9. liat secret
```
k describe secret -n cert-manager infra-com-gcp
Name:         infra-com-gcp
Namespace:    cert-manager
Labels:       <none>
Annotations:  cert-manager.io/alt-names: *.ridwan-siswanto.com
              cert-manager.io/certificate-name: infra-com-gcp
              cert-manager.io/common-name: *.ridwan-siswanto.com
              cert-manager.io/ip-sans: 
              cert-manager.io/issuer-group: 
              cert-manager.io/issuer-kind: ClusterIssuer
              cert-manager.io/issuer-name: clouddns-issuer
              cert-manager.io/uri-sans: 

Type:  kubernetes.io/tls

Data
====
tls.crt:  5607 bytes
tls.key:  1675 bytes
```

> Sampai disini kita sudah berhasil untuk membuatkan ssl certificate wildcard untuk `*.ridwan-siswanto.com`

# Testing certificate
Untuk mengetes certificate yang sudah di setup sebelumnya, saya akan buat sebuah sample deployment, service, dan ingress

```
samplesimple
├── deployment.yaml
├── ingress-gcp.yaml
└── svc.yaml
```

Berikut detail dari application manifestnya

```
deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: sample-deployment
  labels:
    app: sample-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: sample-app
  template:
    metadata:
      labels:
        app: sample-app
    spec:
      containers:
      - name: sample-container
        image: nginx:latest
        ports:
        - name: http
          containerPort: 80
          protocol: TCP
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
```

service.yaml
```
apiVersion: v1
kind: Service
metadata:
  name: sample-app-service
  labels:
    app: sample-app
spec:
  type: NodePort
  selector:
    app: sample-app
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: 80
```

ingress-gcp.yaml
```
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: sampleapp-ingress-gcp
  annotations:
    kubernetes.io/ingress.class: nginx   
    nginx.ingress.kubernetes.io/force-ssl-redirect: "false"    
  labels:
    app: sample-app
spec:
  rules:
  - host: devops.ridwan-siswanto.com
    http:
      paths:
      - path: /
        backend:
          serviceName: sample-app-service
          servicePort: 80
```

Sebelum kita apply manifest2 tersebut, kita harus menambahkan atau edit ingress-controller agar membaca secret tls yang terbuat saat issuing certificate. 
```
$ k get secret -n cert-manager | grep gcp

infra-com-gcp                         kubernetes.io/tls                     2      8h
```

Edit deployment ingress-controller dan tambahkan args seperti di bawah ini

```
    spec:
      containers:
      - args:
        - /nginx-ingress-controller
        - --publish-service=$(POD_NAMESPACE)/ingress-nginx-controller
        - --election-id=ingress-controller-leader
        - --controller-class=k8s.io/ingress-nginx
        - --ingress-class=nginx
        - --configmap=$(POD_NAMESPACE)/ingress-nginx-controller
        - --validating-webhook=:8443
        - --validating-webhook-certificate=/usr/local/certificates/cert
        - --validating-webhook-key=/usr/local/certificates/key
+       - --default-ssl-certificate=cert-manager/infra-com-gcp
```

kita apply semua manifest kita
```
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress-gcp.yaml
```

get & describe ingress
```
k get ingress
NAME                    CLASS    HOSTS                        ADDRESS          PORTS   AGE
sampleapp-ingress-gcp   <none>   devops.ridwan-siswanto.com   192.168.128.89   80      77s
```

```
Name:             sampleapp-ingress-gcp
Namespace:        default
Address:          192.168.128.89
Default backend:  default-http-backend:80 (192.168.206.8:8080)
Rules:
  Host                        Path  Backends
  ----                        ----  --------
  devops.ridwan-siswanto.com  
                              /   sample-app-service:80 (192.168.220.145:80)
Annotations:                  kubernetes.io/ingress.class: nginx
                              nginx.ingress.kubernetes.io/force-ssl-redirect: false
Events:
  Type    Reason  Age                 From                      Message
  ----    ------  ----                ----                      -------
  Normal  Sync    91s (x2 over 117s)  nginx-ingress-controller  Scheduled for sync
```

Untuk di case saya, saya perlu menambahkan manual di local untuk mengarahkan ke applikasi/ingress.

tambahkan di `/etc/hosts`
```
192.168.128.89 devops.ridwan-siswanto.com
```

TESTING!!!!
```
nmap -p 443 --script ssl-cert devops.ridwan-siswanto.com

Starting Nmap 7.92 ( https://nmap.org ) at 2022-04-16 02:24 WIB
Nmap scan report for devops.ridwan-siswanto.com (192.168.128.89)
Host is up (0.027s latency).
rDNS record for 192.168.128.89: devops.transport-infra.tiket.com

PORT    STATE SERVICE
443/tcp open  https
| ssl-cert: Subject: commonName=*.ridwan-siswanto.com
| Subject Alternative Name: DNS:*.ridwan-siswanto.com
| Issuer: commonName=R3/organizationName=Let's Encrypt/countryName=US
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2022-04-15T09:37:59
| Not valid after:  2022-07-14T09:37:58
| MD5:   a8d4 6057 9b90 0fb8 f713 0459 9603 5440
|_SHA-1: d41c e91c 97dc 8521 8344 4920 c9d5 1fef 5871 6ae6

Nmap done: 1 IP address (1 host up) scanned in 0.38 seconds
```

menggunakan curl
```
curl -vs https://devops.ridwan-siswanto.com

*   Trying 192.168.128.89...
* TCP_NODELAY set
* Connected to devops.ridwan-siswanto.com (192.168.128.89) port 443 (#0)
* successfully set certificate verify locations:
*   CAfile: /etc/ssl/cert.pem
  CApath: none
* TLSv1.2 (OUT), TLS handshake, Client hello (1):
* TLSv1.2 (IN), TLS handshake, Server hello (2):
* TLSv1.2 (IN), TLS handshake, Certificate (11):
* TLSv1.2 (IN), TLS handshake, Server key exchange (12):
* TLSv1.2 (IN), TLS handshake, Server finished (14):
* TLSv1.2 (OUT), TLS handshake, Client key exchange (16):
* TLSv1.2 (OUT), TLS change cipher, Change cipher spec (1):
* TLSv1.2 (OUT), TLS handshake, Finished (20):
* TLSv1.2 (IN), TLS change cipher, Change cipher spec (1):
* TLSv1.2 (IN), TLS handshake, Finished (20):
* SSL connection using TLSv1.2 / ECDHE-RSA-AES128-GCM-SHA256
* Server certificate:
*  subject: CN=*.ridwan-siswanto.com
*  start date: Apr 15 09:37:59 2022 GMT
*  expire date: Jul 14 09:37:58 2022 GMT
*  subjectAltName: host "devops.ridwan-siswanto.com" matched cert's "*.ridwan-siswanto.com"
*  issuer: C=US; O=Let's Encrypt; CN=R3
*  SSL certificate verify ok.
> GET / HTTP/1.1
> Host: devops.ridwan-siswanto.com
> User-Agent: curl/7.64.1
> Accept: */*
>
< HTTP/1.1 200 OK
```