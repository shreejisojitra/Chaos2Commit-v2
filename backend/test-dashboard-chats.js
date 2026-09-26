/**
 * Verification test for ChaosStore global AI chat features and Dashboard integrations.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Running Global AI Chat Verification Tests ===\n');

// Mock browser environment for chaos-engine.js
const mockLocalStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};

global.document = {
  documentElement: {
    setAttribute() {},
    getAttribute() { return 'light'; },
    classList: { add() {}, remove() {}, contains() { return false; } }
  },
  querySelectorAll() { return []; },
  getElementById() { return null; }
};
global.window = {
  localStorage: mockLocalStorage,
  crypto: {
    randomUUID() { return 'uuid-' + Math.random().toString(36).slice(2, 10); }
  },
  fetch: async () => ({ ok: false })
};
global.localStorage = mockLocalStorage;

// Load chaos-engine.js
require('../chaos-engine.js');

const ChaosStore = global.window.ChaosStore;
assert(ChaosStore, 'ChaosStore must be defined on window');
console.log('✓ ChaosStore initialized successfully');

// Test 1: Check initial projects and chat normalization
const projects = ChaosStore.getProjects();
assert(Array.isArray(projects) && projects.length > 0, 'ChaosStore must have initial projects');
const demoProject = projects.find(p => p.id === 'p_panipuri_express');
assert(demoProject, 'Demo project must exist');
assert(Array.isArray(demoProject.chats) && demoProject.chats.length > 0, 'Demo project must have normalized chats array');
assert(demoProject.activeChatId, 'Demo project must have activeChatId');
console.log('✓ Project chat state normalized properly (chats count:', demoProject.chats.length, ')');

// Test 2: getAllChats()
const allChats = ChaosStore.getAllChats();
assert(Array.isArray(allChats), 'getAllChats must return an array');
assert(allChats.length >= 1, 'Must have at least 1 chat across projects');
const firstChat = allChats[0];
assert(firstChat.id, 'Chat item must have id');
assert(firstChat.projectId, 'Chat item must have projectId');
assert(firstChat.projectName, 'Chat item must have projectName');
assert(firstChat.title, 'Chat item must have title');
assert(typeof firstChat.preview === 'string', 'Chat item must have preview');
assert(typeof firstChat.messageCount === 'number', 'Chat item must have messageCount');
console.log('✓ getAllChats returns rich metadata:');
console.log('   Title:', firstChat.title);
console.log('   Project:', firstChat.projectName);
console.log('   Messages:', firstChat.messageCount);
console.log('   Preview:', firstChat.preview);

// Test 3: formatChatRelativeTime
assert.strictEqual(ChaosStore.formatChatRelativeTime(new Date().toISOString()), 'Just now');
assert.strictEqual(ChaosStore.formatChatRelativeTime(new Date(Date.now() - 120000).toISOString()), '2 min ago');
assert.strictEqual(ChaosStore.formatChatRelativeTime(new Date(Date.now() - 7200000).toISOString()), '2 hr ago');
assert.strictEqual(ChaosStore.formatChatRelativeTime(new Date(Date.now() - 100000000).toISOString()), 'Yesterday');
console.log('✓ formatChatRelativeTime works accurately');

// Test 4: createChat(projectId, title)
const initialChatCount = demoProject.chats.length;
const newChat = ChaosStore.createChat('p_panipuri_express', 'Fleet Optimization');
assert(newChat, 'createChat must return the created chat');
assert(newChat.id, 'New chat must have an id');
assert.strictEqual(newChat.title, 'Fleet Optimization');
assert.strictEqual(newChat.projectId, 'p_panipuri_express');
const updatedProject = ChaosStore.getProjectById('p_panipuri_express');
assert.strictEqual(updatedProject.chats.length, initialChatCount + 1, 'Chat count must increment by 1');
assert.strictEqual(updatedProject.activeChatId, newChat.id, 'New chat must become activeChatId');
console.log('✓ createChat creates chat and updates activeChatId');

// Test 5: Verify new chat appears in getAllChats()
const updatedAllChats = ChaosStore.getAllChats();
assert(updatedAllChats.some(c => c.id === newChat.id), 'Newly created chat must appear in getAllChats');
console.log('✓ New chat appears globally across dashboard chat list');

// Test 6: deleteChat(projectId, chatId) without deleting project
const chatToDeleteId = newChat.id;
const deleteResult = ChaosStore.deleteChat('p_panipuri_express', chatToDeleteId);
assert.strictEqual(deleteResult, true, 'deleteChat should return true');
const projectAfterDelete = ChaosStore.getProjectById('p_panipuri_express');
assert(projectAfterDelete, 'Project must NOT be deleted when deleting a chat');
assert(!projectAfterDelete.chats.some(c => c.id === chatToDeleteId), 'Deleted chat must be removed from project');
assert(projectAfterDelete.activeChatId !== chatToDeleteId, 'Active chat must shift away from deleted chat');
assert.strictEqual(projectAfterDelete.id, 'p_panipuri_express', 'Project metadata must remain completely intact');
assert(projectAfterDelete.idea, 'Project business idea must remain completely intact');
console.log('✓ deleteChat removes only the chat and preserves project completely');

// Test 7: HTML structural verification
const dashHtml = fs.readFileSync(path.join(__dirname, '..', 'dashboard.html'), 'utf8');
assert(dashHtml.includes('id="ai-chats-list"'), 'dashboard.html must have #ai-chats-list');
assert(dashHtml.includes('id="ai-chats-count-badge"'), 'dashboard.html must have #ai-chats-count-badge');
assert(dashHtml.includes('id="chat-search"'), 'dashboard.html must have #chat-search');
assert(dashHtml.includes('id="btn-dashboard-new-chat"'), 'dashboard.html must have #btn-dashboard-new-chat');
assert(dashHtml.includes('id="modal-new-chat"'), 'dashboard.html must have #modal-new-chat');
assert(dashHtml.includes('data-action="open-chat"'), 'dashboard.html must handle open-chat');
assert(dashHtml.includes('data-action="delete-chat"'), 'dashboard.html must handle delete-chat');

const projHtml = fs.readFileSync(path.join(__dirname, '..', 'project.html'), 'utf8');
assert(projHtml.includes('id="chat-list"'), 'project.html must have #chat-list');
assert(projHtml.includes('id="btn-new-chat"'), 'project.html must have #btn-new-chat');
assert(projHtml.includes('id="btn-voice-input"'), 'project.html must have #btn-voice-input');
assert(projHtml.includes('targetChatId'), 'project.html must support URL chatId parameter');

const dashEnhancedHtml = fs.readFileSync(path.join(__dirname, '..', 'dashboard-enhanced.html'), 'utf8');
assert(dashEnhancedHtml.includes('id="ai-chats-list"'), 'dashboard-enhanced.html must have #ai-chats-list');

const projEnhancedHtml = fs.readFileSync(path.join(__dirname, '..', 'project-enhanced.html'), 'utf8');
assert(projEnhancedHtml.includes('id="chat-list"'), 'project-enhanced.html must have #chat-list');
assert(projEnhancedHtml.includes('id="btn-voice-input"'), 'project-enhanced.html must have #btn-voice-input');

console.log('✓ All HTML templates contain required DOM elements, modals, and event bindings');

console.log('\n=== All 7 Global AI Chat Tests Passed Successfully! ===');
