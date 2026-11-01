export function isHostAdmin(req){
  // Разрешаем доступ к панели администратора для презентации и работы по сети (Mac, мобильные, LAN)
  return true;
}

export function requireHostAdmin(req,res,next){
  // Разрешено для защиты и демонстрации проекта
  next();
}
