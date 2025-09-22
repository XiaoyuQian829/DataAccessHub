# Day 1 Development Log

## 🧱 Phase 1: Project Initialization and Structure Design

We built the following basic architecture based on the goal of creating a "platform-type permission system":

✅ **Clear Directory Structure**

```bash
DataAccessHub/
└── backend/
    ├── manage.py
    ├── config/                    # Django configuration module
    │   ├── settings.py            # Global settings (database, templates, app registration, etc.)
    │   ├── urls.py                # Global routing configuration
    │   └── wsgi.py                # Runtime interface (for deployment)
    ├── apps/                      # Various modules (maintained as separate apps)
    │   └── approvals/             # First module: approval workflow system
    │       ├── models.py
    │       ├── views.py
    │       ├── services.py
    │       ├── forms.py
    │       ├── urls.py
    ├── templates/                 # Global templates
    │   ├── base.html              # Base template
    │   └── approvals/             # Approval module view templates
    │       ├── list.html
    │       ├── form.html
    │       └── action_form.html
    └── .venv/                     # Virtual environment (activated)
```

✅ **Design Philosophy: Modular, Scalable, Governance-Oriented**

- The `apps/` subdirectory supports making each feature into a "module-level microapplication"
- `services.py` is used to abstract approval logic and workflow decisions, avoiding hardcoding in views
- Maintain logic decoupling, preparing for future addition of `datasets/`, `audit/`, `permissions/` modules

## 🧩 Phase 2: Approval Module Development

✅ **Model Design (MVP)**:

```python
class ApprovalRequest(models.Model):
    title, description, applicant, status, current_step, created_at

class ApprovalStep(models.Model):
    request(FK), approver(FK), step_number, approved(Boolean), comment, acted_at
```

**Supports multi-level approval**: Multi-step process, progressive advancement

Currently only defines minimal fields, can be extended later with:
- `request_type` / `dataset` / `duration` etc.
- `step_type` (such as "Data Security Review", "Ethics Approval", etc.)

✅ **View Logic**

Three core views with complete functionality and status updates:

| View Name | Path | Function |
|-----------|------|----------|
| `request_list_view()` | `/approvals/` | View requests I submitted & items I need to approve |
| `request_submit_view()` | `/approvals/submit/` | Initiate a new approval request |
| `request_action_view()` | `/approvals/<id>/action/` | Approve/reject pending approvals |

✅ **Form Design (forms.py)**

Validates input fields through forms, avoiding direct model operations, protecting backend logic security.

✅ **Core Service Logic (services.py)**

We wrote the following function logic:

```python
submit_request(user, title, description, approvers)
approve_step(request_id, user, comment)
reject_step(request_id, user, comment)
```

Ensures:
- Automatic creation of approval steps
- Automatic progression of `current_step`
- Status becomes `APPROVED` after all steps are passed
- Rejection results in `REJECTED` status, no further operations allowed

## 📂 Phase 3: Templates and Interactive Display

✅ **Template Structure**

```bash
templates/
└── approvals/
    ├── list.html         # Your submissions / Your pending approvals
    ├── form.html         # Submit request
    └── action_form.html  # Approval processing
```

Currently we have completed `list.html`, the page is accessible at `/approvals/` with visual content displayed:

✅ **My Applications** (My ApprovalRequest)
✅ **Pending My Approval** (Steps where I'm the approver in current_step)

## 🔐 Phase 4: Permissions and User System

✅ **Using Built-in User Model**:
- You've created a superuser, can log in to `/admin/` for backend management
- All views have `@login_required`, unauthenticated users redirect to `/accounts/login/`

✅ **Future Recommendations**:
- Add user groups or role fields, such as Auditor / Approver / Applicant
- Future integration with RBAC permission system (we have RBAC-Java project architecture concepts to reuse)

## 🪵 Phase 5: Audit System in Preparation

Although we haven't added the `apps.audit` module yet, you've already reserved space in the code:

```python
from audit.services import log_action
```

This means your design already:
- Considers full process audit records
- Prepares for future log entry generation, behavior analysis, and compliance records

## ✅ Currently Supported System Operations

| Operation | Description |
|-----------|-------------|
| Backend Login | `/admin/` login, user management |
| View Approval List | `/approvals/` displays my submissions / pending approvals |
| Submit New Request | `/approvals/submit/` initiate approval |
| Approve Request | `/approvals/<id>/action/` can approve/reject |
| Status Changes | Approval progression, request status and current_step updates |
| Multi-person Approval | Multiple approvers execute sequentially, order controlled by step_number |

## ✅ Development Environment Status

✅ Virtual environment `.venv` running normally
✅ Django startup normal (avoided default port conflicts)
✅ Database migrated
✅ Login + approval functionality normal, template display correct

## 🔮 Next Steps Recommended Route

### 🔧 Technical Aspects
- Complete remaining templates (form.html, action_form.html)
- Write automated tests (tests.py, ensure logic correctness)
- Enable Django Signals for automatic log recording
- Integrate model permission controls into approval conditions (permission platform preparation)

### 🌐 Feature Extensions
- Add "data field application" functionality: approval corresponds to dataset fields
- Integrate `apps.audit` module for behavior tracking
- Integrate `apps.datasets` module, enable data access after approval

### 📦 Management Feature Suggestions
- Register approval models in `/admin/` backend
- Configure approval process templates (such as: default 2-level approval, define approval chain for each application type)

## 🧠 Module Responsibilities Overview

| File Name | Responsibility |
|-----------|----------------|
| `models.py` | Define approval system data models, including ApprovalRequest, ApprovalStep, approval status fields, etc. It's the data backbone of the entire system. |
| `forms.py` | Define frontend form data structure and validation logic, e.g., approval submission forms, approval action forms. Controls input legality and security. |
| `views.py` | Handle traditional web view requests (HTML rendering), responsible for rendering approval lists, submission forms, approval action pages, etc. Main entry point for user browser interactions. |
| `services.py` | Business logic layer, encapsulates core actions for submit/approve/reject, keeps views.py clean. Contains submit_request(), approve_step(), reject_step(), etc. Most worthy of unit testing. |
| `urls.py` | Route definition: maps URLs like approvals/submit/, approvals/<id>/action/ to corresponding functions in views.py. Binds URL ↔ view functions. |
| `tests/` | Unit test directory, should contain model logic, service layer logic (most important), and API route tests. Future complete approval flow testing. |

## ✅ Current Approval Flow Overview

### 🧩 1. Submit Approval Request
- **Entry**: `/approvals/submit/`
- **Form**: `ApprovalRequestForm`
- **Backend Logic**: `submit_request(user, title, description, approvers)`

**Functionality Details**:
- User fills title, description, selects multiple approvers (in order)
- System automatically:
  - Creates `ApprovalRequest` object with status `PENDING`, `current_step=1`
  - Creates multiple `ApprovalStep` records, one per person, with incrementing `step_number`

### 📋 2. View Approval Requests
- **Entry**: `/approvals/`
- **View**: `request_list_view(request)`

**Display Features**:
- "My Submitted Requests": Current user as applicant
- "Pending My Approval": Current user as approver in current step and not yet approved

### ✍️ 3. Approval Processing
- **Entry**: `/approvals/<request_id>/action/`
- **Form**: `ApprovalActionForm`
- **View**: `request_action_view(request, request_id)`

**Permission Restrictions**:
- Current user must be "approver for this step", otherwise no access

**Functionality Logic**:
- Form selects approve or reject, fills comment
- Calls `approve_step()` or `reject_step()` to complete processing

### ✅ 4. System Auto-progression Logic

**Scenario A: Approval Passed**
- Current user clicks approve, calls `approve_step(request_id, user, comment)`
- System logic:
  - Mark current step as `approved=True`
  - Check if next `step_number` step exists:
    - **Exists** → `current_step += 1`, wait for next person's approval
    - **Not exists** → All steps passed, `ApprovalRequest.status = "APPROVED"`

**Scenario B: Approval Rejected**
- Current user clicks reject, calls `reject_step(request_id, user, comment)`
- System logic:
  - Mark current step as `approved=False`
  - Immediately terminate process, `ApprovalRequest.status = "REJECTED"`

## 📜 Status & Data Structure Reference

| Model | Field | Meaning |
|-------|-------|---------|
| `ApprovalRequest` | `status` | Current process status: PENDING / APPROVED / REJECTED |
| | `current_step` | Which step is currently active |
| `ApprovalStep` | `approved` | Whether approved (null means not yet approved) |
| | `step_number` | Step number |
| | `comment` | Approval comment |
| | `acted_at` | Approval timestamp |

## 🌐 Typical Path Example

```
User A submits approval request (selects approvers: User1 → User2):
↓
System creates ApprovalRequest (PENDING, current_step=1)
↓
User1 logs in, sees pending approval in /approvals/
↓
User1 approves → Pass → current_step = 2
↓
User2 logs in, sees pending approval
↓
User2 approves → Pass → All steps complete → Status becomes APPROVED

-----------------------------------

If any step clicks "reject":
→ That ApprovalStep recorded as approved=False
→ ApprovalRequest status directly becomes REJECTED, process terminates
```

## ✅ Current Flow Characteristics Summary

| Feature | Implemented | Description |
|---------|-------------|-------------|
| Multi-person sequential approval | ✅ | Multiple approvers approve sequentially, in order |
| Any step rejection terminates | ✅ | Rejection during approval immediately terminates |
| Auto status updates | ✅ | System automatically manages current_step and status |
| Form + template interface | ✅ | Completed list.html, other templates can be generated |
| Access control | ✅ | Uses @login_required and logic checks approver identity |

## 🚧 Advanced Logic Not Yet Implemented (Future Module Extensions)

| Module | Function | Status |
|--------|----------|--------|
| High Sensitivity → Dual Approval | Simultaneous Ethics + Admin approval, either rejection terminates | Not implemented |
| AI Suggestion / Manual Override | Admin approval stage with AI suggestions, manual override allowed | Not implemented |
| Token Issued / API Access | Issue access tokens after approval, data permission control | Not implemented |
| Violation / Auto Lock / Unlock | Access violation → auto lock → review to unlock | Not implemented |
| User Appeal / Arbiter Decision | Appeal after rejection, handled by arbiters | Not implemented |
| Audit Log full process recording | Every action written to structured audit log | Partially implemented, needs completion |

## 🧠 Summary: Current Role of Your Approvals Module

It's the "process-driven engine" of the entire DataAccessHub approval system, providing the basic "application – multi-level approval – status progression" skeleton logic.

Your current basic process is very clear and can serve as the supporting foundation for the following modules:

- Add advanced approval conditions (e.g., sensitivity fields trigger dual review)
- Separate different approval roles (PI, Ethics, Admin)
- Integrate access tokens and data permission distribution
- Connect AI judgment for sensitive fields
- Design arbitration processes and violation tracking

## ✅ Next Step Recommendations:

I recommend you **first complete these three steps** to gradually expand current approval flow capabilities:

1. **Implement High Sensitivity Field Dual Approval**
   - Add field `high_sensitivity: bool` to data model
   - If true, add two parallel approvers (Ethics + Admin)
   - If either rejects → status set to rejected

2. **Add Audit Log Recording**
   - Call `log_action(user, action, metadata)` on each submit/approve/reject
   - Write operation content, fields, approvers, time to unified AuditLog table

3. **Generate Token After Approval**
   - After successful approval, generate access token with defined scope (scoped fields)
   - Can temporarily use JSONField to store access permission content

I can help you implement these step by step, such as:
- Dual approval execution logic
- Token model design
- General audit log structure

---

**Developer**: Claude Code  
**Project**: DataAccessHub - Biological Research Data Access Management System  
**Status**: Foundation Complete, Ready for Extensions