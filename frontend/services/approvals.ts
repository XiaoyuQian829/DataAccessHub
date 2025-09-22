import api from './api';

export interface ApprovalRequest {
  id: number;
  title: string;
  description: string;
  status: 'DRAFT' | 'PENDING_PI' | 'PENDING_ETHICS' | 'PENDING_ADMIN' | 'AI_REVIEW' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | 'LOCKED' | 'APPEALED';
  applicant: string;
  created_at: string;
  current_step: number;
  sensitivity: 'normal' | 'high' | 'critical';
  dataset: string;
  justification: string;
  
  // Workflow specific fields
  pi_reviewer?: string;
  pi_review_date?: string;
  pi_review_comment?: string;
  pi_approved?: boolean;
  
  ethics_reviewer?: string;
  ethics_review_date?: string;
  ethics_review_comment?: string;
  ethics_approved?: boolean;
  
  admin_reviewer?: string;
  admin_review_date?: string;
  admin_review_comment?: string;
  admin_approved?: boolean;
  
  ai_recommendation?: 'APPROVE' | 'REJECT' | 'REVIEW_REQUIRED';
  ai_confidence?: number;
  ai_analysis?: string;
  
  access_token?: string;
  access_granted_date?: string;
  access_expires_date?: string;
  
  violations_count?: number;
  locked_date?: string;
  locked_reason?: string;
  
  appeal_submitted?: boolean;
  appeal_date?: string;
  appeal_reason?: string;
  arbiter_decision?: 'UPHELD' | 'OVERTURNED' | 'PENDING';
  
  audit_trail: AuditLogEntry[];
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  previous_status?: string;
  new_status?: string;
}

export interface CreateApprovalRequest {
  title: string;
  description: string;
  sensitivity: 'normal' | 'high' | 'critical';
  dataset: string;
  justification: string;
  access_purpose: string;
  time_range_start?: string;
  time_range_end?: string;
  data_fields: string[];
}

class ApprovalService {
  private requests: ApprovalRequest[] = [];
  private nextId = 1;
  private readonly STORAGE_KEY = 'approval_requests';
  private readonly NEXT_ID_KEY = 'approval_next_id';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const storedNextId = localStorage.getItem(this.NEXT_ID_KEY);
      
      if (stored) {
        this.requests = JSON.parse(stored);
      }
      
      if (storedNextId) {
        this.nextId = parseInt(storedNextId, 10);
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.requests));
      localStorage.setItem(this.NEXT_ID_KEY, this.nextId.toString());
    }
  }

  async getMyRequests(): Promise<ApprovalRequest[]> {
    // For now, return stored requests
    // In production, this would call: return api.get('/approvals/requests/my_requests/');
    return this.requests;
  }

  async getPendingApprovals(): Promise<ApprovalRequest[]> {
    // For now, return empty array
    // In production, this would call: return api.get('/approvals/requests/pending_approvals/');
    return [];
  }

  async createRequest(data: CreateApprovalRequest, applicant?: string): Promise<ApprovalRequest> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newRequest: ApprovalRequest = {
      id: this.nextId++,
      title: data.title,
      description: data.description,
      status: 'DRAFT',
      applicant: applicant || 'Current User',
      created_at: new Date().toISOString(),
      current_step: 1,
      sensitivity: data.sensitivity,
      dataset: data.dataset,
      justification: data.justification,
      audit_trail: [{
        id: 1,
        timestamp: new Date().toISOString(),
        action: 'REQUEST_CREATED',
        actor: applicant || 'Current User',
        details: `Created request for dataset: ${data.dataset}`,
        new_status: 'DRAFT'
      }]
    };

    // Store in memory and localStorage
    this.requests.push(newRequest);
    this.saveToStorage();

    return newRequest;
  }

  async submitRequest(requestId: number): Promise<ApprovalRequest> {
    const request = this.requests.find(r => r.id === requestId);
    if (!request) throw new Error('Request not found');

    request.status = 'PENDING_PI';
    request.current_step = 2;
    request.audit_trail.push({
      id: request.audit_trail.length + 1,
      timestamp: new Date().toISOString(),
      action: 'REQUEST_SUBMITTED',
      actor: request.applicant,
      details: 'Request submitted for PI review',
      previous_status: 'DRAFT',
      new_status: 'PENDING_PI'
    });

    this.saveToStorage();
    return request;
  }

  async withdrawRequest(requestId: number, reason?: string): Promise<ApprovalRequest> {
    const request = this.requests.find(r => r.id === requestId);
    if (!request) throw new Error('Request not found');

    const previousStatus = request.status;
    request.status = 'WITHDRAWN';
    request.audit_trail.push({
      id: request.audit_trail.length + 1,
      timestamp: new Date().toISOString(),
      action: 'REQUEST_WITHDRAWN',
      actor: request.applicant,
      details: reason || 'Request withdrawn by applicant',
      previous_status: previousStatus,
      new_status: 'WITHDRAWN'
    });

    this.saveToStorage();
    return request;
  }

  async piReview(requestId: number, approved: boolean, comment: string, reviewer: string): Promise<ApprovalRequest> {
    const request = this.requests.find(r => r.id === requestId);
    if (!request) throw new Error('Request not found');

    request.pi_reviewer = reviewer;
    request.pi_review_date = new Date().toISOString();
    request.pi_review_comment = comment;
    request.pi_approved = approved;

    if (approved) {
      request.status = 'PENDING_ETHICS';
      request.current_step = 3;
    } else {
      request.status = 'DRAFT';
      request.current_step = 1;
    }

    request.audit_trail.push({
      id: request.audit_trail.length + 1,
      timestamp: new Date().toISOString(),
      action: approved ? 'PI_APPROVED' : 'PI_REJECTED',
      actor: reviewer,
      details: `PI review: ${approved ? 'Approved' : 'Rejected'}. Comment: ${comment}`,
      previous_status: 'PENDING_PI',
      new_status: request.status
    });

    this.saveToStorage();
    return request;
  }

  async ethicsReview(requestId: number, approved: boolean, comment: string, reviewer: string): Promise<ApprovalRequest> {
    const request = this.requests.find(r => r.id === requestId);
    if (!request) throw new Error('Request not found');

    request.ethics_reviewer = reviewer;
    request.ethics_review_date = new Date().toISOString();
    request.ethics_review_comment = comment;
    request.ethics_approved = approved;

    if (approved) {
      // Check if high sensitivity requires admin review
      if (request.sensitivity === 'high' || request.sensitivity === 'critical') {
        request.status = 'PENDING_ADMIN';
        request.current_step = 4;
      } else {
        request.status = 'AI_REVIEW';
        request.current_step = 5;
        // Trigger AI review
        await this.performAIReview(requestId);
      }
    } else {
      request.status = 'DRAFT';
      request.current_step = 1;
    }

    request.audit_trail.push({
      id: request.audit_trail.length + 1,
      timestamp: new Date().toISOString(),
      action: approved ? 'ETHICS_APPROVED' : 'ETHICS_REJECTED',
      actor: reviewer,
      details: `Ethics review: ${approved ? 'Approved' : 'Rejected'}. Comment: ${comment}`,
      previous_status: 'PENDING_ETHICS',
      new_status: request.status
    });

    this.saveToStorage();
    return request;
  }

  async adminReview(requestId: number, approved: boolean, comment: string, reviewer: string): Promise<ApprovalRequest> {
    const request = this.requests.find(r => r.id === requestId);
    if (!request) throw new Error('Request not found');

    request.admin_reviewer = reviewer;
    request.admin_review_date = new Date().toISOString();
    request.admin_review_comment = comment;
    request.admin_approved = approved;

    if (approved) {
      request.status = 'AI_REVIEW';
      request.current_step = 5;
      // Trigger AI review
      await this.performAIReview(requestId);
    } else {
      request.status = 'DRAFT';
      request.current_step = 1;
    }

    request.audit_trail.push({
      id: request.audit_trail.length + 1,
      timestamp: new Date().toISOString(),
      action: approved ? 'ADMIN_APPROVED' : 'ADMIN_REJECTED',
      actor: reviewer,
      details: `Admin review: ${approved ? 'Approved' : 'Rejected'}. Comment: ${comment}`,
      previous_status: 'PENDING_ADMIN',
      new_status: request.status
    });

    this.saveToStorage();
    return request;
  }

  async performAIReview(requestId: number): Promise<ApprovalRequest> {
    const request = this.requests.find(r => r.id === requestId);
    if (!request) throw new Error('Request not found');

    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock AI decision logic
    const riskScore = Math.random();
    let recommendation: 'APPROVE' | 'REJECT' | 'REVIEW_REQUIRED';
    let confidence: number;
    let analysis: string;

    if (request.sensitivity === 'critical') {
      recommendation = riskScore > 0.8 ? 'APPROVE' : 'REVIEW_REQUIRED';
      confidence = Math.random() * 0.3 + 0.7; // 70-100%
      analysis = 'Critical sensitivity data requires high confidence approval';
    } else if (request.sensitivity === 'high') {
      recommendation = riskScore > 0.6 ? 'APPROVE' : 'REVIEW_REQUIRED';
      confidence = Math.random() * 0.4 + 0.6; // 60-100%
      analysis = 'High sensitivity data shows moderate risk profile';
    } else {
      recommendation = riskScore > 0.3 ? 'APPROVE' : 'REJECT';
      confidence = Math.random() * 0.5 + 0.5; // 50-100%
      analysis = 'Normal sensitivity data with standard risk assessment';
    }

    request.ai_recommendation = recommendation;
    request.ai_confidence = confidence;
    request.ai_analysis = analysis;

    if (recommendation === 'APPROVE') {
      request.status = 'APPROVED';
      request.access_token = `token_${requestId}_${Date.now()}`;
      request.access_granted_date = new Date().toISOString();
      // Set expiration to 90 days from now
      const expiration = new Date();
      expiration.setDate(expiration.getDate() + 90);
      request.access_expires_date = expiration.toISOString();
    } else {
      request.status = 'REJECTED';
    }

    request.audit_trail.push({
      id: request.audit_trail.length + 1,
      timestamp: new Date().toISOString(),
      action: 'AI_REVIEW_COMPLETED',
      actor: 'AI_SYSTEM',
      details: `AI recommendation: ${recommendation} (${(confidence * 100).toFixed(1)}% confidence). ${analysis}`,
      previous_status: 'AI_REVIEW',
      new_status: request.status
    });

    this.saveToStorage();
    return request;
  }

  async manualOverride(requestId: number, approved: boolean, reason: string, reviewer: string): Promise<ApprovalRequest> {
    const request = this.requests.find(r => r.id === requestId);
    if (!request) throw new Error('Request not found');

    const previousStatus = request.status;
    
    if (approved) {
      request.status = 'APPROVED';
      request.access_token = `token_${requestId}_${Date.now()}`;
      request.access_granted_date = new Date().toISOString();
      const expiration = new Date();
      expiration.setDate(expiration.getDate() + 90);
      request.access_expires_date = expiration.toISOString();
    } else {
      request.status = 'REJECTED';
    }

    request.audit_trail.push({
      id: request.audit_trail.length + 1,
      timestamp: new Date().toISOString(),
      action: 'MANUAL_OVERRIDE',
      actor: reviewer,
      details: `Manual override: ${approved ? 'Approved' : 'Rejected'}. Reason: ${reason}`,
      previous_status: previousStatus,
      new_status: request.status
    });

    this.saveToStorage();
    return request;
  }

  async submitAppeal(requestId: number, reason: string): Promise<ApprovalRequest> {
    const request = this.requests.find(r => r.id === requestId);
    if (!request) throw new Error('Request not found');

    request.appeal_submitted = true;
    request.appeal_date = new Date().toISOString();
    request.appeal_reason = reason;
    request.status = 'APPEALED';

    request.audit_trail.push({
      id: request.audit_trail.length + 1,
      timestamp: new Date().toISOString(),
      action: 'APPEAL_SUBMITTED',
      actor: request.applicant,
      details: `Appeal submitted. Reason: ${reason}`,
      previous_status: 'REJECTED',
      new_status: 'APPEALED'
    });

    this.saveToStorage();
    return request;
  }

  async lockRequest(requestId: number, reason: string): Promise<ApprovalRequest> {
    const request = this.requests.find(r => r.id === requestId);
    if (!request) throw new Error('Request not found');

    const previousStatus = request.status;
    request.status = 'LOCKED';
    request.locked_date = new Date().toISOString();
    request.locked_reason = reason;
    request.violations_count = (request.violations_count || 0) + 1;

    request.audit_trail.push({
      id: request.audit_trail.length + 1,
      timestamp: new Date().toISOString(),
      action: 'REQUEST_LOCKED',
      actor: 'SYSTEM',
      details: `Request locked due to: ${reason}`,
      previous_status: previousStatus,
      new_status: 'LOCKED'
    });

    this.saveToStorage();
    return request;
  }

  // Utility functions
  getRequestsByStatus(status: ApprovalRequest['status']): ApprovalRequest[] {
    return this.requests.filter(r => r.status === status);
  }

  getRequestsForReview(reviewerRole: string): ApprovalRequest[] {
    switch (reviewerRole) {
      case 'PI':
        return this.requests.filter(r => r.status === 'PENDING_PI');
      case 'Ethics':
        return this.requests.filter(r => r.status === 'PENDING_ETHICS');
      case 'Administrator':
        return this.requests.filter(r => r.status === 'PENDING_ADMIN' || r.status === 'AI_REVIEW');
      default:
        return [];
    }
  }

  getWorkflowStatus(request: ApprovalRequest): string {
    const steps = [
      'Draft',
      'PI Review',
      'Ethics Review',
      'Admin Review',
      'AI Review',
      'Final Decision'
    ];
    return steps[request.current_step - 1] || 'Unknown';
  }

  canPerformAction(request: ApprovalRequest, action: string, userRole: string): boolean {
    switch (action) {
      case 'submit':
        return request.status === 'DRAFT';
      case 'withdraw':
        return ['DRAFT', 'PENDING_PI', 'PENDING_ETHICS', 'PENDING_ADMIN'].includes(request.status);
      case 'pi_review':
        return request.status === 'PENDING_PI' && userRole === 'PI';
      case 'ethics_review':
        return request.status === 'PENDING_ETHICS' && userRole === 'Ethics';
      case 'admin_review':
        return request.status === 'PENDING_ADMIN' && userRole === 'Administrator';
      case 'manual_override':
        return request.status === 'AI_REVIEW' && userRole === 'Administrator';
      case 'appeal':
        return request.status === 'REJECTED';
      default:
        return false;
    }
  }
}

export const approvalService = new ApprovalService();