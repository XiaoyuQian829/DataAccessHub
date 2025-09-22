# 🚀 DataAccessHub Quick Testing Guide

## Start Testing Immediately (5-minute Quick Verification)

### 1. Ensure Services Are Running
```bash
# Check frontend service (should show Next.js process)
ps aux | grep "next dev"

# Check backend service (should show Python process)  
ps aux | grep "python.*manage.py"
```

### 2. Open Browser Testing
Access: `http://localhost:3000/login`

### 3. Quick Function Verification

#### Test 1: Admin Complete Permissions (2 minutes)
```
1. Login: admin / admin123
2. Verify can see all 6 menu items:
   ✅ Dashboard
   ✅ My Requests  
   ✅ Approval Workflow
   ✅ Datasets
   ✅ Permissions
   ✅ Audit Logs
3. Click each menu to confirm pages load normally
```

#### Test 2: Submit New Request (1 minute)
```
1. Click "My Requests" → "Submit New Request"
2. Quick fill:
   - Title: "Test Request"
   - Description: "Testing workflow"
   - Dataset: "customer_data" 
   - Sensitivity: "normal"
   - Access Purpose: "Testing"
   - Select a few Data Fields
   - Justification: "Test"
3. Click "Submit Request"
4. ✅ Should redirect to /workflow and see "Pending Review"
```

#### Test 3: Approval Process (2 minutes)
```
1. In "Approval Workflow" page
2. Should see just submitted request status as "PENDING PI"
3. Click "Approve" button
4. Fill comment: "Test approval"
5. Submit approval
6. ✅ Status should change to "PENDING ETHICS"
7. Repeat approval → finally to "AI REVIEW" → "APPROVED"
```

## 🧪 Automated Testing (Using Test Scripts)

### Run in Browser Console

#### Step 1: Load Test Scripts
```javascript
// Copy entire test-data.js content to console execution
// Or add script tags in webpage
```

#### Step 2: Generate Test Data
```javascript
// Clear old data and generate new test data
testDataUtils.runAllTests();
```

#### Step 3: Verify Results
```javascript
// Check data integrity
testDataUtils.validateData();
```

## 📋 Key Testing Items

### ✅ Must-Pass Tests

#### Basic Functions
- [ ] User login/logout
- [ ] Role permissions display correctly
- [ ] Page navigation normal

#### Core Workflow
- [ ] Request submission successful
- [ ] PI review function normal
- [ ] Ethics review function normal  
- [ ] Admin review function normal
- [ ] AI review auto-trigger
- [ ] Status transitions correct

#### Data Persistence
- [ ] Data persists after page refresh
- [ ] Audit log recording complete
- [ ] localStorage data correct

### ⚠️ Common Issue Troubleshooting

#### Issue 1: Blank Page or Layout Chaos
```bash
# Restart frontend service
pkill -f "next dev"
cd frontend && npm run dev
```

#### Issue 2: Approval Buttons Not Clickable
- Check user role permissions
- Confirm request status is correct
- Verify approval logic

#### Issue 3: Data Loss
- Check localStorage
- Confirm no browser cache clearing
- Verify data saving logic

#### Issue 4: AI Review Not Triggering
- Check prerequisite approvals completed
- Verify async method calls
- Check console errors

## 🎯 Minimum Viable Testing Checklist

**Only 5 minutes to verify core functions:**

1. ✅ **Login Test**: `admin` login successful, see 6 menus
2. ✅ **Submit Test**: Successfully submit new request
3. ✅ **Approval Test**: Complete one approval operation
4. ✅ **Status Test**: Verify correct status transitions
5. ✅ **Persistence Test**: Data persists after page refresh

**Passing these 5 tests means system core functions are normal!**

## 🚀 Advanced Testing Scenarios

### Sensitivity Testing
```
1. Submit "high" sensitivity request
2. Verify requires admin review
3. Test manual override function
```

### Rejection Appeal Testing  
```
1. Intentionally reject a request
2. Submit appeal
3. Verify appeal process
```

### Bulk Operation Testing
```
1. Generate multiple test requests
2. Bulk approval processing
3. Verify performance
```

## 📞 Need Help?

If you encounter problems during testing:

1. **Check Service Status**: Ensure both frontend and backend are running
2. **Check Console**: Browser F12 to view error messages
3. **Verify Data**: Use `testDataUtils.validateData()` to check
4. **Reset Environment**: Use `testDataUtils.clearTestData()` to clear and restart

**Test Success Indicator**: Able to complete the entire process from request submission to final approval!