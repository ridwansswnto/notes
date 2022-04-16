---
title: "Kubernetes Production - External DNS GKE"
metaTitle: "Sejarah DevOps"
metaDescription: "This is the meta description for this page"
---

# External DNS GKE

external dns merupakan

## Install external-dns

1. setup manifest seperti dibawah ini
```
deploy.yaml

  apiVersion: v1
  kind: Namespace
  metadata:
    name: external-dns
---
  apiVersion: v1
  kind: ServiceAccount
  metadata:
    annotations:
+     iam.gke.io/gcp-service-account: external-dns@tk-dev-micro.iam.gserviceaccount.com
    name: external-dns
    namespace: external-dns
---
  apiVersion: rbac.authorization.k8s.io/v1
  kind: ClusterRole
  metadata:
    name: external-dns
  rules:
  - apiGroups:
    - ""
    resources:
    - services
    - endpoints
    - pods
    verbs:
    - get
    - watch
    - list
  - apiGroups:
    - extensions
    - networking.k8s.io
    resources:
    - ingresses
    verbs:
    - get
    - watch
    - list
  - apiGroups:
    - ""
    resources:
    - nodes
    verbs:
    - list
---
  apiVersion: rbac.authorization.k8s.io/v1
  kind: ClusterRoleBinding
  metadata:
    name: external-dns-viewer
  roleRef:
    apiGroup: rbac.authorization.k8s.io
    kind: ClusterRole
    name: external-dns
  subjects:
  - kind: ServiceAccount
    name: external-dns
    namespace: external-dns
---
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: external-dns
    namespace: external-dns
  spec:
    selector:
      matchLabels:
        app: external-dns
    strategy:
      type: Recreate
    template:
      metadata:
        labels:
          app: external-dns
      spec:
        containers:
        - args:
+         - --txt-owner-id=dev-ridwan-identifier
+         - --google-project=tk-dev-vpchost
          - --source=ingress
+         - --domain-filter=ridwan-siswanto.com
          - --provider=google
          - --registry=txt
          image: k8s.gcr.io/external-dns/external-dns:v0.7.3
          name: external-dns
          resources:
            requests:
              cpu: "0.1"
              memory: 64Mi
        securityContext:
          fsGroup: 65534
          runAsUser: 65534
        serviceAccountName: external-dns

```

2. Perhatikan yang bagian di highlight, pastikan sudah memiliki service account dengan permission `write record`. kemudian ganti txt-owner sebagai identifier saja. Untuk project, sesuaikan dengan project apa cloud dns tersebut di buat. Dan terakhir untuk domain-filter, ini sesuaikan dengan record domain.

3. Kita apply deploy.yaml

```
$ kubectl apply -f deploy.yaml

namespace/external-dns created
serviceaccount/external-dns created
clusterrole.rbac.authorization.k8s.io/external-dns created
clusterrolebinding.rbac.authorization.k8s.io/external-dns-viewer created
deployment.apps/external-dns created
```

4. kita check untuk bagian serviceaccount
```
k describe serviceaccounts -n external-dns external-dns

Name:                external-dns
Namespace:           external-dns
Labels:              <none>
Annotations:         iam.gke.io/gcp-service-account: external-dns@tk-dev-micro.iam.gserviceaccount.com
Image pull secrets:  <none>
Mountable secrets:   external-dns-token-wq67x
Tokens:              external-dns-token-wq67x
Events:              <none>
```

5. kita check untuk bagian deployment, pada kondisi saya saat ini, aplikasi yang kita pakai untuk testing di bagian certificate masih run, jadi expectednya akan langsung menambahkan record di clouddns.
```
k logs -n external-dns external-dns-75cbfdf5f6-bj4g6 external-dns -f

time="2022-04-16T02:43:37Z" level=info msg="Instantiating new Kubernetes client"
time="2022-04-16T02:43:37Z" level=info msg="Using inCluster-config based on serviceaccount-token"
time="2022-04-16T02:43:37Z" level=info msg="Created Kubernetes client https://192.168.182.1:443"
time="2022-04-16T02:43:44Z" level=info msg="Change zone: ridwan-siswanto batch #0"
time="2022-04-16T02:43:44Z" level=info msg="Add records: devops.ridwan-siswanto.com. A [192.168.128.89] 300"
time="2022-04-16T02:43:44Z" level=info msg="Add records: devops.ridwan-siswanto.com. TXT [\"heritage=external-dns,external-dns/owner=dev-ridwan-identifier,external-dns/resource=ingress/default/sampleapp-ingress-gcp\"] 300"
```

6. berdasarkan logs deployment external-dns kita berhasil menambahkan record untuk devops.ridwan-siswanto.com ke 192.168.128.89. Kita check di record domain kita
```
$ gcloud dns record-sets list --zone=ridwan-siswanto

NAME                         TYPE  TTL    DATA
ridwan-siswanto.com.         NS    21600  ns-cloud-b1.googledomains.com.,ns-cloud-b2.googledomains.com.,ns-cloud-b3.googledomains.com.,ns-cloud-b4.googledomains.com.
ridwan-siswanto.com.         SOA   21600  ns-cloud-b1.googledomains.com. cloud-dns-hostmaster.google.com. 1 21600 3600 259200 300
devops.ridwan-siswanto.com.  A     300    192.168.128.89
devops.ridwan-siswanto.com.  TXT   300    "heritage=external-dns,external-dns/owner=dev-ridwan-identifier,external-dns/resource=ingress/default/sampleapp-ingress-gcp"
```

7. untuk testing saya akan mencoba untuk menghapus record di `/etc/hosts` dimana sebelumnya kita perlu nambahin manual ya. Dan kondisi saya untuk mengetesnya adalah menggunakan vpn yang dapat ngobrol ke cloud dns tersebut.

```
$ cat /etc/hosts | grep devops

$ dig devops.ridwan-siswanto.com TXT

; <<>> DiG 9.10.6 <<>> devops.ridwan-siswanto.com TXT
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 57350
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;devops.ridwan-siswanto.com.  IN  TXT

;; ANSWER SECTION:
devops.ridwan-siswanto.com. 274 IN  TXT "heritage=external-dns,external-dns/owner=dev-ridwan-identifier,external-dns/resource=ingress/default/sampleapp-ingress-gcp"

;; Query time: 21 msec
;; SERVER: 192.168.48.31#53(192.168.48.31)
;; WHEN: Sat Apr 16 09:49:49 WIB 2022
;; MSG SIZE  rcvd: 190

$ dig devops.ridwan-siswanto.com A

; <<>> DiG 9.10.6 <<>> devops.ridwan-siswanto.com A
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 44737
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;devops.ridwan-siswanto.com.  IN  A

;; ANSWER SECTION:
devops.ridwan-siswanto.com. 300 IN  A 192.168.128.89

;; Query time: 32 msec
;; SERVER: 192.168.48.31#53(192.168.48.31)
;; WHEN: Sat Apr 16 09:49:52 WIB 2022
;; MSG SIZE  rcvd: 71
```

> saat ini kita sukses buat system auto untuk creating DNS, jadi misal ada aplikasi dengan ingress baru. Contoh testing.ridwan-siswanto.com. Dari external-dns akan auto membuatkan record ke `clouddns` untuk ingress tersebut berdasarkan domain yang kita define di ingress

Referensi:
https://github.com/kubernetes-sigs/external-dns/blob/master/docs/tutorials/gke.md
