/**
 * Comprehensive Verification Suite for Chaos2Commit:
 * Independent AI Chats (Project-less) & AI Consultant Multi-Chat System.
 * Tests against live server http://127.0.0.1:3847
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://127.0.0.1:3847';

console.log('=== CHAOS2COMMIT INDEPENDENT AI CHATS & MULTI-CHAT TEST SUITE ===\n');

// Mock browser environment
const store = {};
const mockLocalStorage = {
  store,
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { for (const k in this.store) delete this.store[k]; }
};

const elements = {};
function getOrCreateEl(id) {
  if (!elements[id]) {
    elements[id] = {
      id,
      innerHTML: '',
      textContent: '',
      value: '',
      dataset: {},
      disabled: false,
      classList: {
        classes: new Set(),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
        contains(c) { return this.classes.has(c); }
      },
      style: {},
      scrollHeight: 42,
      listeners: {},
      addEventListener(evt, fn) {
        this.listeners[evt] = this.listeners[evt] || [];
        this.listeners[evt].push(fn);
      },
      dispatchEvent(evt) {
        const fns = this.listeners[evt.type] || [];
        fns.forEach(fn => fn(evt));
      },
      click() {
        this.dispatchEvent({ type: 'click', preventDefault() {} });
      },
      closest() { return null; },
      focus() {}
    };
  }
  return elements[id];
}

global.document = {
  documentElement: {
    setAttribute() {},
    getAttribute() { return 'light'; },
    classList: { add() {}, remove() {}, contains() { return false; } }
  },
  getElementById(id) { return getOrCreateEl(id); },
  querySelectorAll() { return []; },
  querySelector() { return null; }
};

global.window = {
  localStorage: mockLocalStorage,
  crypto: {
    randomUUID() { return 'uuid-' + Math.random().toString(36).slice(2, 10); }
  },
  location: { href: '' },
  fetch: global.fetch,
  confirm() { return true; },
  alert(msg) { console.log('[Alert]', msg); }
};
global.localStorage = mockLocalStorage;

// Load chaos-engine.js
require('../chaos-engine.js');
const ChaosStore = global.window.ChaosStore;

async function runTests() {
  // Test 1: Dashboard New Chat Modal has NO project dropdown
  console.log('--- Test 1: Dashboard + New Chat Modal has NO Project Dropdown ---');
  const dashHtml = fs.readFileSync(path.join(__dirname, '..', 'dashboard.html'), 'utf8');
  assert(!dashHtml.includes('id="select-chat-project"'), 'dashboard.html must NOT contain #select-chat-project');
  assert(!dashHtml.includes('Select Project *'), 'dashboard.html must NOT contain "Select Project *"');
  assert(!dashHtml.includes('Chat history and requirements stay scoped to the selected project'), 'dashboard.html must NOT contain project scoping disclaimer');
  assert(dashHtml.includes('id="input-new-chat-idea"'), 'dashboard.html must contain #input-new-chat-idea');
  assert(dashHtml.includes('id="input-new-chat-topic"'), 'dashboard.html must contain #input-new-chat-topic');
  assert(dashHtml.includes('What would you like to work on?'), 'dashboard.html must contain "What would you like to work on?"');

  const dashEnhancedHtml = fs.readFileSync(path.join(__dirname, '..', 'dashboard-enhanced.html'), 'utf8');
  assert(!dashEnhancedHtml.includes('id="select-chat-project"'), 'dashboard-enhanced.html must NOT contain #select-chat-project');
  assert(dashEnhancedHtml.includes('id="input-new-chat-idea"'), 'dashboard-enhanced.html must contain #input-new-chat-idea');
  console.log('✓ Modal cleanly verified: absolutely NO project dropdown or project-scoping disclaimer\n');

  // Test 2: Create independent chat (Restaurant Ordering) without selecting a project
  console.log('--- Test 2: Create Independent Chat without Project Selection ---');
  const independentChat1 = ChaosStore.createChat(null, 'Restaurant Ordering');
  assert(independentChat1, 'createChat must return independent chat');
  assert(independentChat1.id, 'Chat must have unique ID');
  assert.strictEqual(independentChat1.projectId, null, 'Chat projectId must be null');
  assert.strictEqual(independentChat1.title, 'Restaurant Ordering');
  assert(Array.isArray(independentChat1.messages), 'Messages must be an array');

  const fetchedChat1 = ChaosStore.getChatById(independentChat1.id);
  assert(fetchedChat1, 'ChaosStore.getChatById must locate independent chat');
  assert.strictEqual(fetchedChat1.projectId, null);
  console.log('✓ Independent chat created with projectId = null and found via getChatById\n');

  // Test 3: Send message to /api/ai/chat with projectId = null
  console.log('--- Test 3: Send Message in Independent Chat (projectId = null) ---');
  const chatRes1 = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: null,
      chatId: independentChat1.id,
      message: 'I want to create an online restaurant ordering system.',
      conversation: []
    })
  });
  assert.strictEqual(chatRes1.status, 200, 'POST /api/ai/chat with projectId: null must return HTTP 200');
  const chatData1 = await chatRes1.json();
  assert(chatData1.message || chatData1.analysis?.businessUnderstanding, 'Must return assistant reply');
  console.log('✓ Backend responded HTTP 200 for independent chat');
  console.log('  Preview:', String(chatData1.message).slice(0, 80) + '...\n');

  // Add messages to independentChat1 and save
  independentChat1.messages.push({
    id: 'msg-rest-1',
    role: 'user',
    content: 'I want to create an online restaurant ordering system.',
    timestamp: new Date().toISOString()
  });
  independentChat1.messages.push({
    id: 'msg-rest-2',
    role: 'assistant',
    content: chatData1.message || 'Restaurant ordering system roadmap initialized.',
    timestamp: new Date().toISOString()
  });
  ChaosStore.saveChat(independentChat1);

  // Test 4: Create second independent chat (Hospital Management)
  console.log('--- Test 4: Create Second Independent Chat (Hospital Management) ---');
  const independentChat2 = ChaosStore.createChat(null, 'Hospital Management');
  assert(independentChat2, 'Second independent chat created');
  assert.strictEqual(independentChat2.projectId, null);
  assert.strictEqual(independentChat2.title, 'Hospital Management');

  const chatRes2 = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: null,
      chatId: independentChat2.id,
      message: 'I want a hospital appointment management system.',
      conversation: []
    })
  });
  assert.strictEqual(chatRes2.status, 200, 'Hospital chat request returned 200');
  const chatData2 = await chatRes2.json();
  assert(chatData2.message || chatData2.analysis?.businessUnderstanding, 'Must return response');

  independentChat2.messages.push({
    id: 'msg-hosp-1',
    role: 'user',
    content: 'I want a hospital appointment management system.',
    timestamp: new Date().toISOString()
  });
  independentChat2.messages.push({
    id: 'msg-hosp-2',
    role: 'assistant',
    content: chatData2.message || 'Hospital appointment system guidelines initialized.',
    timestamp: new Date().toISOString()
  });
  ChaosStore.saveChat(independentChat2);
  console.log('✓ Hospital Management chat created and responded independently\n');

  // Test 5: Switch back to Restaurant Ordering & verify isolation
  console.log('--- Test 5: Switch Between Chats & Verify Isolation ---');
  const reloadedChat1 = ChaosStore.getChatById(independentChat1.id);
  const reloadedChat2 = ChaosStore.getChatById(independentChat2.id);

  assert.strictEqual(reloadedChat1.messages.length, 2);
  assert.strictEqual(reloadedChat2.messages.length, 2);
  assert(reloadedChat1.messages[0].content.includes('restaurant'), 'Chat 1 has restaurant topic');

  assert(reloadedChat2.messages[0].content.includes('hospital'), 'Chat 2 has hospital topic');
  assert(!reloadedChat2.messages.some(m => m.content.includes('restaurant')), 'Chat 2 has NO restaurant data');
  console.log('✓ Complete conversation isolation verified between independent chats\n');

  // Test 6: Persistence test (reloading ChaosStore)
  console.log('--- Test 6: Persistence across Storage Reload ---');
  // Re-read storage
  const rawIndependentChats = JSON.parse(mockLocalStorage.getItem('asb_independent_chats') || '[]');
  assert(rawIndependentChats.some(c => c.id === independentChat1.id), 'Chat 1 persisted in localStorage');
  assert(rawIndependentChats.some(c => c.id === independentChat2.id), 'Chat 2 persisted in localStorage');

  const allChats = ChaosStore.getAllChats();
  const foundChat1 = allChats.find(c => c.id === independentChat1.id);
  const foundChat2 = allChats.find(c => c.id === independentChat2.id);
  assert(foundChat1, 'getAllChats returns Chat 1');
  assert.strictEqual(foundChat1.projectId, null);
  assert.strictEqual(foundChat1.projectName, 'No project');
  assert(foundChat2, 'getAllChats returns Chat 2');
  assert.strictEqual(foundChat2.projectId, null);
  assert.strictEqual(foundChat2.projectName, 'No project');
  console.log('✓ Independent chats persist and render with "No project" metadata\n');

  // Test 7: Existing Project Chats still work
  console.log('--- Test 7: Existing Project-Scoped Chats Function Normally ---');
  const proj = ChaosStore.getProjectById('p_panipuri_express');
  assert(proj, 'Project p_panipuri_express must exist');
  const projectChat = ChaosStore.createChat('p_panipuri_express', 'Packaging Redesign');
  assert.strictEqual(projectChat.projectId, 'p_panipuri_express');

  const projChatRes = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: 'p_panipuri_express',
      chatId: projectChat.id,
      message: 'We need tamper-proof packaging for Pani Puri kits.',
      conversation: []
    })
  });
  assert.strictEqual(projChatRes.status, 200, 'Project chat must return 200');
  const projChatData = await projChatRes.json();
  assert(projChatData.message, 'Project chat returned reply');
  console.log('✓ Project-scoped chat functions flawlessly alongside independent chats\n');

  // Test 8: Voice Input Path Simulation
  console.log('--- Test 8: Voice Input Processing in Independent Chat ---');
  // Simulate voice input: recognized text placed in textarea, then submitted
  const voiceTranscribedText = 'We need automated temperature control alerts for food storage';
  const voiceChatRes = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: null,
      chatId: independentChat1.id,
      message: voiceTranscribedText,
      conversation: independentChat1.messages.map(m => ({ role: m.role, content: m.content }))
    })
  });
  assert.strictEqual(voiceChatRes.status, 200, 'Voice-originated message succeeds');
  const voiceData = await voiceChatRes.json();
  assert(voiceData.message, 'Voice message receives AI reply');
  console.log('✓ Voice input pipeline successfully communicates with AI for independent chat\n');

  // Test 9: Future Project Association Capability
  console.log('--- Test 9: Future Project Association (associateChatWithProject) ---');
  const associableChat = ChaosStore.createChat(null, 'Warehouse Robotics');
  assert.strictEqual(associableChat.projectId, null);

  // Associate with project
  const associated = ChaosStore.associateChatWithProject(associableChat.id, 'p_panipuri_express');
  assert(associated, 'associateChatWithProject must succeed');
  assert.strictEqual(associated.projectId, 'p_panipuri_express');

  // Verify it was moved to project
  const updatedProj = ChaosStore.getProjectById('p_panipuri_express');
  assert(updatedProj.chats.some(c => c.id === associableChat.id), 'Chat moved to project chats array');
  assert(!ChaosStore.independentChats.some(c => c.id === associableChat.id), 'Chat removed from independentChats array');
  console.log('✓ Independent chat successfully associated with project for future expansion\n');

  console.log('================================================================');
  console.log('🎉 ALL 9 TEST SUITES COMPLETED AND PASSED WITH 100% SUCCESS!');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test suite failure:', err);
  process.exit(1);
});
