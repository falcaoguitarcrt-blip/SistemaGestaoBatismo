import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('let dayUnsub=null, dayPending=new Set()');
const end = html.indexOf("window.addEventListener('day-legacy-marks'", start);
assert.notEqual(start, -1, 'não encontrou o bloco de check-in Firebase');
assert.notEqual(end, -1, 'não encontrou o fim do bloco de check-in Firebase');
const source = html.slice(start, end);

const docs = new Map();
const calls = [];
let auditId = 0;
const firestore = {};
const user = { uid: 'uid-teste', displayName: 'Teste', email: 'teste@example.invalid' };
const context = {
  console,
  firestore,
  auth: { currentUser: user },
  navigator: { onLine: true },
  crypto: { randomUUID: () => 'operation-test-' + (calls.length + 1) },
  dayPending: new Set(),
  dayOnline: true,
  dayServerConnected: null,
  daySyncError: false,
  dayUnsub: null,
  CustomEvent: class CustomEvent { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } },
  window: { addEventListener() {}, dispatchEvent() {} },
  sessionStorage: { getItem() { return null; }, setItem() {} },
  serverTimestamp: () => ({ __sentinel: 'serverTimestamp' }),
  collection: (_db, name) => ({ path: name }),
  doc: (parent, name, id) => {
    if (id === undefined && typeof name === 'string') return { path: parent.path + '/' + name };
    if (id === undefined) return { path: parent.path + '/audit-' + (++auditId) };
    return { path: (parent.path ? parent.path + '/' : '') + name + '/' + id };
  },
  setDoc: (ref, data, options) => {
    calls.push({ path: ref.path, data, options });
    if (ref.path.startsWith('marcacoesBatismo/')) {
      docs.set(ref.path, { ...(options?.merge ? docs.get(ref.path) || {} : {}), ...data });
    } else {
      docs.set(ref.path, data);
    }
    return Promise.resolve();
  },
  getDoc: async ref => {
    const value = docs.get(ref.path);
    return { exists: () => value !== undefined, data: () => value };
  },
  getDocFromServer: async ref => {
    const value = docs.get(ref.path);
    return { exists: () => value !== undefined, data: () => value };
  },
  runTransaction: async (_db, callback) => callback({
    get: async ref => {
      const value = docs.get(ref.path);
      return { exists: () => value !== undefined, data: () => value };
    },
    set: (ref, data, options) => {
      const prior = docs.get(ref.path) || {};
      docs.set(ref.path, options?.merge ? { ...prior, ...data } : data);
    }
  }, {}),
  emitDayStatus() {}
};
vm.runInNewContext(source, context, { filename: 'index.html#firebase-checkin' });

const row = { number: 7, sourceRow: 7, __turmaId: '36' };
const markId = '36_7';
const fields = { presente: true, presenteEm: new Date().toISOString() };
const toggleResult = await context.window.firebaseToggleDayMark(markId, fields, row, {});
assert.equal(toggleResult.saved, true, 'firebaseToggleDayMark deve concluir sem TypeError');
assert.equal(calls[0].path, 'marcacoesBatismo/36_7', 'gravação principal deve iniciar primeiro');
assert.equal(calls[1].path.startsWith('marcacoesBatismoAuditoria/'), true, 'auditoria deve iniciar depois da gravação principal');
const auditAfter = calls[1].data.depois;
assert.notDeepEqual(auditAfter.presenteEm, { __sentinel: 'serverTimestamp' }, 'presenteEm não pode ser sentinel no snapshot da auditoria');
assert.equal(typeof auditAfter.presenteEm, 'string', 'presenteEm deve ser uma representação serializável no snapshot de auditoria');
assert.equal(auditAfter.atualizadoEm, undefined, 'não incluir atualizadoEm sentinel nos snapshots before/after');
assert.equal(calls[1].data.porUid, user.uid, 'auditoria deve registrar porUid');
assert.equal(typeof calls[1].data.operacaoId, 'string', 'auditoria deve registrar operacaoId');

const undoResult = await context.window.firebaseUndoDayMark(markId, {}, row, toggleResult.after);
assert.equal(undoResult.saved, true, 'firebaseUndoDayMark deve concluir sem TypeError');
assert.equal(docs.get('marcacoesBatismo/36_7').presente, false, 'desfazer deve restaurar presente=false');
assert.equal(docs.get('marcacoesBatismo/36_7').presenteEm, null, 'desfazer deve restaurar presenteEm=null');
assert.ok(calls.some(call => call.path.startsWith('marcacoesBatismoAuditoria/')), 'ambas as operações devem iniciar auditoria');
console.log('OK: firebaseToggleDayMark e firebaseUndoDayMark executados com mocks, sem TypeError; ordem de escrita, auditoria e restauração verificados.');
