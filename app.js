/* app.js - 精簡版，依使用者要求：
   - 分類：小說、詩、散文、雜記
   - 筆記欄位：書名（必填）、心得（選填）
   - 任何人都可新增/編輯/刪除（資料存在 localStorage）
*/
const DEFAULT_CATEGORIES = ['社會關係','社會互動','社會結構','功能論','衝突論','互動論'];
const STORAGE_KEY = 'reading_notes_simple_v3';
const CATEGORIES_KEY = 'reading_categories_v3';

// DOM elements
const categoryList = document.getElementById('category-list');
const noteCategory = document.getElementById('note-category');
const noteForm = document.getElementById('note-form');
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const notesList = document.getElementById('notes-list');
const cancelEditBtn = document.getElementById('cancel-edit');
const searchInput = document.getElementById('search');
const voiceTitleBtn = document.getElementById('voice-title-btn');
const voiceContentBtn = document.getElementById('voice-content-btn');
const addCategoryBtn = document.getElementById('add-category-btn');

let notes = [];
let categories = [...DEFAULT_CATEGORIES];
let editingId = null;
let activeCategory = '全部';

// 語音辨識相關
let recognition = null;
let isRecognizing = false;
let currentVoiceTarget = null;

function initSpeechRecognition(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){
    console.warn('此瀏覽器不支援語音辨識');
    if(voiceTitleBtn) voiceTitleBtn.style.display = 'none';
    if(voiceContentBtn) voiceContentBtn.style.display = 'none';
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'zh-TW';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = function(){
    isRecognizing = true;
    updateVoiceButtonState();
  };

  recognition.onresult = function(event){
    const transcript = event.results[0][0].transcript;
    if(currentVoiceTarget === 'title'){
      noteTitle.value = transcript;
    } else if(currentVoiceTarget === 'content'){
      noteContent.value += (noteContent.value ? ' ' : '') + transcript;
    }
  };

  recognition.onerror = function(event){
    console.error('語音辨識錯誤:', event.error);
    if(event.error === 'no-speech'){
      alert('未偵測到語音,請重試');
    } else if(event.error === 'not-allowed'){
      alert('未授權使用麥克風,請檢查瀏覽器設定');
    } else {
      alert('語音辨識發生錯誤: ' + event.error);
    }
    isRecognizing = false;
    updateVoiceButtonState();
  };

  recognition.onend = function(){
    isRecognizing = false;
    updateVoiceButtonState();
  };
}

function startVoiceInput(target){
  if(!recognition){
    alert('此瀏覽器不支援語音辨識');
    return;
  }
  
  if(isRecognizing){
    recognition.stop();
    return;
  }

  currentVoiceTarget = target;
  try{
    recognition.start();
  }catch(e){
    console.error('啟動語音辨識失敗:', e);
  }
}

function updateVoiceButtonState(){
  if(voiceTitleBtn){
    voiceTitleBtn.textContent = isRecognizing && currentVoiceTarget === 'title' ? '🎤 錄音中...' : '🎤';
    voiceTitleBtn.classList.toggle('recording', isRecognizing && currentVoiceTarget === 'title');
  }
  if(voiceContentBtn){
    voiceContentBtn.textContent = isRecognizing && currentVoiceTarget === 'content' ? '🎤 錄音中...' : '🎤';
    voiceContentBtn.classList.toggle('recording', isRecognizing && currentVoiceTarget === 'content');
  }
}

function init(){
  loadNotes();
  loadCategories();
  renderCategoryList();
  populateCategorySelect();
  renderNotes();
  initSpeechRecognition();
  
  noteForm.addEventListener('submit', onSave);
  cancelEditBtn.addEventListener('click', cancelEdit);
  searchInput.addEventListener('input', renderNotes);
  
  if(voiceTitleBtn){
    voiceTitleBtn.addEventListener('click', ()=> startVoiceInput('title'));
  }
  if(voiceContentBtn){
    voiceContentBtn.addEventListener('click', ()=> startVoiceInput('content'));
  }
  
  if(addCategoryBtn){
    addCategoryBtn.addEventListener('click', addNewCategory);
  }
}

function loadNotes(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw) {
    try{ notes = JSON.parse(raw); }catch(e){ notes = []; }
  } else notes = [];
}

function loadCategories(){
  const raw = localStorage.getItem(CATEGORIES_KEY);
  if(raw){
    try{
      const saved = JSON.parse(raw);
      if(Array.isArray(saved) && saved.length > 0){
        categories = saved;
        return;
      }
    }catch(e){}
  }
  categories = [...DEFAULT_CATEGORIES];
}

function saveNotes(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); }

function saveCategories(){ localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories)); }

function uid(){ return 'n_' + Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

function addNewCategory(){
  const newCat = prompt('請輸入新分類名稱:');
  if(!newCat || !newCat.trim()) return;
  const trimmed = newCat.trim();
  if(categories.includes(trimmed)){
    alert('此分類已存在');
    return;
  }
  categories.push(trimmed);
  saveCategories();
  renderCategoryList();
  populateCategorySelect();
  alert(`已新增分類: ${trimmed}`);
}

function deleteCategory(cat){
  if(DEFAULT_CATEGORIES.includes(cat)){
    alert('預設分類無法刪除');
    return;
  }
  if(!confirm(`確認刪除分類「${cat}」?\n\n注意: 此分類下的筆記不會被刪除,但會失去分類標籤。`)) return;
  
  categories = categories.filter(c => c !== cat);
  saveCategories();
  
  if(activeCategory === cat){
    activeCategory = '全部';
  }
  
  renderCategoryList();
  populateCategorySelect();
  renderNotes();
}

function renderCategoryList(){
  categoryList.innerHTML = '';
  const allLi = document.createElement('li');
  allLi.textContent = '全部';
  allLi.className = activeCategory==='全部'?'active':'';
  allLi.onclick = ()=>{ activeCategory='全部'; renderCategoryList(); renderNotes(); }
  categoryList.appendChild(allLi);
  
  categories.forEach(cat=>{
    const li = document.createElement('li');
    li.className = activeCategory===cat?'active':'';
    
    const span = document.createElement('span');
    span.textContent = cat;
    span.onclick = ()=>{ activeCategory=cat; renderCategoryList(); renderNotes(); }
    li.appendChild(span);
    
    if(!DEFAULT_CATEGORIES.includes(cat)){
      const delBtn = document.createElement('button');
      delBtn.textContent = '✕';
      delBtn.className = 'delete-category-btn';
      delBtn.title = '刪除此分類';
      delBtn.onclick = (e)=>{
        e.stopPropagation();
        deleteCategory(cat);
      };
      li.appendChild(delBtn);
    }
    
    categoryList.appendChild(li);
  });
}

function populateCategorySelect(){
  noteCategory.innerHTML = '';
  categories.forEach(cat=>{
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

function startEdit(id){
  const note = notes.find(x=>x.id===id); if(!note) return;
  editingId = id;
  noteTitle.value = note.title;
  noteCategory.value = note.category;
  noteContent.value = note.content;
  cancelEditBtn.style.display = 'inline-block';
  window.scrollTo({top:0,behavior:'smooth'});
}

function cancelEdit(){
  editingId = null;
  noteTitle.value = '';
  noteCategory.value = categories[0];
  noteContent.value = '';
  cancelEditBtn.style.display = 'none';
}

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
  saveNotes(); 
  noteForm.reset(); 
  renderNotes(); 
  cancelEditBtn.style.display='none';
}

function removeNote(id){
  if(!confirm('確認刪除這則筆記？')) return;
  notes = notes.filter(n=>n.id!==id); 
  saveNotes(); 
  renderNotes();
}

init();
