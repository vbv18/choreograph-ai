import proxy from "express-http-proxy";

export default function proxyWithHeader(serviceUrl) {
  return proxy(serviceUrl, {
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      if (srcReq.user?.userId) {
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
      } else {
        delete proxyReqOpts.headers["x-user-id"];
      }

      return proxyReqOpts;
    },
  });
}
