import { auth, db, firebaseConfigurado } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  collection, getDocs, getDoc, doc, addDoc, updateDoc, query, where, limit,
  serverTimestamp, orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Módulos reais: só tentam ler/gravar depois da autenticação e da verificação do perfil.
const root = document.querySelector("#modulesRoot");
const launchers = [...document.querySelectorAll("[data-open-module]")];
let currentUser = null;
let currentRole = "";
let peopleCache = [];
let pendingCache = [];
let peoplePage = 0;
const PAGE_SIZE = 25;
let peopleFilters = { search: "", turma: "", status: "", pendencia: "" };
let activeModule = "pessoas";
let editingPersonId = null;
let selectedPersonId = null;
let drawerTab = "dados";

const norm = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR").replace(/\s+/g, " ");
const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const display = value => value === undefined || value === null || value === "" ? "Não informado" : String(value);
const allowed = () => ["admin","secretaria"].includes(currentRole);

function msg(text, ok = false) {
  const el = root.querySelector("#moduleMessage");
  if (!el) return;
  el.textContent = text;
  el.className = ok ? "module-message ok" : "module-message";
}
function btn(label, action, extra = "") {
  return '<button type="button" class="button secondary '+extra+'" data-action="'+action+'">'+label+'</button>';
}
function moduleFrame(title, description, inner) {
  root.hidden = false;
  root.innerHTML = '<section class="module-panel"><div class="module-heading"><div><h3>'+title+'</h3><p>'+description+'</p></div>'+btn("Voltar ao painel","home")+'</div>'+inner+'<p id="moduleMessage" class="module-message" role="status" aria-live="polite"></p></section>';
}
function noAccess() {
  moduleFrame("Acesso não liberado","Seu perfil atual não tem permissão para abrir os módulos de cadastro.",'<div class="module-warning">Somente usuários ativos com perfil administrador ou secretaria podem acessar estes dados nesta etapa. A autorização também é aplicada nas regras do Firestore.</div>');
}
function showLoading(title) {
  moduleFrame(title,"Carregando dados autorizados…",'<div class="module-empty">Aguarde enquanto consultamos o Firestore.</div>');
}
function showHome() {
  root.hidden = true;
  root.innerHTML = "";
  document.querySelector(".kpi-grid").hidden = false;
  document.querySelector(".next-event").hidden = false;
  document.querySelector(".preparation").hidden = false;
  document.querySelector(".demo-banner").hidden = false;
  document.querySelector(".module-launchers").hidden = false;
}
function showModule(module) {
  if (!currentUser) return;
  activeModule = module;
  document.querySelector(".kpi-grid").hidden = true;
  document.querySelector(".next-event").hidden = true;
  document.querySelector(".preparation").hidden = true;
  document.querySelector(".demo-banner").hidden = true;
  document.querySelector(".module-launchers").hidden = true;
  if (!allowed()) { noAccess(); return; }
  if (module === "pessoas") renderPeople();
  else renderPendencies();
}
async function loadPeople() {
  const snap = await getDocs(query(collection(db,"pessoas"), limit(100)));
  peopleCache = snap.docs.map(d => ({id:d.id,...d.data()}));
  peopleCache.sort((a,b) => String(a.nome||"").localeCompare(String(b.nome||""),"pt-BR"));
}
async function loadPendencies() {
  const snap = await getDocs(query(collection(db,"pendencias"), limit(100)));
  pendingCache = snap.docs.map(d => ({id:d.id,...d.data()}));
  pendingCache.sort((a,b) => String(a.status||"aberta").localeCompare(String(b.status||"aberta")));
}
function personStatus(p) {
  if (p.statusGeral) return p.statusGeral;
  if (p.jornadaConcluida === true || p.jornada === "Concluída") return "Jornada concluída";
  return "Em acompanhamento";
}
function personHasPending(p) {
  return (Array.isArray(p.pendencias) && p.pendencias.length > 0) || Boolean(p.pendenciaTexto) ||
    pendingCache.some(x => x.pessoaId === p.id && (x.status || "aberta") !== "resolvida");
}
function filteredPeople() {
  return peopleCache.filter(p => {
    const search = norm(peopleFilters.search);
    const searchable = norm([p.nome,p.telefoneExibicao,p.telefone,p.turmaId,p.turma,p.statusGeral].join(" "));
    return (!search || searchable.includes(search))
      && (!peopleFilters.turma || String(p.turmaId ?? p.turma ?? "") === peopleFilters.turma)
      && (!peopleFilters.status || personStatus(p) === peopleFilters.status)
      && (!peopleFilters.pendencia || String(personHasPending(p)) === peopleFilters.pendencia);
  });
}
function renderPeople() {
  const rows = filteredPeople();
  const pageCount = Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
  peoplePage = Math.min(peoplePage,pageCount-1);
  const pageRows = rows.slice(peoplePage*PAGE_SIZE,(peoplePage+1)*PAGE_SIZE);
  const classes = [...new Set(peopleCache.map(p=>String(p.turmaId ?? p.turma ?? "")).filter(Boolean))].sort();
  const statusOptions = ["Em acompanhamento","Jornada concluída","Pendente"];
  moduleFrame("Pessoas","Cadastro e acompanhamento individual. A lista consulta até 100 registros por carregamento; use a busca e os filtros abaixo.",`
    <div class="module-toolbar">
      <input class="module-input search-wide" id="pSearch" type="search" value="${esc(peopleFilters.search)}" placeholder="Buscar nome ou telefone" aria-label="Buscar por nome ou telefone">
      <select class="module-select" id="pClass" aria-label="Filtrar turma"><option value="">Todas as turmas</option>${classes.map(c=>'<option value="'+esc(c)+'" '+(peopleFilters.turma===c?'selected':'')+'>'+esc(c)+'</option>').join("")}</select>
      <select class="module-select" id="pStatus" aria-label="Filtrar situação"><option value="">Todas as situações</option>${statusOptions.map(s=>'<option '+(peopleFilters.status===s?'selected':'')+'>'+s+'</option>').join("")}</select>
      <select class="module-select" id="pPending" aria-label="Filtrar pendências"><option value="">Com ou sem pendência</option><option value="true" ${peopleFilters.pendencia==="true"?"selected":""}>Com pendência</option><option value="false" ${peopleFilters.pendencia==="false"?"selected":""}>Sem pendência</option></select>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
      <button class="button primary" data-action="new-person" type="button">+ Cadastro rápido</button>
      <button class="button secondary" data-action="reload-people" type="button">Atualizar lista</button>
      <button class="button secondary" data-action="saved-pending" type="button">Pendentes</button>
      <button class="button secondary" data-action="saved-no-ekklesia" type="button">Sem Ekklesia</button>
    </div>
    <div class="module-table-wrap"><table class="module-table"><thead><tr><th><input type="checkbox" id="selectAllPeople" aria-label="Selecionar todos os registros desta página"></th><th>Nome</th><th>Turma</th><th>Situação</th><th>Pendências</th><th>Ações</th></tr></thead><tbody>${pageRows.map(p=>'<tr><td><input type="checkbox" class="person-check" value="'+esc(p.id)+'" aria-label="Selecionar '+esc(p.nome)+'"></td><td><strong>'+esc(display(p.nome))+'</strong><br><small>'+esc(display(p.telefoneExibicao||p.telefone))+'</small></td><td>'+esc(display(p.turmaId||p.turma))+'</td><td>'+esc(personStatus(p))+'</td><td><span class="module-chip '+(personHasPending(p)?"warn":"")+'">'+(personHasPending(p)?"Revisar":"Sem pendência identificada")+'</span></td><td>'+btn("Ficha","person-detail:"+p.id)+btn("Editar","person-edit:"+p.id)+'</td></tr>').join("") || '<tr><td colspan="6"><div class="module-empty">Nenhuma pessoa encontrada com os filtros atuais.</div></td></tr>'}</tbody></table></div>
    <div class="module-pagination"><span>${rows.length} registro(s) nesta consulta · página ${peoplePage+1} de ${pageCount}</span><div>${btn("Anterior","people-prev")}${btn("Próxima","people-next")}</div></div>
    <div id="personEditor"></div>
  `);
  root.querySelector("#pSearch").addEventListener("input",e=>{peopleFilters.search=e.target.value;peoplePage=0;renderPeople();const el=root.querySelector("#pSearch");el.focus();el.setSelectionRange(el.value.length,el.value.length);});
  root.querySelector("#pClass").addEventListener("change",e=>{peopleFilters.turma=e.target.value;peoplePage=0;renderPeople();});
  root.querySelector("#pStatus").addEventListener("change",e=>{peopleFilters.status=e.target.value;peoplePage=0;renderPeople();});
  root.querySelector("#pPending").addEventListener("change",e=>{peopleFilters.pendencia=e.target.value;peoplePage=0;renderPeople();});
  root.querySelector("#selectAllPeople")?.addEventListener("change",e=>root.querySelectorAll(".person-check").forEach(c=>c.checked=e.target.checked));
}
function personFormMarkup(p = {}) {
 return '<form id="personEditorForm" class="module-panel" style="margin-top:16px" novalidate><div class="module-heading"><div><h3>'+(p.id?"Editar cadastro":"Cadastro rápido")+'</h3><p>Campos básicos. Campos não informados permanecem sem confirmação.</p></div></div><div class="module-form-grid">'+
 '<label class="module-label">Nome completo *<input class="module-input" name="nome" required maxlength="120" value="'+esc(p.nome||"")+'"></label>'+
 '<label class="module-label">Telefone<input class="module-input" name="telefone" inputmode="tel" maxlength="30" value="'+esc(p.telefoneExibicao||p.telefone||"")+'" placeholder="+55 DDD número"></label>'+
 '<label class="module-label">Turma<input class="module-input" name="turmaId" maxlength="40" value="'+esc(p.turmaId||p.turma||"")+'" placeholder="Ex.: 37"></label>'+
 '<label class="module-label">Data de nascimento<input class="module-input" name="dataNascimento" type="date" value="'+esc(p.dataNascimento||"")+'"></label>'+
 '<label class="module-label">Jornada<select class="module-select" name="jornada"><option value="Não informado">Não informado</option><option '+(p.jornada==="Em andamento"?"selected":"")+' value="Em andamento">Em andamento</option><option '+(p.jornada==="Concluída"?"selected":"")+' value="Concluída">Concluída</option><option '+(p.jornada==="Precisa repor aula"?"selected":"")+' value="Precisa repor aula">Precisa repor aula</option></select></label>'+
 '<label class="module-label">Cadastro Ekklesia<select class="module-select" name="cadastroEkklesia"><option value="Não informado">Não informado</option><option '+(p.cadastroEkklesia==="sim"?"selected":"")+' value="sim">Sim</option><option '+(p.cadastroEkklesia==="não"?"selected":"")+' value="não">Não</option></select></label>'+
 '<label class="module-label">Grupo de batismo<select class="module-select" name="entrouNoGrupo"><option value="Não informado">Não informado</option><option '+(p.entrouNoGrupo==="sim"?"selected":"")+' value="sim">Sim</option><option '+(p.entrouNoGrupo==="não"?"selected":"")+' value="não">Não</option></select></label>'+
 '<label class="module-label">Tamanho da camiseta<select class="module-select" name="camiseta"><option value="Não informado">Não informado</option>'+["PP","P","M","G","GG","EG","XG","G1","G2","G3","Infantil"].map(s=>'<option '+(p.camiseta?.tamanho===s?"selected":"")+'>'+s+'</option>').join("")+'</select></label>'+
 '<label class="module-label">Status geral<select class="module-select" name="statusGeral"><option value="Em acompanhamento">Em acompanhamento</option><option '+(p.statusGeral==="Pendente"?"selected":"")+' value="Pendente">Pendente</option><option '+(p.statusGeral==="Inativo"?"selected":"")+' value="Inativo">Inativo</option></select></label>'+
 '<label class="module-label wide">Pendência resumida (não restrita)<input class="module-input" name="pendenciaTexto" maxlength="240" value="'+esc(p.pendenciaTexto||"")+'" placeholder="Ex.: aula 2 a repor"></label></div><div class="module-form-actions"><button class="button primary" type="submit">'+(p.id?"Salvar alterações":"Salvar pessoa")+'</button><button class="button secondary" type="button" data-action="cancel-person-editor">Cancelar</button></div><p class="module-message" id="editorMessage" role="status"></p></form>';
}
function normalizePhone(raw) {
 const digits=String(raw||"").replace(/\D/g,"");
 if (!raw.trim()) return {display:"",e164:""};
 let e164=digits;
 if (digits.length===10||digits.length===11) e164="55"+digits;
 if (digits.length===12||digits.length===13) e164=digits;
 if (!/^55[1-9][0-9](?:[2-5][0-9]{7}|9[0-9]{8})$/.test(e164)) return {error:"Confira o telefone com DDD. Não vamos inventar DDD nem código do país."};
 return {display:raw.trim(),e164:"+"+e164};
}
async function savePersonForm(form) {
 const data=new FormData(form), nome=String(data.get("nome")||"").trim();
 if(!nome){form.querySelector("#editorMessage").textContent="Informe o nome.";return;}
 const phone=normalizePhone(String(data.get("telefone")||""));
 if(phone.error){form.querySelector("#editorMessage").textContent=phone.error;return;}
 const nomeNormalizado=norm(nome);
 const turmaId=String(data.get("turmaId")||"").trim();
 const date=String(data.get("dataNascimento")||"");
 if(date && date>new Date().toISOString().slice(0,10)){form.querySelector("#editorMessage").textContent="A data de nascimento não pode estar no futuro.";return;}
 if(date && (new Date().getFullYear()-new Date(date+"T12:00:00").getFullYear())<18) {
   const confirmed=window.confirm("A data indica que a pessoa pode ser menor de 18 anos. Esta ficha rápida ainda não coleta os dados do responsável. Deseja salvar somente se o responsável for registrado no fluxo completo?");
   if(confirmed){form.querySelector("#editorMessage").textContent="Cadastro interrompido: conclua o fluxo completo de responsável antes de salvar um menor.";return;}
   return;
 }
 if(!editingPersonId) {
   const possible=peopleCache.filter(p=>norm(p.nome)===nomeNormalizado && phone.e164 && (p.telefoneE164||"")===phone.e164);
   if(possible.length && !window.confirm("Já existe uma pessoa com nome normalizado e telefone correspondente. Manter ambos os registros?"))return;
 }
 const camisetaTamanho=String(data.get("camiseta")||"Não informado");
 const item={
   nome,nomeNormalizado,telefoneE164:phone.e164,telefoneExibicao:phone.display,
   turmaId:turmaId||null,dataNascimento:date||null,
   jornada:String(data.get("jornada")||"Não informado"),
   jornadaConcluida:String(data.get("jornada")||"")==="Concluída",
   cadastroEkklesia:String(data.get("cadastroEkklesia")||"Não informado"),
   entrouNoGrupo:String(data.get("entrouNoGrupo")||"Não informado"),
   camiseta:{...(editingPersonId?(peopleCache.find(p=>p.id===editingPersonId)?.camiseta||{}):{}),tamanho:camisetaTamanho},
   statusGeral:String(data.get("statusGeral")||"Em acompanhamento"),
   pendenciaTexto:String(data.get("pendenciaTexto")||"").trim(),
   atualizadoEm:serverTimestamp(),atualizadoPor:currentUser.uid
 };
 try {
   const submit=form.querySelector('button[type="submit"]');submit.disabled=true;submit.textContent="Salvando…";
   if(editingPersonId) await updateDoc(doc(db,"pessoas",editingPersonId),item);
   else { item.criadoEm=serverTimestamp();item.criadoPor=currentUser.uid;await addDoc(collection(db,"pessoas"),item); }
   editingPersonId=null;await loadPeople();await loadPendencies();renderPeople();msg("Cadastro salvo no Firestore.",true);
 } catch(error) {
   console.error("Falha ao salvar cadastro",error.code||"");
   const el=form.querySelector("#editorMessage");el.textContent=error.code==="permission-denied"?"Acesso negado pelas regras do Firestore. Confira se seu perfil está ativo.":"Não foi possível salvar. Verifique a conexão e as permissões.";
   const submit=form.querySelector('button[type="submit"]');if(submit){submit.disabled=false;submit.textContent=editingPersonId?"Salvar alterações":"Salvar pessoa";}
 }
}
function openPersonEditor(id=null) {
 editingPersonId=id;
 const p=id?peopleCache.find(x=>x.id===id):{};
 const target=root.querySelector("#personEditor");
 target.innerHTML=personFormMarkup(p||{});
 target.querySelector("#personEditorForm").addEventListener("submit",e=>{e.preventDefault();savePersonForm(e.currentTarget);});
 target.scrollIntoView({behavior:"smooth",block:"start"});
}
async function openPersonDetail(id) {
 selectedPersonId=id;drawerTab="dados";
 const p=peopleCache.find(x=>x.id===id);if(!p)return;
 const drawer=document.createElement("div");drawer.id="personDrawerLayer";
 drawer.innerHTML='<button class="module-drawer-scrim" aria-label="Fechar ficha"></button><aside class="module-drawer" role="dialog" aria-modal="true" aria-labelledby="drawerTitle"><div class="module-heading"><div><h3 id="drawerTitle">'+esc(p.nome||"Pessoa")+'</h3><p>Ficha individual · acesso restrito</p></div><button class="button secondary" data-action="close-drawer">Fechar</button></div><div class="module-tabs">'+["dados","jornada","camiseta","pendencias","historico"].map(t=>'<button class="module-tab '+(drawerTab===t?"active":"")+'" data-tab="'+t+'">'+({dados:"Dados",jornada:"Jornada",camiseta:"Camiseta",pendencias:"Pendências",historico:"Histórico"}[t])+'</button>').join("")+'</div><div id="drawerContent"></div><div class="module-form-actions">'+btn("Editar cadastro","person-edit:"+p.id)+'</div></aside>';
 document.body.append(drawer);
 const close=()=>drawer.remove();
 drawer.querySelector(".module-drawer-scrim").addEventListener("click",close);
 drawer.querySelector('[data-action="close-drawer"]').addEventListener("click",close);
 drawer.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{drawerTab=b.dataset.tab;drawer.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));renderDrawerContent(drawer,p);}));
 renderDrawerContent(drawer,p);
}
function renderDrawerContent(drawer,p) {
 const fields={
  dados:[["Nome",p.nome],["Telefone",p.telefoneExibicao||p.telefone],["Turma",p.turmaId||p.turma],["Data de nascimento",p.dataNascimento],["Status",personStatus(p)],["Cadastro Ekklesia",p.cadastroEkklesia]],
  jornada:[["Situação",p.jornada],["Jornada concluída",p.jornadaConcluida===true?"Sim":"Não confirmado"],["Aulas a repor",p.aulasARepor],["Entrada no grupo",p.entrouNoGrupo]],
  camiseta:[["Tamanho",p.camiseta?.tamanho],["Valor",p.camiseta?.valor],["Pago",p.camiseta?.pago===true?"Sim":p.camiseta?.pago===false?"Não":"Não informado"],["Entregue",p.camiseta?.entregue===true?"Sim":p.camiseta?.entregue===false?"Não":"Não informado"]],
  pendencias:[["Resumo",p.pendenciaTexto],["Pendências abertas",pendingCache.filter(x=>x.pessoaId===p.id&&(x.status||"aberta")!=="resolvida").length]],
  historico:[["Criado em",p.criadoEm?.toDate?p.criadoEm.toDate().toLocaleString("pt-BR"):"Não informado"],["Atualizado em",p.atualizadoEm?.toDate?p.atualizadoEm.toDate().toLocaleString("pt-BR"):"Não informado"],["Último usuário",p.atualizadoPor]]
 };
 const items=fields[drawerTab]||fields.dados;
 drawer.querySelector("#drawerContent").innerHTML='<div class="module-detail-grid">'+items.map(([k,v])=>'<div class="module-detail"><small>'+esc(k)+'</small><strong>'+esc(display(v))+'</strong></div>').join("")+'</div>';
}
function renderPendencies() {
 const open=pendingCache.filter(p=>(p.status||"aberta")!=="resolvida");
 moduleFrame("Pendências","Acompanhe itens em aberto e resolvidos. O resumo separa quantidade de pessoas e quantidade de itens.",`
 <div class="module-toolbar"><input id="pendingSearch" class="module-input search-wide" type="search" placeholder="Buscar por tipo, responsável ou pessoa" aria-label="Buscar pendências"><select id="pendingStatus" class="module-select" aria-label="Filtrar status"><option value="">Todos os status</option><option value="aberta">Aberta</option><option value="em contato">Em contato</option><option value="resolvida">Resolvida</option></select><select id="pendingType" class="module-select" aria-label="Filtrar tipo"><option value="">Todos os tipos</option>${["Sem cadastro no Ekklesia","Número sem WhatsApp/errado","Sem contato","Aula a repor","Camiseta pendente","Documento do responsável","Verificação de perfil","Conversar com pastor","Outro"].map(t=>'<option>'+t+'</option>').join("")}</select></div>
 <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px"><span class="module-chip warn">${open.length} item(ns) aberto(s)</span><span class="module-chip">${new Set(open.map(p=>p.pessoaId).filter(Boolean)).size} pessoa(s) com pendência</span><button class="button primary" data-action="new-pending" type="button">+ Nova pendência</button><button class="button secondary" data-action="reload-pendencies" type="button">Atualizar</button></div>
 <div id="pendingEditor"></div><div class="module-table-wrap"><table class="module-table"><thead><tr><th>Tipo</th><th>Pessoa</th><th>Responsável</th><th>Prazo</th><th>Status</th><th>Ação</th></tr></thead><tbody id="pendingRows"></tbody></table></div>
 `);
 const renderRows=()=>{
  const q=norm(root.querySelector("#pendingSearch").value),s=root.querySelector("#pendingStatus").value,t=root.querySelector("#pendingType").value;
  const rows=pendingCache.filter(p=>(!q||norm([p.tipo,p.responsavel,p.nomePessoa,p.nota].join(" ")).includes(q))&&(!s||(p.status||"aberta")===s)&&(!t||p.tipo===t));
  root.querySelector("#pendingRows").innerHTML=rows.map(p=>'<tr><td>'+esc(display(p.tipo))+'</td><td>'+esc(display(p.nomePessoa||peopleCache.find(x=>x.id===p.pessoaId)?.nome))+'</td><td>'+esc(display(p.responsavel))+'</td><td>'+esc(display(p.prazo))+'</td><td><span class="module-chip '+((p.status||"aberta")==="resolvida"?"":"warn")+'">'+esc(p.status||"aberta")+'</span></td><td>'+btn((p.status||"aberta")==="resolvida"?"Reabrir":"Resolver","resolve-pending:"+p.id)+'</td></tr>').join("")||'<tr><td colspan="6"><div class="module-empty">Nenhuma pendência corresponde aos filtros.</div></td></tr>';
 };
 ["pendingSearch","pendingStatus","pendingType"].forEach(id=>root.querySelector("#"+id).addEventListener(id==="pendingSearch"?"input":"change",renderRows));
 renderRows();
}
function openPendingEditor() {
 const target=root.querySelector("#pendingEditor");
 target.innerHTML='<form id="pendingForm" class="module-panel" style="margin:12px 0" novalidate><div class="module-form-grid"><label class="module-label">Pessoa *<select class="module-select" name="pessoaId" required><option value="">Selecione</option>'+peopleCache.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.nome)+'</option>').join("")+'</select></label><label class="module-label">Tipo *<select class="module-select" name="tipo" required>'+["Sem cadastro no Ekklesia","Número sem WhatsApp/errado","Sem contato","Aula a repor","Camiseta pendente","Documento do responsável","Verificação de perfil","Conversar com pastor","Outro"].map(t=>'<option>'+t+'</option>').join("")+'</select></label><label class="module-label">Responsável<input class="module-input" name="responsavel" maxlength="100"></label><label class="module-label">Prazo<input class="module-input" name="prazo" type="date"></label><label class="module-label wide">Nota administrativa<input class="module-input" name="nota" maxlength="240"></label></div><div class="module-form-actions"><button class="button primary" type="submit">Salvar pendência</button><button class="button secondary" type="button" data-action="cancel-pending">Cancelar</button></div><p class="module-message" id="pendingFormMessage" role="status"></p></form>';
 target.querySelector("#pendingForm").addEventListener("submit",async e=>{
  e.preventDefault();const form=e.currentTarget,d=new FormData(form),p=peopleCache.find(x=>x.id===d.get("pessoaId"));
  if(!p){form.querySelector("#pendingFormMessage").textContent="Selecione uma pessoa.";return;}
  try{
   const save=form.querySelector('button[type="submit"]');save.disabled=true;
   await addDoc(collection(db,"pendencias"),{pessoaId:p.id,nomePessoa:p.nome,tipo:String(d.get("tipo")),responsavel:String(d.get("responsavel")||"").trim()||null,prazo:String(d.get("prazo")||"")||null,status:"aberta",nota:String(d.get("nota")||"").trim(),criadoEm:serverTimestamp(),criadoPor:currentUser.uid,atualizadoEm:serverTimestamp()});
   await loadPendencies();await renderPendencies();msg("Pendência criada no Firestore.",true);
  }catch(error){console.error("Falha ao criar pendência",error.code||"");form.querySelector("#pendingFormMessage").textContent=error.code==="permission-denied"?"Acesso negado pelas regras do Firestore.":"Não foi possível salvar a pendência.";}
 });
}
root.addEventListener("click",async e=>{
 const tab=e.target.closest("[data-tab]");
 if(tab)return;
 const el=e.target.closest("[data-action]");if(!el)return;
 const action=el.dataset.action;
 if(action==="home"){showHome();return;}
 if(action==="new-person"){openPersonEditor();return;}
 if(action==="cancel-person-editor"){editingPersonId=null;root.querySelector("#personEditor").innerHTML="";return;}
 if(action==="reload-people"){try{await loadPeople();await loadPendencies();renderPeople();msg("Lista atualizada.",true);}catch{msg("Não foi possível atualizar a lista.");}return;}
 if(action==="saved-pending"){peopleFilters.pendencia="true";peoplePage=0;renderPeople();return;}
 if(action==="saved-no-ekklesia"){peopleFilters.search="";peopleFilters.pendencia="";renderPeople();msg("Filtro salvo aplicado quando os registros possuem esse campo. Use a ficha para confirmar os valores.");return;}
 if(action==="people-prev"){peoplePage=Math.max(0,peoplePage-1);renderPeople();return;}
 if(action==="people-next"){peoplePage++;renderPeople();return;}
 if(action==="new-pending"){openPendingEditor();return;}
 if(action==="cancel-pending"){root.querySelector("#pendingEditor").innerHTML="";return;}
 if(action==="reload-pendencies"){try{await loadPendencies();renderPendencies();msg("Pendências atualizadas.",true);}catch{msg("Não foi possível atualizar as pendências.");}return;}
 if(action.startsWith("person-detail:")){await openPersonDetail(action.split(":")[1]);return;}
 if(action.startsWith("person-edit:")){const id=action.split(":")[1];document.getElementById("personDrawerLayer")?.remove();openPersonEditor(id);return;}
 if(action.startsWith("resolve-pending:")){
  const id=action.split(":")[1],p=pendingCache.find(x=>x.id===id);if(!p)return;
  const next=(p.status||"aberta")==="resolvida"?"aberta":"resolvida";
  if(!window.confirm(next==="resolvida"?"Marcar esta pendência como resolvida?":"Reabrir esta pendência?"))return;
  try{await updateDoc(doc(db,"pendencias",id),{status:next,atualizadoEm:serverTimestamp(),atualizadoPor:currentUser.uid,...(next==="resolvida"?{resolvidoEm:serverTimestamp(),resolvidoPor:currentUser.uid}:{resolvidoEm:null,resolvidoPor:null})});await loadPendencies();renderPendencies();msg("Status da pendência atualizado.",true);}
  catch(error){console.error("Falha ao atualizar pendência",error.code||"");msg(error.code==="permission-denied"?"Acesso negado pelas regras do Firestore.":"Não foi possível atualizar a pendência.");}
 }
});
launchers.forEach(b=>b.addEventListener("click",()=>showModule(b.dataset.openModule)));
if(auth) onAuthStateChanged(auth,async user=>{
 currentUser=user;
 if(!user){launchers.forEach(b=>b.hidden=true);root.hidden=true;return;}
 if(!firebaseConfigurado||!db){launchers.forEach(b=>b.hidden=true);return;}
 try{
  const userSnap=await getDoc(doc(db,"usuarios",user.uid));
  currentRole=userSnap.exists()&&userSnap.data().ativo===true?String(userSnap.data().perfil||""):"";
  launchers.forEach(b=>b.hidden=!allowed());
  if(allowed()){await loadPeople();await loadPendencies();}
 }catch(error){console.error("Falha ao verificar perfil",error.code||"");launchers.forEach(b=>b.hidden=true);}
});
else launchers.forEach(b=>b.hidden=true);
