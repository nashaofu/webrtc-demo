# webrtc-demo
webrtc 演示示例，在线[预览地址](https://nashaofu.github.io/webrtc-demo/)，项目更多介绍可在公众号[nashaofu在路上](https://mp.weixin.qq.com/s?__biz=MzI2MTE0Njk1OA==&mid=2247483719&idx=1&sn=83a5bdde1c32abcfdb523244abeecf0d&chksm=ea5f9166dd281870f8d9f1c45e9438513c603bc809f84e7bc506cea894ace8365fce55ec2f66&mpshare=1&scene=1&srcid=0711vqT1fuIYaMUmSENe3Vqw&sharer_sharetime=1594441106087&sharer_shareid=e153e334206354e3d976016f883ef1ae#rd)中查看

## 使用说明

1. 生成ssl
```bash
mkdir ssl

cd ssl

openssl genrsa -des3 -passout pass:x -out server.pass.key 2048

# writing RSA key
openssl rsa -passin pass:x -in server.pass.key -out server.key

rm server.pass.key

openssl req -new -key server.key -out server.csr

openssl x509 -req -sha256 -days 365 -in server.csr -signkey server.key -out server.crt
```

2. 安装依赖启动服务
```bash
yarn

yarn start
```

3. 在浏览器中打开终端输出的地址，如遇到证书安全问题可参考https://blog.caojun.xyz/posts/macos_trust_ssl/
4. index.html是使用复制文本握手的示例，http.html是使用http建立连接的示例，socket.html是用来演示socket建立连接的示例

## webRTC 连接建立流程

![webrtc.svg](./docs/img/webrtc.svg)

交换offer和iceCandidata通常通过socket来交换，目的是方便对方网络情况变化后能够推送到参与会话的人，其实这个交换过程也可以用其他任何方式，只要能相互交换信息就可以。例如，A创建会话后，把自己的offer和iceCandidata通过邮件发送给B，B把这些信息设置到自己的会话中，然后把自己的offer和iceCandidata发送给A，只要在这期间网络状况没发生变化，就能够正常通话。关于webRTC，[这篇文章](https://juejin.im/post/5dcb652cf265da4d194864a3)讲得比较不错。

## MDN webRTC 连接流程介绍

![webRTC-mdn.png](./webRTC-mdn.png)
