self.addEventListener("install",e=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("push",event=>{
 let data={title:"EveryYear 음력 알림",body:"등록한 음력 날짜입니다."};
 try{if(event.data)data={...data,...event.data.json()}}catch(_){}
 event.waitUntil(self.registration.showNotification(data.title,{
  body:data.body,icon:"./icon-192.png",badge:"./icon-192.png",data:{url:"./"}
 }));
});
self.addEventListener("notificationclick",event=>{
 event.notification.close();
 event.waitUntil(self.clients.openWindow("./"));
});
