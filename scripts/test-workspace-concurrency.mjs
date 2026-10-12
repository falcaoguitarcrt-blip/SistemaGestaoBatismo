import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('let baseWorkspaceVersionId = null;');
const end = html.indexOf('\nasync function loadCloudWorkspace() {', start);
assert.notEqual(start, -1, 'não encontrou o controle de versão do workspace');
assert.notEqual(end, -1, 'não encontrou o fim da função de gravação');
const source = html.slice(start, end) + '\nglobalThis.__saveWorkspace = saveCloudWorkspace; globalThis.__setBase = value => { baseWorkspaceVersionId = value; workspaceVersionConflict = false; };';

const documents = new Map();
const firestore = {};
const auth = { currentUser: { uid: 'uid-permitido-teste', displayName: 'Teste' } };
const events = [];
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
const contextFactory = () => {
  const context = {
    console,
    Date,
    Math,
    setTimeout,
    clearTimeout,
    navigator: { onLine: true },
    firestore,
    auth,
    window: { dispatchEvent: event => events.push(event) },
    CustomEvent: class CustomEvent { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } },
    safeValue: clone,
    doc: (first, ...parts) => ({ path: (first === firestore ? '' : first.path + '/') + parts.join('/') }),
    collection: (_db, ...parts) => ({ path: parts.join('/') }),
    chunkItems: (section, items, size, options = {}) => items.length ? [{
      id: (options.idPrefix || '') + section + '_0',
      section,
      part: 0,
      items: clone(items),
      ...options
    }] : [],
    getDoc: async ref => {
      const value = documents.get(ref.path);
      return { exists: () => value !== undefined, data: () => clone(value) };
    },
    setDoc: async (ref, data, options) => {
      const previous = documents.get(ref.path) || {};
      documents.set(ref.path, options?.merge ? { ...previous, ...clone(data) } : clone(data));
    },
    writeInBatches: async actions => {
      for (const action of actions) {
        if (action.type === 'delete') documents.delete(action.ref.path);
        else documents.set(action.ref.path, clone(action.data));
      }
    },
    runTransaction: async (_db, callback) => {
      const writes = [];
      const tx = {
        get: async ref => {
          const value = documents.get(ref.path);
          return { exists: () => value !== undefined, data: () => clone(value) };
        },
        set: (ref, data, options) => writes.push({ ref, data: clone(data), options })
      };
      const result = await callback(tx);
      for (const write of writes) {
        const previous = documents.get(write.ref.path) || {};
        documents.set(write.ref.path, write.options?.merge ? { ...previous, ...write.data } : write.data);
      }
      return result;
    }
  };
  vm.runInNewContext(source, context, { filename: 'workspace-save-extracted.js' });
  return context;
};

documents.set('appData/primary', { schemaVersion: 1, currentVersion: 'v0', updatedBy: 'seed' });
documents.set('appData/primary/versions/v0', { versionId: 'v0', sourceFileName: 'base de teste' });
const sessionA = contextFactory();
const sessionB = contextFactory();
sessionA.__setBase('v0');
sessionB.__setBase('v0');

const payloadA = { people: [{ id: 'A', name: 'Salvo pela sessão A' }], rawSheets: {}, checkin: { legacy: 'A' } };
const payloadB = { people: [{ id: 'B', name: 'Salvo pela sessão B' }], rawSheets: {}, checkin: { legacy: 'B' } };

await sessionA.__saveWorkspace(payloadA, true);
const pointerAfterA = documents.get('appData/primary').currentVersion;
assert.notEqual(pointerAfterA, 'v0', 'a primeira sessão deve avançar a versão');
const countAfterA = documents.size;

await assert.rejects(
  sessionB.__saveWorkspace(payloadB, true),
  error => /Outra pessoa salvou alterações/.test(error.message),
  'a segunda sessão deve ser bloqueada quando sua versão-base ficou obsoleta'
);

assert.equal(documents.get('appData/primary').currentVersion, pointerAfterA, 'a segunda sessão não pode sobrescrever o ponteiro');
assert.equal(documents.size, countAfterA, 'a sessão bloqueada não deve criar uma versão órfã');
assert.ok(documents.has('appData/primary/versions/v0'), 'a versão antiga continua legível');
assert.equal(documents.get('appData/primary/versions/v0').sourceFileName, 'base de teste');
assert.equal(documents.get('appData/primary/live/state').checkin.legacy, 'A', 'a sessão bloqueada não pode sobrescrever o estado legado do check-in');
console.log('OK: duas sessões com base v0; a primeira salva, a segunda é bloqueada, o ponteiro e check-in ficam intactos e a versão antiga continua legível.');
