/* app.js - 精簡版，依使用者要求：
   - 分類：小說、詩、散文、雜記
   - 筆記欄位：書名（必填）、心得（選填）
   - 任何人都可新增/編輯/刪除（資料存在 localStorage）
*/
const DEFAULT_CATEGORIES = ['小說','詩','散文','雜記'];
const STORAGE_KEY = 'reading_notes_simple_v1';

// DOM elements
const categoryList = document.getElementById('category-list');
const noteCategory = document.getElementById('note-category');
const noteForm = document.getElementById('note-form');
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const notesList = document.getElementById('notes-list');
const mdPreview = document.getElementById('md-preview');
const btnNew = document.getElementById('btn-new');
const btnExport = document.getElementById('btn-export');
const btnImport = document.getElementById('btn-import');
const importFile = document.getElementById('import-file');
const cancelEditBtn = document.getElementById('cancel-edit');
const searchInput = document.getElementById('search');

let notes = [];
let editingId = null;
let activeCategory = '全部';

function init(){
  loadNotes();
  renderCategoryList();
  populateCategorySelect();
  renderNotes();
  noteContent.addEventListener('input', updatePreview);
  noteForm.addEventListener('submit', onSave);
  btnNew.addEventListener('click', startNew);
  btnExport.addEventListener('click', onExport);
  btnImport.addEventListener('click', ()=>importFile.click());
  importFile.addEventListener('change', onImportFile);
  cancelEditBtn.addEventListener('click', cancelEdit);
  searchInput.addEventListener('input', renderNotes);
  updatePreview();
}

function loadNotes(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw) {
    try{ notes = JSON.parse(raw); }catch(e){ notes = []; }
  } else notes = [];
}

function saveNotes(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); }

function uid(){ return 'n_' + Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

function renderCategoryList(){
  categoryList.innerHTML = '';
  const allLi = document.createElement('li');
  allLi.textContent = '全部';
  allLi.className = activeCategory==='全部'?'active':'';
  allLi.onclick = ()=>{ activeCategory='全部'; renderCategoryList(); renderNotes(); }
  categoryList.appendChild(allLi);
  DEFAULT_CATEGORIES.forEach(cat=>{
    const li = document.createElement('li');
    li.textContent = cat;
    li.className = activeCategory===cat?'active':'';
    li.onclick = ()=>{ activeCategory=cat; renderCategoryList(); renderNotes(); }
    categoryList.appendChild(li);
  });
}

function populateCategorySelect(){
  noteCategory.innerHTML = '';
  DEFAULT_CATEGORIES.forEach(cat=>{
    const opt = document.createElement('option');
    opt.value = cat; opt.textContent = cat;
    noteCategory.appendChild(opt);
  });
}

function renderNotes(){
  const q = searchInput.value.trim().toLowerCase();
  const filtered = notes.filter(n=>{
    if(activeCategory!=='全部' && n.category!==activeCategory) return false;
    if(!q) return true;
    return (n.title && n.title.toLowerCase().includes(q)) || (n.content && n.content.toLowerCase().includes(q));
  }).sort((a,b)=> (b.updatedAt||b.createdAt) - (a.updatedAt||a.createdAt));
  notesList.innerHTML = '';
  if(filtered.length===0){ notesList.innerHTML = '<p style="color:#666">目前沒有筆記</p>'; return; }
  filtered.forEach(n=>{
    const card = document.createElement('div'); card.className='note-card';
    const meta = document.createElement('div'); meta.className='note-meta';
    const date = new Date(n.updatedAt || n.createdAt);
    meta.textContent = `${n.category} • ${date.toLocaleString()}`;
    const title = document.createElement('h3'); title.textContent = n.title || '（未命名）';
    const contentDiv = document.createElement('div'); contentDiv.className='note-content';
    contentDiv.innerHTML = marked.parse(n.content || '');
    const actions = document.createElement('div'); actions.className='note-actions';
    const btnEdit = document.createElement('button'); btnEdit.textContent='編輯'; btnEdit.onclick = ()=> startEdit(n.id);
    const btnDel = document.createElement('button'); btnDel.textContent='刪除'; btnDel.onclick = ()=> removeNote(n.id);
    actions.appendChild(btnEdit); actions.appendChild(btnDel);
    card.appendChild(meta); card.appendChild(title); card.appendChild(contentDiv); card.appendChild(actions);
    notesList.appendChild(card);
  });
}

function updatePreview(){ mdPreview.innerHTML = marked.parse(noteContent.value || ''); }

function startNew(){
  editingId = null;
  noteTitle.value = '';
  noteCategory.value = DEFAULT_CATEGORIES[0];
  noteContent.value = '';
  cancelEditBtn.style.display = 'none';
  updatePreview();
  window.scrollTo({top:0,behavior:'smooth'});
}

function startEdit(id){
  const note = notes.find(x=>x.id===id); if(!note) return;
  editingId = id;
  noteTitle.value = note.title;
  noteCategory.value = note.category;
  noteContent.value = note.content;
  cancelEditBtn.style.display = 'inline-block';
  updatePreview();
  window.scrollTo({top:0,behavior:'smooth'});
}

function cancelEdit(){ startNew(); }

function onSave(e){
  e.preventDefault();
  const title = noteTitle.value.trim();
  if(!title){ alert('請填寫書名'); return; }
  const category = noteCategory.value;
  const content = noteContent.value;
  const now = Date.now();
  if(editingId){
    const idx = notes.findIndex(n=>n.id===editingId);
    if(idx>=0){ notes[idx].title = title; notes[idx].category = category; notes[idx].content = content; notes[idx].updatedAt = now; }
    editingId = null;
  } else {
    const newNote = { id: uid(), title, category, content, createdAt: now, updatedAt: now };
    notes.push(newNote);
  }
  saveNotes(); noteForm.reset(); updatePreview(); renderNotes(); cancelEditBtn.style.display='none';
}

function removeNote(id){
  if(!confirm('確認刪除這則筆記？')) return;
  notes = notes.filter(n=>n.id!==id); saveNotes(); renderNotes();
}

function onExport(){
  const dataStr = JSON.stringify(notes, null, 2);
  const blob = new Blob([dataStr], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'reading-notes-export.json'; a.click();
  URL.revokeObjectURL(url);
}

function onImportFile(e){
  const f = e.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const arr = JSON.parse(reader.result);
      if(Array.isArray(arr)){
        arr.forEach(item=>{ if(!item.id) item.id = uid(); notes.push(item); });
        saveNotes(); renderNotes(); alert('匯入完成');
      } else alert('檔案內容不是有效的筆記陣列');
    }catch(err){ alert('匯入失敗: ' + err.message); }
  };
  reader.readAsText(f); importFile.value='';
}

init();
