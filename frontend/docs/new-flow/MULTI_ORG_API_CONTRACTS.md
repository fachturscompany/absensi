# Multi-Organization API Contracts

## 📋 Daftar Isi
1. [Authentication APIs](#authentication-apis)
2. [Organization APIs](#organization-apis)
3. [Role APIs](#role-apis)
4. [Member APIs](#member-apis)
5. [Import APIs](#import-apis)
6. [Error Handling](#error-handling)

---

## Authentication APIs

### POST /api/auth/login
**Login user dan fetch organizations**

Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "avatar": "https://..."
    },
    "organizations": [
      {
        "id": 1,
        "name": "PT ABC",
        "code": "ABC",
        "timezone": "Asia/Jakarta",
        "roles": [
          {
            "id": 1,
            "code": "A001",
            "name": "Admin",
            "description": "Organization Admin"
          }
        ]
      }
    ]
  }
}
```

---

### POST /api/auth/logout
**Logout user dan clear session**

Request:
```json
{}
```

Response (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET /api/auth/me
**Get current user info**

Response (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "currentOrganization": {
      "id": 1,
      "name": "PT ABC"
    },
    "currentRole": {
      "id": 1,
      "code": "A001",
      "name": "Admin"
    },
    "permissions": [
      "attendance:record:create",
      "attendance:record:approve",
      "members:manage",
      "settings:manage"
    ]
  }
}
```

---

## Organization APIs

### GET /api/organizations
**List user's organizations**

Query Parameters:
```
?limit=10&offset=0&search=PT
```

Response (200):
```json
{
  "success": true,
  "data": {
    "organizations": [
      {
        "id": 1,
        "name": "PT ABC",
        "code": "ABC",
        "country_code": "ID",
        "timezone": "Asia/Jakarta",
        "address": "Jl. Sudirman No. 1",
        "created_at": "2024-01-01T00:00:00Z",
        "member_count": 50,
        "roles": [
          {
            "id": 1,
            "code": "A001",
            "name": "Admin"
          }
        ]
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

---

### POST /api/organizations
**Create new organization**

Request:
```json
{
  "name": "PT XYZ",
  "code": "XYZ",
  "country_code": "ID",
  "timezone": "Asia/Jakarta",
  "address": "Jl. Gatot Subroto No. 1",
  "currency": "IDR",
  "work_hours_start": "08:00",
  "work_hours_end": "17:00",
  "attendance_method": "manual",
  "leave_policy": "standard"
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "PT XYZ",
    "code": "XYZ",
    "country_code": "ID",
    "timezone": "Asia/Jakarta",
    "address": "Jl. Gatot Subroto No. 1",
    "created_at": "2024-12-03T10:00:00Z"
  }
}
```

---

### GET /api/organizations/:id
**Get organization details**

Response (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "PT ABC",
    "code": "ABC",
    "country_code": "ID",
    "timezone": "Asia/Jakarta",
    "address": "Jl. Sudirman No. 1",
    "currency": "IDR",
    "work_hours_start": "08:00",
    "work_hours_end": "17:00",
    "attendance_method": "manual",
    "leave_policy": "standard",
    "member_count": 50,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-12-03T10:00:00Z"
  }
}
```

---

### PUT /api/organizations/:id
**Update organization (admin only)**

Request:
```json
{
  "name": "PT ABC Updated",
  "timezone": "Asia/Jakarta",
  "address": "Jl. Sudirman No. 2",
  "work_hours_start": "09:00",
  "work_hours_end": "18:00"
}
```

Response (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "PT ABC Updated",
    "timezone": "Asia/Jakarta",
    "address": "Jl. Sudirman No. 2",
    "updated_at": "2024-12-03T10:00:00Z"
  }
}
```

---

## Role APIs

### GET /api/organizations/:id/roles
**List available roles in organization**

Response (200):
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": 1,
        "code": "A001",
        "name": "Admin",
        "description": "Organization Administrator",
        "is_system": true,
        "permission_count": 25
      },
      {
        "id": 2,
        "code": "SUP",
        "name": "Support",
        "description": "Support Staff",
        "is_system": false,
        "permission_count": 10
      }
    ]
  }
}
```

---

### GET /api/roles/:roleId/permissions
**Get permissions for a role**

Response (200):
```json
{
  "success": true,
  "data": {
    "role": {
      "id": 1,
      "code": "A001",
      "name": "Admin"
    },
    "permissions": [
      {
        "id": 1,
        "module": "attendance",
        "resource": "record",
        "action": "create",
        "code": "attendance:record:create",
        "name": "Create Attendance Record"
      },
      {
        "id": 2,
        "module": "attendance",
        "resource": "record",
        "action": "approve",
        "code": "attendance:record:approve",
        "name": "Approve Attendance Record"
      }
    ]
  }
}
```

---

## Member APIs

### GET /api/organizations/:id/members
**List organization members**

Query Parameters:
```
?limit=10&offset=0&search=john&department=IT&role=A001
```

Response (200):
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": 1,
        "user_id": 1,
        "organization_id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "phone": "081234567890",
        "department": "IT",
        "position": "Manager",
        "role": {
          "id": 1,
          "code": "A001",
          "name": "Admin"
        },
        "status": "active",
        "joined_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

---

### POST /api/organizations/:id/members
**Add member to organization**

Request:
```json
{
  "user_id": 2,
  "role_id": 2,
  "department_id": 1,
  "position_id": 1
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "user_id": 2,
    "organization_id": 1,
    "role_id": 2,
    "department_id": 1,
    "position_id": 1,
    "created_at": "2024-12-03T10:00:00Z"
  }
}
```

---

### PUT /api/organizations/:id/members/:memberId
**Update member (admin only)**

Request:
```json
{
  "role_id": 3,
  "department_id": 2,
  "position_id": 2,
  "status": "active"
}
```

Response (200):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "role_id": 3,
    "department_id": 2,
    "position_id": 2,
    "status": "active",
    "updated_at": "2024-12-03T10:00:00Z"
  }
}
```

---

### DELETE /api/organizations/:id/members/:memberId
**Remove member from organization (admin only)**

Response (200):
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

---

## Import APIs

### POST /api/organizations/:id/members/import
**Import members from Excel**

Request (multipart/form-data):
```
file: <Excel file>
column_mapping: {
  "first_name": 0,
  "last_name": 1,
  "email": 2,
  "phone": 3,
  "department": 4,
  "position": 5
}
default_role_id: 2
```

Response (200):
```json
{
  "success": true,
  "data": {
    "imported": 45,
    "skipped": 5,
    "errors": [
      {
        "row": 10,
        "email": "invalid@",
        "error": "Invalid email format"
      }
    ],
    "preview": [
      {
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane@example.com",
        "phone": "081234567891",
        "department": "HR",
        "position": "Staff",
        "status": "success"
      }
    ]
  }
}
```

---

### GET /api/organizations/:id/members/import/template
**Download Excel template**

Response (200):
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="member-import-template.xlsx"

[Excel file with headers]
```

---

### POST /api/organizations/:id/members/import/validate
**Validate Excel file before import**

Request (multipart/form-data):
```
file: <Excel file>
```

Response (200):
```json
{
  "success": true,
  "data": {
    "valid": true,
    "row_count": 50,
    "columns": [
      "first_name",
      "last_name",
      "email",
      "phone",
      "department",
      "position"
    ],
    "preview": [
      {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "phone": "081234567890",
        "department": "IT",
        "position": "Manager"
      }
    ],
    "warnings": []
  }
}
```

---

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "issue": "Email is required"
    }
  }
}
```

### Common Error Codes

| Code | Status | Message | Cause |
|------|--------|---------|-------|
| `UNAUTHORIZED` | 401 | Unauthorized | User not authenticated |
| `FORBIDDEN` | 403 | Forbidden | User doesn't have permission |
| `NOT_FOUND` | 404 | Not found | Resource not found |
| `INVALID_REQUEST` | 400 | Invalid request | Invalid parameters |
| `DUPLICATE_ENTRY` | 409 | Duplicate entry | Email/code already exists |
| `INVALID_FILE` | 400 | Invalid file | File format not supported |
| `IMPORT_ERROR` | 400 | Import error | Error during import process |
| `INTERNAL_ERROR` | 500 | Internal error | Server error |

### Example Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to access this resource"
  }
}
```

**409 Duplicate Entry:**
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_ENTRY",
    "message": "Organization code already exists",
    "details": {
      "field": "code",
      "value": "ABC"
    }
  }
}
```

---

## Response Conventions

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2024-12-03T10:00:00Z",
    "version": "1.0"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { /* optional details */ }
  },
  "meta": {
    "timestamp": "2024-12-03T10:00:00Z",
    "version": "1.0"
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [ /* array of items */ ],
    "pagination": {
      "total": 100,
      "limit": 10,
      "offset": 0,
      "page": 1,
      "pages": 10
    }
  }
}
```

---

**API contracts ini akan di-update seiring dengan progress implementasi.**
