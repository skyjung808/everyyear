import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { toSolar, LunarCalendar } from "https://esm.sh/kor-lunar@1.7.0";
import { SUPABASE_URL, SUPABASE_ANON_KEY, VAPID_PUBLIC_KEY } from "./config.js";

const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const $=id=>document.getElementById(id);
for(let m=1;m<=12;m++) $("month").add(new Option(`${m}월`,m));
for(let d=1;d<=30;d++) $("day").add(new Option(`${d}일`,d));
let user=null;

function msg(id,text){$(id).textContent=text}
async function refresh(){
 const {data:{user:u}}=await supabase.auth.getUser(); user=u;
 $("authCard").classList.toggle("hidden",!!user);
 $("appCard").classList.toggle("hidden",!user);
 if(user) await loadReminders();
}
$("signup").onclick=async()=>{
 const {error}=await supabase.auth.signUp({email:$("email").value.trim(),password:$("password").value});
 msg("authMessage",error?error.message:"가입 요청 완료! 이메일 인증을 마친 뒤 로그인해 주세요.");
};
$("login").onclick=async()=>{
 const {error}=await supabase.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
 msg("authMessage",error?error.message:"로그인되었습니다.");
 if(!error) await refresh();
};
$("logout").onclick=async()=>{await supabase.auth.signOut();await refresh()};
supabase.auth.onAuthStateChange(()=>refresh());

$("addReminder").onclick=async()=>{
 if(!user)return;
 const month=Number($("month").value),day=Number($("day").value),leap=$("leap").value==="true";
 const {data:{user:u}}=await supabase.auth.getUser();
 const currentYear=new Date().getFullYear();
 if(!LunarCalendar.isValid(currentYear,month,day,leap)){
   // 현재 연도에 윤달이 없어도 날짜 자체는 다른 해에 존재할 수 있으므로 일반 날짜 범위만 검사
   if(day>30){msg("pushMessage","음력 날짜를 확인해 주세요.");return;}
 }
 const {error}=await supabase.from("reminders").insert({
  user_id:u.id,title:$("title").value.trim()||"음력 알림",
  lunar_month:month,lunar_day:day,is_leap_month:leap,
  notify_time:$("time").value,timezone:"Asia/Seoul",active:true
 });
 msg("pushMessage",error?error.message:"매년 반복 알림을 등록했어요.");
 if(!error) await loadReminders();
};
async function loadReminders(){
 const {data,error}=await supabase.from("reminders").select("*").order("created_at",{ascending:false});
 if(error){msg("pushMessage",error.message);return}
 $("reminders").replaceChildren();
 for(const r of data||[]){
  const el=document.createElement("div");el.className="item";
  const title=document.createElement("strong");title.textContent=r.title;
  const detail=document.createElement("small");detail.textContent=`음력 ${r.is_leap_month?"윤":""}${r.lunar_month}월 ${r.lunar_day}일 · ${r.notify_time.slice(0,5)} · ${r.active?"사용 중":"중지됨"}`;
  const del=document.createElement("button");del.textContent="삭제";
  del.onclick=async()=>{const {error}=await supabase.from("reminders").delete().eq("id",r.id);if(error)msg("pushMessage",error.message);else await loadReminders()};
  el.append(title,detail,del);$("reminders").append(el);
 }
}
function urlBase64ToUint8Array(base64String){
 const padding="=".repeat((4-base64String.length%4)%4);
 const raw=atob((base64String+padding).replace(/-/g,"+").replace(/_/g,"/"));
 return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));
}
$("enablePush").onclick=async()=>{
 try{
  if(!("serviceWorker" in navigator)||!("PushManager" in window)){msg("pushMessage","이 브라우저는 푸시 알림을 지원하지 않습니다.");return}
  if(!VAPID_PUBLIC_KEY||VAPID_PUBLIC_KEY.startsWith("YOUR_")){msg("pushMessage","먼저 config.js에 VAPID 공개키를 설정해야 합니다.");return}
  const permission=await Notification.requestPermission();
  if(permission!=="granted"){msg("pushMessage","알림 권한이 허용되지 않았습니다.");return}
  const reg=await navigator.serviceWorker.ready;
  let sub=await reg.pushManager.getSubscription();
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)});
  const j=sub.toJSON();
  const {data:{user:u}}=await supabase.auth.getUser();
  const {error}=await supabase.from("push_subscriptions").upsert({
   user_id:u.id,endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth
  },{onConflict:"endpoint"});
  msg("pushMessage",error?error.message:"이 기기의 푸시 알림 등록이 완료됐어요.");
 }catch(e){msg("pushMessage","푸시 등록 실패: "+e.message)}
};
if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(console.error);
refresh();
