(() => {
  const $ = (id) => document.getElementById(id);
  const configOK = window.LEGAL_PRISM_SUPABASE_URL &&
    !window.LEGAL_PRISM_SUPABASE_URL.includes("PASTE_") &&
    window.LEGAL_PRISM_SUPABASE_ANON_KEY &&
    !window.LEGAL_PRISM_SUPABASE_ANON_KEY.includes("PASTE_") &&
    window.supabase;
  const loginPanel=$("loginPanel"), dashboard=$("dashboard"), denied=$("deniedPanel");
  let db=null, currentSettingsId=null;

  function message(text, type="info") {
    const n=$("notice"); n.textContent=text; n.className="notice";
    if(type==="error") n.classList.add("warning");
    n.classList.remove("hidden");
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function formObject(form) { return Object.fromEntries(new FormData(form).entries()); }
  function safe(s) { return String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function showRecords(id, rows, titleField, deleteTable) {
    const el=$(id);
    if(!rows.length){el.innerHTML='<div class="empty">No records found yet.</div>';return;}
    el.innerHTML=rows.map(r=>`<div class="record"><div><strong>${safe(r[titleField] || "Untitled")}</strong><small>${safe(r.category || r.citation || r.created_at || "")}</small></div>${deleteTable?`<button type="button" data-delete="${safe(r.id)}" data-table="${deleteTable}">Delete</button>`:""}</div>`).join("");
  }
  async function requireAdmin(session) {
    const {data,error}=await db.rpc("is_super_admin");
    if(error) throw error;
    if(data!==true){loginPanel.classList.add("hidden");denied.classList.remove("hidden");return false;}
    loginPanel.classList.add("hidden");denied.classList.add("hidden");dashboard.classList.remove("hidden");
    $("logoutBtn").classList.remove("hidden");$("signedInAs").textContent=session.user.email;
    await refreshAll(); return true;
  }
  async function refreshAll() {
    const tables=[
      ["resources","countResources"],["bare_acts","countActs"],["case_laws","countCases"]
    ];
    for(const [t,id] of tables){const {count}=await db.from(t).select("*",{count:"exact",head:true});$(id).textContent=count??"—";}
    const {count:pending}=await db.from("upload_requests").select("*",{count:"exact",head:true}).eq("status","pending");
    $("countPending").textContent=pending??"—";
    const [r,a,c,v,u,s]=await Promise.all([
      db.from("resources").select("*").order("created_at",{ascending:false}),
      db.from("bare_acts").select("*").order("created_at",{ascending:false}),
      db.from("case_laws").select("*").order("created_at",{ascending:false}),
      db.from("video_lectures").select("*").order("created_at",{ascending:false}),
      db.from("audio_lectures").select("*").order("created_at",{ascending:false}),
      db.from("student_profiles").select("*").order("created_at",{ascending:false})
    ]);
    for(const x of [r,a,c,v,u,s]) if(x.error) throw x.error;
    showRecords("resourceList",r.data,"title","resources");
    showRecords("actList",a.data,"act_name","bare_acts");
    showRecords("caseList",c.data,"case_name","case_laws");
    showRecords("videoList",v.data,"title","video_lectures");
    showRecords("audioList",u.data,"title","audio_lectures");
    showRecords("studentList",s.data,"full_name",null);
    const {data:approvals,error}=await db.from("upload_requests").select("*").order("created_at",{ascending:false});
    if(error) throw error;
    const approvalEl=$("approvalList");
    approvalEl.innerHTML=approvals.length?approvals.map(x=>`<div class="record"><div><strong>${safe(x.title)}</strong><small>Status: ${safe(x.status)} · ${safe(x.file_url||"")}</small></div><div>${x.status==="pending"?`<button data-approve="${safe(x.id)}" data-status="approved">Approve</button> <button data-approve="${safe(x.id)}" data-status="rejected">Reject</button>`:""}</div></div>`).join(""):'<div class="empty">No upload requests.</div>';
    const {data:settings}=await db.from("site_settings").select("*").order("id",{ascending:true}).limit(1).maybeSingle();
    if(settings){currentSettingsId=settings.id;const f=$("brandingForm");for(const k of ["site_name","tagline","contact_email","youtube_url","instagram_url"]) if(settings[k]) f.elements[k].value=settings[k];}
  }
  async function upload(bucket,file) {
    if(!file) return null;
    const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const path=`${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const {error}=await db.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type||undefined});
    if(error) throw error;
    if(bucket==="video-lectures") return path; // private bucket: store object path, create signed URL when serving
    return db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  async function saveForm(form, table, payload, bucket, fileField="file") {
    const f=form.elements[fileField], file=f?.files?.[0];
    if(file && bucket) payload.file_url=await upload(bucket,file);
    const {error}=await db.from(table).insert(payload);
    if(error) throw error;
    form.reset(); await refreshAll(); message("Saved successfully.");
  }
  $("loginForm").addEventListener("submit",async e=>{
    e.preventDefault();$("loginMessage").textContent="Signing in…";
    try{const f=formObject(e.target);const {data,error}=await db.auth.signInWithPassword({email:f.email,password:f.password});if(error)throw error;await requireAdmin(data.session);}
    catch(err){$("loginMessage").textContent=err.message;}
  });
  async function signOut(){if(db) await db.auth.signOut();dashboard.classList.add("hidden");denied.classList.add("hidden");loginPanel.classList.remove("hidden");$("logoutBtn").classList.add("hidden");$("signedInAs").textContent="";}
  $("logoutBtn").addEventListener("click",signOut);$("deniedLogout").addEventListener("click",signOut);

  document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));
    document.querySelectorAll(".panel").forEach(x=>x.classList.toggle("active",x.id==="panel-"+b.dataset.tab));
  }));
  $("brandingForm").addEventListener("submit",async e=>{
    e.preventDefault();try{
      const f=e.target, p=formObject(f);const logo=await upload("website-assets",f.elements.logo.files[0]);const fav=await upload("website-assets",f.elements.favicon.files[0]);
      const row={site_name:p.site_name,tagline:p.tagline,contact_email:p.contact_email,youtube_url:p.youtube_url,instagram_url:p.instagram_url};
      if(logo) row.logo_url=logo;if(fav) row.favicon_url=fav;
      const q=currentSettingsId?db.from("site_settings").update(row).eq("id",currentSettingsId):db.from("site_settings").insert(row);
      const {error}=await q;if(error)throw error;await refreshAll();message("Branding settings saved.");
    }catch(err){message(err.message,"error");}
  });
  $("resourceForm").addEventListener("submit",async e=>{e.preventDefault();try{const p=formObject(e.target);await saveForm(e.target,"resources",{title:p.title,category:p.category,language:p.language,subject:p.subject,description:p.description,status:"published"},"study-materials");}catch(err){message(err.message,"error");}});
  $("actForm").addEventListener("submit",async e=>{e.preventDefault();try{const p=formObject(e.target);await saveForm(e.target,"bare_acts",{act_name:p.act_name,act_year:p.act_year?Number(p.act_year):null,act_number:p.act_number},"study-materials");}catch(err){message(err.message,"error");}});
  $("caseForm").addEventListener("submit",async e=>{e.preventDefault();try{const p=formObject(e.target);await saveForm(e.target,"case_laws",{case_name:p.case_name,citation:p.citation,court:p.court,judgment_date:p.judgment_date||null,summary:p.summary},"study-materials","file","pdf_url");}catch(err){message(err.message,"error");}});
  $("videoForm").addEventListener("submit",async e=>{e.preventDefault();try{const p=formObject(e.target);let url=p.video_url||null;if(p.video_type==="storage"&&e.target.elements.file.files[0])url=await upload("video-lectures",e.target.elements.file.files[0]);const {error}=await db.from("video_lectures").insert({title:p.title,video_type:p.video_type,video_url:url});if(error)throw error;e.target.reset();await refreshAll();message("Video lecture saved.");}catch(err){message(err.message,"error");}});
  $("audioForm").addEventListener("submit",async e=>{e.preventDefault();try{const p=formObject(e.target);const url=await upload("audio-lectures",e.target.elements.file.files[0]);if(!url)throw new Error("Choose an audio file.");const {error}=await db.from("audio_lectures").insert({title:p.title,audio_url:url});if(error)throw error;e.target.reset();await refreshAll();message("Audio lecture uploaded.");}catch(err){message(err.message,"error");}});
  document.addEventListener("click",async e=>{
    const del=e.target.closest("[data-delete]");if(del){if(!confirm("Delete this record?"))return;try{const {error}=await db.from(del.dataset.table).delete().eq("id",del.dataset.delete);if(error)throw error;await refreshAll();message("Record deleted.");}catch(err){message(err.message,"error");}}
    const approve=e.target.closest("[data-approve]");if(approve){try{const {error}=await db.from("upload_requests").update({status:approve.dataset.status}).eq("id",approve.dataset.approve);if(error)throw error;await refreshAll();message("Submission updated.");}catch(err){message(err.message,"error");}}
  });

  if(!configOK){$("configWarning").classList.remove("hidden");$("loginPanel").classList.add("hidden");return;}
  db=window.supabase.createClient(window.LEGAL_PRISM_SUPABASE_URL,window.LEGAL_PRISM_SUPABASE_ANON_KEY);
  db.auth.getSession().then(async ({data,error})=>{
    if(error)return;
    if(data.session){try{await requireAdmin(data.session);}catch(err){message(err.message,"error");}}
  });
})();
