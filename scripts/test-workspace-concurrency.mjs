import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('let baseWorkspaceVersionId = null;');
const end = html.indexOf('\nwindow.firebaseSaveWorkspace = saveCloudWorkspace;', start);
assert.notEqual(start, -1, 'não encontrou o controle de versão do workspace');
assert.notEqual(end, -1, 'não encontrou o fim do carregador do workspace');
const source = html.slice(start, end) + '\nglobalThis.__saveWorkspace = saveCloudWorkspace; globalThis.__setBase = value => { baseWorkspaceVersionId = value; workspaceVersionConflict = false; }; globalThis.__getBase = () => baseWorkspaceVersionId;';

const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
function makeHarness(options = {}) {
  const documents = options.documents || new Map();
  const firestore = {};
  const auth = { currentUser: { uid: 'uid-permitido-teste', displayName: 'Teste' } };
  const events = [];
  const consoleMessages = [];
  const deletedPaths = [];
  let transactionCount = 0;
  const harness = {
    documents, events, consoleMessages, deletedPaths,
    context: null
  };
  const context = {
    console: {
      log: (...args) => consoleMessages.push(['log', ...args]),
      warn: (...args) => consoleMessages.push(['warn', ...args]),
      error: (...args) => consoleMessages.push(['error', ...args])
    },
    Date,
    Math,
    setTimeout: options.fastTimeout ? ((fn, _ms) => setTimeout(fn, 5)) : setTimeout,
    clearTimeout,
    navigator: { onLine: true },
    firestore,
    auth,
    window: { dispatchEvent: event => events.push(event) },
    CustomEvent: class CustomEvent { constructor(type, config = {}) { this.type = type; this.detail = config.detail; } },
    safeValue: clone,
    doc: (first, ...parts) => ({ path: (first === firestore ? '' : first.path + '/') + parts.join('/') }),
    collection: (_db, ...parts) => ({ path: parts.join('/') }),
    chunkItems: (section, items, _size, extra = {}) => items.length ? [{
      id: (extra.idPrefix || '') + section + '_0',
      section,
      part: 0,
      items: clone(items),
      ...extra
    }] : [],
    getDoc: async ref => {
      const value = documents.get(ref.path);
      return { exists: () => value !== undefined, data: () => clone(value) };
    },
    getDocs: async ref => {
      const prefix = ref.path + '/';
      const docs = [...documents.entries()].filter(([path]) => path.startsWith(prefix)).map(([path, value]) => ({
        id: path.slice(prefix.length),
        data: () => clone(value)
      }));
      return { docs };
    },
    setDoc: async (ref, data, config) => {
      const previous = documents.get(ref.path) || {};
      documents.set(ref.path, config?.merge ? { ...previous, ...clone(data) } : clone(data));
    },
    writeInBatches: async actions => {
      for (const action of actions) {
        if (action.type === 'delete') {
          deletedPaths.push(action.ref.path);
          documents.delete(action.ref.path);
        } else documents.set(action.ref.path, clone(action.data));
      }
    },
    runTransaction: async (_db, callback) => {
      transactionCount++;
      const writes = [];
      const tx = {
        get: async ref => {
          const value = documents.get(ref.path);
          return { exists: () => value !== undefined, data: () => clone(value) };
        },
        set: (ref, data, config) => writes.push({ ref, data: clone(data), config })
      };
      const result = await callback(tx);
      const commit = () => {
        for (const write of writes) {
          const previous = documents.get(write.ref.path) || {};
          documents.set(write.ref.path, write.config?.merge ? { ...previous, ...write.data } : write.data);
        }
        return result;
      };
      const isPointerWrite = writes.some(write => write.ref.path === 'appData/primary' && write.data.currentVersion);
      if (options.delayPointerCommit && isPointerWrite) {
        return new Promise(resolve => setTimeout(() => resolve(commit()), 35));
      }
      return commit();
    }
  };
  vm.runInNewContext(source, context, { filename: 'workspace-save-extracted.js' });
  harness.context = context;
  return harness;
}

function seed(documents) {
  documents.set('appData/primary', { schemaVersion: 1, currentVersion: 'v0', updatedBy: 'seed' });
  documents.set('appData/primary/versions/v0', { versionId: 'v0', sourceFileName: 'base de teste' });
  documents.set('appData/primary/versions/v0/chunks/people_0', {
    section: 'people', part: 0, items: [{ id: 'seed', name: 'Base preservada' }]
  });
  documents.set('appData/primary/live/state', { checkin: { legacy: 'seed' } });
}

const payloadA = { people: [{ id: 'A', name: 'Salvo pela sessão A' }], rawSheets: {}, checkin: { legacy: 'A' } };
const payloadB = { people: [{ id: 'B', name: 'Salvo pela sessão B' }], rawSheets: {}, checkin: { legacy: 'B' } };

// Caso 1: duas sessões com a mesma base. A segunda é barrada antes de criar documentos.
const sharedDocuments = new Map();
seed(sharedDocuments);
const sessionA = makeHarness({ documents: sharedDocuments });
const sessionB = makeHarness({ documents: sharedDocuments });
sessionA.context.__setBase('v0');
sessionB.context.__setBase('v0');
await sessionA.context.__saveWorkspace(payloadA, true);
const pointerAfterA = sharedDocuments.get('appData/primary').currentVersion;
assert.notEqual(pointerAfterA, 'v0', 'a primeira sessão deve avançar a versão');
const countAfterA = sharedDocuments.size;
await assert.rejects(
  sessionB.context.__saveWorkspace(payloadB, true),
  error => /Outra pessoa salvou alterações/.test(error.message),
  'a segunda sessão deve ser bloqueada quando sua versão-base ficou obsoleta'
);
assert.equal(sharedDocuments.get('appData/primary').currentVersion, pointerAfterA, 'a segunda sessão não pode sobrescrever o ponteiro');
assert.equal(sharedDocuments.size, countAfterA, 'o conflito de preflight não deve criar documentos');
assert.ok(sharedDocuments.has('appData/primary/versions/v0'), 'a versão antiga continua legível');
assert.equal(sharedDocuments.get('appData/primary/live/state').checkin.legacy, 'A', 'a sessão bloqueada não pode sobrescrever o check-in legado');
assert.deepEqual(sessionB.deletedPaths, [], 'nenhum documento deve ser apagado no conflito');

// Caso 2: o compare-and-swap excede o timeout, mas a transação confirma depois.
const lateDocuments = new Map();
seed(lateDocuments);
const late = makeHarness({ documents: lateDocuments, fastTimeout: true, delayPointerCommit: true });
late.context.__setBase('v0');
const originalPaths = new Set(lateDocuments.keys());
await assert.rejects(
  late.context.__saveWorkspace(payloadA, true),
  error => error.workspaceTransactionPending === true && /Sem conexão com o Firebase/.test(error.message),
  'o chamador deve receber o estado de confirmação pendente sem travar indefinidamente'
);
assert.deepEqual(late.deletedPaths, [], 'o timeout/resultado indeterminado nunca pode disparar delete');
await new Promise(resolve => setTimeout(resolve, 70));
const finalPointer = lateDocuments.get('appData/primary').currentVersion;
assert.notEqual(finalPointer, 'v0', 'a transação tardia deve confirmar a nova versão');
assert.equal(late.context.__getBase(), finalPointer, 'a base local deve ser recarregada após confirmação tardia');
assert.deepEqual(late.deletedPaths, [], 'nenhum documento deve ser apagado após a confirmação tardia');
for (const path of originalPaths) assert.ok(lateDocuments.has(path), 'documento anterior foi removido: ' + path);
assert.equal(lateDocuments.get('appData/primary/live/state').checkin.legacy, 'A', 'o estado legado deve acompanhar a transação confirmada');
const refreshEvent = late.events.find(event => event.type === 'firebase-workspace-refresh');
assert.ok(refreshEvent, 'a confirmação tardia deve emitir evento para recarregar a base');
assert.equal(refreshEvent.detail.workspace.people[0].name, 'Salvo pela sessão A', 'a base recarregada deve conter o cadastro confirmado');
assert.equal(refreshEvent.detail.workspace.checkin.legacy, 'A', 'a base recarregada não pode perder os dados de check-in');
assert.ok(late.consoleMessages.every(entry => !entry.slice(1).some(value => String(value).includes('delete'))), 'o console não deve indicar limpeza destrutiva');

const saveHandlerStart = html.indexOf("window.addEventListener('firebase-workspace-refresh'");
const saveHandlerEnd = html.indexOf('\n  function goTo(sectionId)', saveHandlerStart);
const refreshHandler = html.slice(saveHandlerStart, saveHandlerEnd);
assert.ok(saveHandlerStart >= 0 && saveHandlerEnd > saveHandlerStart, 'não encontrou o handler de Atualizar agora');
assert.ok(!/firebaseSaveWorkspace|saveWorkspace\s*\(/.test(refreshHandler), 'Atualizar agora não deve salvar automaticamente');
assert.ok(refreshHandler.includes('Dados atualizados, revise antes de salvar.'), 'o editor deve avisar para revisar antes de salvar');

const markHandlerStart = html.indexOf("window.firebaseToggleDayMark=async function");
const undoStart = html.indexOf("window.firebaseUndoDayMark=async function", markHandlerStart);
const refreshStart = html.indexOf("window.firebaseRefreshDayMark=async function", markHandlerStart);
const legacyStart = html.indexOf("window.addEventListener('day-legacy-marks'", markHandlerStart);
const possibleEnds = [undoStart, refreshStart, legacyStart].filter(index => index > markHandlerStart);
const markHandlerEnd = possibleEnds.length ? Math.min(...possibleEnds) : -1;
const markHandler = html.slice(markHandlerStart, markHandlerEnd);
assert.ok(markHandlerStart >= 0 && markHandlerEnd > markHandlerStart, 'não encontrou o fluxo independente de marcacoesBatismo');
assert.ok(!/workspaceVersionConflict/.test(markHandler), 'o conflito do workspace não deve bloquear marcações de presença/batismo');
assert.ok(markHandler.includes("'marcacoesBatismo'"), 'a marcação do dia deve continuar usando a coleção existente');

console.log('OK: concorrência bloqueada sem deletes; timeout seguido de confirmação preserva documentos e recarrega a base; Atualizar agora não salva automaticamente; marcações do dia independem do conflito.');
