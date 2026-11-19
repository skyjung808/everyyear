import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { toLunar } from "npm:kor-lunar@1.7.0";

const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 const cronSecret=Deno.env.get("CRON_SECRET")||"";
 if(!cronSecret||req.headers.get("Authorization")!==`Bearer ${cronSecret}`){
  return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers:{...corsHeaders,"Content-Type":"application/json"}});
 }
 const url=Deno.env.get("SUPABASE_URL")!;
 const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 const publicKey=Deno.env.get("VAPID_PUBLIC_KEY")!;
 const privateKey=Deno.env.get("VAPID_PRIVATE_KEY")!;
 const subject=Deno.env.get("VAPID_SUBJECT")||"mailto:admin@example.com";
 if(!publicKey||!privateKey)return new Response(JSON.stringify({error:"VAPID keys missing"}),{status:500});
 webpush.setVapidDetails(subject,publicKey,privateKey);
 const db=createClient(url,serviceKey);
 const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date());
 const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));
 const year=Number(p.year),month=Number(p.month),day=Number(p.day),time=`${p.hour}:${p.minute}:00`;
 const solarDate=`${p.year}-${p.month}-${p.day}`;
 const lunar=toLunar(year,month,day);
 const {data:reminders,error}=await db.from("reminders").select("*").eq("active",true).eq("lunar_month",lunar.month).eq("lunar_day",lunar.day).eq("is_leap_month",lunar.isLeapMonth).eq("notify_time",time);
 if(error)return new Response(JSON.stringify({error:error.message}),{status:500});
 let sent=0,skipped=0;
 for(const r of reminders||[]){
  const {error:claimError}=await db.from("notification_deliveries").insert({reminder_id:r.id,solar_date:solarDate});
  if(claimError){skipped++;continue}
  const {data:subs}=await db.from("push_subscriptions").select("*").eq("user_id",r.user_id);
  for(const s of subs||[]){
   try{
    await webpush.sendNotification({endpoint:s.endpoint,keys:{p256dh:s.p256dh,auth:s.auth}},JSON.stringify({
      title:r.title,body:`오늘은 음력 ${r.is_leap_month?"윤":""}${r.lunar_month}월 ${r.lunar_day}일입니다.`
    }),{TTL:60,urgency:"high"});
    sent++;
   }catch(e){
    const status=(e as {statusCode?:number}).statusCode;
    if(status===404||status===410)await db.from("push_subscriptions").delete().eq("id",s.id);
    console.error("push error",status,String(e));
   }
  }
 }
 return new Response(JSON.stringify({date:solarDate,lunar,sent,skipped}),{headers:{...corsHeaders,"Content-Type":"application/json"}});
});
