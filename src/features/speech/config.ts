/** 与参照项目相同的 FunASR 服务；HTTPS 部署需配置 wss 地址。 */
export const ASR_WS_URL = import.meta.env.VITE_ASR_WS_URL?.trim() || 'ws://47.110.147.126:13020/';
