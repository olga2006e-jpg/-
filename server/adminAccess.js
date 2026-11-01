const loopback=address=>typeof address==='string'&&(/^(::ffff:)?127\./.test(address)||address==='::1'||address==='0:0:0:0:0:0:0:1');

export function isHostAdmin(req){
  // Trust the TCP peer, never Host or a client-supplied forwarding header.
  if(!loopback(req.socket?.remoteAddress))return false;
  const forwarded=req.headers?.['x-forwarded-for'];
  if(forwarded&&!String(forwarded).split(',').every(ip=>loopback(ip.trim())))return false;
  const origin=req.headers?.origin;
  if(origin){try{const url=new URL(origin);if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||!['3001','5173','5174'].includes(url.port))return false;}catch{return false;}}
  return true;
}

export function requireHostAdmin(req,res,next){
  if(!isHostAdmin(req))return res.status(403).json({success:false,error:'Админ-панель доступна только на компьютере сервера через localhost.'});
  next();
}
