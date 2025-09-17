# 🔐 Test User Credentials - Clean Role System

## 📋 System Setup Summary

**Date:** September 16, 2025
**Status:** ✅ Successfully cleaned up and configured

### ✅ What Was Done:
- ❌ **Removed all duplicate roles** (Super Admin vs Super Administrator)
- ❌ **Deleted all existing users** (14 users removed)
- ❌ **Deleted all existing roles** (8 roles removed including duplicates and custom roles)
- ✅ **Created 6 unique, clean system roles**
- ✅ **Created 1 test user for each role**
- ✅ **All users have proper permissions from their roles**
- ✅ **Agent role has full handoff access** (view, accept, reject)

---

## 👥 Test User Credentials

### 🔴 **Super Administrator** (Highest Level)
- **Email:** `superadmin@test.com`
- **Password:** `SuperAdmin123!`
- **Role:** `superadministrator`
- **Name:** Super Administrator
- **Access:** Full system access + role management + system settings

### 🟠 **Administrator**
- **Email:** `admin@test.com`
- **Password:** `Admin123!`
- **Role:** `admin`
- **Name:** System Administrator
- **Access:** Full management except system settings

### 🟡 **Manager**
- **Email:** `manager@test.com`
- **Password:** `Manager123!`
- **Role:** `manager`
- **Name:** Team Manager
- **Access:** Team oversight + handoff management

### 🔵 **Operator**
- **Email:** `operator@test.com`
- **Password:** `Operator123!`
- **Role:** `operator`
- **Name:** System Operator
- **Access:** Day-to-day operations + content management

### 🟢 **Agent** (Customer Support)
- **Email:** `agent@test.com`
- **Password:** `Agent123!`
- **Role:** `agent`
- **Name:** Support Agent
- **Access:** Customer support + **handoff handling** (view, accept, reject)

### 🟣 **Viewer** (Read-Only)
- **Email:** `viewer@test.com`
- **Password:** `Viewer123!`
- **Role:** `viewer`
- **Name:** System Viewer
- **Access:** Read-only access for monitoring

---

## 🔐 Role Permissions Matrix

| Permission | Super Admin | Admin | Manager | Operator | Agent | Viewer |
|------------|:-----------:|:-----:|:-------:|:--------:|:-----:|:------:|
| **Dashboard** | ✅ Full | ✅ View | ✅ View | ✅ View | ✅ View | ✅ View |
| **Users** | ✅ Full | ✅ Manage | ❌ View Only | ❌ None | ❌ None | ❌ None |
| **Bots** | ✅ Full | ✅ Full | ✅ Edit | ✅ Edit | ❌ None | ✅ View |
| **Agents** | ✅ Full | ✅ Manage | ✅ Edit | ✅ View | ❌ None | ❌ None |
| **Analytics** | ✅ Full | ✅ Full | ✅ View | ✅ View | ✅ View | ✅ View |
| **Knowledge Base** | ✅ Full | ✅ Manage | ✅ Edit | ✅ Upload | ✅ View | ✅ View |
| **Settings** | ✅ System | ✅ Edit | ✅ View | ❌ None | ❌ None | ❌ None |
| **Chat** | ✅ Full | ✅ Full | ✅ Moderate | ✅ View | ✅ Moderate | ✅ View |
| **Handoffs** | ✅ Manage | ✅ Full | ✅ Manage | ✅ View | ✅ **Accept/Reject** | ✅ View |

---

## 🚀 Login Instructions

1. **Navigate to:** `http://localhost:3000/login`
2. **Use any of the credentials above**
3. **Each role will redirect to appropriate dashboard:**
   - **Super Admin/Admin/Manager/Operator/Viewer** → `/admin` (Admin Panel)
   - **Agent** → `/agent/dashboard` (Agent Portal with Handoff Access)

---

## 🎯 Testing Scenarios

### For **Role Management Testing:**
- Login as **Super Administrator** to create/edit roles
- Login as **Administrator** to manage users but not system roles

### For **Agent Handoff Testing:**
- Login as **Agent** to access `/agent/handoffs` page
- Verify agent can view, accept, and reject handoff requests
- Test agent portal functionality

### For **Permission Testing:**
- Login as each role and verify menu items appear correctly
- Test that restricted actions are properly blocked
- Verify role-based navigation works

---

## ⚠️ Important Notes

- **All passwords follow strong password policy**
- **Each role has distinct, non-overlapping permissions**
- **Agent role specifically designed for handoff management**
- **No duplicate or conflicting roles exist**
- **System is clean and ready for production testing**

---

## 🔧 System Configuration

- **Database:** `chatbot_ai` (MongoDB)
- **Backend:** Running on `http://localhost:5000`
- **Frontend:** Running on `http://localhost:3000`
- **Role System:** Fully functional with RBAC middleware
- **Authentication:** JWT-based with proper permission checking