
const TOOL_DEFS = [
  {slug:"word-counter", name:"Word Counter", icon:"WC", category:"Text", desc:"Words, characters, reading time, paragraphs.", tags:["text","stats","copy"]},
  {slug:"case-converter", name:"Case Converter", icon:"Aa", category:"Text", desc:"Uppercase, lowercase, title case, sentence case.", tags:["text","format"]},
  {slug:"json-formatter", name:"JSON Formatter", icon:"{}", category:"Code", desc:"Format and validate JSON instantly.", tags:["json","validator"]},
  {slug:"base64-tool", name:"Base64 Tool", icon:"64", category:"Code", desc:"Encode and decode Base64 safely.", tags:["base64","encode"]},
  {slug:"hash-generator", name:"SHA-256 Hash", icon:"#", category:"Code", desc:"Generate SHA-256 hash in browser.", tags:["hash","crypto"]},
  {slug:"url-tool", name:"URL Encode/Decode", icon:"//", category:"Code", desc:"Quick URL-safe conversion.", tags:["url","encode"]},
  {slug:"password-generator", name:"Password Generator", icon:"PW", category:"Security", desc:"Strong passwords with fine control.", tags:["password","security"]},
  {slug:"qr-generator", name:"QR Generator", icon:"QR", category:"Media", desc:"Generate QR as PNG or SVG.", tags:["qr","share"]},
  {slug:"image-lab", name:"Image Lab", icon:"IMG", category:"Media", desc:"Resize, convert, compress, batch export images.", tags:["image","resize","compress"]},
  {slug:"pdf-studio", name:"PDF Studio", icon:"PDF", category:"PDF", desc:"Merge, split, remove pages, rotate pages, images to PDF.", tags:["pdf","merge","split"]},
  {slug:"color-lab", name:"Color Lab", icon:"HEX", category:"Design", desc:"HEX / RGB conversion with live preview.", tags:["hex","rgb"]},
  {slug:"unit-converter", name:"Unit Converter", icon:"CM", category:"Utility", desc:"Length, weight, temperature and more.", tags:["units","convert"]},
  {slug:"timestamp-tool", name:"Timestamp Tool", icon:"TS", category:"Utility", desc:"Unix ↔ readable date converter.", tags:["time","unix"]},
  {slug:"text-diff", name:"Text Compare", icon:"<>", category:"Text", desc:"Simple line-by-line text diff.", tags:["diff","compare"]},
  {slug:"csv-json", name:"CSV ↔ JSON", icon:"CJ", category:"Code", desc:"Convert basic CSV and JSON data.", tags:["csv","json","data"]},
  {slug:"regex-tester", name:"Regex Tester", icon:".*", category:"Code", desc:"Test regular expressions in-browser.", tags:["regex","pattern"]},
  {slug:"slug-generator", name:"Slug Generator", icon:"SL", category:"Text", desc:"Generate clean URL slugs.", tags:["slug","url"]},
  {slug:"lorem-generator", name:"Lorem Generator", icon:"LO", category:"Text", desc:"Generate placeholder paragraphs.", tags:["lorem","content"]},
];

const DEFAULT_PINNED = ["pdf-studio","image-lab","qr-generator"];

const POLIHOV = {
  prefix:"polihov_v7_",
  qs(s,r=document){return r.querySelector(s)},
  qsa(s,r=document){return [...r.querySelectorAll(s)]},
  save(k,v){localStorage.setItem(this.prefix+k, JSON.stringify(v))},
  load(k,f={}){try{return JSON.parse(localStorage.getItem(this.prefix+k)) ?? f}catch(e){return f}},
  toast(msg,type="ok"){
    const el=document.createElement("div");
    el.className=type;
    el.textContent=msg;
    Object.assign(el.style,{position:"fixed",right:"18px",bottom:"18px",zIndex:9999,maxWidth:"420px"});
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),2600);
  },
  downloadBlob(blob, filename){
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=filename;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1200);
  },
  copy(text){navigator.clipboard.writeText(text).then(()=>this.toast("Copied to clipboard"))},
  setRecent(tool){
    let list=this.load("recent",[]);
    list=list.filter(x=>x.slug!==tool.slug);
    list.unshift({...tool,at:new Date().toISOString()});
    this.save("recent", list.slice(0,20));
  },
  getRecent(){return this.load("recent",[])},
  setFavorite(slug,val){
    const fav=this.load("favorites",{});
    fav[slug]=!!val;
    this.save("favorites",fav);
  },
  isFavorite(slug){return !!this.load("favorites",{})[slug]},
  getFavorites(){
    const fav=this.load("favorites",{});
    return TOOL_DEFS.filter(t=>fav[t.slug]);
  },
  getPinned(){
    const stored = this.load("pinned_widgets", null);
    if(stored) return stored;
    this.save("pinned_widgets", DEFAULT_PINNED);
    return DEFAULT_PINNED;
  },
  setPinned(arr){ this.save("pinned_widgets", arr.slice(0,6)); }
};

function renderCard(tool, prefix="tools/"){
  return `<a class="card reveal" href="${prefix}${tool.slug}.html" data-category="${tool.category}">
    <div class="icon-chip">${tool.icon}</div>
    <div><h3>${tool.name}</h3><p class="muted">${tool.desc}</p></div>
    <div class="tags"><span class="tag">${tool.category}</span>${tool.tags.slice(0,2).map(t=>`<span class="tag">${t}</span>`).join("")}</div>
  </a>`;
}

function filterTools(query="", category="All"){
  const t=query.trim().toLowerCase();
  return TOOL_DEFS.filter(x=>{
    const okCat = category==="All" || x.category===category;
    const okTerm = !t || x.name.toLowerCase().includes(t) || x.desc.toLowerCase().includes(t) || x.category.toLowerCase().includes(t) || x.tags.join(" ").toLowerCase().includes(t);
    return okCat && okTerm;
  });
}

function bindGlobalSearch(inputSel, outputSel, prefix="tools/", chipSel=null){
  const input=document.querySelector(inputSel), out=document.querySelector(outputSel);
  if(!input||!out) return;
  let currentCategory = "All";
  const draw=()=>{
    const list=filterTools(input.value, currentCategory);
    out.innerHTML=list.map(x=>renderCard(x,prefix)).join("");
    revealIn();
  };
  if(chipSel){
    document.querySelectorAll(chipSel).forEach(chip=>{
      chip.onclick=()=>{
        document.querySelectorAll(chipSel).forEach(c=>{
          c.classList.remove("active");
          c.classList.add("secondary");
        });
        chip.classList.add("active");
        chip.classList.remove("secondary");
        currentCategory = chip.dataset.category;
        draw();
      };
    });
  }
  input.addEventListener("input", draw);
  draw();
}

function initSidebar(){
  const toggle=document.querySelector("[data-mobile-toggle]");
  const sidebar=document.querySelector(".sidebar");
  if(toggle&&sidebar) toggle.onclick=()=>sidebar.classList.toggle("open");
}

function persistForm(id, selectors){
  const form=document.getElementById(id);
  if(!form) return;
  const saved=POLIHOV.load("form_"+id,{});
  selectors.forEach(sel=>{
    const el=form.querySelector(sel);
    if(!el) return;
    if(saved[sel]!==undefined){
      if(el.type==="checkbox") el.checked=!!saved[sel];
      else el.value=saved[sel];
    }
    ["input","change"].forEach(ev=>el.addEventListener(ev,()=>{
      const curr=POLIHOV.load("form_"+id,{});
      curr[sel]=el.type==="checkbox" ? el.checked : el.value;
      POLIHOV.save("form_"+id,curr);
    }));
  });
}

function saveHistory(slug, payload){
  const key="history_"+slug;
  const list=POLIHOV.load(key,[]);
  list.unshift({...payload,at:new Date().toISOString()});
  POLIHOV.save(key,list.slice(0,20));
}
function renderHistory(slug, sel, builder){
  const el=document.querySelector(sel);
  if(!el) return;
  const list=POLIHOV.load("history_"+slug,[]);
  el.innerHTML=list.length ? list.map(i=>`<div class="history-item">${builder(i)}</div>`).join("") : `<div class="history-item muted">No history yet.</div>`;
}
function initCommonToolPage(slug){
  const tool=TOOL_DEFS.find(x=>x.slug===slug);
  if(tool) POLIHOV.setRecent(tool);
  const fav=document.querySelector("[data-favorite-toggle]");
  if(fav){
    const paint=()=>fav.textContent = POLIHOV.isFavorite(slug) ? "★ In favorites" : "☆ Add to favorites";
    paint();
    fav.onclick=()=>{POLIHOV.setFavorite(slug,!POLIHOV.isFavorite(slug)); paint(); POLIHOV.toast(POLIHOV.isFavorite(slug)?"Added to favorites":"Removed from favorites");}
  }
  const pin=document.querySelector("[data-pin-widget]");
  if(pin){
    const paintPin=()=>{
      const current = POLIHOV.getPinned();
      pin.textContent = current.includes(slug) ? "📌 Pinned widget" : "📍 Pin to dashboard";
    };
    paintPin();
    pin.onclick=()=>{
      let current = POLIHOV.getPinned();
      if(current.includes(slug)) current = current.filter(x=>x!==slug);
      else current = [slug, ...current.filter(x=>x!==slug)].slice(0,6);
      POLIHOV.setPinned(current);
      paintPin();
      POLIHOV.toast(current.includes(slug) ? "Pinned to dashboard" : "Removed from dashboard");
    };
  }
  const n=document.querySelector("[data-tool-name]");
  if(n&&tool) n.textContent=tool.name;
}
function populateMiniLists(prefix="tools/"){
  const r=document.querySelector("[data-recent-tools]");
  if(r){
    const items=POLIHOV.getRecent();
    r.innerHTML=items.length ? items.map(t=>`<a class="history-item" href="${prefix}${t.slug}.html"><strong>${t.name}</strong><div class="small muted">${new Date(t.at).toLocaleString()}</div></a>`).join("") : `<div class="history-item muted">No recent tools yet.</div>`;
  }
  const f=document.querySelector("[data-fav-tools]");
  if(f){
    const items=POLIHOV.getFavorites();
    f.innerHTML=items.length ? items.map(t=>`<a class="history-item" href="${prefix}${t.slug}.html"><strong>${t.name}</strong><div class="small muted">${t.category}</div></a>`).join("") : `<div class="history-item muted">No favorites yet.</div>`;
  }
}

function renderPinnedWidgets(sel, prefix="tools/"){
  const wrap=document.querySelector(sel);
  if(!wrap) return;
  const pinned = POLIHOV.getPinned()
    .map(slug => TOOL_DEFS.find(t=>t.slug===slug))
    .filter(Boolean);
  wrap.innerHTML = pinned.map(tool => `
    <a class="pinned-widget reveal" href="${prefix}${tool.slug}.html">
      <div class="icon-chip">${tool.icon}</div>
      <div><strong>${tool.name}</strong><div class="small muted">${tool.category}</div></div>
      <div class="small muted">${tool.desc}</div>
    </a>
  `).join("") || `<div class="note">No pinned widgets yet.</div>`;
  revealIn();
}

function updateDashboardStats(){
  const stats = {
    tools: TOOL_DEFS.length,
    favorites: POLIHOV.getFavorites().length,
    recent: POLIHOV.getRecent().length,
    pinned: POLIHOV.getPinned().length
  };
  document.querySelectorAll("[data-stat-tools]").forEach(el=>el.textContent = stats.tools);
  document.querySelectorAll("[data-stat-favorites]").forEach(el=>el.textContent = stats.favorites);
  document.querySelectorAll("[data-stat-recent]").forEach(el=>el.textContent = stats.recent);
  document.querySelectorAll("[data-stat-pinned]").forEach(el=>el.textContent = stats.pinned);
}

async function sha256(text){
  const bytes=new TextEncoder().encode(text);
  const hash=await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
function sentenceCase(text){return text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g,s=>s.toUpperCase())}
function titleCase(text){return text.toLowerCase().replace(/\b\w/g,s=>s.toUpperCase())}
function countTextStats(text){
  const trimmed=text.trim();
  const words=trimmed ? trimmed.split(/\s+/).length : 0;
  const chars=text.length;
  const charsNoSpaces=text.replace(/\s/g,"").length;
  const lines=text ? text.split(/\n/).length : 0;
  const paragraphs=trimmed ? text.split(/\n\s*\n/).filter(Boolean).length : 0;
  const readingMin=Math.max(1, Math.ceil(words/200 || 0));
  return {words,chars,charsNoSpaces,lines,paragraphs,readingMin};
}
function diffLines(a,b){
  const aa=a.split("\n"), bb=b.split("\n"), max=Math.max(aa.length,bb.length), out=[];
  for(let i=0;i<max;i++){
    const left=aa[i]??"", right=bb[i]??"";
    let status="same";
    if(left!==right) status=!left?"added":!right?"removed":"changed";
    out.push({line:i+1,left,right,status});
  }
  return out;
}
function escapeHtml(s){return s.replace(/[&<>"]/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[m]))}

function initCommandPalette(prefix="tools/"){
  const overlay=document.getElementById("commandOverlay");
  const input=document.getElementById("commandInput");
  const list=document.getElementById("commandList");
  if(!overlay||!input||!list) return;
  const draw=(q="")=>{
    const res=filterTools(q, "All");
    list.innerHTML=res.map(x=>`<a class="search-hit" href="${prefix}${x.slug}.html"><strong>${x.name}</strong><div class="small muted">${x.category} · ${x.desc}</div></a>`).join("");
  };
  window.addEventListener("keydown",e=>{
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==="k"){
      e.preventDefault();
      overlay.classList.add("open");
      input.focus();
      draw(input.value);
    }
    if(e.key==="Escape") overlay.classList.remove("open");
  });
  overlay.addEventListener("click",e=>{if(e.target===overlay) overlay.classList.remove("open")});
  input.addEventListener("input",e=>draw(e.target.value));
  draw();
}

function initDropTiles(){
  document.querySelectorAll("[data-drop-open]").forEach(tile=>{
    tile.addEventListener("dragover",e=>{e.preventDefault(); tile.style.borderColor="rgba(127,240,255,.8)"});
    tile.addEventListener("dragleave",()=>{tile.style.borderColor="rgba(122,168,255,.45)"});
    tile.addEventListener("drop",e=>{
      e.preventDefault();
      location.href=tile.dataset.dropOpen;
    });
  });
}

function revealIn(){
  const items = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting) entry.target.classList.add("show");
    });
  }, {threshold:.08});
  items.forEach(i=>io.observe(i));
}

function initOnboardingFlow(){
  const overlay = document.getElementById("onboardingOverlay");
  if(!overlay) return;
  const seen = POLIHOV.load("onboarding_complete", false);
  if(seen) return;

  const steps = [...overlay.querySelectorAll(".onboarding-step")];
  const bar = overlay.querySelector(".progress span");
  let current = 0;

  function paint(){
    steps.forEach((s,i)=>s.classList.toggle("active", i===current));
    bar.style.width = `${((current+1)/steps.length)*100}%`;
  }

  overlay.classList.add("show");
  paint();

  overlay.querySelectorAll("[data-step-next]").forEach(btn=>{
    btn.onclick = ()=>{
      current = Math.min(current+1, steps.length-1);
      paint();
    };
  });
  overlay.querySelectorAll("[data-step-prev]").forEach(btn=>{
    btn.onclick = ()=>{
      current = Math.max(current-1, 0);
      paint();
    };
  });
  overlay.querySelectorAll("[data-finish-onboarding]").forEach(btn=>{
    btn.onclick = ()=>{
      POLIHOV.save("onboarding_complete", true);
      overlay.classList.remove("show");
      POLIHOV.toast("Onboarding completed");
    };
  });
  overlay.querySelectorAll("[data-skip-onboarding]").forEach(btn=>{
    btn.onclick = ()=>{
      POLIHOV.save("onboarding_complete", true);
      overlay.classList.remove("show");
    };
  });
}

window.addEventListener("DOMContentLoaded",()=>{
  initSidebar();
  populateMiniLists();
  renderPinnedWidgets("[data-pinned-widgets]", document.body.dataset.prefix || "tools/");
  updateDashboardStats();
  initCommandPalette(document.body.dataset.prefix || "tools/");
  initDropTiles();
  revealIn();
  initOnboardingFlow();
});

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
