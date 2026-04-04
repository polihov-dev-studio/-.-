
function downloadText(filename, content, type="text/plain;charset=utf-8"){
  POLIHOV.downloadBlob(new Blob([content], {type}), filename);
}
function fileToArrayBuffer(file){
  return new Promise((resolve,reject)=>{const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsArrayBuffer(file);});
}
function fileToDataURL(file){
  return new Promise((resolve,reject)=>{const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file);});
}
function loadImageFromURL(url){
  return new Promise((resolve,reject)=>{const img=new Image(); img.onload=()=>resolve(img); img.onerror=reject; img.src=url;});
}
function canvasToBlob(canvas, type="image/png", quality=.92){
  return new Promise(resolve=>canvas.toBlob(resolve,type,quality));
}
function parseCsv(text){
  const rows=[], lines=text.replace(/\r/g,"").split("\n").filter(Boolean);
  for(const line of lines){
    const out=[]; let cell="", q=false;
    for(let i=0;i<line.length;i++){
      const ch=line[i], next=line[i+1];
      if(ch === '"' && q && next === '"'){cell+='"'; i++; continue}
      if(ch === '"'){q=!q; continue}
      if(ch === "," && !q){out.push(cell); cell=""; continue}
      cell += ch;
    }
    out.push(cell); rows.push(out);
  }
  return rows;
}
function toCsv(rows){
  return rows.map(r=>r.map(v=>{
    const s=String(v ?? "");
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  }).join(",")).join("\n");
}
